"""Reproducible retained SHP conversion; never fetches network resources."""
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import struct
import sys
import zipfile

import pyproj
import shapefile
import shapely
from shapely.geometry import mapping
from shapely.geometry.polygon import orient
from shapely.ops import transform

from .geometry import checked_geometry, transformer, validate_prj, POLYGON_EDITION, TRANSFORMATION_VERSION

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = Path('public/data/wifi-policy/geographic-v1.1')
ZIP_HASH = '77bcc347b503b8ff8a43f7e1afaaedb18877a6222282587b145adaba69afd2d9'
EXPECTED_DISTRICTS = {'北投區', '士林區', '中山區', '松山區', '大同區', '萬華區', '中正區', '大安區', '信義區', '南港區', '文山區', '內湖區'}
EXPECTED_IDS = dict(zip(['松山區','信義區','大安區','中山區','中正區','大同區','萬華區','文山區','南港區','內湖區','士林區','北投區'], [f'630{i:02d}00' for i in range(1,13)]))


def canonical_bytes(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False) + '\n').encode('utf-8')


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.tmp')
    try:
        temporary.write_bytes(canonical_bytes(value))
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def safe_zip_entries(data, max_entries=128, max_total_bytes=20_000_000):
    archive = zipfile.ZipFile(io.BytesIO(data))
    entries = archive.infolist()
    if len(entries) > max_entries or sum(e.file_size for e in entries) > max_total_bytes:
        raise ValueError('Archive resource limit exceeded')
    names = set()
    for entry in entries:
        name = entry.orig_filename
        parts = PurePosixPath(name.replace('\\', '/'))
        if ('\\' in name or parts.is_absolute() or '..' in parts.parts or ':' in name
                or not name or '\x00' in name or name in names or entry.flag_bits & 1
                or (entry.external_attr >> 16) & 0o170000 == 0o120000):
            raise ValueError('Unsafe or duplicate ZIP entry: ' + name)
        names.add(name)
    return archive


def _orient_geometry(geom):
    if geom.geom_type == 'Polygon':
        return orient(geom, sign=1.0)
    from shapely.geometry import MultiPolygon
    return MultiPolygon([orient(poly, sign=1.0) for poly in geom.geoms])


def build_boundaries(root=ROOT, write=True):
    root = Path(root)
    raw_path = root / 'data/raw/wifi-policy/E-2024-09-16.zip'
    data = raw_path.read_bytes()
    if sha256(data) != ZIP_HASH:
        raise ValueError('Retained E source hash mismatch')
    manifest = json.loads((root / 'data/raw/wifi-policy/acquisition-manifest.json').read_text(encoding='utf-8'))
    source = next(s for s in manifest['sources'] if s['id'] == 'E')
    if source['sha256'] != ZIP_HASH:
        raise ValueError('Source manifest disagrees with pinned E source hash')
    with safe_zip_entries(data) as archive:
        selected = {}
        for extension in ('.shp', '.shx', '.dbf', '.prj', '.cpg'):
            matches = [name for name in archive.namelist() if name.lower().endswith(extension)]
            if len(matches) != 1:
                raise ValueError('Expected exactly one ' + extension)
            selected[extension] = matches[0]
        if len({str(PurePosixPath(n).with_suffix('')) for n in selected.values()}) != 1:
            raise ValueError('Contradictory SHP companion filenames')
        encoding = archive.read(selected['.cpg']).decode('ascii').strip().upper()
        if encoding not in ('UTF-8', 'UTF8', '65001'):
            raise ValueError('Unsupported CPG encoding')
        wkt = archive.read(selected['.prj']).decode('utf-8')
        crs = validate_prj(wkt)
        buffers = {ext: archive.read(name) for ext, name in selected.items()}
    # Inspect the actual SHX binary header/length rather than ignoring the index.
    shx = buffers['.shx']
    if len(shx) < 100 or struct.unpack('>i', shx[:4])[0] != 9994 or struct.unpack('>i', shx[24:28])[0] * 2 != len(shx):
        raise ValueError('Invalid SHX header or declared byte length')
    shp_bytes = buffers['.shp']
    if len(shp_bytes) < 100 or struct.unpack('>i',shp_bytes[:4])[0] != 9994 or struct.unpack('>i',shp_bytes[24:28])[0]*2 != len(shp_bytes):
        raise ValueError('Invalid SHP header or declared byte length')
    for position in range(100,len(shx),8):
        offset,length=struct.unpack('>ii',shx[position:position+8])
        start=offset*2
        if start<100 or length<2 or start+8+length*2>len(shp_bytes) or struct.unpack('>i',shp_bytes[start+4:start+8])[0] != length:
            raise ValueError('SHX offset/length contradicts SHP record')
    reader = shapefile.Reader(shp=io.BytesIO(buffers['.shp']), shx=io.BytesIO(shx), dbf=io.BytesIO(buffers['.dbf']), encoding='utf-8', encodingErrors='strict')
    if (len(shx) - 100) // 8 != len(reader) or len(reader.shapes()) != len(reader.records()):
        raise ValueError('SHP/SHX/DBF record counts disagree')
    features, records, original_geometries, max_error = [], [], {}, 0.0
    forward, inverse = transformer(), transformer('EPSG:4326', 'EPSG:3826')
    for item in reader.iterShapeRecords():
        attributes = item.record.as_dict()
        district_values = [str(v).strip() for v in attributes.values() if str(v).strip() in EXPECTED_DISTRICTS]
        if len(district_values) != 1:
            raise ValueError('District name cannot be established uniquely from DBF')
        district = district_values[0]
        district_id = str(attributes.get('CPTID', ''))
        if district_id != EXPECTED_IDS[district] or attributes.get('TNAME') != district or attributes.get('PNAME') != '臺北市' or attributes.get('PTNAME') != '臺北市'+district:
            raise ValueError('Contradictory original DBF administrative identity fields')
        starts=list(item.shape.parts)+[len(item.shape.points)]
        for start,end in zip(starts,starts[1:]):
            ring=item.shape.points[start:end]
            if len(ring)<4 or ring[0]!=ring[-1]:
                raise ValueError('Source SHP contains unclosed or insufficient polygon ring')
        original = checked_geometry(item.shape.__geo_interface__)
        original_geometries[district]=original
        converted = _orient_geometry(transform(forward.transform, original))
        checked_geometry(mapping(converted))
        minx, miny, maxx, maxy = converted.bounds
        if not (121.3 < minx <= maxx < 121.8 and 24.9 < miny <= maxy < 25.3):
            raise ValueError('Unexpected Taipei geographic extent / axis order')
        # Every original vertex, including hole vertices, participates in round trip.
        from shapely import get_coordinates
        for x, y in get_coordinates(original):
            lon, lat = forward.transform(x, y, errcheck=True)
            xx, yy = inverse.transform(lon, lat, errcheck=True)
            max_error = max(max_error, ((x-xx)**2 + (y-yy)**2)**0.5)
        if max_error > 0.001:
            raise ValueError('Round-trip projected tolerance exceeds one millimeter')
        features.append(dict(type='Feature', properties=dict(district=district, districtId=district_id, sourceAttributes=attributes), geometry=mapping(converted)))
        polygons = [converted] if converted.geom_type == 'Polygon' else list(converted.geoms)
        records.append(dict(district=district, districtId=district_id, sourceAttributes=attributes,
                            sourceGeometryType=original.geom_type, outputGeometryType=converted.geom_type,
                            polygonParts=len(polygons), interiorRings=sum(len(p.interiors) for p in polygons), valid=True, repairs=[]))
    if len(features) != 12 or {f['properties']['district'] for f in features} != EXPECTED_DISTRICTS or len({f['properties']['districtId'] for f in features}) != 12:
        raise ValueError('Unexpected, missing, or duplicate DBF district identities')
    features.sort(key=lambda f: f['properties']['districtId'])
    collection = dict(type='FeatureCollection', features=features)
    geometry_hash = sha256(canonical_bytes(collection))
    overlaps=[]
    for index,a in enumerate(features):
        name_a=a['properties']['district']
        for b in features[index+1:]:
            name_b=b['properties']['district']
            original_area=original_geometries[name_a].intersection(original_geometries[name_b]).area
            from shapely.geometry import shape
            derived_area=transform(inverse.transform,shape(a['geometry'])).intersection(transform(inverse.transform,shape(b['geometry']))).area
            if original_area>1e-6 or derived_area>1e-6:
                overlaps.append(dict(districts=[name_a,name_b],sourceOverlapSquareMeters=original_area,roundTrippedDerivedOverlapSquareMeters=derived_area))
    # An analytic projection control independent of the retained data: the TM
    # false origin (250000,0) must be (central meridian 121°,equator 0°).
    control_lon, control_lat = forward.transform(250000, 0, errcheck=True)
    if abs(control_lon-121) > 1e-10 or abs(control_lat) > 1e-10:
        raise ValueError('Independent projection-origin control failed')
    report = dict(schemaVersion='1.1', methodId=TRANSFORMATION_VERSION, polygonEdition=POLYGON_EDITION,
                  source=source, sourceSha256=ZIP_HASH, geometrySha256=geometry_hash,
                  geometryVersion='taipei-districts-' + geometry_hash[:24], acceptedCount=12, rejectedCount=0,
                  repairs=[], pairwiseOverlapDiagnostics=overlaps, records=sorted(records, key=lambda r:r['districtId']),
                  archiveEntries=[dict(name=name, bytes=len(buffers[ext]), sha256=sha256(buffers[ext])) for ext,name in sorted(selected.items())],
                  dbfFields=[list(f) for f in reader.fields[1:]], cpg=encoding, sourcePrj=wkt,
                  crs=dict(source='EPSG:3826', target='EPSG:4326', prjAuthorityMatch=crs.equals(pyproj.CRS.from_epsg(3826), ignore_axis_order=True), inputAxisOrder='easting,northing', outputAxisOrder='longitude,latitude', operation=forward.description, operationAccuracyMeters=forward.accuracy, operationDefinition=forward.definition, networkEnabled=False, allowBallpark=False),
                  software=dict(python='3.12', pyproj=pyproj.__version__, proj=pyproj.proj_version_str, shapely=shapely.__version__, geos=shapely.geos_version_string, pyshp=shapefile.__version__),
                  validation=dict(maxRoundTripErrorMeters=max_error, roundTripToleranceMeters=0.001, controlPoints=[dict(kind='analytic-projection-origin', input=[250000,0], expected=[121,0], actual=[control_lon,control_lat], toleranceDegrees=1e-10)], independentSurveyedControlPointsAvailable=False, topologyValid=True, ringOrientation='RFC7946 exterior counterclockwise / interior clockwise', historicalEditionOnly=True, sourcePositionalAccuracyMeters=None))
    if write:
        atomic_json(root / OUTPUT / 'district-boundaries.geojson', collection)
        atomic_json(root / OUTPUT / 'boundary-validation.json', report)
    return collection, report


if __name__ == '__main__':
    collection, report = build_boundaries()
    print(json.dumps(dict(accepted=report['acceptedCount'], geometrySha256=report['geometrySha256'], maxRoundTripErrorMeters=report['validation']['maxRoundTripErrorMeters'])))

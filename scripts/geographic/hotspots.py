"""Preserve all published hotspot rows and independently audit polygon attribution."""
import csv
import io
import json
from pathlib import Path

from .boundaries import ROOT, OUTPUT, ZIP_HASH, EXPECTED_DISTRICTS, atomic_json, build_boundaries, sha256
from .geometry import classify_point, valid_coordinate

A_HASH = '09c150e7b8a75e1477413ddcc37059fe97b3c2353ac9f8799069e65d8f81cc55'


def parsed_coordinates(row):
    """Invalid values remain auditable raw strings and serialize as JSON null."""
    try:
        lon,lat=float(row['LONGITUDE']),float(row['LATITUDE'])
    except (ValueError,TypeError,KeyError):
        return None,None
    return (lon,lat) if valid_coordinate(lon,lat) else (None,None)


def normalized_spatial(raw, geometry_version):
    return dict(status={'boundary-adjacent':'interior', 'multi-match':'ambiguous'}.get(raw['status'], raw['status']),
                district=raw['district'], matches=raw['matches'], distanceToBoundaryMeters=raw['boundaryDistanceMeters'],
                sourceDistrictAgrees=raw['sourceDistrictAgreement'], geometryVersion=geometry_version,
                transformationVersion=raw['transformationVersion'])


def audit_hotspots(root=ROOT, write=True):
    root = Path(root)
    collection, boundary_report = build_boundaries(root, write=False)
    data = (root/'data/raw/wifi-policy/A-2026-07-01.csv').read_bytes()
    if sha256(data) != A_HASH:
        raise ValueError('Retained A source hash mismatch')
    rows = list(csv.DictReader(io.StringIO(data.decode('utf-8-sig'))))
    if len(rows) != 3305:
        raise ValueError('Unexpected A edition record count')
    records, counts, seen_ids, seen_coords = [], {}, {}, {}
    for row in rows:
        lon,lat=parsed_coordinates(row)
        raw = classify_point(lon, lat, collection['features'], row['AREA'])
        counts[raw['status']] = counts.get(raw['status'],0)+1
        key = row['SITE_ID']+'|'+row['HOTSPOT_ID']
        seen_ids[key] = seen_ids.get(key,0)+1
        if valid_coordinate(lon, lat):
            coordinate_key = f'{lon},{lat}'
            seen_coords[coordinate_key] = seen_coords.get(coordinate_key,0)+1
        scope = 'taipei-source' if row['county'] in ('臺北市','台北市') and row['AREA'] in EXPECTED_DISTRICTS else 'outside-source' if row['county'] not in ('','臺北市','台北市') else 'unresolved'
        records.append(dict(id=key, sourceIds=[row['SITE_ID'],row['HOTSPOT_ID']], longitude=lon, latitude=lat,
                            sourceDistrict=row['AREA'],sourceScope=scope,spatial=normalized_spatial(raw,boundary_report['geometryVersion'])))
        if lon is None or lat is None:
            records[-1]['originalCoordinateValues']={field:row.get(field,'') for field in ('LONGITUDE','LATITUDE')}
    if any(count > 1 for count in seen_ids.values()):
        # Retain collisions explicitly rather than silently merging source records.
        for record in records:
            if seen_ids[record['id']] > 1:
                record['id'] += '|'+sha256(json.dumps(record,sort_keys=True,ensure_ascii=False).encode())[:16]
        if len({r['id'] for r in records}) != len(records):
            raise ValueError('Indistinguishable A source identity collision')
    report = dict(schemaVersion='1.1', sourceSha256=A_HASH, sourceEdition='A-2026-07-01',
                  geometryVersion=boundary_report['geometryVersion'], geometrySha256=boundary_report['geometrySha256'], records=sorted(records,key=lambda r:r['id']),
                  summary=dict(rows=len(records),spatialStatuses=counts,duplicateCoordinatePairs=sum(c>1 for c in seen_coords.values()),
                               repeatedSiteIdentities=len(rows)-len({r['SITE_ID'] for r in rows}),identityCollisions=sum(c>1 for c in seen_ids.values()),
                               sourceDistrictDisagreements=sum(r['spatial']['sourceDistrictAgrees'] is False for r in records)),
                  limitations=['Published hotspot row is not a unique physical installation.','Polygon disagreement does not prove positional error.'])
    if write:
        atomic_json(root/OUTPUT/'hotspots-audit.json',report)
    return report


if __name__ == '__main__':
    report = audit_hotspots()
    print(json.dumps(report['summary']))

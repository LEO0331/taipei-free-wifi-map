"""Offline GIS admission. No network, geocoding, geometry repair or source mutation."""
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import struct
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

import pyproj
from pyproj import CRS, Transformer
import shapefile
import shapely
from shapely.geometry import Point, shape, mapping
from shapely.geometry.polygon import orient
from shapely.ops import transform
from shapely.validation import explain_validity

ROOT = Path(__file__).resolve().parent.parent
METHOD = 'wifi-geographic-proximity-experiment-v1'
DISTRICTS = ['北投區','士林區','內湖區','南港區','松山區','信義區','中山區','大同區','中正區','萬華區','大安區','文山區']
ACCEPTED_HASHES = {'A':'09c150e7b8a75e1477413ddcc37059fe97b3c2353ac9f8799069e65d8f81cc55','B':'82f4e1aedafd3b68a9b6adc619fdd5e00e4871c3c94100201eefdb12070e0847','C':'368778b0c649f24b05cc0383172afb0e1b804c332541e2d33a2117d7d83834a0','D':'23c5ce0906358d8f95b2f1a8e1b019487cd7fa564b2cf188681648d23c89b11c','E':'77bcc347b503b8ff8a43f7e1afaaedb18877a6222282587b145adaba69afd2d9'}
ACCEPTED_FILES={'A':'A-2026-07-01.csv','B':'B-2026-06-10.csv','C':'C-2025-12-18.ods','D':'D-2026-03-02.csv','E':'E-2024-09-16.zip'}
FORWARD = Transformer.from_crs(3826, 4326, always_xy=True, allow_ballpark=False)
REVERSE = Transformer.from_crs(4326, 3826, always_xy=True, allow_ballpark=False)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def encode(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)+'\n').encode('utf-8')

def archive(data):
    z = zipfile.ZipFile(io.BytesIO(data))
    names = z.namelist()
    if len(names) != len(set(names)) or len(names) > 100:
        raise ValueError('Duplicate or excessive archive entries')
    for info in z.infolist():
        p = PurePosixPath(info.filename)
        if p.is_absolute() or '..' in p.parts or '\\' in info.filename or ':' in info.filename or info.file_size > 25_000_000:
            raise ValueError('Unsafe ZIP path/size')
    if sum(i.file_size for i in z.infolist()) > 50_000_000:
        raise ValueError('Archive expansion limit')
    return z

def accepted_crs(wkt):
    crs = CRS.from_wkt(wkt)
    if not crs.equals(CRS.from_epsg(3826), ignore_axis_order=True):
        raise ValueError('Unsupported or contradictory PRJ')
    return crs

def numeric(value):
    if isinstance(value, bool) or not re.fullmatch(r'[+-]?(?:\d+\.?\d*|\.\d+)', str(value).strip()):
        raise ValueError('Invalid numeric coordinate')
    number = float(value)
    if not math.isfinite(number):
        raise ValueError('Nonfinite coordinate')
    return number

def geographic(lon, lat):
    return math.isfinite(lon) and math.isfinite(lat) and -180 <= lon <= 180 and -90 <= lat <= 90

def polygons(data):
    z = archive(data)
    files, stems = {}, set()
    for extension in ['shp','shx','dbf','prj','cpg']:
        matches = [n for n in z.namelist() if n.lower().endswith('.'+extension)]
        if len(matches) != 1:
            raise ValueError('Missing/ambiguous shapefile component')
        files[extension] = z.read(matches[0])
        stems.add(str(PurePosixPath(matches[0]).with_suffix('')))
    if len(stems)!=1:
        raise ValueError('Mismatched shapefile component stems')
    wkt = files['prj'].decode('utf-8-sig')
    accepted_crs(wkt)
    encoding = files['cpg'].decode('ascii').strip()
    if encoding.upper() not in ['UTF-8', 'UTF8']:
        raise ValueError('Unaccepted DBF encoding')
    reader = shapefile.Reader(shp=io.BytesIO(files['shp']), shx=io.BytesIO(files['shx']), dbf=io.BytesIO(files['dbf']), encoding='utf-8')
    fields = [f[0] for f in reader.fields[1:]]
    features, projected, diagnostics = [], [], []
    district_codes=set()
    # Verify every SHX offset/length against its SHP record, not merely count.
    index = files['shx']
    if len(index) < 100 or (len(index)-100) % 8:
        raise ValueError('Invalid SHX length')
    for i in range((len(index)-100)//8):
        offset, length = struct.unpack('>ii', index[100+i*8:108+i*8])
        if offset*2+8+length*2 > len(files['shp']) or struct.unpack('>ii', files['shp'][offset*2:offset*2+8]) != (i+1, length):
            raise ValueError('SHX/SHP record mismatch')
    for record in reader.iterShapeRecords():
        attributes = dict(zip(fields, record.record))
        names = [str(v).strip() for v in attributes.values() if str(v).strip() in DISTRICTS]
        if len(names) != 1:
            raise ValueError('District DBF identity missing/ambiguous')
        code=attributes.get('CPTID')
        if attributes.get('TNAME')!=names[0] or attributes.get('PTNAME')!='臺北市'+names[0] or not isinstance(code,str) or not re.fullmatch(r'630\d{4}',code) or code in district_codes or attributes.get('COUN_ID')!=code:
            raise ValueError('Contradictory/duplicate district DBF code or name')
        district_codes.add(code)
        validate_raw_rings(record.shape)
        geometry = shape(record.shape.__geo_interface__)
        if geometry.geom_type not in ['Polygon','MultiPolygon'] or geometry.is_empty or not geometry.is_valid:
            raise ValueError('Source topology rejected: '+explain_validity(geometry))
        output = transform(FORWARD.transform, geometry)
        # RFC 7946 right-hand rule; retains every ring and multipart component.
        if output.geom_type == 'Polygon':
            output = orient(output, sign=1)
        else:
            from shapely.geometry import MultiPolygon
            output = MultiPolygon([orient(p, sign=1) for p in output.geoms])
        output = shape(json.loads(json.dumps(mapping(output)), parse_float=lambda v: round(float(v), 9)))
        if not output.is_valid or output.is_empty:
            raise ValueError('Transformed topology rejected')
        west,south,east,north = output.bounds
        if not (121.4 < west < east < 121.8 and 24.9 < south < north < 25.3):
            raise ValueError('Unexpected Taipei geometry extent/axis order')
        round_trip = transform(REVERSE.transform, output)
        error = geometry.hausdorff_distance(round_trip)
        if error > 0.002:
            raise ValueError('Round trip exceeds 2 mm serialization tolerance')
        features.append({'type':'Feature','properties':{'district':names[0],'sourceAttributes':attributes},'geometry':mapping(output)})
        projected.append((names[0], geometry))
        parts = list(geometry.geoms) if geometry.geom_type == 'MultiPolygon' else [geometry]
        diagnostics.append({'district':names[0],'geometryType':geometry.geom_type,'parts':len(parts),'holes':sum(len(p.interiors) for p in parts),'valid':True,'roundTripMaxMeters':round(error,6),'repairs':[]})
    if sorted(n for n,_ in projected) != sorted(DISTRICTS) or len(index) != 100+len(features)*8:
        raise ValueError('Unexpected district population or SHX count')
    overlaps = []
    for i,(a,ga) in enumerate(projected):
        for b,gb in projected[i+1:]:
            area = ga.intersection(gb).area
            if area > 0.000001:
                overlaps.append({'districts':[a,b],'squareMeters':round(area,6)})
            if area > 1:
                raise ValueError('Source overlap exceeds explicit 1 square metre audit tolerance')
    # Overlaps remain auditable; point attribution never arbitrarily breaks ties.
    report = {'sourcePrj':wkt,'cpg':encoding,'dbfFields':fields,'districts':sorted(diagnostics,key=lambda d:d['district']), 'overlaps':overlaps,'repairs':[], 'rejections':[], 'historicalEdition':'2024-09-16','liveCurrencyVerified':False,
              'transform':{'source':'EPSG:3826','target':'EPSG:4326','alwaysXY':True,'operation':FORWARD.description,'operationAccuracyMeters':FORWARD.accuracy,'pipeline':FORWARD.definition,'positionalAccuracy':None,'roundTripToleranceMeters':0.002},
              'control':{'input':[250000,0],'expected':[121,0],'basis':'EPSG:3826 central meridian / false easting definition; analytic projection control, not independent surveyed facility evidence'}}
    control = FORWARD.transform(250000,0)
    if abs(control[0]-121)>1e-10 or abs(control[1])>1e-10:
        raise ValueError('Independent projection-definition control failed')
    return {'type':'FeatureCollection','features':sorted(features,key=lambda f:f['properties']['district'])}, projected, report

def validate_raw_rings(raw_shape):
    starts=list(raw_shape.parts)+[len(raw_shape.points)]
    for start,end in zip(starts,starts[1:]):
        ring=raw_shape.points[start:end]
        if len(ring)<4 or ring[0]!=ring[-1] or any(not math.isfinite(v) for p in ring for v in p):
            raise ValueError('Unclosed, short or nonfinite source ring; no automatic repair')

def spatial(lon, lat, district, boundaries):
    invalid={'status':'invalid','matches':[],'district':None,'boundaryMeters':None,'agrees':None,'sharedBoundary':False,'multipleMatches':False}
    if not geographic(lon,lat):
        return invalid
    try:
        x,y=REVERSE.transform(lon,lat,errcheck=True)
        if not math.isfinite(x) or not math.isfinite(y): return invalid
    except pyproj.exceptions.ProjError:
        return invalid
    point = Point(x,y)
    # One millimetre handles projection/serialization noise on exact shared edges.
    # It is numerical matching tolerance, separate from research uncertainty buffers.
    matches = sorted(name for name,polygon in boundaries if polygon.covers(point) or polygon.boundary.distance(point)<=0.001)
    distance = min(p.boundary.distance(point) for _,p in boundaries)
    if not math.isfinite(distance): return invalid
    assigned = matches[0] if len(matches)==1 else None
    status = 'ambiguous' if len(matches)>1 else 'exterior' if not matches else 'boundary-adjacent' if distance <= 10 else 'interior'
    return {'status':status,'matches':matches,'district':assigned,'boundaryMeters':round(distance,6),'agrees':assigned==district if assigned and district else None,'sharedBoundary':distance<0.001 and len(matches)>1,'multipleMatches':len(matches)>1,
            'boundarySensitivityMeters':{str(t):distance<=t for t in [10,25,50]},'polygonEdition':'E-2024-09-16','transformVersion':'PROJ-EPSG3826-4326-xy-v1'}

NS = {'table':'urn:oasis:names:tc:opendocument:xmlns:table:1.0','office':'urn:oasis:names:tc:opendocument:xmlns:office:1.0','text':'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}
def ods_rows(data):
    xml = archive(data).read('content.xml')
    if b'<!DOCTYPE' in xml or b'<!ENTITY' in xml:
        raise ValueError('Unsafe XML')
    tree = ET.fromstring(xml)
    tables = tree.findall('.//table:table', NS)
    if len(tables)!=1:
        raise ValueError('Ambiguous ODS sheets')
    rows=[]
    for row in tables[0].findall('table:table-row',NS):
        values=[]
        for cell in row:
            repeat=int(cell.get('{'+NS['table']+'}number-columns-repeated','1'))
            if repeat < 1 or repeat > 16384:
                raise ValueError('Invalid repeated ODS cells')
            value=cell.get('{'+NS['office']+'}value')
            if value is None:
                value='\n'.join(''.join(p.itertext()) for p in cell.findall('text:p',NS))
            if value.strip() and len(values)+repeat>7:
                raise ValueError('Populated repeated cell crosses ODS schema width')
            if len(values)<7:
                values.extend([value]*min(repeat,7-len(values)))
            elif value.strip():
                raise ValueError('Unexpected populated ODS column')
        repeat=int(row.get('{'+NS['table']+'}number-rows-repeated','1'))
        if repeat<1 or repeat>1048576:
            raise ValueError('Invalid repeated ODS rows')
        if not any(v.strip() for v in values):
            continue
        if repeat>100 or len(rows)+repeat>1000:
            raise ValueError('ODS row expansion limit')
        rows.extend([values]*repeat)
    expected=['編號','區別','集會堂或活動中心名稱','地址','電話','座標X','座標Y']
    if not rows or rows[0]!=expected:
        raise ValueError('ODS column contract mismatch')
    return [dict(zip(expected,row)) for row in rows[1:]]

def csv_rows(data, required):
    reader=csv.DictReader(io.StringIO(data.decode('utf-8-sig')), strict=True)
    if not reader.fieldnames or len(set(reader.fieldnames))!=len(reader.fieldnames) or not set(required).issubset(reader.fieldnames):
        raise ValueError('CSV column contract mismatch')
    rows=list(reader)
    if any(None in r or any(v is None for v in r.values()) for r in rows):
        raise ValueError('CSV row width mismatch')
    return rows

def haversine(a,b):
    lon1,lat1,lon2,lat2=map(math.radians,[a[0],a[1],b[0],b[1]])
    q=math.sin((lat2-lat1)/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 6371008.8*2*math.asin(math.sqrt(min(1,q)))

def facilities(sources, boundaries):
    result=[]
    for source in sources:
        sid=source['id']
        if sid not in ['B','C','D']: continue
        data=(ROOT/source['path']).read_bytes()
        rows=ods_rows(data) if sid=='C' else csv_rows(data,['地址','經度','緯度', '閱覽單位' if sid=='B' else '名稱'])
        for index,row in enumerate(rows):
            name=row['集會堂或活動中心名稱' if sid=='C' else '閱覽單位' if sid=='B' else '名稱'].strip()
            address=row['地址'].strip()
            fields=['座標X','座標Y'] if sid=='C' else ['經度','緯度']
            original={k:row[k] for k in fields}
            district=row.get('區別') or next((d for d in DISTRICTS if d in address),'')
            issues=[]
            lon=lat=None
            try:
                x,y=[numeric(row[k]) for k in fields]
                if sid=='C':
                    if not (100000<x<400000 and 2400000<y<2900000): raise ValueError('Projected range/axes')
                    lon,lat=FORWARD.transform(x,y,errcheck=True)
                else: lon,lat=x,y
                if not geographic(lon,lat): raise ValueError('Geographic range/axes')
                lon,lat=round(lon,9),round(lat,9)
            except (ValueError,pyproj.exceptions.ProjError): issues.append('invalid-coordinate')
            attribution=spatial(lon,lat,district,boundaries) if lon is not None and lat is not None else spatial(float('nan'),0,district,boundaries)
            if attribution['status'] not in ['interior','boundary-adjacent']: issues.append('unresolved-geography')
            if attribution['agrees'] is not True: issues.append('district-discrepancy')
            if not name or not address: issues.append('missing-identity')
            composite=json.dumps([name,address],ensure_ascii=False,separators=(',',':'))
            key=sid+':'+source['sha256'][:16]+':'+digest(composite.encode())[:24]
            alternatives=[]
            if sid=='C' and lon is not None and lat is not None:
                for epsg in [3825,3828]:
                    try:
                        alternate=Transformer.from_crs(epsg,4326,always_xy=True,allow_ballpark=False).transform(x,y,errcheck=True)
                        alternatives.append({'hypothesis':'EPSG:'+str(epsg),'longitude':round(alternate[0],9),'latitude':round(alternate[1],9),'differenceMeters':round(haversine((lon,lat),alternate),6),'spatial':spatial(*alternate,district,boundaries),'accepted':False})
                    except pyproj.exceptions.ProjError:
                        alternatives.append({'hypothesis':'EPSG:'+str(epsg),'accepted':False,'unavailableReason':'No non-ballpark offline operation available; no approximation substituted'})
            result.append({'id':key,'source':sid,'sourceRow':index+2,'publisherRowId':row.get('編號'),'sourceFile':source['path'],'sourceHash':source['sha256'],'sourceEdition':source['publishedAt'],'sourceUrl':source['catalogueUrl'], 'name':name,'address':address,'originalCoordinates':original,'declaredCRS':None,'assumedCRS':'EPSG:3826' if sid=='C' else 'EPSG:4326','longitude':lon,'latitude':lat,'sourceDistrict':district,'sourceDistrictBasis':'published-區別' if sid=='C' else 'parsed-published-address','spatial':attribution,'independentPositionEvidence':[],'alternativeHypotheses':alternatives, 'issues':issues,'identityQualification':'within-edition-name-address-composite','originalRecord':row})
    composites=Counter(r['id'] for r in result)
    publisher_rows=Counter((r['source'],r['publisherRowId']) for r in result if r['publisherRowId'])
    for r in result:
        if composites[r['id']]>1: r['issues'].append('duplicate-composite')
        if r['publisherRowId'] and publisher_rows[(r['source'],r['publisherRowId'])]>1: r['issues'].append('publisher-row-collision')
        r['tier']='unresolved' if r['issues'] else 'assumption-tested'
        r['eligible']=r['tier']!='unresolved'
        r['confidence']=r['tier']
    groups=defaultdict(list)
    coordinate_groups=defaultdict(list)
    for r in result: groups[r['address']].append(r)
    for r in result:
        if r['longitude'] is not None and r['latitude'] is not None: coordinate_groups[(r['longitude'],r['latitude'])].append(r['id'])
    diagnostics={'duplicateComposites':[{ 'key':key,'rows':count} for key,count in sorted(composites.items()) if count>1],
                 'sharedAddresses':[[r['id'] for r in rows] for rows in groups.values() if len(rows)>1],
                 'conflictingCompositeCoordinates': [key for key,count in composites.items() if count>1 and len({(r['longitude'],r['latitude']) for r in result if r['id']==key})>1],
                 'crossSourceSharedAddresses':[[r['id'] for r in rows] for rows in groups.values() if len({r['source'] for r in rows})>1],
                 'publisherRowCollisions':[{'source':s,'publisherRowId':i,'count':n} for (s,i),n in sorted(publisher_rows.items()) if n>1],
                 'sharedCoordinateGroups':[{'coordinates':list(p),'ids':ids} for p,ids in sorted(coordinate_groups.items()) if len(ids)>1],
                 'longitudinalIdentityEstablished':False,'physicalSiteUniquenessEstablished':False}
    # Source-row disambiguation keeps rejected duplicates visible and uniquely addressable.
    for r in result:
        if composites[r['id']]>1: r['id']+=':row'+str(r['sourceRow'])
    return sorted(result,key=lambda r:r['id']),diagnostics

def main():
    os.chdir(ROOT)
    manifest=json.loads((ROOT/'data/raw/wifi-policy/acquisition-manifest.json').read_text(encoding='utf-8'))
    sources=[s for s in manifest['sources'] if s['id'] in ['A','B','C','D','E']]
    if sorted(s['id'] for s in sources)!=sorted(ACCEPTED_HASHES): raise ValueError('Missing/duplicate accepted source editions')
    for s in sources:
        p=(ROOT/s['path']).resolve()
        if not p.is_relative_to(ROOT/'data/raw/wifi-policy'): raise ValueError('Unsafe source path')
        data=p.read_bytes()
        verify_source(s,data)
    baseline=ROOT/'public/data/wifi-policy/wifi-policy-c250791e7736ed5bca2882ea.json'
    if digest(baseline.read_bytes())!='91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82': raise ValueError('v1.0 mutation')
    geometry,boundaries,report=polygons((ROOT/next(s['path'] for s in sources if s['id']=='E')).read_bytes())
    facility_rows,identity=facilities(sources,boundaries)
    wifi=csv_rows((ROOT/next(s['path'] for s in sources if s['id']=='A')).read_bytes(),['LONGITUDE','LATITUDE','AREA','county','SITE_ID','HOTSPOT_ID'])
    pairs=Counter((r['SITE_ID'],r['HOTSPOT_ID']) for r in wifi)
    hotspots=[]
    for index,row in enumerate(wifi):
        try: lon,lat=numeric(row['LONGITUDE']),numeric(row['LATITUDE'])
        except ValueError: lon=lat=float('nan')
        attribution=spatial(lon,lat,row['AREA'],boundaries)
        eligible=attribution['status'] in ['interior','boundary-adjacent'] and attribution['agrees'] is True and row['county'] in ['臺北市','台北市'] and bool(row['SITE_ID'] and row['HOTSPOT_ID']) and pairs[(row['SITE_ID'],row['HOTSPOT_ID'])]==1
        hotspots.append({'sourceRow':index+2,'siteId':row['SITE_ID'],'hotspotId':row['HOTSPOT_ID'],'sourceDistrict':row['AREA'],'sourceCounty':row['county'],'longitude':lon if math.isfinite(lon) else None,'latitude':lat if math.isfinite(lat) else None,'spatial':attribution,'eligible':eligible})
    # Offline full distances: ~300k pairs once, never in React renders.
    for facility in facility_rows:
        point=(facility['longitude'],facility['latitude'])
        facility['nearestHotspotMeters']={}
        for rule in ['strict','flagged']:
            allowed=[h for h in hotspots if h['eligible'] and (rule=='flagged' or h['spatial']['status']=='interior')]
            valid=point[0] is not None and point[1] is not None
            nearest=min((haversine(point,(h['longitude'],h['latitude'])) for h in allowed),default=None) if valid else None
            facility['nearestHotspotMeters'][rule]=round(nearest,6) if nearest is not None else None
        facility['neighbors']=[{'id':other['id'],'meters':round(haversine(point,(other['longitude'],other['latitude'])),6)} for other in facility_rows if point[0] is not None and point[1] is not None and other['longitude'] is not None and other['latitude'] is not None and haversine(point,(other['longitude'],other['latitude']))<=500]
    report['hotspots']={'rows':len(hotspots),'eligible':sum(h['eligible'] for h in hotspots),'spatialStatuses':dict(Counter(h['spatial']['status'] for h in hotspots)),'districtDisagreements':sum(h['spatial']['agrees'] is False for h in hotspots),'duplicateCoordinateGroups':sum(v>1 for v in Counter((h['longitude'],h['latitude']) for h in hotspots).values()),'repeatedSiteIds':sum(v>1 for v in Counter(h['siteId'] for h in hotspots).values())}
    report['facilities']={'rows':len(facility_rows),'tiers':dict(Counter(r['tier'] for r in facility_rows)),'spatialStatuses':dict(Counter(r['spatial']['status'] for r in facility_rows)),'districtDisagreements':sum(r['spatial']['agrees'] is False for r in facility_rows),'bySource':{s:dict(Counter(r['tier'] for r in facility_rows if r['source']==s)) for s in ['B','C','D']},'identity':identity}
    lineage_keys=['id','datasetId','resourceId','path','sha256','bytes','publishedAt','retrievedAt','retrievalDate','retrievalPrecision','catalogueUrl','url','publisher','license']
    lineage=[{k:s[k] for k in lineage_keys if k in s} for s in sources]
    payload={'schemaVersion':'1.1','methodVersion':METHOD,'baselineSnapshot':{'id':'wifi-policy-c250791e7736ed5bca2882ea','sha256':digest(baseline.read_bytes())},'sourceEditions':lineage,'transform':report['transform'],'geometryEdition':'E-2024-09-16','referenceUnit':'unique-within-edition-facility-composite','facilities':facility_rows,'summary':report,'modeC':{'available':False,'requirements':['operations','usage','comparable-time-windows','population-demand-denominator']},'assumptions':['B/D EPSG:4326 unconfirmed; C EPSG:3826 hypothesis only','H uses published source coordinates; source accuracy not established','10/25/50m boundary tolerances are research parameters, not accuracy guarantees','C = R; self contributions must be reported separately','No RF coverage, resident access, operational status or installation feasibility measured']}
    payload['identitySchema']='version-bound-v1'
    objects={'boundaries.geojson':geometry,'coordinate-audit.json':{'facilities':facility_rows,'report':report},'hotspot-audit.json':hotspots,'references.json':[r['id'] for r in facility_rows if r['eligible']],'excluded.json':[r for r in facility_rows if not r['eligible']],'snapshot.json':payload}
    # Content-addressed generation directory; publish pointer last, atomically.
    version='wifi-geo-'+digest(encode(objects))[:24]
    payload['versionId']=version
    output=ROOT/'public/data/wifi-policy/geographic-v1.1'
    generation=output/version
    generation.mkdir(parents=True,exist_ok=True)
    artifacts={}
    for name,value in objects.items():
        data=encode(value)
        target=generation/name
        if target.exists() and target.read_bytes()!=data: raise ValueError('Immutable artifact collision')
        if not target.exists():
            temporary=target.with_suffix(target.suffix+'.tmp')
            temporary.write_bytes(data)
            temporary.replace(target)
        artifacts[name]={'path':version+'/'+name,'sha256':digest(data),'bytes':len(data)}
    pointer={'schemaVersion':'1.1','versionId':version,'methodVersion':METHOD,'artifacts':artifacts,'tools':{'pyproj':pyproj.__version__,'PROJ':pyproj.proj_version_str,'shapely':shapely.__version__,'GEOS':shapely.geos_version_string,'pyshp':shapefile.__version__}}
    temp=output/'manifest.json.tmp'
    temp.write_bytes(encode(pointer))
    temp.replace(output/'manifest.json')
    print(json.dumps({'versionId':version,'geometry':len(geometry['features']),'facilities':report['facilities'],'hotspots':report['hotspots']},ensure_ascii=True))

def verify_source(source,data):
    if source['id'] not in ACCEPTED_HASHES or source['path']!='data/raw/wifi-policy/'+ACCEPTED_FILES[source['id']] or digest(data)!=source['sha256'] or source['sha256']!=ACCEPTED_HASHES[source['id']] or len(data)!=source['bytes']:
        raise ValueError('Source hash/size/accepted edition mismatch')

if __name__=='__main__': main()

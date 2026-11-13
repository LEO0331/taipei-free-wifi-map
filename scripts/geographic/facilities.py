"""Retained B/C/D facility evidence audit; no geocoding or inferred datum."""
import csv
import hashlib
import io
import json
import math
from pathlib import Path, PurePosixPath
import re
import unicodedata
import xml.etree.ElementTree as ET
import zipfile

from .geometry import classify_point, transform_xy
from pyproj import Transformer
from pyproj.exceptions import ProjError

NS = {'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0', 'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}
DISTRICTS = '中正區 大同區 中山區 松山區 大安區 萬華區 信義區 士林區 北投區 內湖區 南港區 文山區'.split()
SPECS = {
    'B': ('閱覽單位', '經度', '緯度', ['閱覽單位','地址','經度','緯度']),
    'C': ('集會堂或活動中心名稱', '座標X', '座標Y', ['編號','區別','集會堂或活動中心名稱','地址','座標X','座標Y']),
    'D': ('名稱', '經度', '緯度', ['名稱','地址','經度','緯度']),
}

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def normalized(text):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', text)).replace('台北市','臺北市')

def parse_ods(data):
    """Read first sheet, bound expansion and reject hidden extra populated columns."""
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for item in archive.infolist():
            name = PurePosixPath(item.filename)
            if name.is_absolute() or '..' in name.parts or '\\' in item.filename:
                raise ValueError('Unsafe ODS archive path')
            if item.file_size > 8_000_000:
                raise ValueError('ODS member exceeds limit')
        xml = archive.read('content.xml')
    if b'<!DOCTYPE' in xml.upper() or b'<!ENTITY' in xml.upper():
        raise ValueError('ODS entity declarations unsupported')
    tree = ET.fromstring(xml)
    tables = tree.findall('.//table:table', NS)
    if len(tables) != 1:
        raise ValueError('Expected exactly one ODS sheet')
    rows = []
    for row in tables[0].findall('table:table-row', NS):
        repeat = int(row.get('{%s}number-rows-repeated' % NS['table'], '1'))
        values = []
        for cell in list(row):
            count = int(cell.get('{%s}number-columns-repeated' % NS['table'], '1'))
            if not 1 <= count <= 16384 or not 1 <= repeat <= 1048576:
                raise ValueError('Invalid ODS repetition')
            value = '\n'.join(''.join(p.itertext()) for p in cell.findall('text:p', NS))
            if value and len(values) + count > 64:
                raise ValueError('Populated ODS columns exceed limit')
            values.extend([value] * min(count, max(0, 64 - len(values))))
        while values and not values[-1]:
            values.pop()
        if not values:
            continue
        if repeat > 1000 or len(rows) + repeat > 1000:
            raise ValueError('Populated ODS rows exceed limit')
        rows.extend([values.copy() for _ in range(repeat)])
    if not rows:
        raise ValueError('Empty ODS')
    headers = rows[0]
    if len(set(headers)) != len(headers) or any(not h for h in headers):
        raise ValueError('Invalid ODS headers')
    if any(len(row) > len(headers) for row in rows[1:]):
        raise ValueError('ODS row exceeds header width')
    return [dict(zip(headers, row + [''] * (len(headers)-len(row)))) for row in rows[1:]]

def parse_records(data, source):
    if source == 'C':
        rows = parse_ods(data)
    else:
        reader = csv.DictReader(io.StringIO(data.decode('utf-8-sig'), newline=''), strict=True)
        if not reader.fieldnames or len(set(reader.fieldnames)) != len(reader.fieldnames):
            raise ValueError('Invalid CSV headers')
        rows = list(reader)
        if any(None in row or any(value is None for value in row.values()) for row in rows):
            raise ValueError('Malformed CSV row')
    if not rows or any(key not in rows[0] for key in SPECS[source][3]):
        raise ValueError('Missing required facility columns')
    return rows

def number(value):
    if not value or not value.strip():
        raise ValueError('Missing coordinate')
    result = float(value)
    if not math.isfinite(result):
        raise ValueError('Non-finite coordinate')
    return result

def normalize_spatial(raw):
    return {'status': {'boundary-adjacent':'interior','multi-match':'ambiguous'}.get(raw['status'],raw['status']),
            'rawSpatialStatus':raw['status'], 'district':raw.get('district'), 'matches':raw.get('matches',[]),
            'distanceToBoundaryMeters':raw.get('boundaryDistanceMeters'),
            'sourceDistrictAgrees':raw.get('sourceDistrictAgreement'),
            'geometryVersion':raw.get('polygonEdition','E-2024-09-16'),
            'transformationVersion':raw.get('transformationVersion','')}

def audit_facilities(root, districts, geometry_sha256=None):
    root = Path(root)
    manifest = json.loads((root/'data/raw/wifi-policy/acquisition-manifest.json').read_text(encoding='utf-8'))
    sources = [s for s in manifest['sources'] if s['id'] in SPECS]
    records = []
    for source in sources:
        source_id = source['id']
        data = (root/source['path']).read_bytes()
        if sha256(data) != source['sha256']:
            raise ValueError('Facility source hash mismatch: '+source_id)
        name_field, x_field, y_field, _ = SPECS[source_id]
        for index, row in enumerate(parse_records(data, source_id), start=2):
            name, address = row[name_field].strip(), row['地址'].strip()
            district = row.get('區別','').strip() if source_id == 'C' else next((d for d in DISTRICTS if d in address),'')
            composite = normalized(name) + '\0' + normalized(address)
            key = sha256((source_id+'\0'+source['sha256']+'\0'+composite).encode())[:24]
            reasons, warnings, checks = [], ['source-datum-unconfirmed','positional-accuracy-unknown','operation-access-unknown'], {}
            if not name: reasons.append('missing-facility-name')
            if not address: reasons.append('missing-address')
            if not district: reasons.append('source-district-unresolved')
            lon = lat = None
            try:
                x,y = number(row[x_field]), number(row[y_field])
                if source_id == 'C':
                    lon,lat = transform_xy(x,y)
                    # Inverse projection only: no authoritative offline datum operation is
                    # available for TWD67 -> WGS84. Never promote this to a 4326 location.
                    alt_lon,alt_lat = Transformer.from_crs('EPSG:3828','EPSG:3821',always_xy=True,allow_ballpark=False).transform(x,y,errcheck=True)
                    checks['alternativeCrs'] = {'crs':'EPSG:3828','outputCrs':'EPSG:3821','longitude':alt_lon,'latitude':alt_lat,'wgs84TransformationAvailable':False,'conclusion':'inverse-projection-only-not-admissible-WGS84-position; degree-range-cannot-identify-datum'}
                    try:
                        swapped = transform_xy(y,x)
                        checks['axisSwap'] = {'longitude':swapped[0],'latitude':swapped[1],'passesTaipeiExtent':120.9<=swapped[0]<=122 and 24.9<=swapped[1]<=25.3}
                    except (ValueError, ProjError):
                        checks['axisSwap'] = {'rejected':True}
                else:
                    lon,lat=x,y
                    checks['axisSwap']={'passesGeographicRange':-180<=y<=180 and -90<=x<=90}
                if not (-180<=lon<=180 and -90<=lat<=90): raise ValueError('Invalid geographic coordinate')
                if not (121<=lon<=122 and 24.9<=lat<=25.3): reasons.append('outside-research-extent')
            except (ValueError,OverflowError,ProjError) as error:
                lon=lat=None
                reasons.append('invalid-coordinate')
                checks['coordinateFailure']=str(error)
            raw_spatial=classify_point(lon,lat,districts,district)
            spatial=normalize_spatial(raw_spatial)
            if spatial['status'] not in ('interior','boundary'): reasons.append('spatial-'+spatial['status'])
            if spatial['sourceDistrictAgrees'] is False: reasons.append('source-polygon-district-disagreement')
            independent=[]
            if source_id=='B': independent=['https://tpml.gov.taipei/cp.aspx?n=1F9AED300D314011 — official directory consulted for identity/address context only; no coordinate datum or independent positional control established']
            if source_id=='C' and name=='萬華新移民會館': independent=['https://ca.gov.taipei/News_Content.aspx?n=59F2E04A34FDA3E8&s=3830F47E22F5BABB&sms=87415A8B9CE81B16 — independently confirms Wanhua Changsha Street hall identity/address; no coordinate datum or surveyed control']
            if source_id=='D' and name=='中正運動中心': independent=['https://www-ws.gov.taipei/001/Upload/public/Attachment/64141744961.pdf — official historic sports brochure confirms Zhongzheng Xinyi Road Section 1 No.1 identity/address; no coordinate datum or surveyed control']
            records.append({'id':'facility-'+source_id+'-'+key,'source':source_id,'sourceEdition':source['sha256'],'sourceFilename':Path(source['path']).name,'sourceSha256':source['sha256'],'rowIdentity':Path(source['path']).name+'#row'+str(index),'name':name,'address':address,'sourceDistrict':district,'sourceDistrictOrigin':'published-column' if source_id=='C' else 'address-derived' if district else 'missing','originalCoordinates':{'x':row[x_field],'y':row[y_field],'xField':x_field,'yField':y_field},'sourceCrs':None,'assumedCrs':'EPSG:3826' if source_id=='C' else 'EPSG:4326','longitude':lon,'latitude':lat,'evidenceTier':'unresolved' if reasons else 'assumption-tested','identityQualified':bool(name and address),'spatial':spatial,'warnings':warnings,'exclusionReasons':reasons,'rawRecord':row,'independentEvidence':independent,'coordinateChecks':checks,'identityDiagnostics':[]})
    if geometry_sha256 is None:
        from .boundaries import build_boundaries
        _, boundary_report=build_boundaries(root,write=False)
        geometry_sha256=boundary_report['geometrySha256']
    geometry_version='taipei-districts-'+geometry_sha256[:24]
    for record in records:
        record['spatial']['geometryVersion']=geometry_version
    diagnostics = qualify_identities(records)
    summary={'examined':len(records),'verified':sum(r['evidenceTier']=='verified' for r in records),'assumptionTested':sum(r['evidenceTier']=='assumption-tested' for r in records),'unresolved':sum(r['evidenceTier']=='unresolved' for r in records),'polygonAssigned':sum(r['spatial']['district'] is not None for r in records),'districtDisagreements':sum(r['spatial']['sourceDistrictAgrees'] is False for r in records),'within25MetersOfBoundary':sum(r['spatial']['distanceToBoundaryMeters'] is not None and r['spatial']['distanceToBoundaryMeters']<=25 for r in records)}
    summary['bySource']={s:{tier:sum(r['source']==s and r['evidenceTier']==tier for r in records) for tier in ['verified','assumption-tested','unresolved']} for s in SPECS}
    reference_manifest=json.loads((root/'data/raw/wifi-policy/geographic-evidence/manifest.json').read_text(encoding='utf-8'))
    for reference in reference_manifest['references']:
        if sha256((root/reference['path']).read_bytes()) != reference['sha256']:
            raise ValueError('Independent reference hash mismatch')
    return {'schemaVersion':'1.1','methodId':'wifi-facility-coordinate-audit-v1.1','geometrySha256':geometry_sha256,'geometryVersion':geometry_version,'referenceUnit':'unique within-edition source-specific name/address composite; physical distinctness unverified','sources':sources,'independentReferenceManifest':reference_manifest,'records':sorted(records,key=lambda r:r['id']),'summary':summary,'identityDiagnostics':diagnostics,'assumptions':['B/D geographic degrees interpreted as EPSG:4326; source datum unconfirmed','C EPSG:3826 hypothesis; EPSG:3828 alternative cannot be resolved by district attribution alone','Independent official address references are identity evidence, not independent coordinate controls','Source/polygon disagreement triggers exclusion pending investigation; it does not prove inaccurate coordinates']}

def qualify_identities(records):
    groups, addresses, coordinates = {}, {}, {}
    for record in records:
        groups.setdefault(record['id'],[]).append(record)
        addresses.setdefault(normalized(record['address']),[]).append(record)
        coordinates.setdefault((record['longitude'],record['latitude']),[]).append(record)
    diagnostics=[]
    for key, group in groups.items():
        if len(group)>1:
            conflict=len({(r['longitude'],r['latitude']) for r in group})>1
            diagnostics.append({'kind':'conflicting-composite' if conflict else 'duplicate-composite','ids':[r['rowIdentity'] for r in group]})
            for i,record in enumerate(group):
                record['id']=key+'-collision-'+str(i+1)
                record['identityQualified']=False
                record['evidenceTier']='unresolved'
                record['exclusionReasons'].append('duplicate-name-address-composite')
    for address, group in addresses.items():
        if address and len(group)>1:
            kind='potential-cross-source-colocation' if len({r['source'] for r in group})>1 else 'shared-address-distinct-records'
            diagnostics.append({'kind':kind,'ids':[r['id'] for r in group]})
            for record in group: record['identityDiagnostics'].append(kind)
    for coordinate, group in coordinates.items():
        if coordinate[0] is not None and len(group)>1:
            diagnostics.append({'kind':'duplicate-coordinate-pair','ids':[r['id'] for r in group]})
            for record in group: record['identityDiagnostics'].append('duplicate-coordinate-pair')
    return diagnostics

if __name__ == '__main__':
    from .boundaries import build_boundaries, atomic_json, OUTPUT
    project_root = Path(__file__).resolve().parents[2]
    boundaries, boundary_report = build_boundaries(project_root, write=False)
    report = audit_facilities(project_root, boundaries['features'],boundary_report['geometrySha256'])
    atomic_json(project_root / OUTPUT / 'facilities-audit.json', report)
    atomic_json(project_root / OUTPUT / 'eligible-facilities.json', {'methodId':report['methodId'],'records':[r for r in report['records'] if r['evidenceTier']!='unresolved']})
    atomic_json(project_root / OUTPUT / 'excluded-facilities.json', {'methodId':report['methodId'],'records':[r for r in report['records'] if r['evidenceTier']=='unresolved']})
    print(json.dumps(report['summary']))

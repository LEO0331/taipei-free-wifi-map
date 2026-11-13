import io
import json
import math
from pathlib import Path
import sys
import unittest
import zipfile
import tempfile
import shutil
import os

sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'scripts'))
import buildWifiGeographic as g
from shapely.geometry import Polygon, MultiPolygon

class GeographicTests(unittest.TestCase):
    def test_projection_axes_roundtrip_and_rejection(self):
        self.assertEqual(g.FORWARD.transform(250000,0),(121.0,0.0))
        # Retained C first row: regression fixture, not a surveyed position control.
        p=g.FORWARD.transform(300625.006,2770374.449)
        self.assertTrue(121.49<p[0]<121.52 and 25.02<p[1]<25.05)
        x,y=g.REVERSE.transform(*p)
        self.assertLess(math.hypot(x-300625.006,y-2770374.449),0.00001)
        with self.assertRaises(ValueError):g.accepted_crs(g.CRS.from_epsg(3828).to_wkt())
        for value in ['', 'nan','Infinity','1x', True]:
            with self.assertRaises(ValueError):g.numeric(value)
        self.assertFalse(g.geographic(300625,2770374))

    def test_holes_multipart_shared_boundary_and_uncertainty(self):
        outer=Polygon([(250000,2770000),(251000,2770000),(251000,2771000),(250000,2771000)],holes=[[(250100,2770100),(250100,2770200),(250200,2770200),(250200,2770100)]])
        neighbor=Polygon([(251000,2770000),(252000,2770000),(252000,2771000),(251000,2771000)])
        polygons=[('A',MultiPolygon([outer])),('B',neighbor)]
        def check(x,y): return g.spatial(*g.FORWARD.transform(x,y),'A',polygons)
        self.assertEqual(check(250500,2770500)['status'],'interior')
        self.assertEqual(check(250150,2770150)['status'],'exterior')
        self.assertEqual(check(250005,2770500)['status'],'boundary-adjacent')
        self.assertTrue(check(250005,2770500)['boundarySensitivityMeters']['10'])
        # PROJ round-trip floating noise: construct exact projected boundary via inverse.
        p=g.FORWARD.transform(251000,2770500)
        x,y=g.REVERSE.transform(*p)
        exact=Polygon([(x,2770000),(252000,2770000),(252000,2771000),(x,2771000)])
        left=Polygon([(250000,2770000),(x,2770000),(x,2771000),(250000,2771000)])
        result=g.spatial(*p,'A',[('A',left),('B',exact)])
        self.assertEqual(result['status'],'ambiguous')
        self.assertTrue(result['sharedBoundary'])
        self.assertIsNone(result['district'])
        self.assertEqual(g.spatial(float('nan'),0,'A',polygons)['status'],'invalid')
        self.assertEqual(g.spatial(31,0,'A',polygons)['status'],'invalid')
        from types import SimpleNamespace
        with self.assertRaises(ValueError):g.validate_raw_rings(SimpleNamespace(parts=[0],points=[(0,0),(1,0),(1,1),(0,1)]))

    def test_archive_path_and_xml_contract(self):
        data=io.BytesIO()
        with zipfile.ZipFile(data,'w') as z:z.writestr('../escape','x')
        with self.assertRaises(ValueError):g.archive(data.getvalue())
        with self.assertRaises(ValueError):g.csv_rows(b'name,x\nx,2\n',['missing'])
        data=io.BytesIO()
        with zipfile.ZipFile(data,'w') as z:z.writestr('content.xml','<!DOCTYPE test><x/>')
        with self.assertRaises(ValueError):g.ods_rows(data.getvalue())
        original=g.archive((g.ROOT/'data/raw/wifi-policy/C-2025-12-18.ods').read_bytes()).read('content.xml')
        for xml in [original.replace(b'office:value="2770374.449"',b'table:number-columns-repeated="2" office:value="2770374.449"'),original.replace(b'<table:table-row table:style-name="ro2">',b'<table:table-row table:number-rows-repeated="0" table:style-name="ro2">',1)]:
            data=io.BytesIO()
            with zipfile.ZipFile(data,'w') as z:z.writestr('content.xml',xml)
            with self.assertRaises(ValueError):g.ods_rows(data.getvalue())

    def test_retained_sources_geometry_and_ods(self):
        manifest=json.loads((g.ROOT/'data/raw/wifi-policy/acquisition-manifest.json').read_text(encoding='utf-8'))
        for source in manifest['sources']:
            if source['id'] in ['A','B','C','D','E']:
                self.assertEqual(g.digest((g.ROOT/source['path']).read_bytes()),source['sha256'])
                with self.assertRaises(ValueError):g.verify_source(source,b'changed')
        geo,polygons,report=g.polygons((g.ROOT/'data/raw/wifi-policy/E-2024-09-16.zip').read_bytes())
        self.assertEqual(len(geo['features']),12)
        self.assertEqual(report['repairs'],[])
        shared=g.spatial(121.529390488,25.124094834,'北投區',polygons)
        self.assertEqual(shared['status'],'ambiguous')
        self.assertTrue(shared['sharedBoundary'])
        self.assertEqual(sorted(n for n,_ in polygons),sorted(g.DISTRICTS))
        self.assertLess(max(r['roundTripMaxMeters'] for r in report['districts']),0.002)
        rows=g.ods_rows((g.ROOT/'data/raw/wifi-policy/C-2025-12-18.ods').read_bytes())
        self.assertEqual(len(rows),9)
        self.assertEqual(rows[0]['集會堂或活動中心名稱'],'萬華新移民會館')
        self.assertAlmostEqual(float(rows[0]['座標X']),300625.006)
        self.assertAlmostEqual(float(rows[0]['座標Y']),2770374.449)
        facilities,identity=g.facilities(manifest['sources'],polygons)
        self.assertEqual(len(facilities),91)
        self.assertEqual(sum(f['eligible'] for f in facilities),87)
        self.assertEqual(sum(f['tier']=='verified' for f in facilities),0)
        self.assertEqual(identity['duplicateComposites'],[])
        self.assertEqual(len({f['id'] for f in facilities}),91)
        self.assertEqual(sum(f['eligible'] for f in facilities if f['source']=='C'),9)
        b=next(s for s in manifest['sources'] if s['id']=='B')
        self.assertEqual(len(g.csv_rows((g.ROOT/b['path']).read_bytes(),['閱覽單位','地址','經度','緯度'])),70)
        # Synthetic duplicate/conflicting composites exercise source-specific identity admission.
        original=g.csv_rows
        def duplicate(data,required):
            rows=original(data,required)
            if '閱覽單位' in required: rows.append({**rows[0],'經度':'121.51'})
            return rows
        g.csv_rows=duplicate
        try:
            rows,diagnostics=g.facilities([b],polygons)
            self.assertEqual(len(diagnostics['duplicateComposites']),1)
            self.assertEqual(len(diagnostics['conflictingCompositeCoordinates']),1)
            self.assertEqual(len({r['id'] for r in rows}),71)
            self.assertEqual(sum('duplicate-composite' in r['issues'] for r in rows),2)
        finally:g.csv_rows=original

    def test_haversine_threshold_and_colocation(self):
        self.assertEqual(g.haversine((121,25),(121,25)),0)
        self.assertAlmostEqual(g.haversine((0,0),(1,0)),111195.0802335329,places=5)

    def test_actual_generated_nearest_hotspots_and_baseline(self):
        root=g.ROOT/'public/data/wifi-policy/geographic-v1.1'
        manifest=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
        snapshot=json.loads((root/manifest['artifacts']['snapshot.json']['path']).read_text(encoding='utf-8'))
        hotspots=json.loads((root/manifest['artifacts']['hotspot-audit.json']['path']).read_text(encoding='utf-8'))
        facilities=[f for f in snapshot['facilities'] if f['eligible']]
        for rule in ['strict','flagged']:
            allowed=[h for h in hotspots if h['eligible'] and (rule=='flagged' or h['spatial']['status']=='interior')]
            # Independent 3D unit-vector atan2 calculation versus pipeline Haversine.
            for f in facilities:
                lon,lat=map(math.radians,[f['longitude'],f['latitude']])
                def distance(h):
                    lo,la=map(math.radians,[h['longitude'],h['latitude']])
                    a=(math.cos(lat)*math.cos(lon),math.cos(lat)*math.sin(lon),math.sin(lat))
                    b=(math.cos(la)*math.cos(lo),math.cos(la)*math.sin(lo),math.sin(la))
                    dot=sum(x*y for x,y in zip(a,b))
                    cross=(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
                    return 6371008.8*math.atan2(math.hypot(*cross),dot)
                expected=min(distance(h) for h in allowed)
                self.assertAlmostEqual(expected,f['nearestHotspotMeters'][rule],delta=0.00001)
            unique={(h['longitude'],h['latitude']) for h in allowed}
            self.assertLess(len(unique),len(allowed))
            f=facilities[0]
            a=min(g.haversine((f['longitude'],f['latitude']),p) for p in unique)
            b=min(g.haversine((f['longitude'],f['latitude']),(h['longitude'],h['latitude'])) for h in allowed+allowed)
            self.assertEqual(a,b)
        self.assertEqual([sum(f['nearestHotspotMeters']['strict']<=r for f in facilities) for r in [100,250,500]],[69,85,87])

    def test_failed_build_preserves_last_good_pointer(self):
        old_root=g.ROOT
        old_cwd=Path.cwd()
        with tempfile.TemporaryDirectory() as temp:
            temp=Path(temp)
            source=old_root/'data/raw/wifi-policy'
            target=temp/'data/raw/wifi-policy'
            target.mkdir(parents=True)
            for name in ['acquisition-manifest.json','A-2026-07-01.csv','B-2026-06-10.csv','C-2025-12-18.ods','D-2026-03-02.csv','E-2024-09-16.zip']:
                shutil.copyfile(source/name,target/name)
            pointer=temp/'public/data/wifi-policy/geographic-v1.1/manifest.json'
            pointer.parent.mkdir(parents=True)
            pointer.write_bytes(b'last-good')
            (target/'B-2026-06-10.csv').write_bytes(b'changed')
            g.ROOT=temp
            try:
                with self.assertRaises(ValueError):g.main()
                self.assertEqual(pointer.read_bytes(),b'last-good')
            finally:
                g.ROOT=old_root
                os.chdir(old_cwd)

    def test_shp_ingestion_preserves_holes_and_multipart(self):
        shp,shx,dbf=io.BytesIO(),io.BytesIO(),io.BytesIO()
        writer=g.shapefile.Writer(shp=shp,shx=shx,dbf=dbf,shapeType=g.shapefile.POLYGON,encoding='utf-8')
        for field in ['TNAME','PTNAME','CPTID','COUN_ID']:writer.field(field,'C',size=60)
        for i,district in enumerate(g.DISTRICTS):
            x,y=300000+i*2000,2770000
            rings=[[(x,y),(x,y+1000),(x+1000,y+1000),(x+1000,y),(x,y)]]
            if i==0:
                rings.extend([[(x+100,y+100),(x+200,y+100),(x+200,y+200),(x+100,y+200),(x+100,y+100)],[(x+1200,y),(x+1200,y+100),(x+1300,y+100),(x+1300,y),(x+1200,y)]])
            writer.poly(rings)
            writer.record(district,'臺北市'+district,f'630{i+1:02}00',f'630{i+1:02}00')
        writer.close()
        retained=g.archive((g.ROOT/'data/raw/wifi-policy/E-2024-09-16.zip').read_bytes())
        result=io.BytesIO()
        with zipfile.ZipFile(result,'w') as z:
            for suffix,b in [('shp',shp.getvalue()),('shx',shx.getvalue()),('dbf',dbf.getvalue()),('cpg',b'UTF-8'),('prj',retained.read('G97_A_CADIST_P.prj'))]:z.writestr('fixture.'+suffix,b)
        geo,_,report=g.polygons(result.getvalue())
        first=next(f for f in geo['features'] if f['properties']['district']==g.DISTRICTS[0])
        self.assertEqual(first['geometry']['type'],'MultiPolygon')
        d=next(d for d in report['districts'] if d['district']==g.DISTRICTS[0])
        self.assertEqual(d['parts'],2)
        self.assertEqual(d['holes'],1)

if __name__=='__main__':unittest.main()

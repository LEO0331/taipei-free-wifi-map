"""Synthetic geometry fixtures are tests only; no invented production records."""
import io
import math
import tempfile
import unittest
import zipfile
from pathlib import Path

from pyproj import CRS
from shapely.geometry import Polygon, MultiPolygon, mapping

from .boundaries import ROOT, build_boundaries, canonical_bytes, safe_zip_entries, sha256
from .geometry import checked_geometry, classify_point, transform_xy, transformer, validate_prj
from .hotspots import parsed_coordinates


def feature(name, geom):
    return dict(properties=dict(district=name),geometry=mapping(geom))


class GeometryTests(unittest.TestCase):
    def test_hotspot_invalid_coordinates_serialize_as_null(self):
        for value in ['NaN','Infinity','-Infinity','bad','181','']:
            original={'LONGITUDE':value,'LATITUDE':'25.03'}
            lon,lat=parsed_coordinates(original)
            self.assertEqual((lon,lat),(None,None))
            spatial=classify_point(lon,lat,[])
            self.assertEqual(spatial['status'],'invalid')
            encoded=canonical_bytes(dict(longitude=lon,latitude=lat,originalCoordinateValues=original,spatial=spatial))
            self.assertIn(b'"longitude":null',encoded)
            self.assertEqual(original['LONGITUDE'],value)
        self.assertEqual(parsed_coordinates({'LONGITUDE':'121.5','LATITUDE':'25.03'}),(121.5,25.03))

    def test_origin_axis_roundtrip(self):
        lon, lat = transform_xy(250000,0)
        self.assertAlmostEqual(lon,121,places=10)
        self.assertAlmostEqual(lat,0,places=10)
        lon, lat = transform_xy(300625.006,2770374.449)
        self.assertTrue(121.4 < lon < 121.6 and 25 < lat < 25.1)
        x,y=transformer('EPSG:4326','EPSG:3826').transform(lon,lat)
        self.assertLess(math.hypot(x-300625.006,y-2770374.449),0.001)
        swapped=transform_xy(2770374.449,300625.006)
        self.assertFalse(121.4 < swapped[0] < 121.6 and 25 < swapped[1] < 25.1)

    def test_invalid_coordinate_and_crs(self):
        for coordinates in [(math.nan,1),(math.inf,1),(True,2),('1',2)]:
            with self.assertRaises(ValueError): transform_xy(*coordinates)
        for crs in [4326,3828,3857]:
            with self.assertRaises(ValueError): validate_prj(CRS.from_epsg(crs).to_wkt())
        self.assertTrue(validate_prj(CRS.from_epsg(3826).to_wkt()).is_projected)
        self.assertEqual(classify_point(None,None,[])['status'],'invalid')
        self.assertEqual(classify_point(250000,2770000,[])['status'],'invalid')

    def test_holes_multipolygons_and_no_silent_repair(self):
        polygon=Polygon([(121,25),(121.1,25),(121.1,25.1),(121,25.1)], holes=[[(121.02,25.02),(121.04,25.02),(121.04,25.04),(121.02,25.04)]])
        multi=MultiPolygon([polygon,Polygon([(121.2,25),(121.3,25),(121.3,25.1),(121.2,25.1)])])
        self.assertEqual(len(checked_geometry(mapping(polygon)).interiors),1)
        self.assertEqual(len(checked_geometry(mapping(multi)).geoms),2)
        self.assertEqual(classify_point(121.03,25.03,[feature('A',multi)])['status'],'exterior')
        self.assertEqual(classify_point(121.25,25.05,[feature('A',multi)])['district'],'A')
        with self.assertRaisesRegex(ValueError,'no repair performed'):
            checked_geometry(mapping(Polygon([(0,0),(1,1),(1,0),(0,1),(0,0)])))

    def test_boundary_multi_match_exterior_and_sensitivity(self):
        polygon=Polygon([(121,25),(121.1,25),(121.1,25.1),(121,25.1)])
        features=[feature('A',polygon)]
        self.assertEqual(classify_point(121,25.05,features)['status'],'boundary')
        self.assertIsNone(classify_point(121,25.05,features)['district'])
        self.assertEqual(classify_point(121.05,25.05,features,'other')['sourceDistrictAgreement'],False)
        self.assertEqual(classify_point(121.05,25.05,features+[feature('B',polygon)])['status'],'multi-match')
        self.assertEqual(classify_point(120,25,features)['status'],'exterior')
        near=classify_point(121.0001,25.05,features,near_meters=25)
        self.assertEqual(near['status'],'boundary-adjacent')
        self.assertTrue(0<near['boundaryDistanceMeters']<25)
        self.assertEqual(classify_point(121.0001,25.05,features,near_meters=5)['status'],'interior')

    def test_archive_security(self):
        for name in ['../escape.shp','/absolute.shp','C:/absolute.shp','a\\b.shp']:
            stream=io.BytesIO()
            with zipfile.ZipFile(stream,'w') as archive: archive.writestr(name,b'x')
            # zipfile normalizes backslashes on Windows when writing. Corrupt
            # both header names to exercise the actual untrusted bytes.
            data=stream.getvalue().replace(b'a/b.shp',b'a\\b.shp') if '\\' in name else stream.getvalue()
            with self.assertRaises(ValueError): safe_zip_entries(data)
        stream=io.BytesIO()
        with zipfile.ZipFile(stream,'w') as archive: archive.writestr('ok',b'x'*100)
        with self.assertRaises(ValueError): safe_zip_entries(stream.getvalue(),max_total_bytes=10)

    def test_real_boundary_identity_hash_orientation_and_failed_source(self):
        collection,report=build_boundaries(write=False)
        self.assertEqual(report['acceptedCount'],12)
        self.assertEqual(report['rejectedCount'],0)
        self.assertEqual(report['repairs'],[])
        self.assertEqual(sha256(canonical_bytes(collection)),report['geometrySha256'])
        self.assertEqual(len({f['properties']['sourceAttributes']['CPTID'] for f in collection['features']}),12)
        for f in collection['features']:
            geom=checked_geometry(f['geometry'])
            polygons=[geom] if geom.geom_type=='Polygon' else geom.geoms
            for polygon in polygons:
                self.assertTrue(polygon.exterior.is_ccw)
                self.assertTrue(all(not ring.is_ccw for ring in polygon.interiors))
        second,second_report=build_boundaries(write=False)
        self.assertEqual(canonical_bytes(collection),canonical_bytes(second))
        self.assertEqual(report['geometrySha256'],second_report['geometrySha256'])
        with tempfile.TemporaryDirectory(dir=ROOT/'.omx') as temporary:
            root=Path(temporary)
            raw=root/'data/raw/wifi-policy'
            raw.mkdir(parents=True)
            (raw/'E-2024-09-16.zip').write_bytes(b'changed source')
            sentinel=root/'public/data/wifi-policy/geographic-v1.1/district-boundaries.geojson'
            sentinel.parent.mkdir(parents=True)
            sentinel.write_bytes(b'last valid artifact')
            with self.assertRaisesRegex(ValueError,'hash mismatch'): build_boundaries(root)
            self.assertEqual(sentinel.read_bytes(),b'last valid artifact')


if __name__=='__main__':
    unittest.main()

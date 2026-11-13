"""Validated offline PROJ transformations and explicit polygon attribution."""
import math
from functools import lru_cache

from pyproj import CRS, Transformer, network
from shapely.geometry import Point, shape
from shapely.ops import transform

network.set_network_enabled(False)
TRANSFORMATION_VERSION = 'proj-twd97-wgs84-always-xy-v1'
POLYGON_EDITION = 'E-2024-09-16'
_DISTRICT_CACHE = {}


@lru_cache(maxsize=8)
def transformer(source='EPSG:3826', target='EPSG:4326'):
    return Transformer.from_crs(source, target, always_xy=True, allow_ballpark=False, only_best=True)


def validate_prj(wkt):
    crs = CRS.from_wkt(wkt)
    if not crs.is_projected or not crs.equals(CRS.from_epsg(3826), ignore_axis_order=True):
        raise ValueError('Contradictory or unsupported PRJ: expected EPSG:3826')
    return crs


def valid_coordinate(lon, lat):
    return (isinstance(lon, (float, int)) and not isinstance(lon, bool)
            and isinstance(lat, (float, int)) and not isinstance(lat, bool)
            and math.isfinite(lon) and math.isfinite(lat)
            and -180 <= lon <= 180 and -90 <= lat <= 90)


def transform_xy(x, y, source_crs='EPSG:3826'):
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in (x, y)):
        raise ValueError('Invalid projected coordinates')
    lon, lat = transformer(source_crs).transform(x, y, errcheck=True)
    if not valid_coordinate(lon, lat):
        raise ValueError('Invalid geographic transformation result')
    return lon, lat


def checked_geometry(geo):
    geom = shape(geo)
    if geom.geom_type not in ('Polygon', 'MultiPolygon') or geom.is_empty or not geom.is_valid:
        from shapely.validation import explain_validity
        raise ValueError('Invalid polygon; no repair performed: ' + explain_validity(geom))
    return geom


def classify_point(lon, lat, districts, source_district=None, near_meters=25):
    """Never choose a district on a shared/exact boundary or multiple match.

    Boundary distance uses the projected official CRS in meters. The near
    threshold is a research sensitivity, never a surveyed error guarantee.
    """
    result = dict(status='invalid', district=None, matches=[], boundaryDistanceMeters=None,
                  sourceDistrict=source_district, sourceDistrictAgreement=None,
                  polygonEdition=POLYGON_EDITION, transformationVersion=TRANSFORMATION_VERSION)
    if not valid_coordinate(lon, lat):
        return result
    point = Point(lon, lat)
    project = transformer('EPSG:4326', 'EPSG:3826').transform
    projected_point = transform(project, point)
    covers, interiors, boundary_hits, distances = [], [], [], []
    for feature in districts:
        key = id(feature)
        if key not in _DISTRICT_CACHE:
            geom = shape(feature['geometry'])
            _DISTRICT_CACHE[key] = (feature, geom, transform(project, geom.boundary))
        _, geom, projected_boundary = _DISTRICT_CACHE[key]
        district = feature['properties']['district']
        if geom.covers(point):
            covers.append(district)
        if geom.contains(point):
            interiors.append(district)
        if geom.boundary.intersects(point):
            boundary_hits.append(district)
        distances.append(projected_boundary.distance(projected_point))
    distance = min(distances) if distances else None
    result.update(matches=sorted(covers), boundaryDistanceMeters=round(distance, 6) if distance is not None else None)
    if boundary_hits:
        result['status'] = 'boundary'
    elif len(covers) > 1:
        result['status'] = 'multi-match'
    elif len(interiors) == 1:
        result.update(status='boundary-adjacent' if distance is not None and distance <= near_meters else 'interior', district=interiors[0])
    else:
        result['status'] = 'exterior'
    if source_district and result['district']:
        result['sourceDistrictAgreement'] = source_district.replace('台', '臺') == result['district'].replace('台', '臺')
    return result

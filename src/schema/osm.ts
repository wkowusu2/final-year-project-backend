import { bigint, customType, integer, pgTable, real, text } from 'drizzle-orm/pg-core';

// These tables are owned and refreshed by osm2pgsql. Keep them out of migrations.ts.
const hstore = customType<{ data: string; driverData: string }>({
    dataType() {
        return 'hstore';
    },
});

const pointGeometry = customType<{ data: string; driverData: string }>({
    dataType() {
        return 'geometry(Point,3857)';
    },
});

const lineGeometry = customType<{ data: string; driverData: string }>({
    dataType() {
        return 'geometry(LineString,3857)';
    },
});

const polygonGeometry = customType<{ data: string; driverData: string }>({
    dataType() {
        return 'geometry(Geometry,3857)';
    },
});

function osmTags() {
    return {
        osmId: bigint('osm_id', { mode: 'bigint' }),
        access: text(),
        addrHousename: text('addr:housename'),
        addrHousenumber: text('addr:housenumber'),
        addrInterpolation: text('addr:interpolation'),
        adminLevel: text('admin_level'),
        aerialway: text(),
        aeroway: text(),
        amenity: text(),
        area: text(),
        barrier: text(),
        bicycle: text(),
        brand: text(),
        bridge: text(),
        boundary: text(),
        building: text(),
        construction: text(),
        covered: text(),
        culvert: text(),
        cutting: text(),
        denomination: text(),
        disused: text(),
        embankment: text(),
        foot: text(),
        generatorSource: text('generator:source'),
        harbour: text(),
        highway: text(),
        historic: text(),
        horse: text(),
        intermittent: text(),
        junction: text(),
        landuse: text(),
        layer: text(),
        leisure: text(),
        lock: text(),
        manMade: text('man_made'),
        military: text(),
        motorcar: text(),
        name: text(),
        natural: text(),
        office: text(),
        oneway: text(),
        operator: text(),
        place: text(),
        population: text(),
        power: text(),
        powerSource: text('power_source'),
        publicTransport: text('public_transport'),
        railway: text(),
        ref: text(),
        religion: text(),
        route: text(),
        service: text(),
        shop: text(),
        sport: text(),
        surface: text(),
        toll: text(),
        tourism: text(),
        towerType: text('tower:type'),
        tunnel: text(),
        water: text(),
        waterway: text(),
        wetland: text(),
        width: text(),
        wood: text(),
        zOrder: integer('z_order'),
        tags: hstore(),
    };
}

export const planetOsmLine = pgTable('planet_osm_line', {
    ...osmTags(),
    tracktype: text(),
    wayArea: real('way_area'),
    way: lineGeometry(),
});

export const planetOsmRoads = pgTable('planet_osm_roads', {
    ...osmTags(),
    tracktype: text(),
    wayArea: real('way_area'),
    way: lineGeometry(),
});

export const planetOsmPoint = pgTable('planet_osm_point', {
    ...osmTags(),
    capital: text(),
    ele: text(),
    way: pointGeometry(),
});

export const planetOsmPolygon = pgTable('planet_osm_polygon', {
    ...osmTags(),
    tracktype: text(),
    wayArea: real('way_area'),
    way: polygonGeometry(),
});

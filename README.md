# RoadPulse Ghana Backend API

The RoadPulse backend is a Node.js, Express and TypeScript API that coordinates driver authentication, GPS tracking, spatial traffic processing, incidents, road advisories and administrator data.

## Core responsibilities

- Driver phone/OTP authentication, tokens and profiles
- Foreground tracking-session lifecycle and batched GPS ingestion
- Valhalla sequence map matching with a PostGIS nearest-road fallback
- Rolling road-speed aggregation for current traffic levels
- Incidents, confirmations, optional media metadata and advisories
- Administrator authentication, dashboard and operational actions
- Route-intelligence data enriched with traffic, incident and advisory context

## Prerequisites

- Node.js and npm
- PostgreSQL with PostGIS enabled
- Ghana OSM road data imported into the configured database
- Valhalla available at the configured routing URL
- Arkesel credentials for OTP delivery
- Cloudinary credentials for incident-media storage

## Environment configuration

The backend loads an environment file according to `NODE_ENV` (`.env.development`, `.env.production`, `.env.local` or `.env.example`). Configure the following required values for the chosen environment:

```text
DATABASE_URL=
MIGRATION_DATABASE_URL=             # optional
PORT=3000                           # optional
JWT_SECRET=
ARKESEL_API_KEY=
ARKESEL_BASE_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ROUTING_BASE_URL=http://localhost:8002
```

Keep all actual secrets outside version control.

## Install, build and run

```bash
npm install
npm run build
npm run start:dev
```

The API listens on port `3000` by default and exposes endpoints below `/api/v1`.

Useful database scripts include:

```bash
npm run db:generate
npm run db:migrate
npm run db:migrate:local
npm run db:migrate:prod
```

Run migration commands only against the intended database and ensure PostGIS plus the required OSM road data are available before exercising GPS matching endpoints.

## Main API areas

| Area | Base route |
| --- | --- |
| Authentication | `/api/v1/auth` |
| Driver profiles | `/api/v1/driver-profiles` |
| Traffic map | `/api/v1/map` |
| GPS tracking | `/api/v1/tracking` |
| Incidents | `/api/v1/incidents` |
| Administration | `/api/v1/admin` |
| Route intelligence | `/api/v1/routes` |
| Road advisories | `/api/v1/road-advisories` |

## Related projects

- [`../driverApp/move_with_vim`](../driverApp/move_with_vim): driver mobile client
- [`../admin`](../admin): administrator console
- `../vahalla`: Valhalla routing and map-matching deployment resources

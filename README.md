# Cambodia Land Risk Check

Static prototype for screening micro-loan applicant locations against Cambodia protected-area and forest-risk zones.

## API service

The reusable API implementation lives in `api/`. It is a Node.js + TypeScript + Fastify service packaged for Docker with PostgreSQL/PostGIS, API-key authentication, reviewed GeoJSON dataset management, centralized geocoding, risk checks, and audit logging.

See `api/README.md` for setup and endpoint details.

## Use

Open `index.html` through a local static server or deploy the repository with GitHub Pages/Vercel.

## Important

The current protected-area polygons are approximate starter data for demonstration. Before production use, replace them with official Cambodia protected-area GIS data and keep an auditable decision record for every application.

## Deployment

Redeploy trigger: 2026-05-27 20:55 Asia/Colombo.
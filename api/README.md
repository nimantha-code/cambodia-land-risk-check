# Cambodia Land Risk API

Reusable API for screening Cambodia loan locations against reviewed protected-area GIS datasets.

## Stack

- Node.js + TypeScript + Fastify
- PostgreSQL + PostGIS
- Docker / Docker Compose
- API-key authentication per consuming application
- Audit logging for every risk check

## Local Setup

```bash
cp .env.example .env
docker compose up --build
```

In another terminal:

```bash
npm install
npm run migrate
npm run seed:client -- internal-demo
npm run import:geojson -- ../data/wcs_pdf_extracted_candidates.geojson wcs-reviewed-v1 "Reviewed WCS GeoJSON" --activate
```

## Main Endpoints

### `POST /v1/risk-checks`

Headers:

```http
x-api-key: <client-api-key>
content-type: application/json
```

Body with coordinates:

```json
{
  "lat": 11.5564,
  "lng": 104.9282,
  "referenceId": "loan-application-123"
}
```

Body with address:

```json
{
  "address": "Phnom Penh",
  "referenceId": "loan-application-124"
}
```

Response includes `checkId`, normalized location, decision status, nearest protected areas, distance, dataset version, warnings, and audit timestamp.

### `GET /v1/datasets/current`

Returns metadata for the active GIS dataset.

### `POST /v1/datasets`

Admin-only upload of reviewed GeoJSON.

Headers:

```http
x-admin-api-key: <admin-key>
```

Body:

```json
{
  "version": "official-pa-2026-01",
  "source": "Client reviewed GeoJSON",
  "geojson": {
    "type": "FeatureCollection",
    "features": []
  }
}
```

### `POST /v1/datasets/{datasetId}/activate`

Admin-only activation of a reviewed dataset.

## Production Notes

- Put the API behind HTTPS.
- Give each consuming application a separate API key.
- Rotate `API_KEY_PEPPER` and `ADMIN_API_KEY` through the client's secret manager.
- Use official reviewed GeoJSON or shapefile-to-GeoJSON exports for production datasets.
- Keep the MVP frontend as a consumer of this API later; do not duplicate GIS logic across applications.

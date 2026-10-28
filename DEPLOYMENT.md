# Render deployment

This repository is prepared as two Render services backed by Render PostgreSQL:

- `knot-bloom-api`: Python web service rooted at `django_backend/`.
- `knot-bloom-frontend`: Vite static site built from `frontend/`.
- `knot-bloom-db`: PostgreSQL database referenced through `DATABASE_URL`.

The repository Blueprint is [render.yaml](render.yaml). It does not contain
passwords, payment credentials, or secret values.

## Render settings

Do not apply `render.yaml` as a new Blueprint for the already deployed
services: its resource names (`knot-bloom-api`, `knot-bloom-frontend`, and
`knot-bloom-db`) differ from the existing public services and could create
duplicates. Update the existing Render services manually using these values:

- Backend build command: `./build.sh`
- Backend start command: `python -m gunicorn config.wsgi:application`
- Backend root directory: `django_backend`
- Frontend build command: `npm ci && npm run build`
- Frontend publish directory: `frontend/dist`
- Frontend rewrite: `/*` to `/index.html`

For the existing deployment in this project, use:

- Existing backend service URL: `https://crochet-online-shopping-in.onrender.com`
- Existing frontend service URL: `https://knot-and-bloom-in.onrender.com`
- Frontend `VITE_API_BASE_URL`: `https://crochet-online-shopping-in.onrender.com`
- Backend `FRONTEND_URL`: `https://knot-and-bloom-in.onrender.com`
- Backend health check: `/admin/login/`

The Blueprint connects the frontend's `VITE_API_BASE_URL` to the backend's
public Render URL and connects the backend's `FRONTEND_URL` to the frontend's
public Render URL. The backend also accepts its automatic
`RENDER_EXTERNAL_HOSTNAME` value. Add any custom frontend or backend domains to
the corresponding Render environment values when they are introduced.

For production email verification, configure these names on the existing
backend service using private provider values: `EMAIL_BACKEND`,
`DEFAULT_FROM_EMAIL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`,
`EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, and `EMAIL_USE_SSL`. Never commit the
password or paste it into chat. If these values are absent, administrator
verification email delivery remains unavailable; the local development link
is intentionally disabled when `DEBUG=False`.

## Secrets and local development

Keep `django_backend/.env` local. It is intentionally ignored and is no longer
tracked. Set `DJANGO_SECRET_KEY` in Render using a generated value; do not put
it in `render.yaml`. Set `DJANGO_DEBUG=False` in production. `DATABASE_URL` is
provided by Render PostgreSQL.

When `DATABASE_URL` is absent, Django uses the existing
`django_backend/db.sqlite3`, so local development does not replace or delete
that file. The local `.env.example` documents the supported variables.

The current tracked `.env` previously exposed a database password in Git. That
file is removed from Git tracking by this change, but the password must still be
rotated because removing a file does not erase it from Git history.

## Data and uploaded files

`build.sh` runs migrations, but migrations do not copy the contents of the
existing SQLite database into Render PostgreSQL. Before going live, make a
private backup/export of the current data and load it into the Render database
through a protected workflow. Do not commit a data fixture containing user
password hashes, order details, or payment references.

The committed product media is available in the deployed source tree and the
Django app serves `/media/` URLs. Runtime product uploads are written to
`MEDIA_ROOT`, which is ephemeral on a free Render web service. They can
disappear after a restart or deploy. Durable options are:

1. Upgrade the backend to a paid Render web service and attach a persistent
   disk mounted at the backend's `media` directory; or
2. Move product uploads to an object-storage service and configure Django's
   storage backend.

The FamPay QR is `frontend/public/assets/fampay-qr.jpeg`, so Vite copies it into
the static build and Render's static-site CDN serves it durably. The QR and UPI
details are public payment information, not a substitute for secret
credentials; review them before making the site public.

## Current Render free-tier caveat

Render currently allows free static sites, free web services, and a free
PostgreSQL instance for testing. Free web services cannot use persistent disks;
free PostgreSQL is limited to 1 GB, expires 30 days after creation, has no
backups, and has a 14-day upgrade grace period before deletion. Free services
also spin down when idle and share a monthly pool of free instance hours.
Use a paid database and paid backend with durable media for production data.

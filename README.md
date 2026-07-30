# MyStoryKnight

## Description

## Running the application

### Prerequisites

- Docker Desktop

### Steps

1. Clone the repository
2. Inside `backend` and `frontend`, copy `.env.example` to `.env` and fill in the necessary environment variables.
3. Run the following command in the root directory of the repository

```bash
docker-compose up
```

1. Open a web browser and navigate to `http://localhost:3000`
2. Access the backend API at `http://localhost:5000/api`

## Structure

```
MyStoryKnight/
├── frontend                # Frontend code (React)
|  ├── Dockerfile           # Dockerfile for frontend
├── backend                 # Backend code (Flask)
|  ├── Dockerfile           # Dockerfile for backend
├── docker-compose.yml      # Docker compose file
└── README.md               # This file
```

## Deployment

### Backend (Cloud Run)

From the `backend` directory:

```bash
gcloud run deploy mystoryknight-be --source .   --region us-central1   --allow-unauthenticated   --set-env-vars "CORS_ORIGINS=https://tomfluff.github.io,LOGGER=False,DEBUG=False,IMAGE_DELIVERY=inline"
```

Then set `OPENAI_API_KEY` in the Cloud Console (kept out of the command so it
stays out of shell history).

Environment variables:

| Variable | Notes |
| --- | --- |
| `OPENAI_API_KEY` | Required. Without it the service still starts, but every LLM call returns 401. |
| `OPENAI_ORG_ID` | Optional. Leave unset unless you have one; a wrong value 401s every request. |
| `CORS_ORIGINS` | Comma-separated allowed origins. Browser-only protection: it does not stop scripted calls. |
| `IMAGE_DELIVERY` | `inline` (default) returns images as WebP data URLs and stores nothing. `url` stores them. |
| `GCS_BUCKET` | Only used when `IMAGE_DELIVERY=url`. Unset means the instance disk, which on Cloud Run is per-instance and RAM-backed. |
| `DEBUG` | Must stay `False`. `True` exposes the Werkzeug debugger. |
| `PORT` | Do **not** set. Reserved on Cloud Run, which injects it. |

Notes:

- Check the active project first: `gcloud projects list`, `gcloud config get project`, `gcloud config set project PROJECT_ID`.
- The container runs gunicorn, not the Flask development server.
- `.env` is excluded from the image via `.dockerignore`. Do not remove that entry -- the Dockerfile does `COPY . .`, so without it your API key is baked into a pullable image layer.

### Frontend (GitHub Pages)

1. Put the Cloud Run URL in `frontend/.env`:
   ```
   VITE_API_BASE_URL=https://<service>-<hash>.us-central1.run.app/api
   ```
   This is compiled into the bundle at build time, so changing it later requires a rebuild.
2. From `frontend`, run `npm run deploy` (npm runs the `predeploy` build automatically).
3. Publishes to the `gh-pages` branch, served at `https://tomfluff.github.io/mystoryknight/`.

GitHub Pages paths are case-sensitive: `base` in `vite.config.ts` must match the
repository name exactly, and the router takes its `basename` from that value.

# Notes

- Audio playback with more compatability [might be related to this post](https://anvil.works/forum/t/how-to-play-streaming-audio-as-it-arrives/18743/2).

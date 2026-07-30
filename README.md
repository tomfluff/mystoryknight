# MyStoryKnight

A collaborative storytelling web app for children. A player draws or uploads a
character, the backend turns that drawing into a character sheet and a few story
premises using OpenAI models, and the story then advances one illustrated,
narrated part at a time from choices the player makes. React + Vite frontend,
Flask + gunicorn backend.

## Prerequisites

- An OpenAI API key.
- Docker Desktop, or Python 3.10 and Node 18 to run the two services directly.

## Setup and run

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to
`frontend/.env`, then fill them in. Both files must exist -- docker compose
loads them by path.

With Docker, from the repository root:

```bash
docker-compose up
```

Frontend on <http://localhost:3000>, API on <http://localhost:5000/api>.
Compose overrides the backend image's gunicorn command with `python app.py` and
bind-mounts both source trees, so edits hot-reload.

Without Docker: `pip install -r requirements.txt && python app.py` in
`backend/`, and `npm install && npm run dev` in `frontend/`.

## Environment variables

`backend/.env`:

| Variable | Notes |
| --- | --- |
| `OPENAI_API_KEY` | Required. Missing it does not stop startup; every LLM call returns 401 instead. |
| `OPENAI_ORG_ID` | Optional. Leave unset unless you have one -- a wrong value 401s every request. |
| `CORS_ORIGINS` | Comma-separated allowed origins, default `http://localhost:3000`. Browser-only protection: it does not stop scripted calls. |
| `DEBUG` | Default `False`. Never `True` on a deployed instance -- it exposes the Werkzeug debugger. |
| `LOGGER` | Default `False`. `True` logs to `logs/app.log` inside the container, not stdout. |
| `GCS_BUCKET` | Bucket for stored story images. Unused while image delivery is `inline` (see below). |
| `PORT`, `HOST` | Local `python app.py` only. Do not set `PORT` on Cloud Run -- it is reserved and injected. |

`frontend/.env`:

| Variable | Notes |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API root, e.g. `http://localhost:5000/api`. Compiled into the bundle at build time, so changing it requires a rebuild. |

Image delivery is a constant in `backend/config.py`, not an environment
variable. `IMAGE_DELIVERY` defaults to `inline`: illustrations come back as
WebP data URLs and nothing is stored server-side. Set it to `url` to persist
them instead -- to `GCS_BUCKET` if that is set, to local `static/` otherwise.

## API

Everything is under `/api`. `GET /api` returns a self-description, but that
list is stale; the actual endpoints are:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/session` | GET | New session id |
| `/api/character` | POST | Character sheet from a drawing |
| `/api/story/premise` | POST | Candidate premises for a character |
| `/api/story/init` | POST | Opening part and initial story state |
| `/api/story/part` | POST | Next part; advances the client-carried state |
| `/api/story/actions` | POST | Choices for the current part |
| `/api/story/end` | POST | Closing part |
| `/api/story/image` | POST | Illustration for a part |
| `/api/image`, `/api/image/<name>` | POST, GET | Store and serve an image (`url` delivery only) |
| `/api/translate` | GET | Translate text |
| `/api/read` | GET | Streamed TTS audio |

The story state is held by the client and sent with each request; the server
advances it as a pure function (`backend/story_state.py`).

## Deployment

Backend on Cloud Run, from `backend/`:

```bash
gcloud run deploy mystoryknight-be --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "CORS_ORIGINS=https://tomfluff.github.io"
```

Then set `OPENAI_API_KEY` in the Cloud Console, so it stays out of shell
history. Check the target project first with `gcloud config get project`.

`--source .` builds `backend/Dockerfile`, which runs gunicorn. `.dockerignore`
excludes `.env` -- keep that entry, because the Dockerfile does `COPY . .` and
would otherwise bake the API key into a pullable image layer.

The frontend deploys itself: every push to `main` builds it and publishes to
GitHub Pages at <https://tomfluff.github.io/mystoryknight/>, once the `frontend`
and `backend` checks pass. The API URL comes from the `VITE_API_BASE_URL`
repository variable, not from `frontend/.env`, so point it at the Cloud Run URL
(`https://<service>-<hash>.us-central1.run.app/api`) and redeploy the backend
before changing it:

```bash
gh variable set VITE_API_BASE_URL --body "https://<service>-<hash>.us-central1.run.app/api"
```

It is a variable rather than a secret on purpose -- the value is compiled into
the bundle and readable by anyone in devtools, so hiding it would only hide it
from you. Pages paths are case-sensitive: `base` in `vite.config.ts` must match
the repository name exactly, and the router takes its `basename` from that
value.

## License

Copyright (C) 2026 Yotam Sechayk.

MyStoryKnight is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version. It is distributed without any warranty; see [LICENSE](LICENSE)
for the full terms.

The AGPL differs from the GPL in one way that matters here: if you run a
modified version and let people use it over a network, section 13 obliges you to
offer those users its source. That is why the About dialog links back to this
repository -- keep an equivalent link in any fork you deploy.

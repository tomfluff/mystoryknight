"""Where generated story images live.

Cloud Run's filesystem is per-instance and RAM-backed, so writing images to
`static/` means they 404 from any other instance and grow the instance's memory
with no cleanup. Set GCS_BUCKET and they go to Cloud Storage instead; leave it
unset and local development keeps using the disk.
"""

import base64
import os
import uuid
from io import BytesIO

from PIL import Image

from config import (
    IMAGE_DELIVERY,
    IMAGE_INLINE_MAX_SIZE,
    IMAGE_INLINE_QUALITY,
    IMAGE_STORE_MAX_SIZE,
)

GCS_BUCKET = os.environ.get("GCS_BUCKET", "").strip()

# Cache the client: constructing it per request costs a metadata round-trip.
_bucket = None


def _get_bucket():
    global _bucket
    if _bucket is None:
        from google.cloud import storage  # imported lazily: local dev needs neither

        _bucket = storage.Client().bucket(GCS_BUCKET)
    return _bucket


def using_gcs():
    return bool(GCS_BUCKET)


def inline_mode():
    return IMAGE_DELIVERY == "inline"


def _reencode(base64_string, max_size, fmt, quality=None):
    """base64 in -> re-encoded bytes out, downscaled if asked.

    The image models only emit 1024px and up, far larger than the story panel
    needs, so everything gets downscaled before it goes anywhere.
    """
    image = Image.open(BytesIO(base64.b64decode(base64_string)))
    if max_size:
        image.thumbnail((max_size, max_size), Image.LANCZOS)
    buf = BytesIO()
    if fmt == "WEBP":
        image.save(buf, format="WEBP", quality=quality, method=6)
    else:
        image.save(buf, format=fmt, optimize=True)
    return buf.getvalue()


def inline_story_image(base64_string):
    """WebP data URL, stored nowhere. Returns (url, None).

    WebP and a smaller box on purpose: the client keeps every image in
    sessionStorage, and 512px PNG data URLs blow the ~5MB quota mid-story.
    """
    data = _reencode(
        base64_string, IMAGE_INLINE_MAX_SIZE, "WEBP", IMAGE_INLINE_QUALITY
    )
    return "data:image/webp;base64," + base64.b64encode(data).decode(), None


def store_story_image(base64_string, local_dir, public_base_url):
    """Persist a generated image. Returns (url, name).

    `public_base_url` is only used for the local path -- GCS objects are served
    straight from storage.googleapis.com.
    """
    if inline_mode():
        return inline_story_image(base64_string)

    name = f"img_{uuid.uuid4().hex}.png"
    data = _reencode(base64_string, IMAGE_STORE_MAX_SIZE, "PNG")

    if using_gcs():
        blob = _get_bucket().blob(f"story/{name}")
        blob.cache_control = "public, max-age=31536000, immutable"
        blob.upload_from_string(data, content_type="image/png")
        return blob.public_url, name

    os.makedirs(local_dir, exist_ok=True)
    with open(os.path.join(local_dir, name), "wb") as f:
        f.write(data)
    return f"{public_base_url}/api/image/{name}", name


def read_story_image(name, local_dir):
    """Raw bytes of a previously stored image, or None. Used as the Image 2
    reference so the client sends a filename instead of re-uploading megabytes.

    In inline mode nothing is stored, so the client sends the bytes itself and
    this is never consulted.
    """
    if inline_mode():
        return None
    safe = os.path.basename(str(name))
    if using_gcs():
        blob = _get_bucket().blob(f"story/{safe}")
        return blob.download_as_bytes() if blob.exists() else None

    path = os.path.join(local_dir, safe)
    if not os.path.isfile(path):
        return None
    with open(path, "rb") as f:
        return f.read()

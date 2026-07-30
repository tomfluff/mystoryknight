import base64
import os
from PIL import Image
from io import BytesIO
import logging


def save_base64_image(base64_string, save_path, max_size=None):
    # Decode the base64 string and save the image file locally
    image_data = base64.b64decode(base64_string)
    image = Image.open(BytesIO(image_data))
    if max_size:
        # The image models only emit 1024px and up, which is far larger than the
        # story panel needs. Downscaling here cuts the bytes the client fetches.
        image.thumbnail((max_size, max_size), Image.LANCZOS)
    # PIL picks the format from the extension, and JPEG has no alpha channel, so
    # an RGBA source saved as .jpg raises "cannot write mode RGBA as JPEG". The
    # caller chooses that extension, so flatten rather than let it through.
    if os.path.splitext(save_path)[1].lower() in (".jpg", ".jpeg") and image.mode not in (
        "RGB",
        "L",
    ):
        image = image.convert("RGB")
    image.save(save_path, optimize=True)

def logger_setup(name, location, debug=False):
    os.makedirs(os.path.dirname(location), exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if debug else logging.INFO)
    # getLogger hands back the same logger for a given name, so a second setup
    # call would attach a second handler and emit every line twice.
    if logger.handlers:
        return logger
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s]: %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )
    # FileHandler owns the file object so it is closed on shutdown, and its
    # default append mode keeps the previous run's log, which is exactly what you
    # want to read after a crash.
    # utf-8 explicitly: the logger writes story text, which is Japanese or Hebrew
    # whenever the child picked that language, and the platform default encoding
    # raises UnicodeEncodeError on it.
    handler = logging.FileHandler(location, encoding="utf-8")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


def get_mimetype(client_os):
    # Get the mime type of a file
    mime_type = "audio/ogg"
    if client_os == "ios":
        mime_type = "audio/mpeg"
    return mime_type

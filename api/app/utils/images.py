from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

ALLOWED_FORMATS = frozenset({"JPEG", "PNG", "WEBP"})
MAX_AVATAR_BYTES = 2 * 1024 * 1024
MAX_SIDE = 4096
MAX_PIXELS = 16_000_000
WORKING_SIDE = 1024
AVATAR_SIDE = 256
AVATAR_MEDIA_TYPE = "image/webp"
TILE_RGB = (237, 237, 237)

NOT_AN_IMAGE = "Ce fichier n'est pas une image JPEG, PNG ou WebP."
TOO_HEAVY = "La photo dépasse 2 Mo."
TOO_LARGE = f"La photo est trop grande ({MAX_SIDE} px de côté maximum)."
UNREADABLE = "La photo n'a pas pu être lue."


class ImageError(ValueError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def _probe(data: bytes) -> None:
    """Check the real container format and the declared pixel size before any pixel is decoded."""
    try:
        with Image.open(BytesIO(data)) as probe:
            image_format = probe.format
            width, height = probe.size
            if image_format not in ALLOWED_FORMATS:
                raise ImageError(NOT_AN_IMAGE)
            if width > MAX_SIDE or height > MAX_SIDE or width * height > MAX_PIXELS:
                raise ImageError(TOO_LARGE)
            probe.verify()
    except ImageError:
        raise
    except Image.DecompressionBombError as error:
        raise ImageError(TOO_LARGE) from error
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError) as error:
        raise ImageError(NOT_AN_IMAGE) from error


def prepare_avatar(data: bytes) -> bytes:
    """Validate an uploaded picture and return a fresh 256 px square WebP without any metadata."""
    if len(data) > MAX_AVATAR_BYTES:
        raise ImageError(TOO_HEAVY)
    _probe(data)
    try:
        with Image.open(BytesIO(data)) as source:
            if source.format == "JPEG":
                source.draft("RGB", (WORKING_SIDE, WORKING_SIDE))
            source.thumbnail((WORKING_SIDE, WORKING_SIDE))
            upright = ImageOps.exif_transpose(source) or source
            square = ImageOps.fit(upright.convert("RGBA"), (AVATAR_SIDE, AVATAR_SIDE), Image.Resampling.LANCZOS)
            flat = Image.new("RGB", square.size, TILE_RGB)
            flat.paste(square, mask=square.getchannel("A"))
            output = BytesIO()
            flat.save(output, format="WEBP", quality=85, method=4)
            return output.getvalue()
    except Image.DecompressionBombError as error:
        raise ImageError(TOO_LARGE) from error
    except (OSError, ValueError) as error:
        raise ImageError(UNREADABLE) from error

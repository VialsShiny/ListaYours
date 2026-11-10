from io import BytesIO

from PIL import Image

from tests.conftest import auth_headers

SECRET_MARKERS = ("password", "hash", "token", "$2b$")


def headers(account: dict) -> dict[str, str]:
    return auth_headers(account["access_token"])


def image_bytes(width: int, height: int, image_format: str = "PNG", color=(200, 30, 30)) -> bytes:
    image = Image.new("RGBA" if image_format == "PNG" else "RGB", (width, height), color)
    output = BytesIO()
    image.save(output, format=image_format)
    return output.getvalue()


def assert_no_secret(body: dict) -> None:
    text = str(body).lower()
    for marker in SECRET_MARKERS:
        assert marker not in text, marker

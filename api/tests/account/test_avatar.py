from io import BytesIO

from PIL import Image

from app import deps
from app.utils.images import MAX_AVATAR_BYTES
from tests.account.helpers import assert_no_secret, headers, image_bytes

PNG_TYPE = {"Content-Type": "image/png"}


def upload(client, account: dict, data: bytes, content_type: str = "image/png"):
    return client.put("/api/account/avatar", content=data, headers={**headers(account), "Content-Type": content_type})


def test_valid_upload_is_reencoded_to_a_256px_square(client, visitor) -> None:
    response = upload(client, visitor, image_bytes(900, 600, "JPEG"), "image/jpeg")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["has_avatar"] is True
    assert body["avatar_updated_at"] is not None
    assert_no_secret(body)

    served = client.get("/api/account/avatar", headers=headers(visitor))
    assert served.status_code == 200
    assert served.headers["content-type"] == "image/webp"
    assert served.headers["x-content-type-options"] == "nosniff"
    assert "no-store" in served.headers["cache-control"]
    with Image.open(BytesIO(served.content)) as image:
        assert image.format == "WEBP"
        assert image.size == (256, 256)
        assert "exif" not in image.info
    assert len(served.content) < 40_000


def test_png_and_webp_are_accepted_and_transparency_is_flattened(client, visitor) -> None:
    png = upload(client, visitor, image_bytes(300, 300, "PNG", (10, 10, 10, 0)))
    assert png.status_code == 200, png.text
    served = client.get("/api/account/avatar", headers=headers(visitor))
    with Image.open(BytesIO(served.content)) as image:
        pixel = image.convert("RGB").getpixel((128, 128))
        assert all(abs(channel - 237) <= 2 for channel in pixel), pixel
    webp = upload(client, visitor, image_bytes(120, 80, "WEBP"), "image/webp")
    assert webp.status_code == 200, webp.text


def test_wrong_type_disguised_and_oversized_files_are_refused(client, visitor) -> None:
    gif = upload(client, visitor, image_bytes(50, 50, "GIF"), "image/gif")
    assert gif.status_code == 422
    html = upload(client, visitor, b"<html><script>alert(1)</script></html>", "image/png")
    assert html.status_code == 422
    assert "JPEG, PNG ou WebP" in html.json()["detail"]
    svg = upload(client, visitor, b'<svg xmlns="http://www.w3.org/2000/svg"/>', "image/svg+xml")
    assert svg.status_code == 422
    empty = upload(client, visitor, b"")
    assert empty.status_code == 422
    too_heavy = upload(client, visitor, b"\x89PNG" + b"\0" * MAX_AVATAR_BYTES)
    assert too_heavy.status_code == 413
    too_large = upload(client, visitor, image_bytes(5000, 5000, "PNG", (0, 0, 0, 255)))
    assert too_large.status_code == 422
    assert "trop grande" in too_large.json()["detail"]
    assert client.get("/api/account/avatar", headers=headers(visitor)).status_code == 404
    assert client.get("/api/account", headers=headers(visitor)).json()["has_avatar"] is False


def test_declared_length_above_the_limit_is_refused_early(client, visitor) -> None:
    response = client.put(
        "/api/account/avatar",
        content=b"abc",
        headers={**headers(visitor), **PNG_TYPE, "Content-Length": str(MAX_AVATAR_BYTES + 1)},
    )
    assert response.status_code == 413


def test_avatar_is_private_to_its_owner(client, visitor, visitor2) -> None:
    assert upload(client, visitor, image_bytes(64, 64)).status_code == 200
    assert client.get("/api/account/avatar", headers=headers(visitor2)).status_code == 404
    assert client.get("/api/account", headers=headers(visitor2)).json()["has_avatar"] is False
    assert client.get("/api/account/avatar").status_code == 401


def test_delete_restores_the_initial_state(client, visitor) -> None:
    assert upload(client, visitor, image_bytes(64, 64)).status_code == 200
    removed = client.delete("/api/account/avatar", headers=headers(visitor))
    assert removed.status_code == 200
    assert removed.json()["has_avatar"] is False
    assert removed.json()["avatar_updated_at"] is None
    assert client.get("/api/account/avatar", headers=headers(visitor)).status_code == 404
    again = client.delete("/api/account/avatar", headers=headers(visitor))
    assert again.status_code == 200


def test_upload_is_rate_limited(client, visitor) -> None:
    deps.auth_limiter.limit = 2
    deps.auth_limiter.reset()
    try:
        statuses = [upload(client, visitor, image_bytes(32, 32)).status_code for _ in range(3)]
    finally:
        deps.auth_limiter.limit = 1000
    assert statuses == [200, 200, 429]


def test_me_exposes_the_avatar_flag_only(client, visitor) -> None:
    assert upload(client, visitor, image_bytes(64, 64)).status_code == 200
    me = client.get("/api/auth/me", headers=headers(visitor)).json()
    assert me["has_avatar"] is True
    assert "avatar" not in me
    assert_no_secret(me)

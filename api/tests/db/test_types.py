from datetime import UTC

from sqlalchemy import select

from app.db.models import User


def test_datetimes_come_back_timezone_aware(db) -> None:
    db.add(User(email="tz@listayours-test.fr", password_hash="x", display_name="tz", role="visitor"))
    db.commit()
    db.expire_all()
    user = db.scalar(select(User).where(User.email == "tz@listayours-test.fr"))
    assert user is not None
    assert user.created_at.tzinfo is not None
    assert user.created_at.utcoffset() == UTC.utcoffset(None)

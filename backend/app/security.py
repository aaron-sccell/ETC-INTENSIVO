"""Hashing de contrasenas con bcrypt y emision/verificacion de tokens JWT."""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
import jwt

from .config import settings

# bcrypt solo considera los primeros 72 bytes de la contrasena.
BCRYPT_MAX_BYTES = 72


def _truncate(password: str) -> bytes:
    return password.encode("utf-8")[:BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    """Devuelve el hash bcrypt de una contrasena en texto plano."""
    return bcrypt.hashpw(_truncate(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Compara una contrasena en texto plano contra su hash almacenado."""
    try:
        return bcrypt.checkpw(_truncate(password), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _create_token(subject: str | int, token_type: str, expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: int | str) -> str:
    return _create_token(
        user_id, "access", timedelta(minutes=settings.access_token_expire_minutes)
    )


def create_refresh_token(user_id: int | str) -> str:
    return _create_token(
        user_id, "refresh", timedelta(days=settings.refresh_token_expire_days)
    )


def decode_token(token: str, expected_type: Optional[str] = None) -> Optional[dict]:
    """Decodifica y valida un JWT. Devuelve None si es invalido o expiro."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError:
        return None

    if expected_type and payload.get("type") != expected_type:
        return None
    return payload

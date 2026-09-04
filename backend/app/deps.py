"""Dependencias compartidas: validacion del header Authorization: Bearer <token>."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import Usuario
from .security import decode_token

bearer_scheme = HTTPBearer(
    scheme_name="JWT Bearer",
    description="Pega aqui el access_token devuelto por POST /auth/login",
    auto_error=False,
)

CREDENCIALES_INVALIDAS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Token invalido o expirado",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ] = None,
    db: Session = Depends(get_db),
) -> Usuario:
    """Devuelve el usuario autenticado o lanza 401/403."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falta el header Authorization: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials, expected_type="access")
    if payload is None:
        raise CREDENCIALES_INVALIDAS

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise CREDENCIALES_INVALIDAS

    usuario = db.get(Usuario, user_id)
    if usuario is None:
        raise CREDENCIALES_INVALIDAS
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="La cuenta esta desactivada"
        )
    return usuario


CurrentUser = Annotated[Usuario, Depends(get_current_user)]
DbSession = Annotated[Session, Depends(get_db)]

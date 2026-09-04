"""Endpoints de autenticacion: login, registro, refresh y logout."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from ..config import settings
from ..deps import CurrentUser, DbSession
from ..models import Usuario
from ..schemas import (
    LoginRequest,
    MensajeResponse,
    RefreshRequest,
    TokenResponse,
    UsuarioCreate,
    UsuarioOut,
)
from ..security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


def _token_response(usuario: Usuario) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(usuario.id),
        refresh_token=create_refresh_token(usuario.id),
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
        user=UsuarioOut.model_validate(usuario),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesion",
    responses={401: {"description": "Credenciales incorrectas"}},
)
def login(datos: LoginRequest, db: DbSession) -> TokenResponse:
    """Valida email + contrasena y devuelve un JWT junto con los datos del doctor."""
    usuario = db.scalar(select(Usuario).where(Usuario.email == datos.email.lower()))

    if usuario is None or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos",
        )
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="La cuenta esta desactivada"
        )

    return _token_response(usuario)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo doctor",
    responses={400: {"description": "El correo ya esta registrado"}},
)
def register(datos: UsuarioCreate, db: DbSession) -> TokenResponse:
    email = datos.email.lower()
    if db.scalar(select(Usuario).where(Usuario.email == email)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ese correo ya esta registrado",
        )

    usuario = Usuario(
        nombre=datos.nombre,
        email=email,
        password_hash=hash_password(datos.password),
        especialidad=datos.especialidad,
        telefono=datos.telefono,
        avatar_url=datos.avatar_url,
        rol="doctor",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return _token_response(usuario)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Renovar el access token",
    responses={401: {"description": "Refresh token invalido o expirado"}},
)
def refresh(datos: RefreshRequest, db: DbSession) -> TokenResponse:
    payload = decode_token(datos.refresh_token, expected_type="refresh")
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalido o expirado",
        )

    usuario = db.get(Usuario, int(payload["sub"]))
    if usuario is None or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no valido"
        )

    return _token_response(usuario)


@router.post(
    "/logout",
    response_model=MensajeResponse,
    summary="Cerrar sesion",
)
def logout(usuario: CurrentUser) -> MensajeResponse:
    """Cierra la sesion. Los JWT son sin estado: el cliente debe borrar el token."""
    return MensajeResponse(detail=f"Sesion cerrada para {usuario.email}")

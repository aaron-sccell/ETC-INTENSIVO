"""Endpoints del perfil del usuario autenticado."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Usuario
from ..schemas import UsuarioOut, UsuarioUpdate
from ..security import hash_password

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/me", response_model=UsuarioOut, summary="Perfil del usuario autenticado")
def obtener_perfil(usuario: CurrentUser) -> Usuario:
    return usuario


@router.put("/me", response_model=UsuarioOut, summary="Actualizar el perfil")
def actualizar_perfil(
    datos: UsuarioUpdate, usuario: CurrentUser, db: DbSession
) -> Usuario:
    cambios = datos.model_dump(exclude_unset=True)

    if "email" in cambios and cambios["email"]:
        nuevo_email = cambios.pop("email").lower()
        if nuevo_email != usuario.email:
            existe = db.scalar(select(Usuario).where(Usuario.email == nuevo_email))
            if existe:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ese correo ya esta en uso",
                )
            usuario.email = nuevo_email

    if "password" in cambios:
        password = cambios.pop("password")
        if password:
            usuario.password_hash = hash_password(password)

    for campo, valor in cambios.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.get("", response_model=list[UsuarioOut], summary="Listar doctores")
def listar_doctores(usuario: CurrentUser, db: DbSession) -> list[Usuario]:
    """Lista de doctores activos, usada por el selector del formulario de citas."""
    return list(db.scalars(select(Usuario).where(Usuario.activo.is_(True)).order_by(Usuario.nombre)))

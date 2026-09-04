"""Notas medicas: listado/creacion por paciente y edicion/borrado por id."""

from datetime import date

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..models import NotaMedica, Paciente
from ..schemas import MensajeResponse, NotaCreate, NotaOut, NotaUpdate

router = APIRouter(tags=["Notas medicas"])


def _paciente_o_404(db, paciente_id: int) -> Paciente:
    paciente = db.get(Paciente, paciente_id)
    if paciente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el paciente con id {paciente_id}",
        )
    return paciente


def _nota_o_404(db, nota_id: int) -> NotaMedica:
    nota = db.scalar(
        select(NotaMedica)
        .options(selectinload(NotaMedica.doctor))
        .where(NotaMedica.id == nota_id)
    )
    if nota is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe la nota con id {nota_id}",
        )
    return nota


@router.get(
    "/pacientes/{paciente_id}/notas",
    response_model=list[NotaOut],
    summary="Notas medicas de un paciente",
)
def listar_notas(
    paciente_id: int, usuario: CurrentUser, db: DbSession
) -> list[NotaMedica]:
    _paciente_o_404(db, paciente_id)
    return list(
        db.scalars(
            select(NotaMedica)
            .options(selectinload(NotaMedica.doctor))
            .where(NotaMedica.paciente_id == paciente_id)
            .order_by(NotaMedica.fecha.desc(), NotaMedica.id.desc())
        )
    )


@router.post(
    "/pacientes/{paciente_id}/notas",
    response_model=NotaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nota medica",
)
def crear_nota(
    paciente_id: int, datos: NotaCreate, usuario: CurrentUser, db: DbSession
) -> NotaMedica:
    _paciente_o_404(db, paciente_id)

    nota = NotaMedica(
        paciente_id=paciente_id,
        doctor_id=usuario.id,
        fecha=datos.fecha or date.today(),
        titulo=datos.titulo,
        contenido=datos.contenido,
    )
    db.add(nota)
    db.commit()
    return _nota_o_404(db, nota.id)


@router.put("/notas/{nota_id}", response_model=NotaOut, summary="Actualizar nota medica")
def actualizar_nota(
    nota_id: int, datos: NotaUpdate, usuario: CurrentUser, db: DbSession
) -> NotaMedica:
    nota = _nota_o_404(db, nota_id)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(nota, campo, valor)
    db.commit()
    return _nota_o_404(db, nota_id)


@router.delete(
    "/notas/{nota_id}", response_model=MensajeResponse, summary="Eliminar nota medica"
)
def eliminar_nota(nota_id: int, usuario: CurrentUser, db: DbSession) -> MensajeResponse:
    nota = _nota_o_404(db, nota_id)
    db.delete(nota)
    db.commit()
    return MensajeResponse(detail=f"Nota {nota_id} eliminada")

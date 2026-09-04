"""CRUD de citas medicas."""

from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..models import Cita, Paciente
from ..schemas import CitaCreate, CitaOut, CitaUpdate, MensajeResponse

router = APIRouter(prefix="/citas", tags=["Citas"])


def _base_query():
    return select(Cita).options(selectinload(Cita.paciente), selectinload(Cita.doctor))


def obtener_cita_o_404(db, cita_id: int) -> Cita:
    cita = db.scalar(_base_query().where(Cita.id == cita_id))
    if cita is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe la cita con id {cita_id}",
        )
    return cita


def _validar_paciente(db, paciente_id: int) -> None:
    if db.get(Paciente, paciente_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No existe el paciente con id {paciente_id}",
        )


@router.get("", response_model=list[CitaOut], summary="Listar citas")
def listar_citas(
    usuario: CurrentUser,
    db: DbSession,
    paciente_id: int | None = Query(default=None, description="Filtrar por paciente"),
    estado: str | None = Query(default=None, description="pendiente | confirmada | cancelada | completada"),
    desde: date | None = Query(default=None, description="Fecha minima (inclusive)"),
    hasta: date | None = Query(default=None, description="Fecha maxima (inclusive)"),
    proximas: bool = Query(
        default=False, description="Solo citas de hoy en adelante (ordenadas ascendente)"
    ),
    limit: int = Query(default=200, ge=1, le=500),
) -> list[Cita]:
    stmt = _base_query()

    if paciente_id is not None:
        stmt = stmt.where(Cita.paciente_id == paciente_id)
    if estado:
        stmt = stmt.where(Cita.estado == estado)
    if desde:
        stmt = stmt.where(Cita.fecha >= desde)
    if hasta:
        stmt = stmt.where(Cita.fecha <= hasta)

    if proximas:
        stmt = stmt.where(Cita.fecha >= date.today()).order_by(Cita.fecha.asc(), Cita.hora.asc())
    else:
        stmt = stmt.order_by(Cita.fecha.desc(), Cita.hora.desc())

    return list(db.scalars(stmt.limit(limit)))


@router.post(
    "", response_model=CitaOut, status_code=status.HTTP_201_CREATED, summary="Crear cita"
)
def crear_cita(datos: CitaCreate, usuario: CurrentUser, db: DbSession) -> Cita:
    _validar_paciente(db, datos.paciente_id)

    payload = datos.model_dump()
    if payload.get("doctor_id") is None:
        payload["doctor_id"] = usuario.id

    cita = Cita(**payload)
    db.add(cita)
    db.commit()
    return obtener_cita_o_404(db, cita.id)


@router.get("/{cita_id}", response_model=CitaOut, summary="Detalle de una cita")
def obtener_cita(cita_id: int, usuario: CurrentUser, db: DbSession) -> Cita:
    return obtener_cita_o_404(db, cita_id)


@router.put("/{cita_id}", response_model=CitaOut, summary="Actualizar cita")
def actualizar_cita(
    cita_id: int, datos: CitaUpdate, usuario: CurrentUser, db: DbSession
) -> Cita:
    cita = obtener_cita_o_404(db, cita_id)
    cambios = datos.model_dump(exclude_unset=True)

    if "paciente_id" in cambios and cambios["paciente_id"] is not None:
        _validar_paciente(db, cambios["paciente_id"])

    for campo, valor in cambios.items():
        setattr(cita, campo, valor)

    db.commit()
    return obtener_cita_o_404(db, cita_id)


@router.delete("/{cita_id}", response_model=MensajeResponse, summary="Eliminar cita")
def eliminar_cita(cita_id: int, usuario: CurrentUser, db: DbSession) -> MensajeResponse:
    cita = obtener_cita_o_404(db, cita_id)
    db.delete(cita)
    db.commit()
    return MensajeResponse(detail=f"Cita {cita_id} eliminada")

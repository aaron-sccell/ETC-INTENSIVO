"""Signos vitales de un paciente (peso, presion, temperatura, frecuencia cardiaca)."""

from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Paciente, SignoVital
from ..schemas import MensajeResponse, SignoCreate, SignoOut

router = APIRouter(tags=["Signos vitales"])


def _paciente_o_404(db, paciente_id: int) -> Paciente:
    paciente = db.get(Paciente, paciente_id)
    if paciente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el paciente con id {paciente_id}",
        )
    return paciente


@router.get(
    "/pacientes/{paciente_id}/signos",
    response_model=list[SignoOut],
    summary="Historial de signos vitales",
)
def listar_signos(
    paciente_id: int,
    usuario: CurrentUser,
    db: DbSession,
    limit: int = Query(default=100, ge=1, le=500),
) -> list[SignoVital]:
    """Devuelve los registros ordenados del mas antiguo al mas reciente (para la grafica)."""
    _paciente_o_404(db, paciente_id)
    return list(
        db.scalars(
            select(SignoVital)
            .where(SignoVital.paciente_id == paciente_id)
            .order_by(SignoVital.fecha.asc(), SignoVital.id.asc())
            .limit(limit)
        )
    )


@router.post(
    "/pacientes/{paciente_id}/signos",
    response_model=SignoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar signos vitales",
)
def crear_signo(
    paciente_id: int, datos: SignoCreate, usuario: CurrentUser, db: DbSession
) -> SignoVital:
    _paciente_o_404(db, paciente_id)

    payload = datos.model_dump()
    payload["fecha"] = payload.get("fecha") or date.today()

    signo = SignoVital(paciente_id=paciente_id, **payload)
    db.add(signo)
    db.commit()
    db.refresh(signo)
    return signo


@router.delete(
    "/signos/{signo_id}",
    response_model=MensajeResponse,
    summary="Eliminar un registro de signos vitales",
)
def eliminar_signo(signo_id: int, usuario: CurrentUser, db: DbSession) -> MensajeResponse:
    signo = db.get(SignoVital, signo_id)
    if signo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el registro con id {signo_id}",
        )
    db.delete(signo)
    db.commit()
    return MensajeResponse(detail=f"Registro {signo_id} eliminado")

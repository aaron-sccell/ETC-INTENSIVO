"""CRUD de pacientes y expediente completo."""

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import or_, select

from ..deps import CurrentUser, DbSession
from ..models import Cita, FotoPaciente, NotaMedica, Paciente, SignoVital
from ..schemas import (
    ExpedienteOut,
    FotoCreate,
    FotoOut,
    MensajeResponse,
    PacienteCreate,
    PacienteOut,
    PacienteUpdate,
)

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


def obtener_paciente_o_404(db, paciente_id: int) -> Paciente:
    paciente = db.get(Paciente, paciente_id)
    if paciente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el paciente con id {paciente_id}",
        )
    return paciente


def _siguiente_codigo(db) -> str:
    """Genera el siguiente codigo consecutivo con formato 001, 002, 003..."""
    total = db.scalar(select(Paciente.id).order_by(Paciente.id.desc()).limit(1)) or 0
    return f"{total + 1:03d}"


@router.get(
    "",
    response_model=list[PacienteOut],
    summary="Listar pacientes (con busqueda)",
)
def listar_pacientes(
    usuario: CurrentUser,
    db: DbSession,
    q: str | None = Query(
        default=None, description="Busca por nombre, apellidos, codigo, telefono o correo"
    ),
    solo_activos: bool = Query(default=True),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[Paciente]:
    stmt = select(Paciente)

    if solo_activos:
        stmt = stmt.where(Paciente.activo.is_(True))

    if q:
        patron = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Paciente.nombre.like(patron),
                Paciente.apellidos.like(patron),
                Paciente.codigo.like(patron),
                Paciente.telefono.like(patron),
                Paciente.email.like(patron),
            )
        )

    stmt = stmt.order_by(Paciente.nombre, Paciente.apellidos).offset(skip).limit(limit)
    return list(db.scalars(stmt))


@router.post(
    "",
    response_model=PacienteOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear paciente",
)
def crear_paciente(datos: PacienteCreate, usuario: CurrentUser, db: DbSession) -> Paciente:
    payload = datos.model_dump()
    codigo = payload.pop("codigo", None) or _siguiente_codigo(db)

    if db.scalar(select(Paciente).where(Paciente.codigo == codigo)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un paciente con el codigo {codigo}",
        )

    paciente = Paciente(**payload, codigo=codigo, doctor_id=usuario.id)
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.get("/{paciente_id}", response_model=PacienteOut, summary="Detalle de un paciente")
def obtener_paciente(paciente_id: int, usuario: CurrentUser, db: DbSession) -> Paciente:
    return obtener_paciente_o_404(db, paciente_id)


@router.put("/{paciente_id}", response_model=PacienteOut, summary="Actualizar paciente")
def actualizar_paciente(
    paciente_id: int, datos: PacienteUpdate, usuario: CurrentUser, db: DbSession
) -> Paciente:
    paciente = obtener_paciente_o_404(db, paciente_id)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(paciente, campo, valor)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.delete(
    "/{paciente_id}", response_model=MensajeResponse, summary="Eliminar paciente"
)
def eliminar_paciente(
    paciente_id: int, usuario: CurrentUser, db: DbSession
) -> MensajeResponse:
    paciente = obtener_paciente_o_404(db, paciente_id)
    nombre = paciente.nombre_completo
    db.delete(paciente)
    db.commit()
    return MensajeResponse(detail=f"Paciente {nombre} eliminado")


@router.get(
    "/{paciente_id}/expediente",
    response_model=ExpedienteOut,
    summary="Expediente completo (paciente + citas + notas + signos + fotos)",
)
def obtener_expediente(paciente_id: int, usuario: CurrentUser, db: DbSession) -> dict:
    paciente = obtener_paciente_o_404(db, paciente_id)

    citas = list(
        db.scalars(
            select(Cita)
            .where(Cita.paciente_id == paciente_id)
            .order_by(Cita.fecha.desc(), Cita.hora.desc())
        )
    )
    notas = list(
        db.scalars(
            select(NotaMedica)
            .where(NotaMedica.paciente_id == paciente_id)
            .order_by(NotaMedica.fecha.desc(), NotaMedica.id.desc())
        )
    )
    signos = list(
        db.scalars(
            select(SignoVital)
            .where(SignoVital.paciente_id == paciente_id)
            .order_by(SignoVital.fecha.asc())
        )
    )
    fotos = list(
        db.scalars(
            select(FotoPaciente)
            .where(FotoPaciente.paciente_id == paciente_id)
            .order_by(FotoPaciente.created_at.desc())
        )
    )

    return {
        "paciente": paciente,
        "citas": citas,
        "notas": notas,
        "signos": signos,
        "fotos": fotos,
    }


# ---------------------------------------------------------------------------
# Fotos del expediente
# ---------------------------------------------------------------------------
@router.get(
    "/{paciente_id}/fotos", response_model=list[FotoOut], summary="Fotos del paciente"
)
def listar_fotos(
    paciente_id: int, usuario: CurrentUser, db: DbSession
) -> list[FotoPaciente]:
    obtener_paciente_o_404(db, paciente_id)
    return list(
        db.scalars(
            select(FotoPaciente)
            .where(FotoPaciente.paciente_id == paciente_id)
            .order_by(FotoPaciente.created_at.desc())
        )
    )


@router.post(
    "/{paciente_id}/fotos",
    response_model=FotoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar foto al expediente",
)
def crear_foto(
    paciente_id: int, datos: FotoCreate, usuario: CurrentUser, db: DbSession
) -> FotoPaciente:
    obtener_paciente_o_404(db, paciente_id)
    foto = FotoPaciente(paciente_id=paciente_id, **datos.model_dump())
    db.add(foto)
    db.commit()
    db.refresh(foto)
    return foto

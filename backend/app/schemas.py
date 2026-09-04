"""Esquemas Pydantic: validacion de entrada y forma de las respuestas JSON."""

from datetime import date, datetime, time
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field

Sexo = Literal["masculino", "femenino", "otro"]
EstadoCita = Literal["pendiente", "confirmada", "cancelada", "completada"]


# ---------------------------------------------------------------------------
# Usuarios / autenticacion
# ---------------------------------------------------------------------------
class UsuarioBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    especialidad: Optional[str] = None
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6, max_length=72)


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    especialidad: Optional[str] = None
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=72)


class UsuarioOut(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rol: str
    activo: bool
    created_at: Optional[datetime] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"email": "doctor@clinica.com", "password": "123456"}
        }
    )


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: UsuarioOut


class MensajeResponse(BaseModel):
    detail: str


# ---------------------------------------------------------------------------
# Pacientes
# ---------------------------------------------------------------------------
class PacienteBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=80)
    apellidos: str = Field(..., min_length=1, max_length=80)
    fecha_nacimiento: Optional[date] = None
    sexo: Sexo = "otro"
    telefono: Optional[str] = Field(default=None, max_length=30)
    email: Optional[EmailStr] = None
    direccion: Optional[str] = Field(default=None, max_length=255)
    tipo_sangre: Optional[str] = Field(default=None, max_length=10)
    alergias: Optional[str] = None
    foto_url: Optional[str] = Field(default=None, max_length=500)


class PacienteCreate(PacienteBase):
    codigo: Optional[str] = Field(
        default=None,
        max_length=20,
        description="Si se omite, el servidor genera uno consecutivo (001, 002, ...)",
    )


class PacienteUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=80)
    apellidos: Optional[str] = Field(default=None, min_length=1, max_length=80)
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[Sexo] = None
    telefono: Optional[str] = Field(default=None, max_length=30)
    email: Optional[EmailStr] = None
    direccion: Optional[str] = Field(default=None, max_length=255)
    tipo_sangre: Optional[str] = Field(default=None, max_length=10)
    alergias: Optional[str] = None
    foto_url: Optional[str] = Field(default=None, max_length=500)
    activo: Optional[bool] = None


class PacienteOut(PacienteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    activo: bool
    doctor_id: Optional[int] = None
    created_at: Optional[datetime] = None

    @computed_field
    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellidos}".strip()

    @computed_field
    @property
    def edad(self) -> Optional[int]:
        if not self.fecha_nacimiento:
            return None
        hoy = date.today()
        cumple_pasado = (hoy.month, hoy.day) < (
            self.fecha_nacimiento.month,
            self.fecha_nacimiento.day,
        )
        return hoy.year - self.fecha_nacimiento.year - int(cumple_pasado)


# ---------------------------------------------------------------------------
# Citas
# ---------------------------------------------------------------------------
class PacienteMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    nombre: str
    apellidos: str
    foto_url: Optional[str] = None

    @computed_field
    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellidos}".strip()


class DoctorMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    especialidad: Optional[str] = None
    avatar_url: Optional[str] = None


class CitaBase(BaseModel):
    paciente_id: int
    doctor_id: Optional[int] = None
    fecha: date
    hora: time
    motivo: str = Field(..., min_length=1, max_length=255)
    consultorio: Optional[str] = Field(default=None, max_length=60)
    estado: EstadoCita = "pendiente"
    observaciones: Optional[str] = None


class CitaCreate(CitaBase):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "paciente_id": 1,
                "fecha": "2026-05-24",
                "hora": "10:00:00",
                "motivo": "Control general",
                "consultorio": "Consultorio 1",
                "estado": "confirmada",
            }
        }
    )


class CitaUpdate(BaseModel):
    paciente_id: Optional[int] = None
    doctor_id: Optional[int] = None
    fecha: Optional[date] = None
    hora: Optional[time] = None
    motivo: Optional[str] = Field(default=None, min_length=1, max_length=255)
    consultorio: Optional[str] = Field(default=None, max_length=60)
    estado: Optional[EstadoCita] = None
    observaciones: Optional[str] = None


class CitaOut(CitaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    paciente: Optional[PacienteMini] = None
    doctor: Optional[DoctorMini] = None


# ---------------------------------------------------------------------------
# Notas medicas
# ---------------------------------------------------------------------------
class NotaBase(BaseModel):
    fecha: Optional[date] = None
    titulo: Optional[str] = Field(default=None, max_length=150)
    contenido: str = Field(..., min_length=1)


class NotaCreate(NotaBase):
    pass


class NotaUpdate(BaseModel):
    fecha: Optional[date] = None
    titulo: Optional[str] = Field(default=None, max_length=150)
    contenido: Optional[str] = Field(default=None, min_length=1)


class NotaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    paciente_id: int
    doctor_id: Optional[int] = None
    fecha: date
    titulo: Optional[str] = None
    contenido: str
    created_at: Optional[datetime] = None
    doctor: Optional[DoctorMini] = None


# ---------------------------------------------------------------------------
# Signos vitales
# ---------------------------------------------------------------------------
class SignoBase(BaseModel):
    fecha: Optional[date] = None
    peso: Optional[float] = Field(default=None, ge=0, le=500)
    estatura: Optional[float] = Field(default=None, ge=0, le=3)
    presion_sistolica: Optional[int] = Field(default=None, ge=0, le=300)
    presion_diastolica: Optional[int] = Field(default=None, ge=0, le=200)
    temperatura: Optional[float] = Field(default=None, ge=25, le=45)
    frecuencia_cardiaca: Optional[int] = Field(default=None, ge=0, le=300)
    notas: Optional[str] = None


class SignoCreate(SignoBase):
    pass


class SignoOut(SignoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    paciente_id: int
    fecha: date
    created_at: Optional[datetime] = None

    @computed_field
    @property
    def presion(self) -> Optional[str]:
        if self.presion_sistolica is None or self.presion_diastolica is None:
            return None
        return f"{self.presion_sistolica}/{self.presion_diastolica}"


# ---------------------------------------------------------------------------
# Fotos del expediente
# ---------------------------------------------------------------------------
class FotoCreate(BaseModel):
    url: str = Field(..., max_length=500)
    descripcion: Optional[str] = Field(default=None, max_length=255)


class FotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    paciente_id: int
    url: str
    descripcion: Optional[str] = None
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Resumen del expediente (usado por la pantalla "Detalle del paciente")
# ---------------------------------------------------------------------------
class ExpedienteOut(BaseModel):
    paciente: PacienteOut
    citas: List[CitaOut]
    notas: List[NotaOut]
    signos: List[SignoOut]
    fotos: List[FotoOut]

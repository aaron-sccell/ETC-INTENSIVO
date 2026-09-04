"""Modelos ORM: Usuario (doctor), Paciente, Cita, NotaMedica, SignoVital y FotoPaciente."""

from datetime import date, datetime, time
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Usuario(Base):
    """Doctor / usuario que se autentica en la aplicacion."""

    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[str] = mapped_column(String(30), default="doctor", nullable=False)
    especialidad: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    telefono: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    pacientes: Mapped[List["Paciente"]] = relationship(back_populates="doctor")
    citas: Mapped[List["Cita"]] = relationship(back_populates="doctor")


class Paciente(Base):
    """Expediente basico de un paciente."""

    __tablename__ = "pacientes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(80), nullable=False)
    fecha_nacimiento: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    sexo: Mapped[str] = mapped_column(
        Enum("masculino", "femenino", "otro", name="sexo_enum"),
        default="otro",
        nullable=False,
    )
    telefono: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    direccion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tipo_sangre: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    alergias: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    foto_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    doctor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    doctor: Mapped[Optional["Usuario"]] = relationship(back_populates="pacientes")
    citas: Mapped[List["Cita"]] = relationship(
        back_populates="paciente", cascade="all, delete-orphan"
    )
    notas: Mapped[List["NotaMedica"]] = relationship(
        back_populates="paciente", cascade="all, delete-orphan"
    )
    signos: Mapped[List["SignoVital"]] = relationship(
        back_populates="paciente", cascade="all, delete-orphan"
    )
    fotos: Mapped[List["FotoPaciente"]] = relationship(
        back_populates="paciente", cascade="all, delete-orphan"
    )

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellidos}".strip()

    @property
    def edad(self) -> Optional[int]:
        """Edad calculada a partir de la fecha de nacimiento."""
        if not self.fecha_nacimiento:
            return None
        hoy = date.today()
        cumple_pasado = (hoy.month, hoy.day) < (
            self.fecha_nacimiento.month,
            self.fecha_nacimiento.day,
        )
        return hoy.year - self.fecha_nacimiento.year - int(cumple_pasado)


class Cita(Base):
    """Cita medica agendada para un paciente con un doctor."""

    __tablename__ = "citas"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paciente_id: Mapped[int] = mapped_column(
        ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doctor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    hora: Mapped[time] = mapped_column(Time, nullable=False)
    motivo: Mapped[str] = mapped_column(String(255), nullable=False)
    consultorio: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    estado: Mapped[str] = mapped_column(
        Enum("pendiente", "confirmada", "cancelada", "completada", name="estado_cita_enum"),
        default="pendiente",
        nullable=False,
    )
    observaciones: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    paciente: Mapped["Paciente"] = relationship(back_populates="citas")
    doctor: Mapped[Optional["Usuario"]] = relationship(back_populates="citas")


class NotaMedica(Base):
    """Nota clinica libre asociada a un paciente."""

    __tablename__ = "notas_medicas"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paciente_id: Mapped[int] = mapped_column(
        ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doctor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    titulo: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    paciente: Mapped["Paciente"] = relationship(back_populates="notas")
    doctor: Mapped[Optional["Usuario"]] = relationship()


class SignoVital(Base):
    """Registro de signos vitales (peso, presion, temperatura, etc.)."""

    __tablename__ = "signos_vitales"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paciente_id: Mapped[int] = mapped_column(
        ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    peso: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    estatura: Mapped[Optional[float]] = mapped_column(Numeric(4, 2), nullable=True)
    presion_sistolica: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    presion_diastolica: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    temperatura: Mapped[Optional[float]] = mapped_column(Numeric(4, 1), nullable=True)
    frecuencia_cardiaca: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    paciente: Mapped["Paciente"] = relationship(back_populates="signos")


class FotoPaciente(Base):
    """Foto o estudio adjunto al expediente del paciente."""

    __tablename__ = "fotos_paciente"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paciente_id: Mapped[int] = mapped_column(
        ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    paciente: Mapped["Paciente"] = relationship(back_populates="fotos")

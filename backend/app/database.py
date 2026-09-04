"""Motor de SQLAlchemy, fabrica de sesiones y utilidades de creacion de la BD."""

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Clase base para todos los modelos ORM."""


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI que entrega una sesion y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_database_exists() -> None:
    """Crea el schema (CREATE DATABASE IF NOT EXISTS) si aun no existe."""
    server_engine = create_engine(settings.server_url, isolation_level="AUTOCOMMIT")
    with server_engine.connect() as conn:
        conn.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{settings.db_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
    server_engine.dispose()


def create_tables() -> None:
    """Crea todas las tablas declaradas en los modelos."""
    from . import models  # noqa: F401  (importa los modelos para registrarlos)

    Base.metadata.create_all(bind=engine)

"""Punto de entrada de la API REST de la clinica (FastAPI + MySQL)."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from .config import settings
from .database import create_tables, ensure_database_exists
from .routers import auth, citas, notas, pacientes, signos, usuarios

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Al arrancar: crea la base de datos y las tablas si no existen."""
    try:
        ensure_database_exists()
        create_tables()
        logger.info("Base de datos '%s' lista.", settings.db_name)
    except SQLAlchemyError as exc:
        logger.error(
            "No se pudo conectar a MySQL (%s). Revisa las variables del archivo .env. Detalle: %s",
            settings.db_host,
            exc,
        )
    yield


DESCRIPCION = """
API REST para la gestion de una clinica: pacientes, citas y expedientes medicos.

**Autenticacion:** todos los endpoints (excepto `/auth/login`, `/auth/register`,
`/auth/refresh` y `/health`) requieren el header:

```
Authorization: Bearer <access_token>
```

Obten el token con `POST /auth/login` y usalo con el boton **Authorize** de esta pagina.

**Usuario de prueba:** `doctor@clinica.com` / `123456`
"""

app = FastAPI(
    title=settings.app_name,
    description=DESCRIPCION,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Autenticacion", "description": "Login, registro, refresh y logout con JWT."},
        {"name": "Pacientes", "description": "Alta, busqueda, edicion y expediente de pacientes."},
        {"name": "Citas", "description": "Agenda de citas medicas."},
        {"name": "Notas medicas", "description": "Notas clinicas por paciente."},
        {"name": "Signos vitales", "description": "Peso, presion arterial y otros registros."},
        {"name": "Usuarios", "description": "Perfil del doctor autenticado."},
    ],
)

# CORS: necesario para que la app de Expo consuma la API desde la red local.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(pacientes.router)
app.include_router(citas.router)
app.include_router(notas.router)
app.include_router(signos.router)


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    """Devuelve 400 con un mensaje legible en lugar del 422 por defecto."""
    errores = [
        {"campo": ".".join(str(p) for p in e["loc"][1:]), "mensaje": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": "Datos invalidos", "errores": errores},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Error de base de datos")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno de base de datos"},
    )


@app.get("/", tags=["Estado"], summary="Informacion de la API")
def raiz() -> dict:
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "estado": "ok",
    }


@app.get("/health", tags=["Estado"], summary="Health check")
def health() -> dict:
    return {"status": "ok", "database": settings.db_name}

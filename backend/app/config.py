"""Carga y validacion de la configuracion de la aplicacion desde el archivo .env."""

from functools import lru_cache
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Variables de entorno de la API. Se leen del archivo backend/.env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Base de datos
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "clinica_db"

    # Seguridad
    jwt_secret: str = "cambia-esta-clave"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    refresh_token_expire_days: int = 30

    # CORS
    cors_origins: str = "*"

    # App
    app_name: str = "API Clinica"
    app_env: str = "development"

    @property
    def database_url(self) -> str:
        """Cadena de conexion SQLAlchemy hacia MySQL (driver PyMySQL)."""
        password = quote_plus(self.db_password)
        user = quote_plus(self.db_user)
        return (
            f"mysql+pymysql://{user}:{password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"
        )

    @property
    def server_url(self) -> str:
        """Cadena de conexion sin nombre de base de datos (para poder crearla)."""
        password = quote_plus(self.db_password)
        user = quote_plus(self.db_user)
        return f"mysql+pymysql://{user}:{password}@{self.db_host}:{self.db_port}/?charset=utf8mb4"

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

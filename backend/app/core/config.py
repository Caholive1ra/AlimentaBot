from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://alimentabot:alimentabot@localhost:5432/alimentabot"
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:8080"
    auth0_domain: str | None = None
    auth0_audience: str | None = None
    demo_mode_enabled: bool = False
    db_pool_size: int = 5
    db_max_overflow: int = 2
    max_request_body_bytes: int = 1_048_576
    # Resolve from backend/, not from the process working directory.
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def auth0_issuer(self) -> str | None:
        return f"https://{self.auth0_domain}/" if self.auth0_domain else None

    @property
    def auth0_jwks_url(self) -> str | None:
        return f"https://{self.auth0_domain}/.well-known/jwks.json" if self.auth0_domain else None

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return "postgresql+psycopg://" + value.removeprefix("postgres://")
        if value.startswith("postgresql://"):
            return "postgresql+psycopg://" + value.removeprefix("postgresql://")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


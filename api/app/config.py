from pydantic_settings import BaseSettings, SettingsConfigDict
import os
BASE = os.getenv("VITE_API_URL", "http://localhost:8000")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://tracker:tracker@db:5432/tracker"
    seed_on_start: bool = False
    cors_origins: list[str] = [BASE, "http://localhost:5173"]
    secret_key: str = "dev-secret-key-change-in-production"
    token_expire_hours: int = 24


settings = Settings()

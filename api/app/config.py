from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://tracker:tracker@db:5432/tracker"
    seed_on_start: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Auto Data Profiler"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    DATABASE_URL: str

    class Config:
        env_file = ".env"


settings = Settings()

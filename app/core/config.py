from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str
    APP_VERSION: str
    APP_DESCRIPTION: str

    DEBUG: bool = False

    API_PREFIX: str

    DATABASE_URL: str
    
    ABUSEIPDB_API_KEY: str

    VIRUSTOTAL_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )


settings = Settings()
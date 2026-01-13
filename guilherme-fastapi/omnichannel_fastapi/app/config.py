from pydantic import BaseSettings, AnyUrl

class Settings(BaseSettings):
    APP_ENV: str = "production"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DATABASE_URL: str
    LOVABLE_BASE_URL: AnyUrl
    LOVABLE_API_KEY: str
    
    WHATSAPP_API_URL: str = None
    WHATSAPP_API_KEY: str = None
    
    INSTAGRAM_API_URL: str = None
    INSTAGRAM_API_KEY: str = None
    
    FACEBOOK_API_URL: str = None
    FACEBOOK_API_KEY: str = None
    
    TIKTOK_API_URL: str = None
    TIKTOK_API_KEY: str = None
    
    LINKEDIN_API_URL: str = None
    LINKEDIN_API_KEY: str = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
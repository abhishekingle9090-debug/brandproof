from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    firebase_credentials_path: str = "./firebase-service-account.json"

    gemini_api_key: str
    groq_api_key: str
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"

    embedding_model: str = "gemini-embedding-001"
    embedding_dimension: int = 1536

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
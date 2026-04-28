from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    database_path: str = "./data/sor.db"
    default_model: str = "claude-sonnet-4-6"

    # Demo / quality dials applied to per-agent runs only.
    # Leave agent_model unset to honor each agent's own model field
    # (production quality). Set it to claude-haiku-4-5-20251001 for fast demos.
    # agent_max_tokens caps output length per agent run.
    # agent_max_concurrency caps how many agent calls hit Anthropic at once
    # (Anthropic enforces a per-tier "concurrent connections" limit; exceeding
    # it returns 429 and trips the entire stage).
    agent_model: str | None = None
    agent_max_tokens: int = 4096
    agent_max_concurrency: int = 3

    cors_origins: list[str] = ["*"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

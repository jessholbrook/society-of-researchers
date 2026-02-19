FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies first for better layer caching
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy application code
COPY src/ src/

# Create data directory for SQLite
RUN mkdir -p /data

ENV DATABASE_PATH=/data/sor.db
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/.venv/bin:$PATH"

CMD ["python", "-m", "uvicorn", "sor.main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "src"]

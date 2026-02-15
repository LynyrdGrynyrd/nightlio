import os
from dataclasses import dataclass
from typing import Optional, Dict, Any
from pathlib import Path

INSECURE_DEFAULT_SECRET = "dev-secret-key-change-in-production"


def _parse_cors_origins(raw: str) -> list[str]:
    """Parse comma-separated CORS origins into a normalized list."""
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

# Optional .env loader: only if python-dotenv is installed.
try:
    from dotenv import load_dotenv  # type: ignore

    _ENV_PATH = Path(__file__).parent.parent / ".env"
    if _ENV_PATH.exists():
        # Load from project root so simple self-host works OOTB.
        load_dotenv(_ENV_PATH)
except Exception:
    # Silently ignore if dotenv is not installed or fails; env vars still work.
    pass


class Config:
    """Existing Flask-style configuration (kept for backward compatibility).

    Note: New features should prefer the typed config via get_config().
    """

    SECRET_KEY = os.environ.get("SECRET_KEY") or INSECURE_DEFAULT_SECRET

    # Database configuration
    DATABASE_PATH = os.environ.get("DATABASE_PATH") or os.path.join(
        Path(__file__).parent.parent, "data", "twilightio.db"
    )

    # CORS configuration
    CORS_ORIGINS = _parse_cors_origins(
        os.environ.get("CORS_ORIGINS", "http://localhost:5173,https://twilightio.vercel.app")
    )

    # Google OAuth configuration
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

    # JWT configuration (legacy)
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    ENABLE_LOCAL_LOGIN = str(os.environ.get("ENABLE_LOCAL_LOGIN", "")).strip().lower() in {"1", "true", "yes", "on"}


class DevelopmentConfig(Config):
    """Development configuration"""

    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""

    DEBUG = False
    TESTING = False

    # Require explicit DATABASE_PATH in production to prevent silent data loss.
    DATABASE_PATH = os.environ.get("DATABASE_PATH") or "/tmp/twilightio.db"

    @classmethod
    def validate(cls) -> None:
        if not os.environ.get("DATABASE_PATH"):
            import warnings
            warnings.warn(
                "DATABASE_PATH is not set in production config. "
                "Defaulting to /tmp/twilightio.db which is EPHEMERAL and will lose data on restart. "
                "Set DATABASE_PATH to a persistent volume path.",
                stacklevel=2,
            )

    # SECURITY: Exclude localhost from CORS in production
    # Only use explicitly configured origins in production
    CORS_ORIGINS = [
        origin
        for origin in _parse_cors_origins(
            os.environ.get("CORS_ORIGINS", "https://twilightio.vercel.app")
        )
        if not origin.startswith("http://localhost")
    ] or ["https://twilightio.vercel.app"]


class TestingConfig(Config):
    """Testing configuration"""

    DEBUG = True
    TESTING = True
    # Use a file-backed SQLite DB so multiple connections see the same data
    DATABASE_PATH = "/tmp/twilightio_test.db"


# Configuration mapping (legacy app factory still uses this).
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}


# --- New typed configuration for optional features ---

# Avoid importing optional helpers with package-level relative import here,
# as this module is also used directly in scripts. The utils package exists,
# and when imported from the app (which sets PYTHONPATH to api/) this works.
try:
    from utils.is_truthy import is_truthy  # type: ignore
except Exception:
    # Tiny fallback in case utils isn't importable for ad-hoc scripts.
    def is_truthy(value: Optional[str]) -> bool:  # type: ignore
        if value is None:
            return False
        return str(value).strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class ConfigData:
    """Typed runtime configuration for optional features.

    Only use these values on the server; never expose secrets to the client.

    If you use SQLAlchemy elsewhere in the project, prefer keeping this
    module's surface the same and swap underlying DB access in services.
    """

    PORT: int

    # Feature flags
    ENABLE_GOOGLE_OAUTH: bool
    ENABLE_REGISTRATION: bool
    ENABLE_LOCAL_LOGIN: bool

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str]
    GOOGLE_CLIENT_SECRET: Optional[str]
    GOOGLE_CALLBACK_URL: Optional[str]

    # Auth
    JWT_SECRET: str
    DEFAULT_SELF_HOST_ID: str = "selfhost_default_user"
    # Optional friendly defaults for the self-hosted user display
    SELFHOST_USER_NAME: Optional[str] = None
    SELFHOST_USER_EMAIL: Optional[str] = None

    # Email configuration
    EMAIL_PROVIDER: str = "none"  # "sendgrid", "smtp", or "none"
    EMAIL_API_KEY: Optional[str] = None
    EMAIL_FROM_ADDRESS: str = "noreply@twilightio.app"
    EMAIL_FROM_NAME: str = "Twilightio"
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True
    APP_URL: str = "http://localhost:5173"


_CONFIG_SINGLETON: Optional[ConfigData] = None


def _load_config_from_env() -> ConfigData:
    """Load ConfigData from environment variables.

    - Booleans parsed with is_truthy.
    - Secrets are not logged or exposed.
    - JWT_SECRET falls back to JWT_SECRET_KEY/SECRET_KEY/dev default.
    """

    enable_google = is_truthy(os.getenv("ENABLE_GOOGLE_OAUTH"))
    enable_registration = is_truthy(os.getenv("ENABLE_REGISTRATION"))
    # Secrets pulled from env; don't default to empty string.
    jwt_secret = (
        os.getenv("JWT_SECRET")
        or os.getenv("JWT_SECRET_KEY")
        or os.getenv("SECRET_KEY")
        or INSECURE_DEFAULT_SECRET
    )

    port_str = os.getenv("PORT", "5000")
    try:
        port = int(port_str)
    except (TypeError, ValueError):
        port = 5000

    return ConfigData(
        PORT=port,
        ENABLE_GOOGLE_OAUTH=enable_google,
        ENABLE_REGISTRATION=enable_registration,
        ENABLE_LOCAL_LOGIN=is_truthy(os.getenv("ENABLE_LOCAL_LOGIN")),
        GOOGLE_CLIENT_ID=os.getenv("GOOGLE_CLIENT_ID"),
        GOOGLE_CLIENT_SECRET=os.getenv("GOOGLE_CLIENT_SECRET"),
        GOOGLE_CALLBACK_URL=os.getenv("GOOGLE_CALLBACK_URL"),
        JWT_SECRET=jwt_secret,
        DEFAULT_SELF_HOST_ID=os.getenv("DEFAULT_SELF_HOST_ID")
        or "selfhost_default_user",
        SELFHOST_USER_NAME=os.getenv("SELFHOST_USER_NAME") or "Me",
        SELFHOST_USER_EMAIL=os.getenv("SELFHOST_USER_EMAIL") or None,
        EMAIL_PROVIDER=os.getenv("EMAIL_PROVIDER", "none").lower().strip(),
        EMAIL_API_KEY=os.getenv("EMAIL_API_KEY"),
        EMAIL_FROM_ADDRESS=os.getenv("EMAIL_FROM_ADDRESS", "noreply@twilightio.app"),
        EMAIL_FROM_NAME=os.getenv("EMAIL_FROM_NAME", "Twilightio"),
        SMTP_HOST=os.getenv("SMTP_HOST"),
        SMTP_PORT=int(os.getenv("SMTP_PORT", "587")),
        SMTP_USERNAME=os.getenv("SMTP_USERNAME"),
        SMTP_PASSWORD=os.getenv("SMTP_PASSWORD"),
        SMTP_USE_TLS=is_truthy(os.getenv("SMTP_USE_TLS", "true")),
        APP_URL=os.getenv("APP_URL", "http://localhost:5173"),
    )


def get_config() -> ConfigData:
    """Return a process-wide ConfigData singleton.

    Loads from environment on first access; subsequent calls return the same instance.
    """
    global _CONFIG_SINGLETON
    if _CONFIG_SINGLETON is None:
        _CONFIG_SINGLETON = _load_config_from_env()
    return _CONFIG_SINGLETON


def config_to_public_dict(cfg: ConfigData) -> Dict[str, Any]:
    """Return a safe public configuration for the frontend.

    Only returns non-secret feature flags.
    """
    return {
        "enable_google_oauth": bool(cfg.ENABLE_GOOGLE_OAUTH),
        "enable_registration": bool(cfg.ENABLE_REGISTRATION),
        "enable_local_login": bool(cfg.ENABLE_LOCAL_LOGIN),
        # Expose the Google Client ID so the frontend can initialize GSI correctly
        "google_client_id": cfg.GOOGLE_CLIENT_ID,
        "email_enabled": cfg.EMAIL_PROVIDER not in ("none", ""),
    }

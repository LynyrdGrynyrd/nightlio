import os
import sys
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from the project root (parent directory)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Support running as a package (api.*) and from within the api/ directory
try:
    from api.database import MoodDatabase
    from api.services.mood_service import MoodService
    from api.services.goal_service import GoalService
    from api.services.group_service import GroupService
    from api.services.user_service import UserService
    from api.services.achievement_service import AchievementService
    from api.routes.mood_routes import create_mood_routes
    from api.routes.goal_routes import create_goal_routes
    from api.routes.group_routes import create_group_routes
    from api.routes.auth_routes import create_auth_routes
    from api.routes.misc_routes import create_misc_routes
    from api.routes.config_routes import create_config_routes
    from api.routes.achievement_routes import create_achievement_routes
    from api.utils.error_handlers import setup_error_handlers
    from api.utils.security_headers import add_security_headers
except Exception:  # fallback for running from inside api/
    from database import MoodDatabase
    from services.mood_service import MoodService
    from services.goal_service import GoalService
    from services.group_service import GroupService
    from services.user_service import UserService
    from services.achievement_service import AchievementService
    from routes.mood_routes import create_mood_routes
    from routes.goal_routes import create_goal_routes
    from routes.group_routes import create_group_routes
    from routes.auth_routes import create_auth_routes
    from routes.misc_routes import create_misc_routes
    from routes.config_routes import create_config_routes
    from routes.achievement_routes import create_achievement_routes
    from utils.error_handlers import setup_error_handlers
    from utils.security_headers import add_security_headers


def create_app(config_name="default"):
    """Application factory pattern"""
    try:
        from api.config import config as config_map
        from api.config import get_config, INSECURE_DEFAULT_SECRET
    except Exception:
        # Fallback when running from within api/ directory
        from config import config as config_map  # type: ignore[import-not-found]
        from config import get_config, INSECURE_DEFAULT_SECRET  # type: ignore[import-not-found]

    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    # Load typed runtime config and align secrets
    cfg = None
    try:
        cfg = get_config()
        if getattr(cfg, "JWT_SECRET", None):
            app.config["JWT_SECRET_KEY"] = getattr(cfg, "JWT_SECRET")
        if getattr(cfg, "GOOGLE_CLIENT_ID", None):
            app.config["GOOGLE_CLIENT_ID"] = getattr(cfg, "GOOGLE_CLIENT_ID")
        app.config["ENABLE_LOCAL_LOGIN"] = bool(getattr(cfg, "ENABLE_LOCAL_LOGIN", False))
    except Exception:
        cfg = None  # fallback if typed config fails

    def _ensure_secure_secrets() -> None:
        # Reject insecure defaults in production deployments.
        if config_name != "production":
            return

        jwt_secret = app.config.get("JWT_SECRET_KEY")
        flask_secret = app.config.get("SECRET_KEY")
        insecure = {
            None,
            "",
            INSECURE_DEFAULT_SECRET,
            "your-secret-key-change-this",
            "your-jwt-secret-change-this",
        }

        if jwt_secret in insecure or flask_secret in insecure:
            raise RuntimeError(
                "Refusing to start in production with insecure default secrets. "
                "Set JWT_SECRET (or JWT_SECRET_KEY) and SECRET_KEY to strong values."
            )

    _ensure_secure_secrets()

    cors_origins = app.config.get("CORS_ORIGINS") or []
    CORS(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # Rely on flask-cors to handle CORS and automatic OPTIONS responses per route

    # Setup error handlers
    setup_error_handlers(app)

    # Add security headers
    add_security_headers(app)

    def should_start_scheduler():
        return os.getenv("ENABLE_SCHEDULER", "0").lower() in {"1", "true", "yes", "on"}

    # Initialize database
    db = MoodDatabase(app.config.get("DATABASE_PATH"))

    # Initialize services
    mood_service = MoodService(db)
    group_service = GroupService(db)
    goal_service = GoalService(db)
    user_service = UserService(db)
    achievement_service = AchievementService(db)

    # Initialize login attempt tracking service
    try:
        from api.services.login_attempt_service import LoginAttemptService
    except ImportError:
        from services.login_attempt_service import LoginAttemptService
    login_attempt_service = LoginAttemptService(app.config.get("DATABASE_PATH"))

    # Ensure default admin user exists
    try:
        from api.utils.password_utils import hash_password
    except ImportError:
        from utils.password_utils import hash_password

    try:
        existing_admin = user_service.get_user_by_username("admin")
        if not existing_admin:
            # Get admin password from environment or generate secure random password
            admin_password = os.getenv("ADMIN_PASSWORD")

            if not admin_password:
                # Generate a secure random password
                import secrets
                import string
                alphabet = string.ascii_letters + string.digits + string.punctuation
                admin_password = ''.join(secrets.choice(alphabet) for _ in range(16))

                # Never log raw credentials; emit explicit action guidance instead.
                app.logger.warning("=" * 70)
                app.logger.warning("⚠️  DEFAULT ADMIN ACCOUNT CREATED")
                app.logger.warning(f"⚠️  Username: admin")
                app.logger.warning("⚠️  Password was auto-generated and is intentionally not logged.")
                app.logger.warning("⚠️  Set ADMIN_PASSWORD environment variable to a known strong value.")
                app.logger.warning("=" * 70)
            else:
                app.logger.info("Creating admin user with password from ADMIN_PASSWORD env var")

            admin_password_hash = hash_password(admin_password)
            user_service.create_user_with_password(
                username="admin",
                password_hash=admin_password_hash,
                email="admin@localhost",
                name="Administrator"
            )
            app.logger.info("Default admin user created successfully")
    except Exception as e:
        app.logger.warning(f"Could not create default admin user: {e}")

    # Register blueprints with services
    app.register_blueprint(create_auth_routes(user_service, login_attempt_service), url_prefix="/api")
    
    # Media Services needs to be created before some routes if we want to pass it
    upload_folder = os.path.join(app.root_path, "..", "data", "media")
    from api.services.media_service import MediaService
    from api.routes.media_routes import create_media_routes
    media_service = MediaService(db, upload_folder)

    app.register_blueprint(create_mood_routes(mood_service, media_service), url_prefix="/api")
    app.register_blueprint(create_media_routes(media_service, mood_service), url_prefix="/api")
    app.register_blueprint(create_group_routes(group_service), url_prefix="/api")
    app.register_blueprint(create_goal_routes(goal_service), url_prefix="/api")
    app.register_blueprint(
        create_achievement_routes(achievement_service), url_prefix="/api"
    )
    app.register_blueprint(create_misc_routes(), url_prefix="/api")

    app.register_blueprint(create_config_routes(), url_prefix="/api")

    # Search Services
    try:
        from api.routes.search_routes import create_search_routes
        app.register_blueprint(create_search_routes(mood_service), url_prefix="/api")
    except ImportError:
        from routes.search_routes import create_search_routes
        app.register_blueprint(create_search_routes(mood_service), url_prefix="/api")

    # Push Notification Services
    try:
        from api.services.push_service import PushService
        from api.services.scheduler_service import SchedulerService
        from api.routes.reminder_routes import create_reminder_routes

        push_service = PushService(db)
        scheduler_service = SchedulerService(db, push_service)
        if should_start_scheduler():
            scheduler_service.start()
        else:
            app.logger.info("Scheduler disabled; set ENABLE_SCHEDULER=1 to enable.")
        
        app.register_blueprint(create_reminder_routes(scheduler_service, push_service), url_prefix="/api")
    except ImportError: # Fallback for local run
        from services.push_service import PushService
        from services.scheduler_service import SchedulerService
        from routes.reminder_routes import create_reminder_routes
        
        push_service = PushService(db)
        scheduler_service = SchedulerService(db, push_service)
        if should_start_scheduler():
            scheduler_service.start()
        else:
            app.logger.info("Scheduler disabled; set ENABLE_SCHEDULER=1 to enable.")
        
        app.register_blueprint(create_reminder_routes(scheduler_service, push_service), url_prefix="/api")

    # Export Service
    try:
        from api.services.export_service import ExportService
        from api.routes.export_routes import create_export_routes
        export_service = ExportService(db)
        app.register_blueprint(create_export_routes(export_service), url_prefix="/api")
    except ImportError:
        from services.export_service import ExportService
        from routes.export_routes import create_export_routes
        export_service = ExportService(db)
        app.register_blueprint(create_export_routes(export_service), url_prefix="/api")

    # Daylio Import Service
    try:
        from api.services.daylio_import_service import DaylioImportService
        from api.routes.import_routes import create_import_routes

        daylio_import_service = DaylioImportService(db)
        app.register_blueprint(create_import_routes(daylio_import_service), url_prefix="/api")
    except ImportError:
        from services.daylio_import_service import DaylioImportService
        from routes.import_routes import create_import_routes

        daylio_import_service = DaylioImportService(db)
        app.register_blueprint(create_import_routes(daylio_import_service), url_prefix="/api")

    # Custom Mood Definitions
    try:
        from api.services.mood_definition_service import MoodDefinitionService
        from api.routes.mood_definition_routes import create_mood_definition_routes
        mood_definition_service = MoodDefinitionService(db)
        app.register_blueprint(create_mood_definition_routes(mood_definition_service), url_prefix="/api")
    except ImportError:
        from services.mood_definition_service import MoodDefinitionService
        from routes.mood_definition_routes import create_mood_definition_routes
        mood_definition_service = MoodDefinitionService(db)
        app.register_blueprint(create_mood_definition_routes(mood_definition_service), url_prefix="/api")

    # Scale Tracking
    try:
        from api.services.scale_service import ScaleService
        from api.routes.scale_routes import create_scale_routes
        scale_service = ScaleService(db)
        app.register_blueprint(create_scale_routes(scale_service), url_prefix="/api")
    except ImportError:
        from services.scale_service import ScaleService
        from routes.scale_routes import create_scale_routes
        scale_service = ScaleService(db)
        app.register_blueprint(create_scale_routes(scale_service), url_prefix="/api")

    # Analytics Services (after scale_service so we can pass it)
    try:
        from api.services.analytics_service import AnalyticsService
        from api.routes.analytics_routes import create_analytics_routes
        analytics_service = AnalyticsService(db)
        app.register_blueprint(create_analytics_routes(analytics_service, scale_service=scale_service), url_prefix="/api")
    except ImportError:
        from services.analytics_service import AnalyticsService
        from routes.analytics_routes import create_analytics_routes
        analytics_service = AnalyticsService(db)
        app.register_blueprint(create_analytics_routes(analytics_service, scale_service=scale_service), url_prefix="/api")

    # Important Days / Countdowns
    try:
        from api.services.important_days_service import ImportantDaysService
        from api.routes.important_days_routes import create_important_days_routes
        important_days_service = ImportantDaysService(db)
        app.register_blueprint(create_important_days_routes(important_days_service), url_prefix="/api")
    except ImportError:
        from services.important_days_service import ImportantDaysService
        from routes.important_days_routes import create_important_days_routes
        important_days_service = ImportantDaysService(db)
        app.register_blueprint(create_important_days_routes(important_days_service), url_prefix="/api")

    # User Settings / App Lock
    try:
        from api.services.settings_service import SettingsService
        from api.routes.settings_routes import create_settings_routes
        settings_service = SettingsService(db)
        app.register_blueprint(create_settings_routes(settings_service), url_prefix="/api")
    except ImportError:
        from services.settings_service import SettingsService
        from routes.settings_routes import create_settings_routes
        settings_service = SettingsService(db)
        app.register_blueprint(create_settings_routes(settings_service), url_prefix="/api")

    # Expose services for optional blueprints (e.g., OAuth) to reuse
    try:
        if not hasattr(app, "extensions") or app.extensions is None:  # type: ignore[attr-defined]
            app.extensions = {}  # type: ignore[attr-defined]
        app.extensions["user_service"] = user_service  # type: ignore[attr-defined]
    except Exception:
        pass

    # Conditional feature registration (lazy imports)
    if cfg is None:
        try:
            cfg = get_config()
        except Exception:
            cfg = None

    if cfg and getattr(cfg, "ENABLE_GOOGLE_OAUTH", False):
        try:
            # Registered only when enabled; module can lazy-import heavy deps.
            from api.auth.oauth import oauth_bp  # type: ignore

            app.register_blueprint(oauth_bp, url_prefix="/api")
        except Exception as e:
            try:
                from auth.oauth import oauth_bp  # type: ignore

                app.register_blueprint(oauth_bp, url_prefix="/api")
            except Exception as e2:
                if app.debug:
                    print(
                        f"[warn] ENABLE_GOOGLE_OAUTH is true but oauth blueprint not available: {e} / {e2}"
                    )

    # Debug: Print all registered routes
    if app.debug:
        print("Registered routes:")
        for rule in app.url_map.iter_rules():
            methods = sorted(list(getattr(rule, "methods", []) or []))
            print(f"  {rule.rule} -> {rule.endpoint} [{', '.join(methods)}]")

    return app


if __name__ == "__main__":
    # Ensure project root is on sys.path when running this file directly
    root = str(Path(__file__).parent)
    if root not in sys.path:
        sys.path.insert(0, root)

    # Get environment from Railway or default to development
    env = os.getenv("RAILWAY_ENVIRONMENT", "development")
    app = create_app(env)

    print("Starting Flask app...")
    print(f"Environment: {env}")
    print(
        f"Google Client ID: {'Set' if app.config.get('GOOGLE_CLIENT_ID') else 'Missing'}"
    )

    port = int(os.getenv("PORT", 5000))
    print(f"Starting Flask app on port {port}")
    if env == "production":
        print("WARNING: Running in production mode with Flask development server!")
        print("For production deployments, use: gunicorn wsgi:application")
        print("Or run: python3 wsgi.py")
        app.run(host="::", port=port, debug=False)
    else:
        print("Using Flask development server (debug mode on)")
        app.run(debug=True, host="127.0.0.1", port=port)

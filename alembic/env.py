from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.config import settings
from app.db.database import Base

# Import all models so Alembic can detect them
# during autogenerate.
from app.models import IOC, ThreatAnalysis, User


# =========================================================
# ALEMBIC CONFIGURATION
# =========================================================

config = context.config

config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL,
)


# =========================================================
# LOGGING
# =========================================================

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# =========================================================
# SQLALCHEMY METADATA
# =========================================================

target_metadata = Base.metadata


# =========================================================
# OFFLINE MIGRATIONS
# =========================================================

def run_migrations_offline() -> None:
    """
    Run migrations in offline mode.

    This configures Alembic using only the database URL
    without creating a live database connection.
    """

    url = config.get_main_option(
        "sqlalchemy.url"
    )

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


# =========================================================
# ONLINE MIGRATIONS
# =========================================================

def run_migrations_online() -> None:
    """
    Run migrations in online mode.

    This creates a database connection and applies
    migrations against the configured database.
    """

    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {}
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


# =========================================================
# MIGRATION ENTRY POINT
# =========================================================

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
#!/usr/bin/env python3
"""
Database management utilities for Krishi Sakhi
"""

import argparse
import os
import sys

from dotenv import load_dotenv
from flask import Flask
from flask_migrate import Migrate, downgrade, init, migrate, upgrade

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import db


def create_app():
    """Create Flask app for database operations"""
    app = Flask(__name__)
    load_dotenv()

    # Database configuration
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    else:
        postgres_config = {
            "host": os.environ.get("DB_HOST", "localhost"),
            "port": os.environ.get("DB_PORT", "5432"),
            "database": os.environ.get("DB_NAME", "krishi_sakhi"),
            "username": os.environ.get("DB_USER", "postgres"),
            "password": os.environ.get("DB_PASSWORD", ""),
        }

        if all(postgres_config.values()) and postgres_config["password"]:
            app.config["SQLALCHEMY_DATABASE_URI"] = (
                f"postgresql://{postgres_config['username']}:{postgres_config['password']}"
                f"@{postgres_config['host']}:{postgres_config['port']}/{postgres_config['database']}"
            )
        else:
            app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    migrate_obj = Migrate(app, db)
    return app, migrate_obj


def init_migrations():
    """Initialize migration repository"""
    app, migrate_obj = create_app()
    with app.app_context():
        init()
        print("✅ Migration repository initialized")


def create_migration(message=None):
    """Create a new migration"""
    app, migrate_obj = create_app()
    with app.app_context():
        if not message:
            message = input("Enter migration message: ")
        migrate(message=message)
        print(f"✅ Migration created: {message}")


def apply_migrations():
    """Apply all pending migrations"""
    app, migrate_obj = create_app()
    with app.app_context():
        upgrade()
        print("✅ All migrations applied")


def rollback_migration():
    """Rollback the last migration"""
    app, migrate_obj = create_app()
    with app.app_context():
        downgrade()
        print("✅ Last migration rolled back")


def reset_database():
    """Reset database (drop all tables and recreate)"""
    app, migrate_obj = create_app()
    with app.app_context():
        response = input("⚠️  This will delete all data. Are you sure? (y/N): ")
        if response.lower() == "y":
            db.drop_all()
            db.create_all()
            print("✅ Database reset completed")
        else:
            print("❌ Operation cancelled")


def check_database():
    """Check database connection and show info"""
    app, migrate_obj = create_app()
    with app.app_context():
        try:
            # Test connection
            with db.engine.connect() as connection:
                connection.execute(db.text("SELECT 1"))

            # Get database info
            db_url = app.config["SQLALCHEMY_DATABASE_URI"]
            if "postgresql" in db_url:
                db_type = "PostgreSQL"
            elif "sqlite" in db_url:
                db_type = "SQLite"
            else:
                db_type = "Unknown"

            print(f"✅ Database connection successful")
            print(f"📊 Database type: {db_type}")
            print(f"🔗 Connection string: {db_url[:50]}...")

            # Show table info
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"📋 Tables ({len(tables)}): {', '.join(tables)}")

        except Exception as e:
            print(f"❌ Database connection failed: {str(e)}")


def show_stats():
    """Show database statistics"""
    app, migrate_obj = create_app()
    with app.app_context():
        try:
            from models import (
                Activity,
                Advisory,
                Crop,
                Farm,
                Farmer,
                Livestock,
                WeatherLog,
            )

            stats = {
                "Farmers": Farmer.query.count(),
                "Farms": Farm.query.count(),
                "Crops": Crop.query.count(),
                "Livestock": Livestock.query.count(),
                "Activities": Activity.query.count(),
                "Advisories": Advisory.query.count(),
                "Weather Logs": WeatherLog.query.count(),
            }

            print("📊 Database Statistics:")
            for table, count in stats.items():
                print(f"   {table}: {count}")

        except Exception as e:
            print(f"❌ Failed to get statistics: {str(e)}")


def main():
    parser = argparse.ArgumentParser(description="Krishi Sakhi Database Management")
    parser.add_argument(
        "command",
        choices=["init", "migrate", "upgrade", "downgrade", "reset", "check", "stats"],
        help="Database command to execute",
    )
    parser.add_argument("-m", "--message", help="Migration message")

    args = parser.parse_args()

    try:
        if args.command == "init":
            init_migrations()
        elif args.command == "migrate":
            create_migration(args.message)
        elif args.command == "upgrade":
            apply_migrations()
        elif args.command == "downgrade":
            rollback_migration()
        elif args.command == "reset":
            reset_database()
        elif args.command == "check":
            check_database()
        elif args.command == "stats":
            show_stats()

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()

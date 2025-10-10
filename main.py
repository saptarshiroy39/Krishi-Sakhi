import os

from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate

from blueprints.activity import activity_bp
from blueprints.advisory import advisory_bp
from blueprints.chat import chat_bp
from blueprints.home import home_bp
from blueprints.knowledge import knowledge_bp
from blueprints.profile import profile_bp
from blueprints.schemes import schemes_bp
from models import db


def create_app():
    app = Flask(__name__)
    load_dotenv()

    # Database configuration - Using SQLite for development
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")

    # Enable CORS for React frontend
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
    CORS(app, origins=allowed_origins, supports_credentials=True)

    db.init_app(app)
    migrate = Migrate(app, db)

    # Register API blueprints with /api prefix
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(profile_bp, url_prefix="/api")
    app.register_blueprint(activity_bp, url_prefix="/api")
    app.register_blueprint(advisory_bp, url_prefix="/api")
    app.register_blueprint(schemes_bp, url_prefix="/api")
    app.register_blueprint(home_bp, url_prefix="/api/home")
    app.register_blueprint(knowledge_bp, url_prefix="/api/knowledge")

    # API Routes
    @app.route("/api/health")
    def health_check():
        return {"status": "healthy", "message": "Krishi Sakhi API is running"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

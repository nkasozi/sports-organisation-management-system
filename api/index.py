"""
Main application entry point for the Sports Organisation Management System.

This file configures and creates the Flask application instance for deployment
on Vercel Functions with dependency injection support.
"""

from flask import Flask
from flask_cors import CORS
from api.config.settings import Settings
from api.adapters.web.routes import create_api_blueprint
from api.shared.logger import get_logger
from api.core.container import get_container, ServiceProvider

logger = get_logger(__name__)


def create_app(config: Settings = None) -> Flask:
    """
    Create and configure the Flask application with dependency injection.

    Args:
        config: Configuration settings. If None, loads from environment.

    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)

    # Load configuration
    if config is None:
        config = Settings()

    app.config.update(
        SECRET_KEY=config.secret_key,
        DEBUG=config.debug,
        CORS_ORIGINS=config.cors_origins
    )

    # Enable CORS
    CORS(app, origins=config.cors_origins)

    # Initialize dependency injection container
    container = ServiceProvider.create_container()

    # Create and register blueprint with dependency injection
    api_blueprint = create_api_blueprint(container)
    app.register_blueprint(api_blueprint, url_prefix='/api')

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'sports-org-management'}, 200

    logger.info("Sports Organisation Management System API initialized with dependency injection")

    return app


# Create the application instance for Vercel
app = create_app()

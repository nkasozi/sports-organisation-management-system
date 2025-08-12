"""
Main Flask application entry point for Vercel deployment.

This file serves as the WSGI application entry point that Vercel will use
to serve the Flask application.
"""

from flask import Flask
from flask_cors import CORS
from api.adapters.web.routes import create_api_routes
from api.config.settings import get_application_settings
from api.shared.logger import get_application_logger
from typing import Dict, Any
import os


def create_flask_application() -> Flask:
    """
    Create and configure the Flask application instance.

    Returns:
        Flask: Configured Flask application instance
    """
    application_instance = Flask(__name__)

    # Enable CORS for all routes to support frontend requests
    CORS(application_instance)

    # Load application configuration
    application_settings = get_application_settings()
    application_instance.config.from_object(application_settings)

    # Setup logging
    application_logger = get_application_logger()
    application_logger.info("Initializing Sports Organisation Management System API")

    # Register API routes
    api_routes_blueprint = create_api_routes()
    application_instance.register_blueprint(api_routes_blueprint, url_prefix='/api/v1')

    # Add health check endpoint for Vercel
    @application_instance.route('/health')
    def check_application_health() -> Dict[str, Any]:
        """Health check endpoint for monitoring application status."""
        return {
            'status': 'healthy',
            'version': '1.0.0',
            'service': 'sports-organisation-management-api'
        }

    application_logger.info("Flask application initialization completed successfully")
    return application_instance


# Create the application instance for Vercel
app = create_flask_application()


if __name__ == '__main__':
    # Development server (not used in Vercel deployment)
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)

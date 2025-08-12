"""
Configuration settings for the Sports Organisation Management System API.

This module provides configuration classes for different environments
(development, production, testing) following the onion architecture pattern.
"""

import os
from typing import Any, Dict


class BaseApplicationSettings:
    """Base configuration class with common settings."""

    # Flask settings
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    DEBUG: bool = False
    TESTING: bool = False

    # Database settings
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'postgresql://localhost/sports_org_db')
    DATABASE_POOL_SIZE: int = int(os.getenv('DATABASE_POOL_SIZE', '10'))
    DATABASE_MAX_OVERFLOW: int = int(os.getenv('DATABASE_MAX_OVERFLOW', '20'))

    # Auth0 settings
    AUTH0_DOMAIN: str = os.getenv('AUTH0_DOMAIN', '')
    AUTH0_CLIENT_ID: str = os.getenv('AUTH0_CLIENT_ID', '')
    AUTH0_CLIENT_SECRET: str = os.getenv('AUTH0_CLIENT_SECRET', '')
    AUTH0_AUDIENCE: str = os.getenv('AUTH0_AUDIENCE', '')

    # API settings
    API_VERSION: str = 'v1'
    API_PREFIX: str = '/api/v1'
    MAX_PAGE_SIZE: int = 100
    DEFAULT_PAGE_SIZE: int = 20

    # CORS settings
    CORS_ORIGINS: list = ['http://localhost:3000', 'http://localhost:5173']

    # Logging settings
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'


class DevelopmentApplicationSettings(BaseApplicationSettings):
    """Development environment configuration."""

    DEBUG: bool = True
    LOG_LEVEL: str = 'DEBUG'

    # Development database
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL',
        'postgresql://sports_user:sports_password@localhost:5432/sports_org_development'
    )


class ProductionApplicationSettings(BaseApplicationSettings):
    """Production environment configuration."""

    DEBUG: bool = False
    TESTING: bool = False

    # Production database (Vercel provides this)
    DATABASE_URL: str = os.getenv('DATABASE_URL', '')

    # Production CORS settings
    CORS_ORIGINS: list = [
        os.getenv('FRONTEND_URL', 'https://your-app.vercel.app'),
        'https://your-custom-domain.com'
    ]

    # Enhanced security for production
    SECRET_KEY: str = os.getenv('SECRET_KEY')

    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set for production")


class TestingApplicationSettings(BaseApplicationSettings):
    """Testing environment configuration."""

    TESTING: bool = True
    DEBUG: bool = True

    # Test database
    DATABASE_URL: str = os.getenv(
        'TEST_DATABASE_URL',
        'postgresql://sports_user:sports_password@localhost:5432/sports_org_test'
    )

    # Disable external services in tests
    AUTH0_DOMAIN: str = 'test.auth0.com'
    AUTH0_CLIENT_ID: str = 'test_client_id'
    AUTH0_CLIENT_SECRET: str = 'test_client_secret'


def get_application_settings() -> BaseApplicationSettings:
    """
    Get the appropriate configuration based on the environment.

    Returns:
        BaseApplicationSettings: Configuration instance for the current environment
    """
    environment_name = os.getenv('FLASK_ENV', 'development').lower()

    if environment_name == 'production':
        return ProductionApplicationSettings()
    elif environment_name == 'testing':
        return TestingApplicationSettings()
    else:
        return DevelopmentApplicationSettings()


def get_database_configuration() -> Dict[str, Any]:
    """
    Get database configuration dictionary.

    Returns:
        Dict[str, Any]: Database configuration parameters
    """
    application_settings = get_application_settings()

    return {
        'database_url': application_settings.DATABASE_URL,
        'pool_size': application_settings.DATABASE_POOL_SIZE,
        'max_overflow': application_settings.DATABASE_MAX_OVERFLOW,
        'echo': application_settings.DEBUG  # SQL logging in debug mode
    }

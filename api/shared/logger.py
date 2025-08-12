"""
Shared utilities and common functionality for the Sports Organisation Management System.

This module contains logging configuration, common data types, and utility functions
that are used across different layers of the application.
"""

import logging
import sys
from typing import Any, Dict, Optional
from datetime import datetime
import json


def get_application_logger(logger_name: str = 'sports_org_api') -> logging.Logger:
    """
    Get a configured logger instance for the application.

    Args:
        logger_name: Name of the logger instance

    Returns:
        logging.Logger: Configured logger instance
    """
    application_logger = logging.getLogger(logger_name)

    if not application_logger.handlers:
        # Create console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)

        # Create formatter
        log_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        console_handler.setFormatter(log_formatter)

        # Add handler to logger
        application_logger.addHandler(console_handler)
        application_logger.setLevel(logging.INFO)

        # Prevent duplicate logs
        application_logger.propagate = False

    return application_logger


class APIResponse:
    """Standard API response structure."""

    @staticmethod
    def create_success_response(response_data: Any, message: str = "Operation successful") -> Dict[str, Any]:
        """
        Create a successful API response.

        Args:
            response_data: The data to include in the response
            message: Success message

        Returns:
            Dict[str, Any]: Formatted success response
        """
        return {
            'success': True,
            'message': message,
            'data': response_data,
            'timestamp': datetime.utcnow().isoformat(),
            'error': None
        }

    @staticmethod
    def create_error_response(error_message: str, error_code: Optional[str] = None,
                            http_status_code: int = 400) -> Dict[str, Any]:
        """
        Create an error API response.

        Args:
            error_message: Description of the error
            error_code: Optional error code for client handling
            http_status_code: HTTP status code for the response

        Returns:
            Dict[str, Any]: Formatted error response
        """
        return {
            'success': False,
            'message': error_message,
            'data': None,
            'timestamp': datetime.utcnow().isoformat(),
            'error': {
                'code': error_code,
                'message': error_message,
                'http_status': http_status_code
            }
        }

    @staticmethod
    def create_validation_error_response(validation_errors: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a validation error response.

        Args:
            validation_errors: Dictionary of field validation errors

        Returns:
            Dict[str, Any]: Formatted validation error response
        """
        return {
            'success': False,
            'message': 'Validation failed',
            'data': None,
            'timestamp': datetime.utcnow().isoformat(),
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'One or more fields failed validation',
                'validation_errors': validation_errors,
                'http_status': 422
            }
        }


class DataValidator:
    """Utility class for common data validation operations."""

    @staticmethod
    def is_valid_email(email_address: str) -> bool:
        """
        Validate email address format.

        Args:
            email_address: Email address to validate

        Returns:
            bool: True if email format is valid, False otherwise
        """
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_pattern, email_address) is not None

    @staticmethod
    def is_valid_uuid(uuid_string: str) -> bool:
        """
        Validate UUID format.

        Args:
            uuid_string: UUID string to validate

        Returns:
            bool: True if UUID format is valid, False otherwise
        """
        import re
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        return re.match(uuid_pattern, uuid_string.lower()) is not None

    @staticmethod
    def sanitize_string_input(input_string: str, max_length: Optional[int] = None) -> str:
        """
        Sanitize string input by trimming whitespace and optionally limiting length.

        Args:
            input_string: String to sanitize
            max_length: Maximum allowed length

        Returns:
            str: Sanitized string
        """
        if not isinstance(input_string, str):
            return ""

        sanitized_string = input_string.strip()

        if max_length and len(sanitized_string) > max_length:
            sanitized_string = sanitized_string[:max_length]

        return sanitized_string


class DateTimeHelper:
    """Utility class for date and time operations."""

    @staticmethod
    def get_current_utc_timestamp() -> datetime:
        """
        Get the current UTC timestamp.

        Returns:
            datetime: Current UTC timestamp
        """
        return datetime.utcnow()

    @staticmethod
    def format_datetime_for_api(datetime_object: datetime) -> str:
        """
        Format datetime object for API responses.

        Args:
            datetime_object: Datetime object to format

        Returns:
            str: ISO formatted datetime string
        """
        return datetime_object.isoformat()

    @staticmethod
    def parse_datetime_from_string(datetime_string: str) -> Optional[datetime]:
        """
        Parse datetime from string representation.

        Args:
            datetime_string: String representation of datetime

        Returns:
            Optional[datetime]: Parsed datetime object or None if parsing fails
        """
        try:
            return datetime.fromisoformat(datetime_string.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return None


def generate_unique_identifier() -> str:
    """
    Generate a unique identifier for entities.

    Returns:
        str: Unique identifier string
    """
    import uuid
    return str(uuid.uuid4())


def log_api_request(logger: logging.Logger, request_method: str, request_path: str,
                   request_data: Optional[Dict[str, Any]] = None) -> None:
    """
    Log incoming API requests for debugging and monitoring.

    Args:
        logger: Logger instance to use
        request_method: HTTP method of the request
        request_path: URL path of the request
        request_data: Optional request data to log
    """
    log_message = f"API Request: {request_method} {request_path}"

    if request_data:
        # Don't log sensitive data
        sanitized_data = {k: v for k, v in request_data.items()
                         if k.lower() not in ['password', 'token', 'secret']}
        log_message += f" - Data: {json.dumps(sanitized_data, default=str)}"

    logger.info(log_message)

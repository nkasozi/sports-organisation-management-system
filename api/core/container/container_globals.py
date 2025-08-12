"""
Global container management for the Sports Organisation Management System.

This module provides global access to the dependency injection container
and functions for managing the global container lifecycle.
"""

from typing import Optional
from .dependency_container import DependencyContainer
from .service_provider import ServiceProvider


# Global container instance
_container: Optional[DependencyContainer] = None


def get_container() -> DependencyContainer:
    """
    Get the global dependency injection container.

    Returns:
        DependencyContainer: The global container instance
    """
    global _container
    if _container is None:
        _container = ServiceProvider.create_container()
    return _container


def set_container(container: DependencyContainer) -> None:
    """
    Set the global dependency injection container.

    Args:
        container: The container to set as global
    """
    global _container
    _container = container


def reset_container() -> None:
    """Reset the global container (useful for testing)."""
    global _container
    _container = None

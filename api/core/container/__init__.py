"""
Dependency injection container for the Sports Organisation Management System.

This module provides a centralized way to manage dependencies and their lifecycles,
following the dependency inversion principle of clean architecture.
"""

from typing import Dict, Any, TypeVar, Type, Callable, Optional
from abc import ABC, abstractmethod
import inspect
from api.core.domain.repositories import (
    OrganizationRepository, CompetitionRepository, GameRepository, GameEventRepository
)
from api.core.services import (
    OrganizationManagementService, CompetitionManagementService, GameManagementService
)

T = TypeVar('T')


class DependencyContainer:
    """
    Container for managing dependency injection and service lifecycles.

    Supports singleton and transient service registrations with automatic
    dependency resolution based on constructor type hints.
    """

    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._factories: Dict[str, Callable[[], Any]] = {}
        self._singletons: Dict[str, Any] = {}

    def register_singleton(self, interface: Type[T], implementation: Type[T]) -> None:
        """
        Register a service as singleton (single instance for application lifetime).

        Args:
            interface: The interface/abstract class type
            implementation: The concrete implementation class
        """
        service_key = self._get_service_key(interface)
        self._factories[service_key] = lambda: self._create_instance(implementation)
        self._services[service_key] = ('singleton', interface, implementation)

    def register_transient(self, interface: Type[T], implementation: Type[T]) -> None:
        """
        Register a service as transient (new instance every time).

        Args:
            interface: The interface/abstract class type
            implementation: The concrete implementation class
        """
        service_key = self._get_service_key(interface)
        self._factories[service_key] = lambda: self._create_instance(implementation)
        self._services[service_key] = ('transient', interface, implementation)

    def register_instance(self, interface: Type[T], instance: T) -> None:
        """
        Register a specific instance for an interface.

        Args:
            interface: The interface/abstract class type
            instance: The specific instance to register
        """
        service_key = self._get_service_key(interface)
        self._singletons[service_key] = instance
        self._services[service_key] = ('instance', interface, type(instance))

    def resolve(self, service_type: Type[T]) -> T:
        """
        Resolve a service instance by its type.

        Args:
            service_type: The type to resolve

        Returns:
            T: Instance of the requested type

        Raises:
            ValueError: If the service is not registered
        """
        service_key = self._get_service_key(service_type)

        if service_key not in self._services:
            raise ValueError(f"Service {service_type.__name__} is not registered")

        lifecycle, interface, implementation = self._services[service_key]

        if lifecycle == 'singleton':
            if service_key not in self._singletons:
                self._singletons[service_key] = self._factories[service_key]()
            return self._singletons[service_key]
        elif lifecycle == 'instance':
            return self._singletons[service_key]
        else:  # transient
            return self._factories[service_key]()

    def _create_instance(self, implementation_type: Type[T]) -> T:
        """
        Create an instance of the implementation type with dependency injection.

        Args:
            implementation_type: The class to instantiate

        Returns:
            T: Instance of the implementation type
        """
        constructor = implementation_type.__init__
        signature = inspect.signature(constructor)

        dependencies = {}
        for param_name, param in signature.parameters.items():
            if param_name == 'self':
                continue

            if param.annotation == inspect.Parameter.empty:
                raise ValueError(f"Parameter {param_name} in {implementation_type.__name__} must have type annotation")

            dependency_instance = self.resolve(param.annotation)
            dependencies[param_name] = dependency_instance

        return implementation_type(**dependencies)

    def _get_service_key(self, service_type: Type) -> str:
        """Get a unique key for the service type."""
        return f"{service_type.__module__}.{service_type.__name__}"

    def clear(self) -> None:
        """Clear all registered services and singletons."""
        self._services.clear()
        self._factories.clear()
        self._singletons.clear()


class ServiceProvider:
    """
    Factory for creating and configuring the dependency injection container.
    """

    @staticmethod
    def create_container() -> DependencyContainer:
        """
        Create and configure the dependency injection container with default services.

        Returns:
            DependencyContainer: Configured container
        """
        container = DependencyContainer()

        # Register repositories (will be configured based on environment)
        from api.adapters.database.repositories import (
            InMemoryOrganizationRepository, InMemoryCompetitionRepository,
            InMemoryGameRepository, InMemoryGameEventRepository
        )

        # For development, use in-memory repositories
        # In production, these would be replaced with database implementations
        container.register_singleton(OrganizationRepository, InMemoryOrganizationRepository)
        container.register_singleton(CompetitionRepository, InMemoryCompetitionRepository)
        container.register_singleton(GameRepository, InMemoryGameRepository)
        container.register_singleton(GameEventRepository, InMemoryGameEventRepository)

        # Register services
        container.register_transient(OrganizationManagementService, OrganizationManagementService)
        container.register_transient(CompetitionManagementService, CompetitionManagementService)
        container.register_transient(GameManagementService, GameManagementService)

        return container

    @staticmethod
    def create_test_container() -> DependencyContainer:
        """
        Create a container configured for testing with mock dependencies.

        Returns:
            DependencyContainer: Test-configured container
        """
        container = DependencyContainer()

        # Test containers will be configured with mocks in test setup
        return container


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

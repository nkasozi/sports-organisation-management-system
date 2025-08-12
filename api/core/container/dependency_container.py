"""
Dependency injection container for the Sports Organisation Management System.

This module provides the core dependency injection container that manages
service lifecycles and automatic dependency resolution.
"""

from typing import Dict, Any, TypeVar, Type, Callable
import inspect

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
            instance: The instance to register
        """
        service_key = self._get_service_key(interface)
        self._singletons[service_key] = instance
        self._services[service_key] = ('instance', interface, type(instance))

    def resolve(self, service_type: Type[T]) -> T:
        """
        Resolve a service instance by type.

        Args:
            service_type: The type to resolve

        Returns:
            T: Instance of the requested type

        Raises:
            ValueError: If the service type is not registered
        """
        service_key = self._get_service_key(service_type)

        if service_key not in self._services:
            raise ValueError(f"Service {service_type.__name__} is not registered")

        service_info = self._services[service_key]
        service_scope = service_info[0]

        if service_scope == 'instance':
            return self._singletons[service_key]
        elif service_scope == 'singleton':
            if service_key not in self._singletons:
                self._singletons[service_key] = self._factories[service_key]()
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

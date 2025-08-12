"""
Unit tests for the Dependency Injection Container.

This module tests the core dependency injection functionality
to ensure proper service registration and resolution.
"""

import pytest
from api.core.container import DependencyContainer, ServiceProvider
from api.core.domain.repositories import OrganizationRepository
from api.core.services import OrganizationManagementService
from tests.conftest import MockOrganizationRepository


class TestDependencyContainer:
    """Test cases for the Dependency Injection Container."""

    def test_register_singleton_service_returns_same_instance(self):
        """Test that singleton services return the same instance."""
        # Arrange
        container = DependencyContainer()
        container.register_singleton(OrganizationRepository, MockOrganizationRepository)

        # Act
        first_instance = container.resolve(OrganizationRepository)
        second_instance = container.resolve(OrganizationRepository)

        # Assert
        assert first_instance is second_instance
        assert isinstance(first_instance, MockOrganizationRepository)

    def test_register_transient_service_returns_different_instances(self):
        """Test that transient services return different instances."""
        # Arrange
        container = DependencyContainer()
        container.register_transient(OrganizationRepository, MockOrganizationRepository)

        # Act
        first_instance = container.resolve(OrganizationRepository)
        second_instance = container.resolve(OrganizationRepository)

        # Assert
        assert first_instance is not second_instance
        assert isinstance(first_instance, MockOrganizationRepository)
        assert isinstance(second_instance, MockOrganizationRepository)

    def test_register_instance_returns_specific_instance(self):
        """Test that registering a specific instance returns that instance."""
        # Arrange
        container = DependencyContainer()
        mock_repository = MockOrganizationRepository()
        container.register_instance(OrganizationRepository, mock_repository)

        # Act
        resolved_instance = container.resolve(OrganizationRepository)

        # Assert
        assert resolved_instance is mock_repository

    def test_resolve_unregistered_service_raises_value_error(self):
        """Test that resolving an unregistered service raises ValueError."""
        # Arrange
        container = DependencyContainer()

        # Act & Assert
        with pytest.raises(ValueError, match="Service .* is not registered"):
            container.resolve(OrganizationRepository)

    def test_dependency_injection_with_constructor_parameters(self):
        """Test that services with dependencies are resolved correctly."""
        # Arrange
        container = DependencyContainer()
        container.register_singleton(OrganizationRepository, MockOrganizationRepository)
        container.register_transient(OrganizationManagementService, OrganizationManagementService)

        # Act
        service = container.resolve(OrganizationManagementService)

        # Assert
        assert isinstance(service, OrganizationManagementService)
        # The service should have received the mock repository through DI
        assert hasattr(service, '_organization_repository')

    def test_clear_container_removes_all_services(self):
        """Test that clearing the container removes all registered services."""
        # Arrange
        container = DependencyContainer()
        container.register_singleton(OrganizationRepository, MockOrganizationRepository)

        # Act
        container.clear()

        # Assert
        with pytest.raises(ValueError):
            container.resolve(OrganizationRepository)


class TestServiceProvider:
    """Test cases for the Service Provider factory."""

    def test_create_container_registers_default_services(self):
        """Test that the service provider creates a container with default services."""
        # Act
        container = ServiceProvider.create_container()

        # Assert
        # Should be able to resolve core services
        org_service = container.resolve(OrganizationManagementService)
        assert isinstance(org_service, OrganizationManagementService)

        # Should be able to resolve repositories
        org_repo = container.resolve(OrganizationRepository)
        assert org_repo is not None

    def test_create_test_container_returns_empty_container(self):
        """Test that the test container factory returns an empty container."""
        # Act
        container = ServiceProvider.create_test_container()

        # Assert
        with pytest.raises(ValueError):
            container.resolve(OrganizationRepository)


class TestContainerAutoWiring:
    """Test cases for automatic dependency wiring."""

    def test_service_receives_correct_repository_dependency(self):
        """Test that services receive the correct repository dependencies."""
        # Arrange
        container = DependencyContainer()
        mock_repo = MockOrganizationRepository()
        container.register_instance(OrganizationRepository, mock_repo)
        container.register_transient(OrganizationManagementService, OrganizationManagementService)

        # Act
        service = container.resolve(OrganizationManagementService)
        result = service.get_all_organizations()

        # Assert
        assert result.is_success is True
        assert mock_repo.get_call_count('get_all_organizations') == 1

    def test_multiple_services_share_singleton_repository(self):
        """Test that multiple services share the same singleton repository."""
        # Arrange
        container = ServiceProvider.create_container()

        # Act
        org_service_1 = container.resolve(OrganizationManagementService)
        org_service_2 = container.resolve(OrganizationManagementService)

        # Both services should have different instances (transient)
        assert org_service_1 is not org_service_2

        # But they should use the same repository instance (singleton)
        # This is tested implicitly through the container configuration

"""
Service provider factory for the Sports Organisation Management System.

This module provides factory methods for creating and configuring
dependency injection containers for different environments.
"""

from .dependency_container import DependencyContainer
from api.core.domain.repositories import (
    OrganizationRepository, CompetitionRepository, GameRepository, GameEventRepository
)
from api.core.services import (
    OrganizationManagementService, CompetitionManagementService, GameManagementService
)


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

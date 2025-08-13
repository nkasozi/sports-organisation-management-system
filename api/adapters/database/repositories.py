"""
Database repository implementations for the Sports Organisation Management System.

These implementations provide concrete database operations following the repository
pattern, implementing the interfaces defined in the core domain layer.

Currently using in-memory implementations for development.
Future: Will be migrated to Prisma ORM with PostgreSQL for production.
"""

# Import all repository implementations
from .in_memory_organization_repository import InMemoryOrganizationRepository
from .in_memory_competition_repository import InMemoryCompetitionRepository
from .in_memory_game_repository import InMemoryGameRepository
from .in_memory_game_event_repository import InMemoryGameEventRepository

# Import factory functions
from .repository_factories import (
    create_organization_repository,
    create_competition_repository,
    create_game_repository,
    create_game_event_repository
)

# Export all implementations and factories
__all__ = [
    # Repository implementations
    'InMemoryOrganizationRepository',
    'InMemoryCompetitionRepository',
    'InMemoryGameRepository',
    'InMemoryGameEventRepository',
    # Factory functions
    'create_organization_repository',
    'create_competition_repository',
    'create_game_repository',
    'create_game_event_repository',
]

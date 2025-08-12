"""
Repository factory functions for the Sports Organisation Management System.

This module provides factory functions for creating repository instances,
making it easy to switch between different implementations.
"""

from api.core.domain.repositories import (
    OrganizationRepository, CompetitionRepository, GameRepository, GameEventRepository
)
from .in_memory_organization_repository import InMemoryOrganizationRepository
from .in_memory_competition_repository import InMemoryCompetitionRepository
from .in_memory_game_repository import InMemoryGameRepository
from .in_memory_game_event_repository import InMemoryGameEventRepository


def create_organization_repository() -> OrganizationRepository:
    """Create an OrganizationRepository instance."""
    return InMemoryOrganizationRepository()


def create_competition_repository() -> CompetitionRepository:
    """Create a CompetitionRepository instance."""
    return InMemoryCompetitionRepository()


def create_game_repository() -> GameRepository:
    """Create a GameRepository instance."""
    return InMemoryGameRepository()


def create_game_event_repository() -> GameEventRepository:
    """Create a GameEventRepository instance."""
    return InMemoryGameEventRepository()

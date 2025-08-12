"""
Repository interfaces for the Sports Organisation Management System.

These interfaces define the contracts for data persistence operations
without coupling the core business logic to specific database implementations.
Following the onion architecture pattern, these interfaces are defined in the
core domain and implemented by adapters in the outer layers.
"""

# Import all repository interfaces
from .base_repository import BaseRepository
from .organization_repository import OrganizationRepository
from .sport_repository import SportRepository
from .competition_repository import CompetitionRepository
from .team_repository import TeamRepository
from .player_repository import PlayerRepository
from .game_repository import GameRepository
from .game_event_repository import GameEventRepository

# Export all repository interfaces
__all__ = [
    'BaseRepository',
    'OrganizationRepository',
    'SportRepository',
    'CompetitionRepository',
    'TeamRepository',
    'PlayerRepository',
    'GameRepository',
    'GameEventRepository',
]

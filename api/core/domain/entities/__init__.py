"""
Core domain entities for the Sports Organisation Management System.

This module contains the fundamental business entities that represent
the core concepts in our sports management domain.

All entities are imported from their individual modules for better organization
and maintainability.
"""

# Import all enums
from .enums import (
    OrganizationType,
    CompetitionType,
    CompetitionStatus,
    GameStatus,
    PlayerRole,
    EventType
)

# Import entity classes
from .organization import Organization
from .sport import Sport, GameFormat
from .competition import Competition
from .person import Person, Player
from .team import Team
from .game import Game
from .game_event import GameEvent
from .player_game_appearance import PlayerGameAppearance

# Export all entities for easy importing
__all__ = [
    # Enums
    "OrganizationType",
    "CompetitionType",
    "CompetitionStatus",
    "GameStatus",
    "PlayerRole",
    "EventType",
    # Entities
    "Organization",
    "Sport",
    "GameFormat",
    "Competition",
    "Person",
    "Player",
    "Team",
    "Game",
    "GameEvent",
    "PlayerGameAppearance"
]

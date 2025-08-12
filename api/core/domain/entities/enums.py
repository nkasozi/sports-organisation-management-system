"""
Enumerations for the Sports Organisation Management System.

This module contains all the enum types used throughout the domain.
"""

from enum import Enum


class OrganizationType(Enum):
    """Types of sports organizations."""
    LEAGUE = "league"
    CLUB = "club"
    ASSOCIATION = "association"
    FEDERATION = "federation"


class CompetitionType(Enum):
    """Types of competitions."""
    LEAGUE = "league"
    TOURNAMENT = "tournament"
    CUP = "cup"
    FRIENDLY = "friendly"


class CompetitionStatus(Enum):
    """Competition lifecycle status."""
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class GameStatus(Enum):
    """Game lifecycle status."""
    SCHEDULED = "scheduled"
    LINEUPS_SUBMITTED = "lineups_submitted"
    LIVE = "live"
    FINISHED = "finished"
    CANCELLED = "cancelled"


class PlayerRole(Enum):
    """Player roles in a game."""
    STARTER = "starter"
    SUBSTITUTE = "substitute"
    CAPTAIN = "captain"


class EventType(Enum):
    """Types of game events."""
    GOAL = "goal"
    YELLOW_CARD = "yellow_card"
    RED_CARD = "red_card"
    SUBSTITUTION = "substitution"
    PENALTY = "penalty"

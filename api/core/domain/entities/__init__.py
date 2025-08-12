"""
Core domain entities for the Sports Organisation Management System.

This module contains the fundamental business entities that represent
the core concepts in our sports management domain.
"""

from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional, List
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


@dataclass
class Organization:
    """Represents a sports organization entity."""
    organization_id: str
    organization_name: str
    organization_type: OrganizationType
    creation_date: datetime
    is_active: bool = True


@dataclass
class Sport:
    """Represents a sport entity."""
    sport_id: str
    sport_name: str
    sport_description: Optional[str] = None


@dataclass
class GameFormat:
    """Represents the format configuration for a sport."""
    game_format_id: str
    sport_id: str
    format_name: str
    total_duration_minutes: int
    number_of_periods: int
    period_duration_minutes: int
    max_players_per_team: int
    min_players_per_team: int


@dataclass
class Competition:
    """Represents a sports competition entity."""
    competition_id: str
    organization_id: str
    sport_id: str
    competition_name: str
    competition_type: CompetitionType
    start_date: date
    end_date: date
    competition_status: CompetitionStatus
    registration_deadline: Optional[date] = None
    max_teams: Optional[int] = None


@dataclass
class Person:
    """Represents a person entity."""
    person_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    email: Optional[str] = None
    phone_number: Optional[str] = None


@dataclass
class Player:
    """Represents a player entity."""
    player_id: str
    person_id: str
    registration_number: str
    registration_date: date
    is_active: bool = True


@dataclass
class Team:
    """Represents a team entity."""
    team_id: str
    organization_id: str
    team_name: str
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    creation_date: datetime
    is_active: bool = True


@dataclass
class Game:
    """Represents a game entity."""
    game_id: str
    competition_id: str
    game_format_id: str
    home_team_id: str
    away_team_id: str
    scheduled_datetime: datetime
    venue_name: Optional[str] = None
    pitch_number: Optional[str] = None
    game_status: GameStatus
    home_team_score: int = 0
    away_team_score: int = 0
    home_lineup_submitted: bool = False
    away_lineup_submitted: bool = False


@dataclass
class GameEvent:
    """Represents an event that occurs during a game."""
    event_id: str
    game_id: str
    player_id: str
    team_id: str
    event_type: EventType
    event_timestamp: datetime
    game_minute: int
    period_number: int
    event_details: Optional[dict] = None


@dataclass
class PlayerGameAppearance:
    """Represents a player's appearance in a specific game."""
    appearance_id: str
    game_id: str
    player_id: str
    team_id: str
    shirt_number: int
    player_role: PlayerRole
    minutes_played: int = 0
    is_starting_eleven: bool = False

"""
Sport and GameFormat entities for the Sports Organisation Management System.

This module contains the Sport and GameFormat entities.
"""

from dataclasses import dataclass
from typing import Optional


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

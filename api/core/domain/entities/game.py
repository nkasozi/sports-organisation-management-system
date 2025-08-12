"""
Game entity for the Sports Organisation Management System.

This module contains the Game entity representing individual matches.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from .enums import GameStatus


@dataclass
class Game:
    """Represents a game entity."""
    game_id: str
    competition_id: str
    game_format_id: str
    home_team_id: str
    away_team_id: str
    scheduled_datetime: datetime
    game_status: GameStatus
    home_team_score: int = 0
    away_team_score: int = 0
    home_lineup_submitted: bool = False
    away_lineup_submitted: bool = False
    venue_name: Optional[str] = None
    pitch_number: Optional[str] = None

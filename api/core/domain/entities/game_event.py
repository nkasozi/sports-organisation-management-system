"""
GameEvent entity for the Sports Organisation Management System.

This module contains the GameEvent entity representing events that occur during games.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from .enums import EventType


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

"""
PlayerGameAppearance entity for the Sports Organisation Management System.

This module contains the PlayerGameAppearance entity representing a player's
participation in a specific game.
"""

from dataclasses import dataclass
from .enums import PlayerRole


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

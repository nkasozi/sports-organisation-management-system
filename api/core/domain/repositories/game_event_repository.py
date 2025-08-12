"""
Game Event repository interface for the Sports Organisation Management System.

This module defines the repository interface for GameEvent entities,
providing methods for game event-specific data operations.
"""

from typing import List, Dict, Any
from abc import abstractmethod
from .base_repository import BaseRepository


class GameEventRepository(BaseRepository):
    """Repository interface for GameEvent entities."""

    @abstractmethod
    async def find_events_by_game(self, game_id: str) -> List[Dict[str, Any]]:
        """
        Find all events for a specific game.

        Args:
            game_id: The ID of the game

        Returns:
            List[Dict[str, Any]]: List of events in the game
        """
        pass

    @abstractmethod
    async def find_events_by_player(self, player_id: str) -> List[Dict[str, Any]]:
        """
        Find all events involving a specific player.

        Args:
            player_id: The ID of the player

        Returns:
            List[Dict[str, Any]]: List of events involving the player
        """
        pass

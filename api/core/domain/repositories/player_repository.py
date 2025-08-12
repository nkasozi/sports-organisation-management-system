"""
Player repository interface for the Sports Organisation Management System.

This module defines the repository interface for Player entities,
providing methods for player-specific data operations.
"""

from typing import Optional, Dict, Any
from abc import abstractmethod
from .base_repository import BaseRepository


class PlayerRepository(BaseRepository):
    """Repository interface for Player entities."""

    @abstractmethod
    async def find_player_by_registration_number(self, registration_number: str) -> Optional[Dict[str, Any]]:
        """
        Find a player by their registration number.

        Args:
            registration_number: The player's registration number

        Returns:
            Optional[Dict[str, Any]]: Player data if found, None otherwise
        """
        pass

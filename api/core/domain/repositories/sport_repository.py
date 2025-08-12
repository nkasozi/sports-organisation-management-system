"""
Sport repository interface for the Sports Organisation Management System.

This module defines the repository interface for Sport entities,
providing methods for sport-specific data operations.
"""

from typing import Optional, Dict, Any
from abc import abstractmethod
from .base_repository import BaseRepository


class SportRepository(BaseRepository):
    """Repository interface for Sport entities."""

    @abstractmethod
    async def find_sport_by_name(self, sport_name: str) -> Optional[Dict[str, Any]]:
        """
        Find a sport by its name.

        Args:
            sport_name: The name of the sport to search for

        Returns:
            Optional[Dict[str, Any]]: Sport data if found, None otherwise
        """
        pass

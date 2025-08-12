"""
Competition repository interface for the Sports Organisation Management System.

This module defines the repository interface for Competition entities,
providing methods for competition-specific data operations.
"""

from typing import List, Dict, Any
from abc import abstractmethod
from .base_repository import BaseRepository


class CompetitionRepository(BaseRepository):
    """Repository interface for Competition entities."""

    @abstractmethod
    async def find_competitions_by_organization(self, organization_id: str) -> List[Dict[str, Any]]:
        """
        Find competitions belonging to a specific organization.

        Args:
            organization_id: The ID of the organization

        Returns:
            List[Dict[str, Any]]: List of competitions for the organization
        """
        pass

    @abstractmethod
    async def find_active_competitions(self) -> List[Dict[str, Any]]:
        """
        Find all currently active competitions.

        Returns:
            List[Dict[str, Any]]: List of active competitions
        """
        pass

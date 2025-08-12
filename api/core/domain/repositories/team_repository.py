"""
Team repository interface for the Sports Organisation Management System.

This module defines the repository interface for Team entities,
providing methods for team-specific data operations.
"""

from typing import List, Dict, Any
from abc import abstractmethod
from .base_repository import BaseRepository


class TeamRepository(BaseRepository):
    """Repository interface for Team entities."""

    @abstractmethod
    async def find_teams_by_organization(self, organization_id: str) -> List[Dict[str, Any]]:
        """
        Find teams belonging to a specific organization.

        Args:
            organization_id: The ID of the organization

        Returns:
            List[Dict[str, Any]]: List of teams for the organization
        """
        pass

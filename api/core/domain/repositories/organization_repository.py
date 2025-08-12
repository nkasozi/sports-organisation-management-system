"""
Organization repository interface for the Sports Organisation Management System.

This module defines the repository interface for Organization entities,
providing methods for organization-specific data operations.
"""

from typing import List, Dict, Any
from abc import abstractmethod
from .base_repository import BaseRepository


class OrganizationRepository(BaseRepository):
    """Repository interface for Organization entities."""

    @abstractmethod
    async def find_organizations_by_type(self, organization_type: str) -> List[Dict[str, Any]]:
        """
        Find organizations by their type.

        Args:
            organization_type: The type of organization to search for

        Returns:
            List[Dict[str, Any]]: List of matching organizations
        """
        pass

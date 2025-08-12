"""
Base repository interface for the Sports Organisation Management System.

This module defines the common CRUD operations that all repository
interfaces should implement.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any


class BaseRepository(ABC):
    """Base repository interface with common CRUD operations."""

    @abstractmethod
    async def create_entity(self, entity_data: Dict[str, Any]) -> str:
        """
        Create a new entity and return its ID.

        Args:
            entity_data: Dictionary containing entity data

        Returns:
            str: The ID of the created entity
        """
        pass

    @abstractmethod
    async def get_entity_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve an entity by its ID.

        Args:
            entity_id: The unique identifier of the entity

        Returns:
            Optional[Dict[str, Any]]: Entity data if found, None otherwise
        """
        pass

    @abstractmethod
    async def update_entity(self, entity_id: str, entity_data: Dict[str, Any]) -> bool:
        """
        Update an existing entity.

        Args:
            entity_id: The unique identifier of the entity
            entity_data: Dictionary containing updated entity data

        Returns:
            bool: True if update was successful, False otherwise
        """
        pass

    @abstractmethod
    async def delete_entity(self, entity_id: str) -> bool:
        """
        Delete an entity by its ID.

        Args:
            entity_id: The unique identifier of the entity

        Returns:
            bool: True if deletion was successful, False otherwise
        """
        pass

    @abstractmethod
    async def list_entities(self, filters: Optional[Dict[str, Any]] = None,
                          limit: Optional[int] = None, offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        List entities with optional filtering and pagination.

        Args:
            filters: Optional dictionary of filter criteria
            limit: Maximum number of entities to return
            offset: Number of entities to skip

        Returns:
            List[Dict[str, Any]]: List of entity data dictionaries
        """
        pass

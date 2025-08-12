"""
In-memory competition repository implementation for the Sports Organisation Management System.

This module provides an in-memory implementation of CompetitionRepository
for development and testing purposes.
"""

from api.core.domain.repositories import CompetitionRepository
from .common import Dict, Any, List, Optional, get_application_logger, generate_unique_identifier


class InMemoryCompetitionRepository(CompetitionRepository):
    """In-memory implementation of CompetitionRepository for development/testing."""

    def __init__(self):
        self._competitions: Dict[str, Dict[str, Any]] = {}
        self._logger = get_application_logger('competition_repository')

    async def create_entity(self, entity_data: Dict[str, Any]) -> str:
        """Create a new competition entity."""
        competition_id = generate_unique_identifier()
        competition_data = {
            **entity_data,
            'competition_id': competition_id,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }

        self._competitions[competition_id] = competition_data
        self._logger.info(f"Created competition with ID: {competition_id}")
        return competition_id

    async def get_entity_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a competition by its ID."""
        competition_data = self._competitions.get(entity_id)
        if competition_data:
            self._logger.debug(f"Retrieved competition: {entity_id}")
        else:
            self._logger.warning(f"Competition not found: {entity_id}")
        return competition_data

    async def update_entity(self, entity_id: str, entity_data: Dict[str, Any]) -> bool:
        """Update an existing competition."""
        if entity_id not in self._competitions:
            self._logger.warning(f"Cannot update non-existent competition: {entity_id}")
            return False

        self._competitions[entity_id].update(entity_data)
        self._competitions[entity_id]['updated_at'] = '2024-01-01T00:00:00Z'
        self._logger.info(f"Updated competition: {entity_id}")
        return True

    async def delete_entity(self, entity_id: str) -> bool:
        """Delete a competition by its ID."""
        if entity_id in self._competitions:
            del self._competitions[entity_id]
            self._logger.info(f"Deleted competition: {entity_id}")
            return True

        self._logger.warning(f"Cannot delete non-existent competition: {entity_id}")
        return False

    async def list_entities(self, filters: Optional[Dict[str, Any]] = None,
                          limit: Optional[int] = None, offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """List competitions with optional filtering and pagination."""
        competitions_list = list(self._competitions.values())

        # Apply filters if provided
        if filters:
            filtered_competitions = []
            for competition_data in competitions_list:
                matches_filters = True
                for filter_key, filter_value in filters.items():
                    if competition_data.get(filter_key) != filter_value:
                        matches_filters = False
                        break
                if matches_filters:
                    filtered_competitions.append(competition_data)
            competitions_list = filtered_competitions

        # Apply pagination
        if offset:
            competitions_list = competitions_list[offset:]
        if limit:
            competitions_list = competitions_list[:limit]

        self._logger.debug(f"Listed {len(competitions_list)} competitions")
        return competitions_list

    async def find_competitions_by_organization(self, organization_id: str) -> List[Dict[str, Any]]:
        """Find competitions belonging to a specific organization."""
        matching_competitions = [
            comp_data for comp_data in self._competitions.values()
            if comp_data.get('organization_id') == organization_id
        ]

        self._logger.debug(f"Found {len(matching_competitions)} competitions for organization: {organization_id}")
        return matching_competitions

    async def find_active_competitions(self) -> List[Dict[str, Any]]:
        """Find all currently active competitions."""
        active_competitions = [
            comp_data for comp_data in self._competitions.values()
            if comp_data.get('competition_status') in ['published', 'in_progress']
        ]

        self._logger.debug(f"Found {len(active_competitions)} active competitions")
        return active_competitions

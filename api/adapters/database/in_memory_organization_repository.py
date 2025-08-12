"""
In-memory organization repository implementation for the Sports Organisation Management System.

This module provides an in-memory implementation of OrganizationRepository
for development and testing purposes.
"""

from api.core.domain.repositories import OrganizationRepository
from .common import Dict, Any, List, Optional, get_application_logger, generate_unique_identifier


class InMemoryOrganizationRepository(OrganizationRepository):
    """In-memory implementation of OrganizationRepository for development/testing."""

    def __init__(self):
        self._organizations: Dict[str, Dict[str, Any]] = {}
        self._logger = get_application_logger('organization_repository')

    async def create_entity(self, entity_data: Dict[str, Any]) -> str:
        """Create a new organization entity."""
        organization_id = generate_unique_identifier()
        organization_data = {
            **entity_data,
            'organization_id': organization_id,
            'created_at': '2024-01-01T00:00:00Z',  # In real implementation, use current timestamp
            'updated_at': '2024-01-01T00:00:00Z'
        }

        self._organizations[organization_id] = organization_data
        self._logger.info(f"Created organization with ID: {organization_id}")
        return organization_id

    async def get_entity_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve an organization by its ID."""
        organization_data = self._organizations.get(entity_id)
        if organization_data:
            self._logger.debug(f"Retrieved organization: {entity_id}")
        else:
            self._logger.warning(f"Organization not found: {entity_id}")
        return organization_data

    async def update_entity(self, entity_id: str, entity_data: Dict[str, Any]) -> bool:
        """Update an existing organization."""
        if entity_id not in self._organizations:
            self._logger.warning(f"Cannot update non-existent organization: {entity_id}")
            return False

        self._organizations[entity_id].update(entity_data)
        self._organizations[entity_id]['updated_at'] = '2024-01-01T00:00:00Z'
        self._logger.info(f"Updated organization: {entity_id}")
        return True

    async def delete_entity(self, entity_id: str) -> bool:
        """Delete an organization by its ID."""
        if entity_id in self._organizations:
            del self._organizations[entity_id]
            self._logger.info(f"Deleted organization: {entity_id}")
            return True

        self._logger.warning(f"Cannot delete non-existent organization: {entity_id}")
        return False

    async def list_entities(self, filters: Optional[Dict[str, Any]] = None,
                          limit: Optional[int] = None, offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """List organizations with optional filtering and pagination."""
        organizations_list = list(self._organizations.values())

        # Apply filters if provided
        if filters:
            filtered_organizations = []
            for organization_data in organizations_list:
                matches_filters = True
                for filter_key, filter_value in filters.items():
                    if organization_data.get(filter_key) != filter_value:
                        matches_filters = False
                        break
                if matches_filters:
                    filtered_organizations.append(organization_data)
            organizations_list = filtered_organizations

        # Apply pagination
        if offset:
            organizations_list = organizations_list[offset:]
        if limit:
            organizations_list = organizations_list[:limit]

        self._logger.debug(f"Listed {len(organizations_list)} organizations")
        return organizations_list

    async def find_organizations_by_type(self, organization_type: str) -> List[Dict[str, Any]]:
        """Find organizations by their type."""
        matching_organizations = [
            org_data for org_data in self._organizations.values()
            if org_data.get('organization_type') == organization_type
        ]

        self._logger.debug(f"Found {len(matching_organizations)} organizations of type: {organization_type}")
        return matching_organizations

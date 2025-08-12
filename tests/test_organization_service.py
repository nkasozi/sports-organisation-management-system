"""
Unit tests for the Organization Management Service.

This module tests the business logic for managing organizations
using mocked repository dependencies.
"""

import pytest
from unittest.mock import Mock
from datetime import datetime
from api.core.services import OrganizationManagementService, ServiceResult
from api.core.domain.entities import Organization
from tests.conftest import TestDataFactory


class TestOrganizationManagementService:
    """Test cases for the Organization Management Service."""

    def test_create_organization_successfully_returns_organization(self, test_container, mock_organization_repository):
        """Test creating an organization returns success result with organization data."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        organization_name = "New Sports Club"
        organization_description = "A newly created sports club"

        # Act
        create_organization_result = organization_service.create_organization(
            name=organization_name,
            description=organization_description
        )

        # Assert
        assert create_organization_result.is_success is True
        assert create_organization_result.error_message is None
        assert create_organization_result.data is not None
        assert create_organization_result.data.name == organization_name
        assert create_organization_result.data.description == organization_description
        assert create_organization_result.data.organization_id is not None
        assert mock_organization_repository.get_call_count('create_organization') == 1

    def test_create_organization_with_empty_name_returns_failure(self, test_container):
        """Test creating an organization with empty name returns failure result."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        empty_organization_name = ""
        organization_description = "Valid description"

        # Act
        create_organization_result = organization_service.create_organization(
            name=empty_organization_name,
            description=organization_description
        )

        # Assert
        assert create_organization_result.is_success is False
        assert create_organization_result.error_message is not None
        assert "name" in create_organization_result.error_message.lower()
        assert create_organization_result.data is None

    def test_create_organization_with_none_name_returns_failure(self, test_container):
        """Test creating an organization with None name returns failure result."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        none_organization_name = None
        organization_description = "Valid description"

        # Act
        create_organization_result = organization_service.create_organization(
            name=none_organization_name,
            description=organization_description
        )

        # Assert
        assert create_organization_result.is_success is False
        assert create_organization_result.error_message is not None
        assert create_organization_result.data is None

    def test_get_organization_by_id_when_exists_returns_organization(self, test_container, mock_organization_repository):
        """Test getting an organization by ID when it exists returns the organization."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        test_organization = TestDataFactory.create_organization()
        mock_organization_repository.add_test_organization(test_organization)

        # Act
        get_organization_result = organization_service.get_organization_by_id(test_organization.organization_id)

        # Assert
        assert get_organization_result.is_success is True
        assert get_organization_result.error_message is None
        assert get_organization_result.data is not None
        assert get_organization_result.data.organization_id == test_organization.organization_id
        assert get_organization_result.data.name == test_organization.name
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1

    def test_get_organization_by_id_when_not_exists_returns_failure(self, test_container, mock_organization_repository):
        """Test getting an organization by ID when it doesn't exist returns failure."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        non_existent_organization_id = "non-existent-id"

        # Act
        get_organization_result = organization_service.get_organization_by_id(non_existent_organization_id)

        # Assert
        assert get_organization_result.is_success is False
        assert get_organization_result.error_message is not None
        assert "not found" in get_organization_result.error_message.lower()
        assert get_organization_result.data is None
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1

    def test_get_organization_by_id_with_empty_id_returns_failure(self, test_container):
        """Test getting an organization by empty ID returns failure."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        empty_organization_id = ""

        # Act
        get_organization_result = organization_service.get_organization_by_id(empty_organization_id)

        # Assert
        assert get_organization_result.is_success is False
        assert get_organization_result.error_message is not None
        assert get_organization_result.data is None

    def test_get_all_organizations_when_empty_returns_empty_list(self, test_container, mock_organization_repository):
        """Test getting all organizations when repository is empty returns empty list."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)

        # Act
        get_all_organizations_result = organization_service.get_all_organizations()

        # Assert
        assert get_all_organizations_result.is_success is True
        assert get_all_organizations_result.error_message is None
        assert get_all_organizations_result.data is not None
        assert len(get_all_organizations_result.data) == 0
        assert mock_organization_repository.get_call_count('get_all_organizations') == 1

    def test_get_all_organizations_when_has_data_returns_organizations(self, test_container, mock_organization_repository):
        """Test getting all organizations when repository has data returns all organizations."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        first_test_organization = TestDataFactory.create_organization("org-1", "First Organization")
        second_test_organization = TestDataFactory.create_organization("org-2", "Second Organization")

        mock_organization_repository.add_test_organization(first_test_organization)
        mock_organization_repository.add_test_organization(second_test_organization)

        # Act
        get_all_organizations_result = organization_service.get_all_organizations()

        # Assert
        assert get_all_organizations_result.is_success is True
        assert get_all_organizations_result.error_message is None
        assert get_all_organizations_result.data is not None
        assert len(get_all_organizations_result.data) == 2

        organization_ids = [org.organization_id for org in get_all_organizations_result.data]
        assert first_test_organization.organization_id in organization_ids
        assert second_test_organization.organization_id in organization_ids
        assert mock_organization_repository.get_call_count('get_all_organizations') == 1

    def test_update_organization_when_exists_returns_updated_organization(self, test_container, mock_organization_repository):
        """Test updating an organization when it exists returns updated organization."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        original_organization = TestDataFactory.create_organization()
        mock_organization_repository.add_test_organization(original_organization)

        updated_name = "Updated Organization Name"
        updated_description = "Updated description"

        # Act
        update_organization_result = organization_service.update_organization(
            organization_id=original_organization.organization_id,
            name=updated_name,
            description=updated_description
        )

        # Assert
        assert update_organization_result.is_success is True
        assert update_organization_result.error_message is None
        assert update_organization_result.data is not None
        assert update_organization_result.data.organization_id == original_organization.organization_id
        assert update_organization_result.data.name == updated_name
        assert update_organization_result.data.description == updated_description
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1
        assert mock_organization_repository.get_call_count('update_organization') == 1

    def test_update_organization_when_not_exists_returns_failure(self, test_container, mock_organization_repository):
        """Test updating an organization when it doesn't exist returns failure."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        non_existent_organization_id = "non-existent-id"
        updated_name = "Updated Name"

        # Act
        update_organization_result = organization_service.update_organization(
            organization_id=non_existent_organization_id,
            name=updated_name,
            description="Updated description"
        )

        # Assert
        assert update_organization_result.is_success is False
        assert update_organization_result.error_message is not None
        assert "not found" in update_organization_result.error_message.lower()
        assert update_organization_result.data is None
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1
        assert mock_organization_repository.get_call_count('update_organization') == 0

    def test_delete_organization_when_exists_returns_success(self, test_container, mock_organization_repository):
        """Test deleting an organization when it exists returns success."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        test_organization = TestDataFactory.create_organization()
        mock_organization_repository.add_test_organization(test_organization)

        # Act
        delete_organization_result = organization_service.delete_organization(test_organization.organization_id)

        # Assert
        assert delete_organization_result.is_success is True
        assert delete_organization_result.error_message is None
        assert delete_organization_result.data is True
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1
        assert mock_organization_repository.get_call_count('delete_organization') == 1

    def test_delete_organization_when_not_exists_returns_failure(self, test_container, mock_organization_repository):
        """Test deleting an organization when it doesn't exist returns failure."""
        # Arrange
        organization_service = test_container.resolve(OrganizationManagementService)
        non_existent_organization_id = "non-existent-id"

        # Act
        delete_organization_result = organization_service.delete_organization(non_existent_organization_id)

        # Assert
        assert delete_organization_result.is_success is False
        assert delete_organization_result.error_message is not None
        assert "not found" in delete_organization_result.error_message.lower()
        assert delete_organization_result.data is None
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1
        assert mock_organization_repository.get_call_count('delete_organization') == 0

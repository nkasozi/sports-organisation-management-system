"""
Unit tests for the Competition Management Service.

This module tests the business logic for managing competitions
using mocked repository dependencies.
"""

import pytest
from unittest.mock import Mock
from datetime import datetime, date
from api.core.services import CompetitionManagementService, ServiceResult
from api.core.domain.entities import Competition, CompetitionStatus
from tests.conftest import TestDataFactory


class TestCompetitionManagementService:
    """Test cases for the Competition Management Service."""

    def test_create_competition_successfully_returns_competition(self, test_container,
                                                               mock_competition_repository,
                                                               mock_organization_repository):
        """Test creating a competition returns success result with competition data."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        test_organization = TestDataFactory.create_organization()
        mock_organization_repository.add_test_organization(test_organization)

        competition_name = "Premier League 2024"
        sport_id = "football-001"
        competition_description = "Top tier football league"

        # Act
        create_competition_result = competition_service.create_competition(
            name=competition_name,
            sport_id=sport_id,
            organization_id=test_organization.organization_id,
            description=competition_description
        )

        # Assert
        assert create_competition_result.is_success is True
        assert create_competition_result.error_message is None
        assert create_competition_result.data is not None
        assert create_competition_result.data.name == competition_name
        assert create_competition_result.data.sport_id == sport_id
        assert create_competition_result.data.organization_id == test_organization.organization_id
        assert create_competition_result.data.description == competition_description
        assert create_competition_result.data.status == CompetitionStatus.PLANNED
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1
        assert mock_competition_repository.get_call_count('create_competition') == 1

    def test_create_competition_with_non_existent_organization_returns_failure(self, test_container,
                                                                              mock_competition_repository):
        """Test creating a competition with non-existent organization returns failure."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        non_existent_organization_id = "non-existent-org"

        # Act
        create_competition_result = competition_service.create_competition(
            name="Test Competition",
            sport_id="test-sport",
            organization_id=non_existent_organization_id,
            description="Test description"
        )

        # Assert
        assert create_competition_result.is_success is False
        assert create_competition_result.error_message is not None
        assert "organization" in create_competition_result.error_message.lower()
        assert "not found" in create_competition_result.error_message.lower()
        assert create_competition_result.data is None
        assert mock_competition_repository.get_call_count('create_competition') == 0

    def test_create_competition_with_empty_name_returns_failure(self, test_container,
                                                              mock_organization_repository):
        """Test creating a competition with empty name returns failure."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        test_organization = TestDataFactory.create_organization()
        mock_organization_repository.add_test_organization(test_organization)

        # Act
        create_competition_result = competition_service.create_competition(
            name="",
            sport_id="test-sport",
            organization_id=test_organization.organization_id,
            description="Test description"
        )

        # Assert
        assert create_competition_result.is_success is False
        assert create_competition_result.error_message is not None
        assert "name" in create_competition_result.error_message.lower()
        assert create_competition_result.data is None

    def test_get_competition_by_id_when_exists_returns_competition(self, test_container,
                                                                 mock_competition_repository):
        """Test getting a competition by ID when it exists returns the competition."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        test_competition = TestDataFactory.create_competition()
        mock_competition_repository.add_test_competition(test_competition)

        # Act
        get_competition_result = competition_service.get_competition_by_id(test_competition.competition_id)

        # Assert
        assert get_competition_result.is_success is True
        assert get_competition_result.error_message is None
        assert get_competition_result.data is not None
        assert get_competition_result.data.competition_id == test_competition.competition_id
        assert get_competition_result.data.name == test_competition.name
        assert mock_competition_repository.get_call_count('get_competition_by_id') == 1

    def test_get_competition_by_id_when_not_exists_returns_failure(self, test_container,
                                                                 mock_competition_repository):
        """Test getting a competition by ID when it doesn't exist returns failure."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        non_existent_competition_id = "non-existent-comp"

        # Act
        get_competition_result = competition_service.get_competition_by_id(non_existent_competition_id)

        # Assert
        assert get_competition_result.is_success is False
        assert get_competition_result.error_message is not None
        assert "not found" in get_competition_result.error_message.lower()
        assert get_competition_result.data is None
        assert mock_competition_repository.get_call_count('get_competition_by_id') == 1

    def test_get_all_competitions_when_empty_returns_empty_list(self, test_container,
                                                              mock_competition_repository):
        """Test getting all competitions when repository is empty returns empty list."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)

        # Act
        get_all_competitions_result = competition_service.get_all_competitions()

        # Assert
        assert get_all_competitions_result.is_success is True
        assert get_all_competitions_result.error_message is None
        assert get_all_competitions_result.data is not None
        assert len(get_all_competitions_result.data) == 0
        assert mock_competition_repository.get_call_count('get_all_competitions') == 1

    def test_get_all_competitions_when_has_data_returns_competitions(self, test_container,
                                                                   mock_competition_repository):
        """Test getting all competitions when repository has data returns all competitions."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        first_test_competition = TestDataFactory.create_competition("comp-1", "org-1", "sport-1")
        second_test_competition = TestDataFactory.create_competition("comp-2", "org-1", "sport-2")

        mock_competition_repository.add_test_competition(first_test_competition)
        mock_competition_repository.add_test_competition(second_test_competition)

        # Act
        get_all_competitions_result = competition_service.get_all_competitions()

        # Assert
        assert get_all_competitions_result.is_success is True
        assert get_all_competitions_result.error_message is None
        assert get_all_competitions_result.data is not None
        assert len(get_all_competitions_result.data) == 2

        competition_ids = [comp.competition_id for comp in get_all_competitions_result.data]
        assert first_test_competition.competition_id in competition_ids
        assert second_test_competition.competition_id in competition_ids
        assert mock_competition_repository.get_call_count('get_all_competitions') == 1

    def test_get_competitions_by_organization_returns_filtered_competitions(self, test_container,
                                                                          mock_competition_repository):
        """Test getting competitions by organization returns only those competitions."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        target_organization_id = "target-org"
        other_organization_id = "other-org"

        target_competition_one = TestDataFactory.create_competition("comp-1", target_organization_id, "sport-1")
        target_competition_two = TestDataFactory.create_competition("comp-2", target_organization_id, "sport-2")
        other_competition = TestDataFactory.create_competition("comp-3", other_organization_id, "sport-1")

        mock_competition_repository.add_test_competition(target_competition_one)
        mock_competition_repository.add_test_competition(target_competition_two)
        mock_competition_repository.add_test_competition(other_competition)

        # Act
        get_competitions_by_org_result = competition_service.get_competitions_by_organization(target_organization_id)

        # Assert
        assert get_competitions_by_org_result.is_success is True
        assert get_competitions_by_org_result.error_message is None
        assert get_competitions_by_org_result.data is not None
        assert len(get_competitions_by_org_result.data) == 2

        returned_competition_ids = [comp.competition_id for comp in get_competitions_by_org_result.data]
        assert target_competition_one.competition_id in returned_competition_ids
        assert target_competition_two.competition_id in returned_competition_ids
        assert other_competition.competition_id not in returned_competition_ids
        assert mock_competition_repository.get_call_count('get_competitions_by_organization') == 1

    def test_update_competition_status_when_exists_returns_updated_competition(self, test_container,
                                                                             mock_competition_repository):
        """Test updating competition status when it exists returns updated competition."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        test_competition = TestDataFactory.create_competition()
        mock_competition_repository.add_test_competition(test_competition)

        new_competition_status = CompetitionStatus.ACTIVE

        # Act
        update_status_result = competition_service.update_competition_status(
            competition_id=test_competition.competition_id,
            status=new_competition_status
        )

        # Assert
        assert update_status_result.is_success is True
        assert update_status_result.error_message is None
        assert update_status_result.data is not None
        assert update_status_result.data.competition_id == test_competition.competition_id
        assert update_status_result.data.status == new_competition_status
        assert mock_competition_repository.get_call_count('get_competition_by_id') == 1
        assert mock_competition_repository.get_call_count('update_competition') == 1

    def test_update_competition_status_when_not_exists_returns_failure(self, test_container,
                                                                     mock_competition_repository):
        """Test updating competition status when it doesn't exist returns failure."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        non_existent_competition_id = "non-existent-comp"

        # Act
        update_status_result = competition_service.update_competition_status(
            competition_id=non_existent_competition_id,
            status=CompetitionStatus.ACTIVE
        )

        # Assert
        assert update_status_result.is_success is False
        assert update_status_result.error_message is not None
        assert "not found" in update_status_result.error_message.lower()
        assert update_status_result.data is None
        assert mock_competition_repository.get_call_count('get_competition_by_id') == 1
        assert mock_competition_repository.get_call_count('update_competition') == 0

    def test_delete_competition_when_exists_returns_success(self, test_container,
                                                          mock_competition_repository):
        """Test deleting a competition when it exists returns success."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        test_competition = TestDataFactory.create_competition()
        mock_competition_repository.add_test_competition(test_competition)

        # Act
        delete_competition_result = competition_service.delete_competition(test_competition.competition_id)

        # Assert
        assert delete_competition_result.is_success is True
        assert delete_competition_result.error_message is None
        assert delete_competition_result.data is True
        assert mock_competition_repository.get_call_count('get_competition_by_id') == 1
        assert mock_competition_repository.get_call_count('delete_competition') == 1

    def test_delete_competition_when_not_exists_returns_failure(self, test_container,
                                                              mock_competition_repository):
        """Test deleting a competition when it doesn't exist returns failure."""
        # Arrange
        competition_service = test_container.resolve(CompetitionManagementService)
        non_existent_competition_id = "non-existent-comp"

        # Act
        delete_competition_result = competition_service.delete_competition(non_existent_competition_id)

        # Assert
        assert delete_competition_result.is_success is False
        assert delete_competition_result.error_message is not None
        assert "not found" in delete_competition_result.error_message.lower()
        assert delete_competition_result.data is None
        assert mock_competition_repository.get_call_count('get_competition_by_id') == 1
        assert mock_competition_repository.get_call_count('delete_competition') == 0

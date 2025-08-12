"""
Competition Management Service for the Sports Organisation Management System.

This service handles all business operations related to sports competitions,
including creation, retrieval, and management of competition data.
"""

from typing import Dict, Any
from api.core.domain.repositories import CompetitionRepository, OrganizationRepository
from .service_result import ServiceResult


class CompetitionManagementService:
    """Service for managing competitions."""

    def __init__(self, competition_repository: CompetitionRepository,
                 organization_repository: OrganizationRepository):
        self._competition_repository = competition_repository
        self._organization_repository = organization_repository

    async def create_new_competition(self, competition_data: Dict[str, Any]) -> ServiceResult:
        """
        Create a new competition within an organization.

        Args:
            competition_data: Dictionary containing competition details

        Returns:
            ServiceResult: Result of the operation with competition ID or error
        """
        required_fields = ["competition_name", "organization_id", "sport_id", "competition_type"]

        for required_field in required_fields:
            if required_field not in competition_data or not competition_data[required_field]:
                return ServiceResult(
                    is_successful=False,
                    error_message=f"Required field '{required_field}' is missing or empty",
                    error_code="MISSING_REQUIRED_FIELD"
                )

        # Verify organization exists
        organization_exists = await self._organization_repository.get_entity_by_id(
            competition_data["organization_id"]
        )
        if organization_exists is None:
            return ServiceResult(
                is_successful=False,
                error_message="Organization not found",
                error_code="ORGANIZATION_NOT_FOUND"
            )

        try:
            competition_id = await self._competition_repository.create_entity(competition_data)
            return ServiceResult(
                is_successful=True,
                result_data={"competition_id": competition_id}
            )
        except Exception as exception_details:
            return ServiceResult(
                is_successful=False,
                error_message=f"Failed to create competition: {str(exception_details)}",
                error_code="CREATION_FAILED"
            )

    async def get_competitions_for_organization(self, organization_id: str) -> ServiceResult:
        """
        Retrieve all competitions for a specific organization.

        Args:
            organization_id: ID of the organization

        Returns:
            ServiceResult: Result containing list of competitions or error
        """
        if not organization_id or not organization_id.strip():
            return ServiceResult(
                is_successful=False,
                error_message="Organization ID cannot be empty",
                error_code="INVALID_ID"
            )

        try:
            competitions_list = await self._competition_repository.find_competitions_by_organization(organization_id)
            return ServiceResult(
                is_successful=True,
                result_data={"competitions": competitions_list}
            )
        except Exception as exception_details:
            return ServiceResult(
                is_successful=False,
                error_message=f"Failed to retrieve competitions: {str(exception_details)}",
                error_code="RETRIEVAL_FAILED"
            )

"""
Organization Management Service for the Sports Organisation Management System.

This service handles all business operations related to sports organizations,
including creation, retrieval, and management of organization data.
"""

from api.core.domain.repositories import OrganizationRepository
from .service_result import ServiceResult


class OrganizationManagementService:
    """Service for managing organizations."""

    def __init__(self, organization_repository: OrganizationRepository):
        self._organization_repository = organization_repository

    async def create_new_organization(self, organization_name: str, organization_type: str) -> ServiceResult:
        """
        Create a new sports organization.

        Args:
            organization_name: Name of the organization
            organization_type: Type of organization (league, club, etc.)

        Returns:
            ServiceResult: Result of the operation with organization ID or error
        """
        if not organization_name or not organization_name.strip():
            return ServiceResult(
                is_successful=False,
                error_message="Organization name cannot be empty",
                error_code="INVALID_NAME"
            )

        organization_data = {
            "organization_name": organization_name.strip(),
            "organization_type": organization_type,
            "is_active": True
        }

        try:
            organization_id = await self._organization_repository.create_entity(organization_data)
            return ServiceResult(
                is_successful=True,
                result_data={"organization_id": organization_id}
            )
        except Exception as exception_details:
            return ServiceResult(
                is_successful=False,
                error_message=f"Failed to create organization: {str(exception_details)}",
                error_code="CREATION_FAILED"
            )

    async def get_organization_details(self, organization_id: str) -> ServiceResult:
        """
        Retrieve details of a specific organization.

        Args:
            organization_id: Unique identifier of the organization

        Returns:
            ServiceResult: Result containing organization details or error
        """
        if not organization_id or not organization_id.strip():
            return ServiceResult(
                is_successful=False,
                error_message="Organization ID cannot be empty",
                error_code="INVALID_ID"
            )

        try:
            organization_data = await self._organization_repository.get_entity_by_id(organization_id)
            if organization_data is None:
                return ServiceResult(
                    is_successful=False,
                    error_message="Organization not found",
                    error_code="NOT_FOUND"
                )

            return ServiceResult(
                is_successful=True,
                result_data=organization_data
            )
        except Exception as exception_details:
            return ServiceResult(
                is_successful=False,
                error_message=f"Failed to retrieve organization: {str(exception_details)}",
                error_code="RETRIEVAL_FAILED"
            )

    async def list_organizations_by_type(self, organization_type: str) -> ServiceResult:
        """
        List all organizations of a specific type.

        Args:
            organization_type: Type of organizations to retrieve

        Returns:
            ServiceResult: Result containing list of organizations or error
        """
        try:
            organizations_list = await self._organization_repository.find_organizations_by_type(organization_type)
            return ServiceResult(
                is_successful=True,
                result_data={"organizations": organizations_list}
            )
        except Exception as exception_details:
            return ServiceResult(
                is_successful=False,
                error_message=f"Failed to list organizations: {str(exception_details)}",
                error_code="LISTING_FAILED"
            )

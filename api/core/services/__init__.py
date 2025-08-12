"""
Services for the Sports Organisation Management System.

Services represent the business operations that can be performed in the application.
They orchestrate the interaction between entities and repositories to fulfill
specific business requirements while maintaining independence from external concerns.
"""

# Import all service classes and types
from .service_result import ServiceResult
from .organization_management_service import OrganizationManagementService
from .competition_management_service import CompetitionManagementService
from .game_management_service import GameManagementService

# Export all service classes and types
__all__ = [
    'ServiceResult',
    'OrganizationManagementService',
    'CompetitionManagementService',
    'GameManagementService',
]

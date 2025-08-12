"""
Web adapter routes for the Sports Organisation Management System API.

This module defines the Flask routes and blueprints that expose the API endpoints.
Following the onion architecture pattern, these routes handle HTTP concerns and
delegate business logic to the use cases in the core domain.
"""

from flask import Blueprint, request, jsonify
from typing import Dict, Any, Tuple
from api.core.use_cases import OrganizationManagementUseCase, CompetitionManagementUseCase, GameManagementUseCase
from api.shared.logger import get_application_logger, APIResponse, log_api_request
from api.adapters.database.repositories import (
    create_organization_repository, create_competition_repository,
    create_game_repository, create_game_event_repository
)


def create_api_routes() -> Blueprint:
    """
    Create and configure the API routes blueprint.

    Returns:
        Blueprint: Configured Flask blueprint with all API routes
    """
    api_blueprint = Blueprint('api', __name__)
    application_logger = get_application_logger('api_routes')

    # Initialize repositories (in a real implementation, these would be injected)
    organization_repository = create_organization_repository()
    competition_repository = create_competition_repository()
    game_repository = create_game_repository()
    game_event_repository = create_game_event_repository()

    # Initialize use cases
    organization_use_case = OrganizationManagementUseCase(organization_repository)
    competition_use_case = CompetitionManagementUseCase(competition_repository, organization_repository)
    game_use_case = GameManagementUseCase(game_repository, game_event_repository)

    @api_blueprint.route('/organizations', methods=['POST'])
    async def create_organization_endpoint() -> Tuple[Dict[str, Any], int]:
        """Create a new organization."""
        try:
            request_data = request.get_json()
            log_api_request(application_logger, 'POST', '/organizations', request_data)

            if not request_data:
                return APIResponse.create_error_response(
                    "Request body is required", "MISSING_BODY"
                ), 400

            organization_name = request_data.get('organization_name', '').strip()
            organization_type = request_data.get('organization_type', '').strip()

            if not organization_name:
                return APIResponse.create_error_response(
                    "Organization name is required", "MISSING_NAME"
                ), 400

            if not organization_type:
                return APIResponse.create_error_response(
                    "Organization type is required", "MISSING_TYPE"
                ), 400

            use_case_result = await organization_use_case.create_new_organization(
                organization_name, organization_type
            )

            if use_case_result.is_successful:
                application_logger.info(f"Organization created successfully: {use_case_result.result_data}")
                return APIResponse.create_success_response(
                    use_case_result.result_data, "Organization created successfully"
                ), 201
            else:
                application_logger.warning(f"Organization creation failed: {use_case_result.error_message}")
                return APIResponse.create_error_response(
                    use_case_result.error_message, use_case_result.error_code
                ), 400

        except Exception as exception_details:
            application_logger.error(f"Unexpected error in create_organization: {str(exception_details)}")
            return APIResponse.create_error_response(
                "Internal server error", "INTERNAL_ERROR"
            ), 500

    @api_blueprint.route('/organizations/<organization_id>', methods=['GET'])
    async def get_organization_endpoint(organization_id: str) -> Tuple[Dict[str, Any], int]:
        """Get organization details by ID."""
        try:
            log_api_request(application_logger, 'GET', f'/organizations/{organization_id}')

            use_case_result = await organization_use_case.get_organization_details(organization_id)

            if use_case_result.is_successful:
                return APIResponse.create_success_response(
                    use_case_result.result_data, "Organization retrieved successfully"
                ), 200
            else:
                status_code = 404 if use_case_result.error_code == "NOT_FOUND" else 400
                return APIResponse.create_error_response(
                    use_case_result.error_message, use_case_result.error_code
                ), status_code

        except Exception as exception_details:
            application_logger.error(f"Unexpected error in get_organization: {str(exception_details)}")
            return APIResponse.create_error_response(
                "Internal server error", "INTERNAL_ERROR"
            ), 500

    @api_blueprint.route('/organizations/by-type/<organization_type>', methods=['GET'])
    async def list_organizations_by_type_endpoint(organization_type: str) -> Tuple[Dict[str, Any], int]:
        """List organizations by type."""
        try:
            log_api_request(application_logger, 'GET', f'/organizations/by-type/{organization_type}')

            use_case_result = await organization_use_case.list_organizations_by_type(organization_type)

            if use_case_result.is_successful:
                return APIResponse.create_success_response(
                    use_case_result.result_data, "Organizations retrieved successfully"
                ), 200
            else:
                return APIResponse.create_error_response(
                    use_case_result.error_message, use_case_result.error_code
                ), 400

        except Exception as exception_details:
            application_logger.error(f"Unexpected error in list_organizations_by_type: {str(exception_details)}")
            return APIResponse.create_error_response(
                "Internal server error", "INTERNAL_ERROR"
            ), 500

    @api_blueprint.route('/competitions', methods=['POST'])
    async def create_competition_endpoint() -> Tuple[Dict[str, Any], int]:
        """Create a new competition."""
        try:
            request_data = request.get_json()
            log_api_request(application_logger, 'POST', '/competitions', request_data)

            if not request_data:
                return APIResponse.create_error_response(
                    "Request body is required", "MISSING_BODY"
                ), 400

            use_case_result = await competition_use_case.create_new_competition(request_data)

            if use_case_result.is_successful:
                application_logger.info(f"Competition created successfully: {use_case_result.result_data}")
                return APIResponse.create_success_response(
                    use_case_result.result_data, "Competition created successfully"
                ), 201
            else:
                application_logger.warning(f"Competition creation failed: {use_case_result.error_message}")
                return APIResponse.create_error_response(
                    use_case_result.error_message, use_case_result.error_code
                ), 400

        except Exception as exception_details:
            application_logger.error(f"Unexpected error in create_competition: {str(exception_details)}")
            return APIResponse.create_error_response(
                "Internal server error", "INTERNAL_ERROR"
            ), 500

    @api_blueprint.route('/organizations/<organization_id>/competitions', methods=['GET'])
    async def get_organization_competitions_endpoint(organization_id: str) -> Tuple[Dict[str, Any], int]:
        """Get competitions for a specific organization."""
        try:
            log_api_request(application_logger, 'GET', f'/organizations/{organization_id}/competitions')

            use_case_result = await competition_use_case.get_competitions_for_organization(organization_id)

            if use_case_result.is_successful:
                return APIResponse.create_success_response(
                    use_case_result.result_data, "Competitions retrieved successfully"
                ), 200
            else:
                return APIResponse.create_error_response(
                    use_case_result.error_message, use_case_result.error_code
                ), 400

        except Exception as exception_details:
            application_logger.error(f"Unexpected error in get_organization_competitions: {str(exception_details)}")
            return APIResponse.create_error_response(
                "Internal server error", "INTERNAL_ERROR"
            ), 500

    @api_blueprint.route('/games', methods=['POST'])
    async def create_game_endpoint() -> Tuple[Dict[str, Any], int]:
        """Create a new game."""
        try:
            request_data = request.get_json()
            log_api_request(application_logger, 'POST', '/games', request_data)

            if not request_data:
                return APIResponse.create_error_response(
                    "Request body is required", "MISSING_BODY"
                ), 400

            use_case_result = await game_use_case.create_new_game(request_data)

            if use_case_result.is_successful:
                application_logger.info(f"Game created successfully: {use_case_result.result_data}")
                return APIResponse.create_success_response(
                    use_case_result.result_data, "Game created successfully"
                ), 201
            else:
                application_logger.warning(f"Game creation failed: {use_case_result.error_message}")
                return APIResponse.create_error_response(
                    use_case_result.error_message, use_case_result.error_code
                ), 400

        except Exception as exception_details:
            application_logger.error(f"Unexpected error in create_game: {str(exception_details)}")
            return APIResponse.create_error_response(
                "Internal server error", "INTERNAL_ERROR"
            ), 500

    @api_blueprint.route('/games/<game_id>/events', methods=['POST'])
    async def record_game_event_endpoint(game_id: str) -> Tuple[Dict[str, Any], int]:
        """Record a new game event."""
        try:
            request_data = request.get_json()
            log_api_request(application_logger, 'POST', f'/games/{game_id}/events', request_data)

            if not request_data:
                return APIResponse.create_error_response(
                    "Request body is required", "MISSING_BODY"
                ), 400

            # Add game_id to the request data
            request_data['game_id'] = game_id

            use_case_result = await game_use_case.record_game_event(request_data)

            if use_case_result.is_successful:
                application_logger.info(f"Game event recorded successfully: {use_case_result.result_data}")
                return APIResponse.create_success_response(
                    use_case_result.result_data, "Game event recorded successfully"
                ), 201
            else:
                application_logger.warning(f"Game event recording failed: {use_case_result.error_message}")
                return APIResponse.create_error_response(
                    use_case_result.error_message, use_case_result.error_code
                ), 400

        except Exception as exception_details:
            application_logger.error(f"Unexpected error in record_game_event: {str(exception_details)}")
            return APIResponse.create_error_response(
                "Internal server error", "INTERNAL_ERROR"
            ), 500

    return api_blueprint

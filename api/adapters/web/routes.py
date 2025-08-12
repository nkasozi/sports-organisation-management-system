"""
Web adapter for handling HTTP requests and responses.

This module defines the REST API endpoints for the Sports Organisation
Management System using Flask blueprints with dependency injection.
"""

from typing import Dict, Any, List
from flask import Blueprint, request, jsonify
from api.core.domain.entities import Organization, Competition, Game, GameEvent, CompetitionStatus, GameStatus
from api.core.services import OrganizationManagementService, CompetitionManagementService, GameManagementService
from api.core.container import DependencyContainer
from api.shared.logger import get_logger

logger = get_logger(__name__)


def create_api_blueprint(container: DependencyContainer) -> Blueprint:
    """
    Create the API blueprint with dependency injection.

    Args:
        container: Dependency injection container

    Returns:
        Blueprint: Configured Flask blueprint
    """
    api_blueprint = Blueprint('api', __name__)

    # Organization endpoints
    @api_blueprint.route('/organizations', methods=['GET'])
    def list_organizations():
        """Get all organizations."""
        try:
            organization_service = container.resolve(OrganizationManagementService)
            organizations_result = organization_service.get_all_organizations()

            if organizations_result.is_success:
                organizations_data = [
                    {
                        'id': org.organization_id,
                        'name': org.name,
                        'description': org.description,
                        'created_at': org.created_at.isoformat(),
                        'updated_at': org.updated_at.isoformat()
                    }
                    for org in organizations_result.data
                ]
                return jsonify({
                    'success': True,
                    'data': organizations_data,
                    'message': 'Organizations retrieved successfully'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': organizations_result.error_message,
                    'message': 'Failed to retrieve organizations'
                }), 500
        except Exception as e:
            logger.error(f"Error in list_organizations: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'message': 'Internal server error'
            }), 500

    @api_blueprint.route('/organizations/<organization_id>', methods=['GET'])
    def get_organization(organization_id: str):
        """Get organization by ID."""
        try:
            organization_service = container.resolve(OrganizationManagementService)
            organization_result = organization_service.get_organization_by_id(organization_id)

            if organization_result.is_success:
                org = organization_result.data
                organization_data = {
                    'id': org.organization_id,
                    'name': org.name,
                    'description': org.description,
                    'created_at': org.created_at.isoformat(),
                    'updated_at': org.updated_at.isoformat()
                }
                return jsonify({
                    'success': True,
                    'data': organization_data,
                    'message': 'Organization retrieved successfully'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': organization_result.error_message,
                    'message': 'Organization not found'
                }), 404
        except Exception as e:
            logger.error(f"Error in get_organization: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'message': 'Internal server error'
            }), 500

    @api_blueprint.route('/organizations', methods=['POST'])
    def create_organization():
        """Create a new organization."""
        try:
            data = request.get_json()

            if not data or 'name' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Name is required',
                    'message': 'Invalid request data'
                }), 400

            organization_service = container.resolve(OrganizationManagementService)
            create_organization_result = organization_service.create_organization(
                name=data['name'],
                description=data.get('description', '')
            )

            if create_organization_result.is_success:
                org = create_organization_result.data
                organization_data = {
                    'id': org.organization_id,
                    'name': org.name,
                    'description': org.description,
                    'created_at': org.created_at.isoformat(),
                    'updated_at': org.updated_at.isoformat()
                }
                return jsonify({
                    'success': True,
                    'data': organization_data,
                    'message': 'Organization created successfully'
                }), 201
            else:
                return jsonify({
                    'success': False,
                    'error': create_organization_result.error_message,
                    'message': 'Failed to create organization'
                }), 500
        except Exception as e:
            logger.error(f"Error in create_organization: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'message': 'Internal server error'
            }), 500

    # Competition endpoints
    @api_blueprint.route('/competitions', methods=['GET'])
    def list_competitions():
        """Get all competitions."""
        try:
            competition_service = container.resolve(CompetitionManagementService)
            competitions_result = competition_service.get_all_competitions()

            if competitions_result.is_success:
                competitions_data = [
                    {
                        'id': comp.competition_id,
                        'name': comp.name,
                        'description': comp.description,
                        'sport_id': comp.sport_id,
                        'organization_id': comp.organization_id,
                        'start_date': comp.start_date.isoformat() if comp.start_date else None,
                        'end_date': comp.end_date.isoformat() if comp.end_date else None,
                        'status': comp.status.value,
                        'created_at': comp.created_at.isoformat(),
                        'updated_at': comp.updated_at.isoformat()
                    }
                    for comp in competitions_result.data
                ]
                return jsonify({
                    'success': True,
                    'data': competitions_data,
                    'message': 'Competitions retrieved successfully'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': competitions_result.error_message,
                    'message': 'Failed to retrieve competitions'
                }), 500
        except Exception as e:
            logger.error(f"Error in list_competitions: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'message': 'Internal server error'
            }), 500

    @api_blueprint.route('/competitions', methods=['POST'])
    def create_competition():
        """Create a new competition."""
        try:
            data = request.get_json()

            required_fields = ['name', 'sport_id', 'organization_id']
            if not data or not all(field in data for field in required_fields):
                return jsonify({
                    'success': False,
                    'error': f'Required fields: {required_fields}',
                    'message': 'Invalid request data'
                }), 400

            competition_service = container.resolve(CompetitionManagementService)
            create_competition_result = competition_service.create_competition(
                name=data['name'],
                sport_id=data['sport_id'],
                organization_id=data['organization_id'],
                description=data.get('description', ''),
                start_date=data.get('start_date'),
                end_date=data.get('end_date')
            )

            if create_competition_result.is_success:
                comp = create_competition_result.data
                competition_data = {
                    'id': comp.competition_id,
                    'name': comp.name,
                    'description': comp.description,
                    'sport_id': comp.sport_id,
                    'organization_id': comp.organization_id,
                    'start_date': comp.start_date.isoformat() if comp.start_date else None,
                    'end_date': comp.end_date.isoformat() if comp.end_date else None,
                    'status': comp.status.value,
                    'created_at': comp.created_at.isoformat(),
                    'updated_at': comp.updated_at.isoformat()
                }
                return jsonify({
                    'success': True,
                    'data': competition_data,
                    'message': 'Competition created successfully'
                }), 201
            else:
                return jsonify({
                    'success': False,
                    'error': create_competition_result.error_message,
                    'message': 'Failed to create competition'
                }), 500
        except Exception as e:
            logger.error(f"Error in create_competition: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'message': 'Internal server error'
            }), 500

    # Game endpoints
    @api_blueprint.route('/games', methods=['GET'])
    def list_games():
        """Get all games."""
        try:
            game_service = container.resolve(GameManagementService)
            games_result = game_service.get_all_games()

            if games_result.is_success:
                games_data = [
                    {
                        'id': game.game_id,
                        'competition_id': game.competition_id,
                        'home_team': game.home_team,
                        'away_team': game.away_team,
                        'scheduled_datetime': game.scheduled_datetime.isoformat() if game.scheduled_datetime else None,
                        'venue': game.venue,
                        'status': game.status.value,
                        'score_home': game.score_home,
                        'score_away': game.score_away,
                        'created_at': game.created_at.isoformat(),
                        'updated_at': game.updated_at.isoformat()
                    }
                    for game in games_result.data
                ]
                return jsonify({
                    'success': True,
                    'data': games_data,
                    'message': 'Games retrieved successfully'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': games_result.error_message,
                    'message': 'Failed to retrieve games'
                }), 500
        except Exception as e:
            logger.error(f"Error in list_games: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'message': 'Internal server error'
            }), 500

    @api_blueprint.route('/games', methods=['POST'])
    def create_game():
        """Create a new game."""
        try:
            data = request.get_json()

            required_fields = ['competition_id', 'home_team', 'away_team']
            if not data or not all(field in data for field in required_fields):
                return jsonify({
                    'success': False,
                    'error': f'Required fields: {required_fields}',
                    'message': 'Invalid request data'
                }), 400

            game_service = container.resolve(GameManagementService)
            create_game_result = game_service.create_game(
                competition_id=data['competition_id'],
                home_team=data['home_team'],
                away_team=data['away_team'],
                scheduled_datetime=data.get('scheduled_datetime'),
                venue=data.get('venue')
            )

            if create_game_result.is_success:
                game = create_game_result.data
                game_data = {
                    'id': game.game_id,
                    'competition_id': game.competition_id,
                    'home_team': game.home_team,
                    'away_team': game.away_team,
                    'scheduled_datetime': game.scheduled_datetime.isoformat() if game.scheduled_datetime else None,
                    'venue': game.venue,
                    'status': game.status.value,
                    'score_home': game.score_home,
                    'score_away': game.score_away,
                    'created_at': game.created_at.isoformat(),
                    'updated_at': game.updated_at.isoformat()
                }
                return jsonify({
                    'success': True,
                    'data': game_data,
                    'message': 'Game created successfully'
                }), 201
            else:
                return jsonify({
                    'success': False,
                    'error': create_game_result.error_message,
                    'message': 'Failed to create game'
                }), 500
        except Exception as e:
            logger.error(f"Error in create_game: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'message': 'Internal server error'
            }), 500

    return api_blueprint

from flask import Blueprint, request, jsonify
from typing import Dict, Any, Tuple
from api.core.services import OrganizationManagementService, CompetitionManagementService, GameManagementService
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

    # Initialize services
    organization_service = OrganizationManagementService(organization_repository)
    competition_service = CompetitionManagementService(competition_repository, organization_repository)
    game_service = GameManagementService(game_repository, game_event_repository)

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

            service_result = await organization_service.create_new_organization(
                organization_name, organization_type
            )

            if service_result.is_successful:
                application_logger.info(f"Organization created successfully: {service_result.result_data}")
                return APIResponse.create_success_response(
                    service_result.result_data, "Organization created successfully"
                ), 201
            else:
                application_logger.warning(f"Organization creation failed: {service_result.error_message}")
                return APIResponse.create_error_response(
                    service_result.error_message, service_result.error_code
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

            service_result = await organization_service.get_organization_details(organization_id)

            if service_result.is_successful:
                return APIResponse.create_success_response(
                    service_result.result_data, "Organization retrieved successfully"
                ), 200
            else:
                status_code = 404 if service_result.error_code == "NOT_FOUND" else 400
                return APIResponse.create_error_response(
                    service_result.error_message, service_result.error_code
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

            service_result = await organization_service.list_organizations_by_type(organization_type)

            if service_result.is_successful:
                return APIResponse.create_success_response(
                    service_result.result_data, "Organizations retrieved successfully"
                ), 200
            else:
                return APIResponse.create_error_response(
                    service_result.error_message, service_result.error_code
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

            service_result = await competition_service.create_new_competition(request_data)

            if service_result.is_successful:
                application_logger.info(f"Competition created successfully: {service_result.result_data}")
                return APIResponse.create_success_response(
                    service_result.result_data, "Competition created successfully"
                ), 201
            else:
                application_logger.warning(f"Competition creation failed: {service_result.error_message}")
                return APIResponse.create_error_response(
                    service_result.error_message, service_result.error_code
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

            service_result = await competition_service.get_competitions_for_organization(organization_id)

            if service_result.is_successful:
                return APIResponse.create_success_response(
                    service_result.result_data, "Competitions retrieved successfully"
                ), 200
            else:
                return APIResponse.create_error_response(
                    service_result.error_message, service_result.error_code
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

            service_result = await game_service.create_new_game(request_data)

            if service_result.is_successful:
                application_logger.info(f"Game created successfully: {service_result.result_data}")
                return APIResponse.create_success_response(
                    service_result.result_data, "Game created successfully"
                ), 201
            else:
                application_logger.warning(f"Game creation failed: {service_result.error_message}")
                return APIResponse.create_error_response(
                    service_result.error_message, service_result.error_code
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

            service_result = await game_service.record_game_event(request_data)

            if service_result.is_successful:
                application_logger.info(f"Game event recorded successfully: {service_result.result_data}")
                return APIResponse.create_success_response(
                    service_result.result_data, "Game event recorded successfully"
                ), 201
            else:
                application_logger.warning(f"Game event recording failed: {service_result.error_message}")
                return APIResponse.create_error_response(
                    service_result.error_message, service_result.error_code
                ), 400

        except Exception as exception_details:
            application_logger.error(f"Unexpected error in record_game_event: {str(exception_details)}")
            return APIResponse.create_error_response(
                "Internal server error", "INTERNAL_ERROR"
            ), 500

    return api_blueprint

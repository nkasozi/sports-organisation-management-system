"""
Integration tests for the API routes.

This module tests the web layer endpoints with mocked dependencies
to ensure proper request/response handling and error scenarios.
"""

import pytest
import json
from unittest.mock import Mock
from flask import Flask
from api.adapters.web.routes import create_api_blueprint
from api.core.services import ServiceResult
from api.core.domain.entities import Organization, Competition, Game
from tests.conftest import TestDataFactory


@pytest.fixture
def flask_app(test_container):
    """Fixture providing a Flask app configured for testing."""
    app = Flask(__name__)
    app.config['TESTING'] = True

    # Register the API blueprint with the test container
    api_blueprint = create_api_blueprint(test_container)
    app.register_blueprint(api_blueprint, url_prefix='/api')

    return app


@pytest.fixture
def client(flask_app):
    """Fixture providing a test client for the Flask app."""
    return flask_app.test_client()


class TestOrganizationRoutes:
    """Test cases for organization API endpoints."""

    def test_get_organizations_when_empty_returns_empty_list(self, client, mock_organization_repository):
        """Test GET /organizations returns empty list when no organizations exist."""
        # Act
        response = client.get('/api/organizations')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 200
        assert response_data['success'] is True
        assert response_data['data'] == []
        assert 'retrieved successfully' in response_data['message']
        assert mock_organization_repository.get_call_count('get_all_organizations') == 1

    def test_get_organizations_when_has_data_returns_organizations(self, client, mock_organization_repository):
        """Test GET /organizations returns organizations when they exist."""
        # Arrange
        test_org = TestDataFactory.create_organization()
        mock_organization_repository.add_test_organization(test_org)

        # Act
        response = client.get('/api/organizations')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 200
        assert response_data['success'] is True
        assert len(response_data['data']) == 1
        assert response_data['data'][0]['id'] == test_org.organization_id
        assert response_data['data'][0]['name'] == test_org.name
        assert mock_organization_repository.get_call_count('get_all_organizations') == 1

    def test_get_organization_by_id_when_exists_returns_organization(self, client, mock_organization_repository):
        """Test GET /organizations/<id> returns organization when it exists."""
        # Arrange
        test_org = TestDataFactory.create_organization()
        mock_organization_repository.add_test_organization(test_org)

        # Act
        response = client.get(f'/api/organizations/{test_org.organization_id}')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 200
        assert response_data['success'] is True
        assert response_data['data']['id'] == test_org.organization_id
        assert response_data['data']['name'] == test_org.name
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1

    def test_get_organization_by_id_when_not_exists_returns_not_found(self, client, mock_organization_repository):
        """Test GET /organizations/<id> returns 404 when organization doesn't exist."""
        # Act
        response = client.get('/api/organizations/non-existent-id')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 404
        assert response_data['success'] is False
        assert 'not found' in response_data['message']
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1

    def test_create_organization_with_valid_data_returns_created_organization(self, client, mock_organization_repository):
        """Test POST /organizations with valid data creates organization."""
        # Arrange
        organization_data = {
            'name': 'New Sports Club',
            'description': 'A brand new sports club'
        }

        # Act
        response = client.post('/api/organizations',
                             data=json.dumps(organization_data),
                             content_type='application/json')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 201
        assert response_data['success'] is True
        assert response_data['data']['name'] == organization_data['name']
        assert response_data['data']['description'] == organization_data['description']
        assert response_data['data']['id'] is not None
        assert mock_organization_repository.get_call_count('create_organization') == 1

    def test_create_organization_without_name_returns_bad_request(self, client, mock_organization_repository):
        """Test POST /organizations without name returns 400."""
        # Arrange
        organization_data = {
            'description': 'A description without name'
        }

        # Act
        response = client.post('/api/organizations',
                             data=json.dumps(organization_data),
                             content_type='application/json')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 400
        assert response_data['success'] is False
        assert 'required' in response_data['error'].lower()
        assert mock_organization_repository.get_call_count('create_organization') == 0

    def test_create_organization_with_empty_request_returns_bad_request(self, client, mock_organization_repository):
        """Test POST /organizations with empty request returns 400."""
        # Act
        response = client.post('/api/organizations',
                             data=json.dumps({}),
                             content_type='application/json')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 400
        assert response_data['success'] is False
        assert mock_organization_repository.get_call_count('create_organization') == 0


class TestCompetitionRoutes:
    """Test cases for competition API endpoints."""

    def test_get_competitions_when_empty_returns_empty_list(self, client, mock_competition_repository):
        """Test GET /competitions returns empty list when no competitions exist."""
        # Act
        response = client.get('/api/competitions')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 200
        assert response_data['success'] is True
        assert response_data['data'] == []
        assert 'retrieved successfully' in response_data['message']
        assert mock_competition_repository.get_call_count('get_all_competitions') == 1

    def test_get_competitions_when_has_data_returns_competitions(self, client, mock_competition_repository):
        """Test GET /competitions returns competitions when they exist."""
        # Arrange
        test_comp = TestDataFactory.create_competition()
        mock_competition_repository.add_test_competition(test_comp)

        # Act
        response = client.get('/api/competitions')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 200
        assert response_data['success'] is True
        assert len(response_data['data']) == 1
        assert response_data['data'][0]['id'] == test_comp.competition_id
        assert response_data['data'][0]['name'] == test_comp.name
        assert mock_competition_repository.get_call_count('get_all_competitions') == 1

    def test_create_competition_with_valid_data_returns_created_competition(self, client,
                                                                          mock_competition_repository,
                                                                          mock_organization_repository):
        """Test POST /competitions with valid data creates competition."""
        # Arrange
        test_org = TestDataFactory.create_organization()
        mock_organization_repository.add_test_organization(test_org)

        competition_data = {
            'name': 'Premier League 2024',
            'sport_id': 'football-001',
            'organization_id': test_org.organization_id,
            'description': 'Top tier football league'
        }

        # Act
        response = client.post('/api/competitions',
                             data=json.dumps(competition_data),
                             content_type='application/json')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 201
        assert response_data['success'] is True
        assert response_data['data']['name'] == competition_data['name']
        assert response_data['data']['sport_id'] == competition_data['sport_id']
        assert response_data['data']['organization_id'] == competition_data['organization_id']
        assert mock_organization_repository.get_call_count('get_organization_by_id') == 1
        assert mock_competition_repository.get_call_count('create_competition') == 1

    def test_create_competition_without_required_fields_returns_bad_request(self, client,
                                                                           mock_competition_repository):
        """Test POST /competitions without required fields returns 400."""
        # Arrange
        competition_data = {
            'name': 'Incomplete Competition'
            # Missing sport_id and organization_id
        }

        # Act
        response = client.post('/api/competitions',
                             data=json.dumps(competition_data),
                             content_type='application/json')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 400
        assert response_data['success'] is False
        assert 'required fields' in response_data['error'].lower()
        assert mock_competition_repository.get_call_count('create_competition') == 0


class TestGameRoutes:
    """Test cases for game API endpoints."""

    def test_get_games_when_empty_returns_empty_list(self, client, mock_game_repository):
        """Test GET /games returns empty list when no games exist."""
        # Act
        response = client.get('/api/games')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 200
        assert response_data['success'] is True
        assert response_data['data'] == []
        assert 'retrieved successfully' in response_data['message']
        assert mock_game_repository.get_call_count('get_all_games') == 1

    def test_get_games_when_has_data_returns_games(self, client, mock_game_repository):
        """Test GET /games returns games when they exist."""
        # Arrange
        test_game = TestDataFactory.create_game()
        mock_game_repository.add_test_game(test_game)

        # Act
        response = client.get('/api/games')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 200
        assert response_data['success'] is True
        assert len(response_data['data']) == 1
        assert response_data['data'][0]['id'] == test_game.game_id
        assert response_data['data'][0]['home_team'] == test_game.home_team
        assert response_data['data'][0]['away_team'] == test_game.away_team
        assert mock_game_repository.get_call_count('get_all_games') == 1

    def test_create_game_with_valid_data_returns_created_game(self, client,
                                                             mock_game_repository,
                                                             mock_competition_repository):
        """Test POST /games with valid data creates game."""
        # Arrange
        test_comp = TestDataFactory.create_competition()
        mock_competition_repository.add_test_competition(test_comp)

        game_data = {
            'competition_id': test_comp.competition_id,
            'home_team': 'Manchester United',
            'away_team': 'Liverpool FC',
            'venue': 'Old Trafford'
        }

        # Act
        response = client.post('/api/games',
                             data=json.dumps(game_data),
                             content_type='application/json')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 201
        assert response_data['success'] is True
        assert response_data['data']['competition_id'] == game_data['competition_id']
        assert response_data['data']['home_team'] == game_data['home_team']
        assert response_data['data']['away_team'] == game_data['away_team']
        assert response_data['data']['venue'] == game_data['venue']
        assert mock_competition_repository.get_call_count('get_competition_by_id') == 1
        assert mock_game_repository.get_call_count('create_game') == 1

    def test_create_game_without_required_fields_returns_bad_request(self, client, mock_game_repository):
        """Test POST /games without required fields returns 400."""
        # Arrange
        game_data = {
            'home_team': 'Team A'
            # Missing competition_id and away_team
        }

        # Act
        response = client.post('/api/games',
                             data=json.dumps(game_data),
                             content_type='application/json')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 400
        assert response_data['success'] is False
        assert 'required fields' in response_data['error'].lower()
        assert mock_game_repository.get_call_count('create_game') == 0

    def test_create_game_with_non_existent_competition_returns_server_error(self, client,
                                                                           mock_game_repository,
                                                                           mock_competition_repository):
        """Test POST /games with non-existent competition returns 500."""
        # Arrange
        game_data = {
            'competition_id': 'non-existent-comp',
            'home_team': 'Team A',
            'away_team': 'Team B',
            'venue': 'Stadium'
        }

        # Act
        response = client.post('/api/games',
                             data=json.dumps(game_data),
                             content_type='application/json')
        response_data = json.loads(response.data)

        # Assert
        assert response.status_code == 500
        assert response_data['success'] is False
        assert 'failed to create' in response_data['message'].lower()
        assert mock_competition_repository.get_call_count('get_competition_by_id') == 1
        assert mock_game_repository.get_call_count('create_game') == 0

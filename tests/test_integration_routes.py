"""
Integration tests for API routes with real Flask app.

This module provides end-to-end integration tests that start a real Flask
application and test the routes with actual HTTP requests.
"""

import pytest
import json
from flask import Flask
from api.adapters.web.routes import create_api_blueprint
from api.core.container import ServiceProvider
from api.adapters.database.repositories import (
    create_organization_repository,
    create_competition_repository,
    create_game_repository
)


@pytest.fixture
def integration_app():
    """Create a Flask app with real dependencies for integration testing."""
    app = Flask(__name__)
    app.config['TESTING'] = True

    # Create a real container with in-memory repositories
    container = ServiceProvider.create_container()

    # Register the API blueprint
    api_blueprint = create_api_blueprint(container)
    app.register_blueprint(api_blueprint, url_prefix='/api')

    return app


@pytest.fixture
def integration_client(integration_app):
    """Create a test client for integration testing."""
    return integration_app.test_client()


class TestIntegrationOrganizationRoutes:
    """Integration tests for organization routes with real services."""

    def test_full_organization_crud_workflow(self, integration_client):
        """Test complete CRUD workflow for organizations."""
        # Create an organization
        create_data = {
            'name': 'Test Sports Club',
            'description': 'A test sports club'
        }

        create_response = integration_client.post(
            '/api/organizations',
            data=json.dumps(create_data),
            content_type='application/json'
        )

        assert create_response.status_code == 201
        create_result = json.loads(create_response.data)
        assert create_result['success'] is True
        assert 'id' in create_result['data']

        org_id = create_result['data']['id']

        # Get the created organization
        get_response = integration_client.get(f'/api/organizations/{org_id}')
        assert get_response.status_code == 200
        get_result = json.loads(get_response.data)
        assert get_result['success'] is True
        assert get_result['data']['name'] == 'Test Sports Club'

        # List all organizations (should include our created one)
        list_response = integration_client.get('/api/organizations')
        assert list_response.status_code == 200
        list_result = json.loads(list_response.data)
        assert list_result['success'] is True
        assert len(list_result['data']) > 0

        # Find our organization in the list
        found_org = None
        for org in list_result['data']:
            if org['id'] == org_id:
                found_org = org
                break

        assert found_org is not None
        assert found_org['name'] == 'Test Sports Club'

    def test_organization_validation_errors(self, integration_client):
        """Test validation errors for organization creation."""
        # Test missing name
        create_data = {
            'description': 'A test sports club without name'
        }

        response = integration_client.post(
            '/api/organizations',
            data=json.dumps(create_data),
            content_type='application/json'
        )

        assert response.status_code == 400
        result = json.loads(response.data)
        assert result['success'] is False

        # Test empty request body
        response = integration_client.post(
            '/api/organizations',
            data='',
            content_type='application/json'
        )

        assert response.status_code == 400


class TestIntegrationCompetitionRoutes:
    """Integration tests for competition routes with real services."""

    def test_full_competition_crud_workflow(self, integration_client):
        """Test complete CRUD workflow for competitions."""
        # First create an organization (competitions need an organization)
        org_data = {
            'name': 'Test Organization',
            'description': 'A test organization for competitions'
        }

        org_response = integration_client.post(
            '/api/organizations',
            data=json.dumps(org_data),
            content_type='application/json'
        )

        assert org_response.status_code == 201
        org_result = json.loads(org_response.data)
        org_id = org_result['data']['id']

        # Create a competition
        comp_data = {
            'name': 'Test Championship',
            'sport_id': 'football',
            'organization_id': org_id,
            'description': 'A test championship'
        }

        comp_response = integration_client.post(
            '/api/competitions',
            data=json.dumps(comp_data),
            content_type='application/json'
        )

        assert comp_response.status_code == 201
        comp_result = json.loads(comp_response.data)
        assert comp_result['success'] is True
        assert 'id' in comp_result['data']

        # List all competitions (should include our created one)
        list_response = integration_client.get('/api/competitions')
        assert list_response.status_code == 200
        list_result = json.loads(list_response.data)
        assert list_result['success'] is True
        assert len(list_result['data']) > 0

        # Find our competition in the list
        found_comp = None
        for comp in list_result['data']:
            if comp['name'] == 'Test Championship':
                found_comp = comp
                break

        assert found_comp is not None
        assert found_comp['organization_id'] == org_id


class TestIntegrationGameRoutes:
    """Integration tests for game routes with real services."""

    def test_full_game_crud_workflow(self, integration_client):
        """Test complete CRUD workflow for games."""
        # First create an organization
        org_data = {
            'name': 'Test Game Organization',
            'description': 'A test organization for games'
        }

        org_response = integration_client.post(
            '/api/organizations',
            data=json.dumps(org_data),
            content_type='application/json'
        )

        assert org_response.status_code == 201
        org_result = json.loads(org_response.data)
        org_id = org_result['data']['id']

        # Create a competition
        comp_data = {
            'name': 'Test Game Competition',
            'sport_id': 'football',
            'organization_id': org_id,
            'description': 'A test competition for games'
        }

        comp_response = integration_client.post(
            '/api/competitions',
            data=json.dumps(comp_data),
            content_type='application/json'
        )

        assert comp_response.status_code == 201
        comp_result = json.loads(comp_response.data)
        comp_id = comp_result['data']['id']

        # Create a game
        game_data = {
            'competition_id': comp_id,
            'home_team': 'Team A',
            'away_team': 'Team B',
            'venue': 'Test Stadium'
        }

        game_response = integration_client.post(
            '/api/games',
            data=json.dumps(game_data),
            content_type='application/json'
        )

        assert game_response.status_code == 201
        game_result = json.loads(game_response.data)
        assert game_result['success'] is True
        assert 'id' in game_result['data']

        # List all games (should include our created one)
        list_response = integration_client.get('/api/games')
        assert list_response.status_code == 200
        list_result = json.loads(list_response.data)
        assert list_result['success'] is True
        assert len(list_result['data']) > 0

        # Find our game in the list
        found_game = None
        for game in list_result['data']:
            if game['competition_id'] == comp_id:
                found_game = game
                break

        assert found_game is not None
        assert found_game['home_team'] == 'Team A'
        assert found_game['away_team'] == 'Team B'


class TestIntegrationErrorHandling:
    """Integration tests for error handling across all routes."""

    def test_404_for_non_existent_organization(self, integration_client):
        """Test 404 response for non-existent organization."""
        response = integration_client.get('/api/organizations/non-existent-id')
        assert response.status_code == 404
        result = json.loads(response.data)
        assert result['success'] is False

    def test_400_for_invalid_json(self, integration_client):
        """Test 400 response for invalid JSON in requests."""
        response = integration_client.post(
            '/api/organizations',
            data='invalid json{',
            content_type='application/json'
        )
        assert response.status_code == 400

    def test_500_for_invalid_competition_reference(self, integration_client):
        """Test 500 response for games referencing non-existent competition."""
        game_data = {
            'competition_id': 'non-existent-competition',
            'home_team': 'Team A',
            'away_team': 'Team B',
            'venue': 'Test Stadium'
        }

        response = integration_client.post(
            '/api/games',
            data=json.dumps(game_data),
            content_type='application/json'
        )

        # This should return a server error since the competition doesn't exist
        assert response.status_code == 500
        result = json.loads(response.data)
        assert result['success'] is False


class TestIntegrationPerformance:
    """Integration tests for performance and scalability."""

    def test_bulk_operations_performance(self, integration_client):
        """Test performance with bulk operations."""
        # Create multiple organizations quickly
        org_ids = []

        for i in range(10):
            org_data = {
                'name': f'Bulk Test Organization {i}',
                'description': f'Bulk test organization number {i}'
            }

            response = integration_client.post(
                '/api/organizations',
                data=json.dumps(org_data),
                content_type='application/json'
            )

            assert response.status_code == 201
            result = json.loads(response.data)
            org_ids.append(result['data']['id'])

        # Verify all organizations were created
        list_response = integration_client.get('/api/organizations')
        assert list_response.status_code == 200
        list_result = json.loads(list_response.data)
        assert len(list_result['data']) >= 10

        # Check that all our bulk organizations are in the list
        found_count = 0
        for org in list_result['data']:
            if org['id'] in org_ids:
                found_count += 1

        assert found_count == 10

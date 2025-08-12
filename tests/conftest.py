"""
Test configuration and fixtures for the Sports Organisation Management System.

This module provides common test utilities, fixtures, and mock objects
for unit testing the application components.
"""

import pytest
from typing import Dict, Any, List
from unittest.mock import Mock, AsyncMock
from datetime import datetime
from api.core.domain.entities import (
    Organization, Competition, Game, Sport, Player, GameEvent,
    CompetitionStatus, GameStatus
)
from api.core.domain.repositories import (
    OrganizationRepository, CompetitionRepository, GameRepository, GameEventRepository
)
from api.core.services import ServiceResult
from api.core.container import DependencyContainer


class MockOrganizationRepository:
    """Mock organization repository for testing."""

    def __init__(self):
        self._organizations: Dict[str, Organization] = {}
        self._call_count: Dict[str, int] = {}

    async def get_organization_by_id(self, organization_id: str) -> Organization:
        self._increment_call_count('get_organization_by_id')
        return self._organizations.get(organization_id)

    async def get_all_organizations(self) -> List[Organization]:
        self._increment_call_count('get_all_organizations')
        return list(self._organizations.values())

    async def create_organization(self, organization: Organization) -> Organization:
        self._increment_call_count('create_organization')
        self._organizations[organization.organization_id] = organization
        return organization

    async def update_organization(self, organization: Organization) -> Organization:
        self._increment_call_count('update_organization')
        self._organizations[organization.organization_id] = organization
        return organization

    async def delete_organization(self, organization_id: str) -> bool:
        self._increment_call_count('delete_organization')
        if organization_id in self._organizations:
            del self._organizations[organization_id]
            return True
        return False

    def _increment_call_count(self, method_name: str) -> None:
        """Track method call counts for verification."""
        self._call_count[method_name] = self._call_count.get(method_name, 0) + 1

    def get_call_count(self, method_name: str) -> int:
        """Get the number of times a method was called."""
        return self._call_count.get(method_name, 0)

    def reset_call_counts(self) -> None:
        """Reset all call counts."""
        self._call_count.clear()

    def add_test_organization(self, organization: Organization) -> None:
        """Add an organization for testing."""
        self._organizations[organization.organization_id] = organization


class MockCompetitionRepository:
    """Mock competition repository for testing."""

    def __init__(self):
        self._competitions: Dict[str, Competition] = {}
        self._call_count: Dict[str, int] = {}

    async def get_competition_by_id(self, competition_id: str) -> Competition:
        self._increment_call_count('get_competition_by_id')
        return self._competitions.get(competition_id)

    async def get_all_competitions(self) -> List[Competition]:
        self._increment_call_count('get_all_competitions')
        return list(self._competitions.values())

    async def get_competitions_by_organization(self, organization_id: str) -> List[Competition]:
        self._increment_call_count('get_competitions_by_organization')
        return [comp for comp in self._competitions.values()
                if comp.organization_id == organization_id]

    async def create_competition(self, competition: Competition) -> Competition:
        self._increment_call_count('create_competition')
        self._competitions[competition.competition_id] = competition
        return competition

    async def update_competition(self, competition: Competition) -> Competition:
        self._increment_call_count('update_competition')
        self._competitions[competition.competition_id] = competition
        return competition

    async def delete_competition(self, competition_id: str) -> bool:
        self._increment_call_count('delete_competition')
        if competition_id in self._competitions:
            del self._competitions[competition_id]
            return True
        return False

    def _increment_call_count(self, method_name: str) -> None:
        """Track method call counts for verification."""
        self._call_count[method_name] = self._call_count.get(method_name, 0) + 1

    def get_call_count(self, method_name: str) -> int:
        """Get the number of times a method was called."""
        return self._call_count.get(method_name, 0)

    def reset_call_counts(self) -> None:
        """Reset all call counts."""
        self._call_count.clear()

    def add_test_competition(self, competition: Competition) -> None:
        """Add a competition for testing."""
        self._competitions[competition.competition_id] = competition


class MockGameRepository:
    """Mock game repository for testing."""

    def __init__(self):
        self._games: Dict[str, Game] = {}
        self._call_count: Dict[str, int] = {}

    async def get_game_by_id(self, game_id: str) -> Game:
        self._increment_call_count('get_game_by_id')
        return self._games.get(game_id)

    async def get_all_games(self) -> List[Game]:
        self._increment_call_count('get_all_games')
        return list(self._games.values())

    async def get_games_by_competition(self, competition_id: str) -> List[Game]:
        self._increment_call_count('get_games_by_competition')
        return [game for game in self._games.values()
                if game.competition_id == competition_id]

    async def create_game(self, game: Game) -> Game:
        self._increment_call_count('create_game')
        self._games[game.game_id] = game
        return game

    async def update_game(self, game: Game) -> Game:
        self._increment_call_count('update_game')
        self._games[game.game_id] = game
        return game

    async def delete_game(self, game_id: str) -> bool:
        self._increment_call_count('delete_game')
        if game_id in self._games:
            del self._games[game_id]
            return True
        return False

    def _increment_call_count(self, method_name: str) -> None:
        """Track method call counts for verification."""
        self._call_count[method_name] = self._call_count.get(method_name, 0) + 1

    def get_call_count(self, method_name: str) -> int:
        """Get the number of times a method was called."""
        return self._call_count.get(method_name, 0)

    def reset_call_counts(self) -> None:
        """Reset all call counts."""
        self._call_count.clear()

    def add_test_game(self, game: Game) -> None:
        """Add a game for testing."""
        self._games[game.game_id] = game


class MockGameEventRepository:
    """Mock game event repository for testing."""

    def __init__(self):
        self._events: Dict[str, GameEvent] = {}
        self._call_count: Dict[str, int] = {}

    async def get_event_by_id(self, event_id: str) -> GameEvent:
        self._increment_call_count('get_event_by_id')
        return self._events.get(event_id)

    async def get_events_by_game(self, game_id: str) -> List[GameEvent]:
        self._increment_call_count('get_events_by_game')
        return [event for event in self._events.values()
                if event.game_id == game_id]

    async def create_event(self, event: GameEvent) -> GameEvent:
        self._increment_call_count('create_event')
        self._events[event.event_id] = event
        return event

    async def update_event(self, event: GameEvent) -> GameEvent:
        self._increment_call_count('update_event')
        self._events[event.event_id] = event
        return event

    async def delete_event(self, event_id: str) -> bool:
        self._increment_call_count('delete_event')
        if event_id in self._events:
            del self._events[event_id]
            return True
        return False

    def _increment_call_count(self, method_name: str) -> None:
        """Track method call counts for verification."""
        self._call_count[method_name] = self._call_count.get(method_name, 0) + 1

    def get_call_count(self, method_name: str) -> int:
        """Get the number of times a method was called."""
        return self._call_count.get(method_name, 0)

    def reset_call_counts(self) -> None:
        """Reset all call counts."""
        self._call_count.clear()

    def add_test_event(self, event: GameEvent) -> None:
        """Add an event for testing."""
        self._events[event.event_id] = event


@pytest.fixture
def mock_organization_repository():
    """Fixture providing a mock organization repository."""
    return MockOrganizationRepository()


@pytest.fixture
def mock_competition_repository():
    """Fixture providing a mock competition repository."""
    return MockCompetitionRepository()


@pytest.fixture
def mock_game_repository():
    """Fixture providing a mock game repository."""
    return MockGameRepository()


@pytest.fixture
def mock_game_event_repository():
    """Fixture providing a mock game event repository."""
    return MockGameEventRepository()


@pytest.fixture
def test_container(mock_organization_repository, mock_competition_repository,
                  mock_game_repository, mock_game_event_repository):
    """Fixture providing a dependency injection container configured for testing."""
    container = DependencyContainer()

    # Register mock repositories
    container.register_instance(OrganizationRepository, mock_organization_repository)
    container.register_instance(CompetitionRepository, mock_competition_repository)
    container.register_instance(GameRepository, mock_game_repository)
    container.register_instance(GameEventRepository, mock_game_event_repository)

    # Register services (they will use the mock repositories through DI)
    from api.core.services import (
        OrganizationManagementService, CompetitionManagementService, GameManagementService
    )
    container.register_transient(OrganizationManagementService, OrganizationManagementService)
    container.register_transient(CompetitionManagementService, CompetitionManagementService)
    container.register_transient(GameManagementService, GameManagementService)

    return container


@pytest.fixture
def sample_organization():
    """Fixture providing a sample organization for testing."""
    return Organization(
        organization_id="org-123",
        name="Test Sports Club",
        description="A test sports organization"
    )


@pytest.fixture
def sample_sport():
    """Fixture providing a sample sport for testing."""
    return Sport(
        sport_id="sport-456",
        name="Football",
        description="Association football"
    )


@pytest.fixture
def sample_competition():
    """Fixture providing a sample competition for testing."""
    return Competition(
        competition_id="comp-789",
        name="Premier League 2024",
        description="Top tier football league",
        sport_id="sport-456",
        organization_id="org-123",
        status=CompetitionStatus.PLANNED
    )


@pytest.fixture
def sample_game():
    """Fixture providing a sample game for testing."""
    return Game(
        game_id="game-101",
        competition_id="comp-789",
        home_team="Team A",
        away_team="Team B",
        status=GameStatus.SCHEDULED,
        venue="Stadium One"
    )


@pytest.fixture
def sample_player():
    """Fixture providing a sample player for testing."""
    return Player(
        player_id="player-202",
        name="John Doe",
        email="john.doe@example.com",
        organization_id="org-123"
    )


class TestDataFactory:
    """Factory for creating test data objects."""

    @staticmethod
    def create_organization(organization_id: str = "test-org",
                          name: str = "Test Organization") -> Organization:
        """Create a test organization."""
        return Organization(
            organization_id=organization_id,
            name=name,
            description=f"Description for {name}"
        )

    @staticmethod
    def create_competition(competition_id: str = "test-comp",
                          organization_id: str = "test-org",
                          sport_id: str = "test-sport") -> Competition:
        """Create a test competition."""
        return Competition(
            competition_id=competition_id,
            name="Test Competition",
            description="A test competition",
            sport_id=sport_id,
            organization_id=organization_id,
            status=CompetitionStatus.PLANNED
        )

    @staticmethod
    def create_game(game_id: str = "test-game",
                   competition_id: str = "test-comp") -> Game:
        """Create a test game."""
        return Game(
            game_id=game_id,
            competition_id=competition_id,
            home_team="Home Team",
            away_team="Away Team",
            status=GameStatus.SCHEDULED,
            venue="Test Stadium"
        )

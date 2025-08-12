"""
Database repository implementations for the Sports Organisation Management System.

These implementations provide concrete database operations following the repository
pattern, implementing the interfaces defined in the core domain layer.
"""

from typing import Dict, Any, List, Optional
from api.core.domain.repositories import (
    OrganizationRepository, SportRepository, CompetitionRepository,
    TeamRepository, PlayerRepository, GameRepository, GameEventRepository
)
from api.shared.logger import get_application_logger, generate_unique_identifier


class InMemoryOrganizationRepository(OrganizationRepository):
    """In-memory implementation of OrganizationRepository for development/testing."""

    def __init__(self):
        self._organizations: Dict[str, Dict[str, Any]] = {}
        self._logger = get_application_logger('organization_repository')

    async def create_entity(self, entity_data: Dict[str, Any]) -> str:
        """Create a new organization entity."""
        organization_id = generate_unique_identifier()
        organization_data = {
            **entity_data,
            'organization_id': organization_id,
            'created_at': '2024-01-01T00:00:00Z',  # In real implementation, use current timestamp
            'updated_at': '2024-01-01T00:00:00Z'
        }

        self._organizations[organization_id] = organization_data
        self._logger.info(f"Created organization with ID: {organization_id}")
        return organization_id

    async def get_entity_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve an organization by its ID."""
        organization_data = self._organizations.get(entity_id)
        if organization_data:
            self._logger.debug(f"Retrieved organization: {entity_id}")
        else:
            self._logger.warning(f"Organization not found: {entity_id}")
        return organization_data

    async def update_entity(self, entity_id: str, entity_data: Dict[str, Any]) -> bool:
        """Update an existing organization."""
        if entity_id not in self._organizations:
            self._logger.warning(f"Cannot update non-existent organization: {entity_id}")
            return False

        self._organizations[entity_id].update(entity_data)
        self._organizations[entity_id]['updated_at'] = '2024-01-01T00:00:00Z'
        self._logger.info(f"Updated organization: {entity_id}")
        return True

    async def delete_entity(self, entity_id: str) -> bool:
        """Delete an organization by its ID."""
        if entity_id in self._organizations:
            del self._organizations[entity_id]
            self._logger.info(f"Deleted organization: {entity_id}")
            return True

        self._logger.warning(f"Cannot delete non-existent organization: {entity_id}")
        return False

    async def list_entities(self, filters: Optional[Dict[str, Any]] = None,
                          limit: Optional[int] = None, offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """List organizations with optional filtering and pagination."""
        organizations_list = list(self._organizations.values())

        # Apply filters if provided
        if filters:
            filtered_organizations = []
            for organization_data in organizations_list:
                matches_filters = True
                for filter_key, filter_value in filters.items():
                    if organization_data.get(filter_key) != filter_value:
                        matches_filters = False
                        break
                if matches_filters:
                    filtered_organizations.append(organization_data)
            organizations_list = filtered_organizations

        # Apply pagination
        if offset:
            organizations_list = organizations_list[offset:]
        if limit:
            organizations_list = organizations_list[:limit]

        self._logger.debug(f"Listed {len(organizations_list)} organizations")
        return organizations_list

    async def find_organizations_by_type(self, organization_type: str) -> List[Dict[str, Any]]:
        """Find organizations by their type."""
        matching_organizations = [
            org_data for org_data in self._organizations.values()
            if org_data.get('organization_type') == organization_type
        ]

        self._logger.debug(f"Found {len(matching_organizations)} organizations of type: {organization_type}")
        return matching_organizations


class InMemoryCompetitionRepository(CompetitionRepository):
    """In-memory implementation of CompetitionRepository for development/testing."""

    def __init__(self):
        self._competitions: Dict[str, Dict[str, Any]] = {}
        self._logger = get_application_logger('competition_repository')

    async def create_entity(self, entity_data: Dict[str, Any]) -> str:
        """Create a new competition entity."""
        competition_id = generate_unique_identifier()
        competition_data = {
            **entity_data,
            'competition_id': competition_id,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }

        self._competitions[competition_id] = competition_data
        self._logger.info(f"Created competition with ID: {competition_id}")
        return competition_id

    async def get_entity_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a competition by its ID."""
        competition_data = self._competitions.get(entity_id)
        if competition_data:
            self._logger.debug(f"Retrieved competition: {entity_id}")
        else:
            self._logger.warning(f"Competition not found: {entity_id}")
        return competition_data

    async def update_entity(self, entity_id: str, entity_data: Dict[str, Any]) -> bool:
        """Update an existing competition."""
        if entity_id not in self._competitions:
            self._logger.warning(f"Cannot update non-existent competition: {entity_id}")
            return False

        self._competitions[entity_id].update(entity_data)
        self._competitions[entity_id]['updated_at'] = '2024-01-01T00:00:00Z'
        self._logger.info(f"Updated competition: {entity_id}")
        return True

    async def delete_entity(self, entity_id: str) -> bool:
        """Delete a competition by its ID."""
        if entity_id in self._competitions:
            del self._competitions[entity_id]
            self._logger.info(f"Deleted competition: {entity_id}")
            return True

        self._logger.warning(f"Cannot delete non-existent competition: {entity_id}")
        return False

    async def list_entities(self, filters: Optional[Dict[str, Any]] = None,
                          limit: Optional[int] = None, offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """List competitions with optional filtering and pagination."""
        competitions_list = list(self._competitions.values())

        # Apply filters if provided
        if filters:
            filtered_competitions = []
            for competition_data in competitions_list:
                matches_filters = True
                for filter_key, filter_value in filters.items():
                    if competition_data.get(filter_key) != filter_value:
                        matches_filters = False
                        break
                if matches_filters:
                    filtered_competitions.append(competition_data)
            competitions_list = filtered_competitions

        # Apply pagination
        if offset:
            competitions_list = competitions_list[offset:]
        if limit:
            competitions_list = competitions_list[:limit]

        self._logger.debug(f"Listed {len(competitions_list)} competitions")
        return competitions_list

    async def find_competitions_by_organization(self, organization_id: str) -> List[Dict[str, Any]]:
        """Find competitions belonging to a specific organization."""
        matching_competitions = [
            comp_data for comp_data in self._competitions.values()
            if comp_data.get('organization_id') == organization_id
        ]

        self._logger.debug(f"Found {len(matching_competitions)} competitions for organization: {organization_id}")
        return matching_competitions

    async def find_active_competitions(self) -> List[Dict[str, Any]]:
        """Find all currently active competitions."""
        active_competitions = [
            comp_data for comp_data in self._competitions.values()
            if comp_data.get('competition_status') in ['published', 'in_progress']
        ]

        self._logger.debug(f"Found {len(active_competitions)} active competitions")
        return active_competitions


class InMemoryGameRepository(GameRepository):
    """In-memory implementation of GameRepository for development/testing."""

    def __init__(self):
        self._games: Dict[str, Dict[str, Any]] = {}
        self._logger = get_application_logger('game_repository')

    async def create_entity(self, entity_data: Dict[str, Any]) -> str:
        """Create a new game entity."""
        game_id = generate_unique_identifier()
        game_data = {
            **entity_data,
            'game_id': game_id,
            'game_status': 'scheduled',
            'home_team_score': 0,
            'away_team_score': 0,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }

        self._games[game_id] = game_data
        self._logger.info(f"Created game with ID: {game_id}")
        return game_id

    async def get_entity_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a game by its ID."""
        game_data = self._games.get(entity_id)
        if game_data:
            self._logger.debug(f"Retrieved game: {entity_id}")
        else:
            self._logger.warning(f"Game not found: {entity_id}")
        return game_data

    async def update_entity(self, entity_id: str, entity_data: Dict[str, Any]) -> bool:
        """Update an existing game."""
        if entity_id not in self._games:
            self._logger.warning(f"Cannot update non-existent game: {entity_id}")
            return False

        self._games[entity_id].update(entity_data)
        self._games[entity_id]['updated_at'] = '2024-01-01T00:00:00Z'
        self._logger.info(f"Updated game: {entity_id}")
        return True

    async def delete_entity(self, entity_id: str) -> bool:
        """Delete a game by its ID."""
        if entity_id in self._games:
            del self._games[entity_id]
            self._logger.info(f"Deleted game: {entity_id}")
            return True

        self._logger.warning(f"Cannot delete non-existent game: {entity_id}")
        return False

    async def list_entities(self, filters: Optional[Dict[str, Any]] = None,
                          limit: Optional[int] = None, offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """List games with optional filtering and pagination."""
        games_list = list(self._games.values())

        # Apply filters if provided
        if filters:
            filtered_games = []
            for game_data in games_list:
                matches_filters = True
                for filter_key, filter_value in filters.items():
                    if game_data.get(filter_key) != filter_value:
                        matches_filters = False
                        break
                if matches_filters:
                    filtered_games.append(game_data)
            games_list = filtered_games

        # Apply pagination
        if offset:
            games_list = games_list[offset:]
        if limit:
            games_list = games_list[:limit]

        self._logger.debug(f"Listed {len(games_list)} games")
        return games_list

    async def find_games_by_competition(self, competition_id: str) -> List[Dict[str, Any]]:
        """Find games belonging to a specific competition."""
        matching_games = [
            game_data for game_data in self._games.values()
            if game_data.get('competition_id') == competition_id
        ]

        self._logger.debug(f"Found {len(matching_games)} games for competition: {competition_id}")
        return matching_games

    async def find_games_by_team(self, team_id: str) -> List[Dict[str, Any]]:
        """Find games involving a specific team."""
        matching_games = [
            game_data for game_data in self._games.values()
            if game_data.get('home_team_id') == team_id or game_data.get('away_team_id') == team_id
        ]

        self._logger.debug(f"Found {len(matching_games)} games for team: {team_id}")
        return matching_games

    async def update_game_score(self, game_id: str, home_score: int, away_score: int) -> bool:
        """Update the score of a specific game."""
        if game_id not in self._games:
            self._logger.warning(f"Cannot update score for non-existent game: {game_id}")
            return False

        self._games[game_id]['home_team_score'] = home_score
        self._games[game_id]['away_team_score'] = away_score
        self._games[game_id]['updated_at'] = '2024-01-01T00:00:00Z'

        self._logger.info(f"Updated game score: {game_id} - {home_score}:{away_score}")
        return True


class InMemoryGameEventRepository(GameEventRepository):
    """In-memory implementation of GameEventRepository for development/testing."""

    def __init__(self):
        self._game_events: Dict[str, Dict[str, Any]] = {}
        self._logger = get_application_logger('game_event_repository')

    async def create_entity(self, entity_data: Dict[str, Any]) -> str:
        """Create a new game event entity."""
        event_id = generate_unique_identifier()
        event_data = {
            **entity_data,
            'event_id': event_id,
            'created_at': '2024-01-01T00:00:00Z'
        }

        self._game_events[event_id] = event_data
        self._logger.info(f"Created game event with ID: {event_id}")
        return event_id

    async def get_entity_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a game event by its ID."""
        event_data = self._game_events.get(entity_id)
        if event_data:
            self._logger.debug(f"Retrieved game event: {entity_id}")
        else:
            self._logger.warning(f"Game event not found: {entity_id}")
        return event_data

    async def update_entity(self, entity_id: str, entity_data: Dict[str, Any]) -> bool:
        """Update an existing game event."""
        if entity_id not in self._game_events:
            self._logger.warning(f"Cannot update non-existent game event: {entity_id}")
            return False

        self._game_events[entity_id].update(entity_data)
        self._logger.info(f"Updated game event: {entity_id}")
        return True

    async def delete_entity(self, entity_id: str) -> bool:
        """Delete a game event by its ID."""
        if entity_id in self._game_events:
            del self._game_events[entity_id]
            self._logger.info(f"Deleted game event: {entity_id}")
            return True

        self._logger.warning(f"Cannot delete non-existent game event: {entity_id}")
        return False

    async def list_entities(self, filters: Optional[Dict[str, Any]] = None,
                          limit: Optional[int] = None, offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """List game events with optional filtering and pagination."""
        events_list = list(self._game_events.values())

        # Apply filters if provided
        if filters:
            filtered_events = []
            for event_data in events_list:
                matches_filters = True
                for filter_key, filter_value in filters.items():
                    if event_data.get(filter_key) != filter_value:
                        matches_filters = False
                        break
                if matches_filters:
                    filtered_events.append(event_data)
            events_list = filtered_events

        # Apply pagination
        if offset:
            events_list = events_list[offset:]
        if limit:
            events_list = events_list[:limit]

        self._logger.debug(f"Listed {len(events_list)} game events")
        return events_list

    async def find_events_by_game(self, game_id: str) -> List[Dict[str, Any]]:
        """Find all events for a specific game."""
        matching_events = [
            event_data for event_data in self._game_events.values()
            if event_data.get('game_id') == game_id
        ]

        self._logger.debug(f"Found {len(matching_events)} events for game: {game_id}")
        return matching_events

    async def find_events_by_player(self, player_id: str) -> List[Dict[str, Any]]:
        """Find all events involving a specific player."""
        matching_events = [
            event_data for event_data in self._game_events.values()
            if event_data.get('player_id') == player_id
        ]

        self._logger.debug(f"Found {len(matching_events)} events for player: {player_id}")
        return matching_events


# Factory functions for creating repository instances
def create_organization_repository() -> OrganizationRepository:
    """Create an OrganizationRepository instance."""
    return InMemoryOrganizationRepository()


def create_competition_repository() -> CompetitionRepository:
    """Create a CompetitionRepository instance."""
    return InMemoryCompetitionRepository()


def create_game_repository() -> GameRepository:
    """Create a GameRepository instance."""
    return InMemoryGameRepository()


def create_game_event_repository() -> GameEventRepository:
    """Create a GameEventRepository instance."""
    return InMemoryGameEventRepository()

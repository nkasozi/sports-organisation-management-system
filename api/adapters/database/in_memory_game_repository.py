"""
In-memory game repository implementation for the Sports Organisation Management System.

This module provides an in-memory implementation of GameRepository
for development and testing purposes.
"""

from api.core.domain.repositories import GameRepository
from .common import Dict, Any, List, Optional, get_application_logger, generate_unique_identifier


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

"""
Repository interfaces for the Sports Organisation Management System.

These interfaces define the contracts for data persistence operations
without coupling the core business logic to specific database implementations.
Following the onion architecture pattern, these interfaces are defined in the
core domain and implemented by adapters in the outer layers.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from api.core.domain.entities import (
    Organization, Sport, GameFormat, Competition, Person, Player, Team, Game, GameEvent, PlayerGameAppearance
)


class BaseRepository(ABC):
    """Base repository interface with common CRUD operations."""

    @abstractmethod
    async def create_entity(self, entity_data: Dict[str, Any]) -> str:
        """
        Create a new entity and return its ID.

        Args:
            entity_data: Dictionary containing entity data

        Returns:
            str: The ID of the created entity
        """
        pass

    @abstractmethod
    async def get_entity_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve an entity by its ID.

        Args:
            entity_id: The unique identifier of the entity

        Returns:
            Optional[Dict[str, Any]]: Entity data if found, None otherwise
        """
        pass

    @abstractmethod
    async def update_entity(self, entity_id: str, entity_data: Dict[str, Any]) -> bool:
        """
        Update an existing entity.

        Args:
            entity_id: The unique identifier of the entity
            entity_data: Dictionary containing updated entity data

        Returns:
            bool: True if update was successful, False otherwise
        """
        pass

    @abstractmethod
    async def delete_entity(self, entity_id: str) -> bool:
        """
        Delete an entity by its ID.

        Args:
            entity_id: The unique identifier of the entity

        Returns:
            bool: True if deletion was successful, False otherwise
        """
        pass

    @abstractmethod
    async def list_entities(self, filters: Optional[Dict[str, Any]] = None,
                          limit: Optional[int] = None, offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        List entities with optional filtering and pagination.

        Args:
            filters: Optional dictionary of filter criteria
            limit: Maximum number of entities to return
            offset: Number of entities to skip

        Returns:
            List[Dict[str, Any]]: List of entity data dictionaries
        """
        pass


class OrganizationRepository(BaseRepository):
    """Repository interface for Organization entities."""

    @abstractmethod
    async def find_organizations_by_type(self, organization_type: str) -> List[Dict[str, Any]]:
        """
        Find organizations by their type.

        Args:
            organization_type: The type of organization to search for

        Returns:
            List[Dict[str, Any]]: List of matching organizations
        """
        pass


class SportRepository(BaseRepository):
    """Repository interface for Sport entities."""

    @abstractmethod
    async def find_sport_by_name(self, sport_name: str) -> Optional[Dict[str, Any]]:
        """
        Find a sport by its name.

        Args:
            sport_name: The name of the sport to search for

        Returns:
            Optional[Dict[str, Any]]: Sport data if found, None otherwise
        """
        pass


class CompetitionRepository(BaseRepository):
    """Repository interface for Competition entities."""

    @abstractmethod
    async def find_competitions_by_organization(self, organization_id: str) -> List[Dict[str, Any]]:
        """
        Find competitions belonging to a specific organization.

        Args:
            organization_id: The ID of the organization

        Returns:
            List[Dict[str, Any]]: List of competitions for the organization
        """
        pass

    @abstractmethod
    async def find_active_competitions(self) -> List[Dict[str, Any]]:
        """
        Find all currently active competitions.

        Returns:
            List[Dict[str, Any]]: List of active competitions
        """
        pass


class TeamRepository(BaseRepository):
    """Repository interface for Team entities."""

    @abstractmethod
    async def find_teams_by_organization(self, organization_id: str) -> List[Dict[str, Any]]:
        """
        Find teams belonging to a specific organization.

        Args:
            organization_id: The ID of the organization

        Returns:
            List[Dict[str, Any]]: List of teams for the organization
        """
        pass


class PlayerRepository(BaseRepository):
    """Repository interface for Player entities."""

    @abstractmethod
    async def find_player_by_registration_number(self, registration_number: str) -> Optional[Dict[str, Any]]:
        """
        Find a player by their registration number.

        Args:
            registration_number: The player's registration number

        Returns:
            Optional[Dict[str, Any]]: Player data if found, None otherwise
        """
        pass


class GameRepository(BaseRepository):
    """Repository interface for Game entities."""

    @abstractmethod
    async def find_games_by_competition(self, competition_id: str) -> List[Dict[str, Any]]:
        """
        Find games belonging to a specific competition.

        Args:
            competition_id: The ID of the competition

        Returns:
            List[Dict[str, Any]]: List of games in the competition
        """
        pass

    @abstractmethod
    async def find_games_by_team(self, team_id: str) -> List[Dict[str, Any]]:
        """
        Find games involving a specific team.

        Args:
            team_id: The ID of the team

        Returns:
            List[Dict[str, Any]]: List of games involving the team
        """
        pass

    @abstractmethod
    async def update_game_score(self, game_id: str, home_score: int, away_score: int) -> bool:
        """
        Update the score of a specific game.

        Args:
            game_id: The ID of the game
            home_score: The home team's score
            away_score: The away team's score

        Returns:
            bool: True if update was successful, False otherwise
        """
        pass


class GameEventRepository(BaseRepository):
    """Repository interface for GameEvent entities."""

    @abstractmethod
    async def find_events_by_game(self, game_id: str) -> List[Dict[str, Any]]:
        """
        Find all events for a specific game.

        Args:
            game_id: The ID of the game

        Returns:
            List[Dict[str, Any]]: List of events in the game
        """
        pass

    @abstractmethod
    async def find_events_by_player(self, player_id: str) -> List[Dict[str, Any]]:
        """
        Find all events involving a specific player.

        Args:
            player_id: The ID of the player

        Returns:
            List[Dict[str, Any]]: List of events involving the player
        """
        pass

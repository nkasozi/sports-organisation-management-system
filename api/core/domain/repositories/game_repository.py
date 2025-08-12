"""
Game repository interface for the Sports Organisation Management System.

This module defines the repository interface for Game entities,
providing methods for game-specific data operations.
"""

from typing import List, Dict, Any
from abc import abstractmethod
from .base_repository import BaseRepository


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

"""
Game Management Service for the Sports Organisation Management System.

This service handles all business operations related to games and game events,
including game creation, event recording, and score management.
"""

from typing import Dict, Any
from api.core.domain.repositories import GameRepository, GameEventRepository
from .service_result import ServiceResult


class GameManagementService:
    """Service for managing games and game events."""

    def __init__(self, game_repository: GameRepository, game_event_repository: GameEventRepository):
        self._game_repository = game_repository
        self._game_event_repository = game_event_repository

    async def create_new_game(self, game_data: Dict[str, Any]) -> ServiceResult:
        """
        Create a new game between two teams.

        Args:
            game_data: Dictionary containing game details

        Returns:
            ServiceResult: Result of the operation with game ID or error
        """
        required_fields = ["competition_id", "home_team_id", "away_team_id", "scheduled_datetime"]

        for required_field in required_fields:
            if required_field not in game_data or not game_data[required_field]:
                return ServiceResult(
                    is_successful=False,
                    error_message=f"Required field '{required_field}' is missing or empty",
                    error_code="MISSING_REQUIRED_FIELD"
                )

        # Ensure teams are different
        if game_data["home_team_id"] == game_data["away_team_id"]:
            return ServiceResult(
                is_successful=False,
                error_message="Home team and away team cannot be the same",
                error_code="INVALID_TEAM_ASSIGNMENT"
            )

        try:
            game_id = await self._game_repository.create_entity(game_data)
            return ServiceResult(
                is_successful=True,
                result_data={"game_id": game_id}
            )
        except Exception as exception_details:
            return ServiceResult(
                is_successful=False,
                error_message=f"Failed to create game: {str(exception_details)}",
                error_code="CREATION_FAILED"
            )

    async def record_game_event(self, event_data: Dict[str, Any]) -> ServiceResult:
        """
        Record a new event during a game (goal, card, etc.).

        Args:
            event_data: Dictionary containing event details

        Returns:
            ServiceResult: Result of the operation with event ID or error
        """
        required_fields = ["game_id", "player_id", "team_id", "event_type", "game_minute"]

        for required_field in required_fields:
            if required_field not in event_data or event_data[required_field] is None:
                return ServiceResult(
                    is_successful=False,
                    error_message=f"Required field '{required_field}' is missing",
                    error_code="MISSING_REQUIRED_FIELD"
                )

        try:
            # Record the event
            event_id = await self._game_event_repository.create_entity(event_data)

            # Update game score if it's a goal
            if event_data["event_type"] == "goal":
                await self._update_game_score_after_goal(event_data["game_id"], event_data["team_id"])

            return ServiceResult(
                is_successful=True,
                result_data={"event_id": event_id}
            )
        except Exception as exception_details:
            return ServiceResult(
                is_successful=False,
                error_message=f"Failed to record game event: {str(exception_details)}",
                error_code="EVENT_RECORDING_FAILED"
            )

    async def _update_game_score_after_goal(self, game_id: str, scoring_team_id: str) -> bool:
        """
        Update the game score after a goal is scored.

        Args:
            game_id: ID of the game
            scoring_team_id: ID of the team that scored

        Returns:
            bool: True if update was successful, False otherwise
        """
        try:
            game_details = await self._game_repository.get_entity_by_id(game_id)
            if game_details is None:
                return False

            current_home_score = game_details.get("home_team_score", 0)
            current_away_score = game_details.get("away_team_score", 0)

            if scoring_team_id == game_details["home_team_id"]:
                new_home_score = current_home_score + 1
                new_away_score = current_away_score
            else:
                new_home_score = current_home_score
                new_away_score = current_away_score + 1

            return await self._game_repository.update_game_score(game_id, new_home_score, new_away_score)
        except Exception:
            return False

"""
Use cases for the Sports Organisation Management System.

Use cases represent the business operations that can be performed in the system.
They orchestrate the interaction between entities and repositories to fulfill
specific business requirements while maintaining independence from external concerns.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from api.core.domain.repositories import (
    OrganizationRepository, SportRepository, CompetitionRepository,
    TeamRepository, PlayerRepository, GameRepository, GameEventRepository
)


@dataclass
class UseCaseResult:
    """Standard result structure for use case operations."""
    is_successful: bool
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None


class OrganizationManagementUseCase:
    """Use cases for managing organizations."""

    def __init__(self, organization_repository: OrganizationRepository):
        self._organization_repository = organization_repository

    async def create_new_organization(self, organization_name: str, organization_type: str) -> UseCaseResult:
        """
        Create a new sports organization.

        Args:
            organization_name: Name of the organization
            organization_type: Type of organization (league, club, etc.)

        Returns:
            UseCaseResult: Result of the operation with organization ID or error
        """
        if not organization_name or not organization_name.strip():
            return UseCaseResult(
                is_successful=False,
                error_message="Organization name cannot be empty",
                error_code="INVALID_NAME"
            )

        organization_data = {
            "organization_name": organization_name.strip(),
            "organization_type": organization_type,
            "is_active": True
        }

        try:
            organization_id = await self._organization_repository.create_entity(organization_data)
            return UseCaseResult(
                is_successful=True,
                result_data={"organization_id": organization_id}
            )
        except Exception as exception_details:
            return UseCaseResult(
                is_successful=False,
                error_message=f"Failed to create organization: {str(exception_details)}",
                error_code="CREATION_FAILED"
            )

    async def get_organization_details(self, organization_id: str) -> UseCaseResult:
        """
        Retrieve details of a specific organization.

        Args:
            organization_id: Unique identifier of the organization

        Returns:
            UseCaseResult: Result containing organization details or error
        """
        if not organization_id or not organization_id.strip():
            return UseCaseResult(
                is_successful=False,
                error_message="Organization ID cannot be empty",
                error_code="INVALID_ID"
            )

        try:
            organization_data = await self._organization_repository.get_entity_by_id(organization_id)
            if organization_data is None:
                return UseCaseResult(
                    is_successful=False,
                    error_message="Organization not found",
                    error_code="NOT_FOUND"
                )

            return UseCaseResult(
                is_successful=True,
                result_data=organization_data
            )
        except Exception as exception_details:
            return UseCaseResult(
                is_successful=False,
                error_message=f"Failed to retrieve organization: {str(exception_details)}",
                error_code="RETRIEVAL_FAILED"
            )

    async def list_organizations_by_type(self, organization_type: str) -> UseCaseResult:
        """
        List all organizations of a specific type.

        Args:
            organization_type: Type of organizations to retrieve

        Returns:
            UseCaseResult: Result containing list of organizations or error
        """
        try:
            organizations_list = await self._organization_repository.find_organizations_by_type(organization_type)
            return UseCaseResult(
                is_successful=True,
                result_data={"organizations": organizations_list}
            )
        except Exception as exception_details:
            return UseCaseResult(
                is_successful=False,
                error_message=f"Failed to list organizations: {str(exception_details)}",
                error_code="LISTING_FAILED"
            )


class CompetitionManagementUseCase:
    """Use cases for managing competitions."""

    def __init__(self, competition_repository: CompetitionRepository,
                 organization_repository: OrganizationRepository):
        self._competition_repository = competition_repository
        self._organization_repository = organization_repository

    async def create_new_competition(self, competition_data: Dict[str, Any]) -> UseCaseResult:
        """
        Create a new competition within an organization.

        Args:
            competition_data: Dictionary containing competition details

        Returns:
            UseCaseResult: Result of the operation with competition ID or error
        """
        required_fields = ["competition_name", "organization_id", "sport_id", "competition_type"]

        for required_field in required_fields:
            if required_field not in competition_data or not competition_data[required_field]:
                return UseCaseResult(
                    is_successful=False,
                    error_message=f"Required field '{required_field}' is missing or empty",
                    error_code="MISSING_REQUIRED_FIELD"
                )

        # Verify organization exists
        organization_exists = await self._organization_repository.get_entity_by_id(
            competition_data["organization_id"]
        )
        if organization_exists is None:
            return UseCaseResult(
                is_successful=False,
                error_message="Organization not found",
                error_code="ORGANIZATION_NOT_FOUND"
            )

        try:
            competition_id = await self._competition_repository.create_entity(competition_data)
            return UseCaseResult(
                is_successful=True,
                result_data={"competition_id": competition_id}
            )
        except Exception as exception_details:
            return UseCaseResult(
                is_successful=False,
                error_message=f"Failed to create competition: {str(exception_details)}",
                error_code="CREATION_FAILED"
            )

    async def get_competitions_for_organization(self, organization_id: str) -> UseCaseResult:
        """
        Retrieve all competitions for a specific organization.

        Args:
            organization_id: ID of the organization

        Returns:
            UseCaseResult: Result containing list of competitions or error
        """
        if not organization_id or not organization_id.strip():
            return UseCaseResult(
                is_successful=False,
                error_message="Organization ID cannot be empty",
                error_code="INVALID_ID"
            )

        try:
            competitions_list = await self._competition_repository.find_competitions_by_organization(organization_id)
            return UseCaseResult(
                is_successful=True,
                result_data={"competitions": competitions_list}
            )
        except Exception as exception_details:
            return UseCaseResult(
                is_successful=False,
                error_message=f"Failed to retrieve competitions: {str(exception_details)}",
                error_code="RETRIEVAL_FAILED"
            )


class GameManagementUseCase:
    """Use cases for managing games and game events."""

    def __init__(self, game_repository: GameRepository, game_event_repository: GameEventRepository):
        self._game_repository = game_repository
        self._game_event_repository = game_event_repository

    async def create_new_game(self, game_data: Dict[str, Any]) -> UseCaseResult:
        """
        Create a new game between two teams.

        Args:
            game_data: Dictionary containing game details

        Returns:
            UseCaseResult: Result of the operation with game ID or error
        """
        required_fields = ["competition_id", "home_team_id", "away_team_id", "scheduled_datetime"]

        for required_field in required_fields:
            if required_field not in game_data or not game_data[required_field]:
                return UseCaseResult(
                    is_successful=False,
                    error_message=f"Required field '{required_field}' is missing or empty",
                    error_code="MISSING_REQUIRED_FIELD"
                )

        # Ensure teams are different
        if game_data["home_team_id"] == game_data["away_team_id"]:
            return UseCaseResult(
                is_successful=False,
                error_message="Home team and away team cannot be the same",
                error_code="INVALID_TEAM_ASSIGNMENT"
            )

        try:
            game_id = await self._game_repository.create_entity(game_data)
            return UseCaseResult(
                is_successful=True,
                result_data={"game_id": game_id}
            )
        except Exception as exception_details:
            return UseCaseResult(
                is_successful=False,
                error_message=f"Failed to create game: {str(exception_details)}",
                error_code="CREATION_FAILED"
            )

    async def record_game_event(self, event_data: Dict[str, Any]) -> UseCaseResult:
        """
        Record a new event during a game (goal, card, etc.).

        Args:
            event_data: Dictionary containing event details

        Returns:
            UseCaseResult: Result of the operation with event ID or error
        """
        required_fields = ["game_id", "player_id", "team_id", "event_type", "game_minute"]

        for required_field in required_fields:
            if required_field not in event_data or event_data[required_field] is None:
                return UseCaseResult(
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

            return UseCaseResult(
                is_successful=True,
                result_data={"event_id": event_id}
            )
        except Exception as exception_details:
            return UseCaseResult(
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

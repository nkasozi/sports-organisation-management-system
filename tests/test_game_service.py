"""
Unit tests for the Game Management Service.

This module tests the business logic for managing games
using mocked repository dependencies.
"""

import pytest
from unittest.mock import Mock
from datetime import datetime
from api.core.services import GameManagementService, ServiceResult
from api.core.domain.entities import Game, GameStatus
from tests.conftest import TestDataFactory


class TestGameManagementService:
    """Test cases for the Game Management Service."""

    def test_create_game_successfully_returns_game(self, test_container,
                                                  mock_game_repository,
                                                  mock_competition_repository):
        """Test creating a game returns success result with game data."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        test_competition = TestDataFactory.create_competition()
        mock_competition_repository.add_test_competition(test_competition)

        home_team_name = "Manchester United"
        away_team_name = "Liverpool FC"
        game_venue = "Old Trafford"

        # Act
        create_game_result = game_service.create_game(
            competition_id=test_competition.competition_id,
            home_team=home_team_name,
            away_team=away_team_name,
            venue=game_venue
        )

        # Assert
        assert create_game_result.is_success is True
        assert create_game_result.error_message is None
        assert create_game_result.data is not None
        assert create_game_result.data.competition_id == test_competition.competition_id
        assert create_game_result.data.home_team == home_team_name
        assert create_game_result.data.away_team == away_team_name
        assert create_game_result.data.venue == game_venue
        assert create_game_result.data.status == GameStatus.SCHEDULED
        assert create_game_result.data.score_home == 0
        assert create_game_result.data.score_away == 0
        assert mock_competition_repository.get_call_count('get_competition_by_id') == 1
        assert mock_game_repository.get_call_count('create_game') == 1

    def test_create_game_with_non_existent_competition_returns_failure(self, test_container,
                                                                      mock_game_repository):
        """Test creating a game with non-existent competition returns failure."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        non_existent_competition_id = "non-existent-comp"

        # Act
        create_game_result = game_service.create_game(
            competition_id=non_existent_competition_id,
            home_team="Team A",
            away_team="Team B",
            venue="Stadium"
        )

        # Assert
        assert create_game_result.is_success is False
        assert create_game_result.error_message is not None
        assert "competition" in create_game_result.error_message.lower()
        assert "not found" in create_game_result.error_message.lower()
        assert create_game_result.data is None
        assert mock_game_repository.get_call_count('create_game') == 0

    def test_create_game_with_empty_home_team_returns_failure(self, test_container,
                                                             mock_competition_repository):
        """Test creating a game with empty home team returns failure."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        test_competition = TestDataFactory.create_competition()
        mock_competition_repository.add_test_competition(test_competition)

        # Act
        create_game_result = game_service.create_game(
            competition_id=test_competition.competition_id,
            home_team="",
            away_team="Team B",
            venue="Stadium"
        )

        # Assert
        assert create_game_result.is_success is False
        assert create_game_result.error_message is not None
        assert "home team" in create_game_result.error_message.lower()
        assert create_game_result.data is None

    def test_create_game_with_empty_away_team_returns_failure(self, test_container,
                                                             mock_competition_repository):
        """Test creating a game with empty away team returns failure."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        test_competition = TestDataFactory.create_competition()
        mock_competition_repository.add_test_competition(test_competition)

        # Act
        create_game_result = game_service.create_game(
            competition_id=test_competition.competition_id,
            home_team="Team A",
            away_team="",
            venue="Stadium"
        )

        # Assert
        assert create_game_result.is_success is False
        assert create_game_result.error_message is not None
        assert "away team" in create_game_result.error_message.lower()
        assert create_game_result.data is None

    def test_get_game_by_id_when_exists_returns_game(self, test_container, mock_game_repository):
        """Test getting a game by ID when it exists returns the game."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        test_game = TestDataFactory.create_game()
        mock_game_repository.add_test_game(test_game)

        # Act
        get_game_result = game_service.get_game_by_id(test_game.game_id)

        # Assert
        assert get_game_result.is_success is True
        assert get_game_result.error_message is None
        assert get_game_result.data is not None
        assert get_game_result.data.game_id == test_game.game_id
        assert get_game_result.data.home_team == test_game.home_team
        assert get_game_result.data.away_team == test_game.away_team
        assert mock_game_repository.get_call_count('get_game_by_id') == 1

    def test_get_game_by_id_when_not_exists_returns_failure(self, test_container, mock_game_repository):
        """Test getting a game by ID when it doesn't exist returns failure."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        non_existent_game_id = "non-existent-game"

        # Act
        get_game_result = game_service.get_game_by_id(non_existent_game_id)

        # Assert
        assert get_game_result.is_success is False
        assert get_game_result.error_message is not None
        assert "not found" in get_game_result.error_message.lower()
        assert get_game_result.data is None
        assert mock_game_repository.get_call_count('get_game_by_id') == 1

    def test_get_all_games_when_empty_returns_empty_list(self, test_container, mock_game_repository):
        """Test getting all games when repository is empty returns empty list."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)

        # Act
        get_all_games_result = game_service.get_all_games()

        # Assert
        assert get_all_games_result.is_success is True
        assert get_all_games_result.error_message is None
        assert get_all_games_result.data is not None
        assert len(get_all_games_result.data) == 0
        assert mock_game_repository.get_call_count('get_all_games') == 1

    def test_get_all_games_when_has_data_returns_games(self, test_container, mock_game_repository):
        """Test getting all games when repository has data returns all games."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        first_test_game = TestDataFactory.create_game("game-1", "comp-1")
        second_test_game = TestDataFactory.create_game("game-2", "comp-1")

        mock_game_repository.add_test_game(first_test_game)
        mock_game_repository.add_test_game(second_test_game)

        # Act
        get_all_games_result = game_service.get_all_games()

        # Assert
        assert get_all_games_result.is_success is True
        assert get_all_games_result.error_message is None
        assert get_all_games_result.data is not None
        assert len(get_all_games_result.data) == 2

        game_ids = [game.game_id for game in get_all_games_result.data]
        assert first_test_game.game_id in game_ids
        assert second_test_game.game_id in game_ids
        assert mock_game_repository.get_call_count('get_all_games') == 1

    def test_get_games_by_competition_returns_filtered_games(self, test_container, mock_game_repository):
        """Test getting games by competition returns only those games."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        target_competition_id = "target-comp"
        other_competition_id = "other-comp"

        target_game_one = TestDataFactory.create_game("game-1", target_competition_id)
        target_game_two = TestDataFactory.create_game("game-2", target_competition_id)
        other_game = TestDataFactory.create_game("game-3", other_competition_id)

        mock_game_repository.add_test_game(target_game_one)
        mock_game_repository.add_test_game(target_game_two)
        mock_game_repository.add_test_game(other_game)

        # Act
        get_games_by_comp_result = game_service.get_games_by_competition(target_competition_id)

        # Assert
        assert get_games_by_comp_result.is_success is True
        assert get_games_by_comp_result.error_message is None
        assert get_games_by_comp_result.data is not None
        assert len(get_games_by_comp_result.data) == 2

        returned_game_ids = [game.game_id for game in get_games_by_comp_result.data]
        assert target_game_one.game_id in returned_game_ids
        assert target_game_two.game_id in returned_game_ids
        assert other_game.game_id not in returned_game_ids
        assert mock_game_repository.get_call_count('get_games_by_competition') == 1

    def test_update_game_score_when_exists_returns_updated_game(self, test_container,
                                                               mock_game_repository):
        """Test updating game score when it exists returns updated game."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        test_game = TestDataFactory.create_game()
        mock_game_repository.add_test_game(test_game)

        new_home_score = 2
        new_away_score = 1

        # Act
        update_score_result = game_service.update_game_score(
            game_id=test_game.game_id,
            home_score=new_home_score,
            away_score=new_away_score
        )

        # Assert
        assert update_score_result.is_success is True
        assert update_score_result.error_message is None
        assert update_score_result.data is not None
        assert update_score_result.data.game_id == test_game.game_id
        assert update_score_result.data.score_home == new_home_score
        assert update_score_result.data.score_away == new_away_score
        assert mock_game_repository.get_call_count('get_game_by_id') == 1
        assert mock_game_repository.get_call_count('update_game') == 1

    def test_update_game_score_when_not_exists_returns_failure(self, test_container,
                                                              mock_game_repository):
        """Test updating game score when it doesn't exist returns failure."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        non_existent_game_id = "non-existent-game"

        # Act
        update_score_result = game_service.update_game_score(
            game_id=non_existent_game_id,
            home_score=2,
            away_score=1
        )

        # Assert
        assert update_score_result.is_success is False
        assert update_score_result.error_message is not None
        assert "not found" in update_score_result.error_message.lower()
        assert update_score_result.data is None
        assert mock_game_repository.get_call_count('get_game_by_id') == 1
        assert mock_game_repository.get_call_count('update_game') == 0

    def test_update_game_status_when_exists_returns_updated_game(self, test_container,
                                                                mock_game_repository):
        """Test updating game status when it exists returns updated game."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        test_game = TestDataFactory.create_game()
        mock_game_repository.add_test_game(test_game)

        new_game_status = GameStatus.IN_PROGRESS

        # Act
        update_status_result = game_service.update_game_status(
            game_id=test_game.game_id,
            status=new_game_status
        )

        # Assert
        assert update_status_result.is_success is True
        assert update_status_result.error_message is None
        assert update_status_result.data is not None
        assert update_status_result.data.game_id == test_game.game_id
        assert update_status_result.data.status == new_game_status
        assert mock_game_repository.get_call_count('get_game_by_id') == 1
        assert mock_game_repository.get_call_count('update_game') == 1

    def test_delete_game_when_exists_returns_success(self, test_container, mock_game_repository):
        """Test deleting a game when it exists returns success."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        test_game = TestDataFactory.create_game()
        mock_game_repository.add_test_game(test_game)

        # Act
        delete_game_result = game_service.delete_game(test_game.game_id)

        # Assert
        assert delete_game_result.is_success is True
        assert delete_game_result.error_message is None
        assert delete_game_result.data is True
        assert mock_game_repository.get_call_count('get_game_by_id') == 1
        assert mock_game_repository.get_call_count('delete_game') == 1

    def test_delete_game_when_not_exists_returns_failure(self, test_container, mock_game_repository):
        """Test deleting a game when it doesn't exist returns failure."""
        # Arrange
        game_service = test_container.resolve(GameManagementService)
        non_existent_game_id = "non-existent-game"

        # Act
        delete_game_result = game_service.delete_game(non_existent_game_id)

        # Assert
        assert delete_game_result.is_success is False
        assert delete_game_result.error_message is not None
        assert "not found" in delete_game_result.error_message.lower()
        assert delete_game_result.data is None
        assert mock_game_repository.get_call_count('get_game_by_id') == 1
        assert mock_game_repository.get_call_count('delete_game') == 0

"""
In-memory game event repository implementation for the Sports Organisation Management System.

This module provides an in-memory implementation of GameEventRepository
for development and testing purposes.
"""

from api.core.domain.repositories import GameEventRepository
from .common import Dict, Any, List, Optional, get_application_logger, generate_unique_identifier


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

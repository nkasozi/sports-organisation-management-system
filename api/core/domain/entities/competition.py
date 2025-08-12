"""
Competition entity for the Sports Organisation Management System.

This module contains the Competition entity.
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional
from .enums import CompetitionType, CompetitionStatus


@dataclass
class Competition:
    """Represents a sports competition entity."""
    competition_id: str
    organization_id: str
    sport_id: str
    competition_name: str
    competition_type: CompetitionType
    start_date: date
    end_date: date
    competition_status: CompetitionStatus
    registration_deadline: Optional[date] = None
    max_teams: Optional[int] = None

"""
Team entity for the Sports Organisation Management System.

This module contains the Team entity.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Team:
    """Represents a team entity."""
    team_id: str
    organization_id: str
    team_name: str
    creation_date: datetime
    is_active: bool = True
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None

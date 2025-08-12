"""
Person and Player entities for the Sports Organisation Management System.

This module contains the Person and Player entities representing individuals
in the sports management system.
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class Person:
    """Represents a person entity."""
    person_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    email: Optional[str] = None
    phone_number: Optional[str] = None


@dataclass
class Player:
    """Represents a player entity."""
    player_id: str
    person_id: str
    registration_number: str
    registration_date: date
    is_active: bool = True

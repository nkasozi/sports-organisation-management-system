"""
Organization entity for the Sports Organisation Management System.

This module contains the Organization entity and related types.
"""

from dataclasses import dataclass
from datetime import datetime
from .enums import OrganizationType


@dataclass
class Organization:
    """Represents a sports organization entity."""
    organization_id: str
    organization_name: str
    organization_type: OrganizationType
    creation_date: datetime
    is_active: bool = True

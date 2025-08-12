"""
Common types and result structures for services in the Sports Organisation Management System.

This module defines shared data structures and types used across all service classes.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional


@dataclass
class ServiceResult:
    """Standard result structure for service operations."""
    is_successful: bool
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None

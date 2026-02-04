"""
Industry-specific generators registry.

Maps industry names to their generator classes.
"""

from typing import TYPE_CHECKING, Optional, Type

if TYPE_CHECKING:
    from ..generator import IndustryGenerator

# Registry of industry generators
_INDUSTRY_REGISTRY: dict[str, Type["IndustryGenerator"]] = {}


def register_industry(name: str):
    """Decorator to register an industry generator."""
    def decorator(cls: Type["IndustryGenerator"]) -> Type["IndustryGenerator"]:
        _INDUSTRY_REGISTRY[name.lower()] = cls
        return cls
    return decorator


def get_industry_generator(industry: str) -> Optional["IndustryGenerator"]:
    """
    Get an industry generator instance by name.
    
    Args:
        industry: Industry name (case-insensitive)
        
    Returns:
        IndustryGenerator instance or None if not found
    """
    cls = _INDUSTRY_REGISTRY.get(industry.lower())
    if cls:
        return cls()
    return None


def list_industries() -> list[str]:
    """List all registered industries."""
    return list(_INDUSTRY_REGISTRY.keys())


# Import industry modules to trigger registration
from . import healthcare
from . import retail
from . import financial

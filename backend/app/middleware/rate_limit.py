"""
Rate Limiting Middleware for Pentesting Routes
Implements rate limiting to prevent abuse of scanning endpoints.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from typing import Callable
import logging

logger = logging.getLogger(__name__)

# Initialize rate limiter
# Uses client IP address for rate limiting
limiter = Limiter(key_func=get_remote_address)


def get_user_id_for_rate_limit(request: Request) -> str:
    """
    Extract user ID from request for user-based rate limiting.
    Falls back to IP address if user info is not available.
    
    This function is used when we want to rate limit per user
    rather than per IP address.
    """
    # Try to get user ID from request state (set by auth dependency)
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"
    
    # Fallback to IP address
    return get_remote_address(request)


# Rate limit configuration for pentesting endpoints
# Allow 10 scans per minute per IP/user
PENTEST_RATE_LIMIT = "10/minute"

# Allow 50 scans per hour per IP/user
PENTEST_HOURLY_LIMIT = "50/hour"


def create_rate_limit_middleware(app):
    """
    Create and configure rate limiting middleware for FastAPI app.
    
    Args:
        app: FastAPI application instance
        
    Returns:
        Configured app with rate limiting
    """
    # Add rate limiter to app state
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    return app


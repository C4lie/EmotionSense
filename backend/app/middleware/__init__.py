"""
app/middleware/__init__.py

Middleware package exports.
"""

from app.middleware.logging import RequestLoggingMiddleware

__all__ = ["RequestLoggingMiddleware"]

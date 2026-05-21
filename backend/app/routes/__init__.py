"""
app/routes/__init__.py

Routes package. Aggregates all routers for clean mounting in main.py.
"""

from app.routes.auth import router as auth_router

__all__ = ["auth_router"]

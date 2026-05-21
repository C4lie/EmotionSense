"""
app/websocket/__init__.py

WebSocket package exports.
"""

from app.websocket.connection import connection_manager

__all__ = ["connection_manager"]

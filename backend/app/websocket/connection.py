"""
app/websocket/connection.py

WebSocket connection manager.

Manages active WebSocket connections in memory. Provides
broadcast and unicast message methods.

This is scaffolded for Phase 7 (Real-Time WebSocket streaming).
The connection manager pattern ensures clean lifecycle management
as user count scales.
"""

import json
from typing import Dict, Optional

from fastapi import WebSocket
from loguru import logger


class ConnectionManager:
    """
    Manages active WebSocket client connections.

    Connections are stored keyed by session_id (UUID string).
    This allows targeted messages to specific sessions.
    """

    def __init__(self) -> None:
        # Dict[session_id, WebSocket]
        self._active_connections: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection and register it."""
        await websocket.accept()
        self._active_connections[session_id] = websocket
        logger.info(f"[WS] Client connected — session_id={session_id}")

    def disconnect(self, session_id: str) -> None:
        """Remove a disconnected WebSocket from the registry."""
        if session_id in self._active_connections:
            del self._active_connections[session_id]
            logger.info(f"[WS] Client disconnected — session_id={session_id}")

    async def send_json(self, session_id: str, data: dict) -> None:
        """Send a JSON payload to a specific session's WebSocket."""
        websocket = self._active_connections.get(session_id)
        if websocket:
            try:
                await websocket.send_text(json.dumps(data))
            except Exception as exc:
                logger.warning(f"[WS] Failed to send to session {session_id}: {exc}")
                self.disconnect(session_id)

    async def send_error(self, session_id: str, message: str) -> None:
        """Send a structured error message to a client."""
        await self.send_json(session_id, {"error": True, "message": message})

    @property
    def active_count(self) -> int:
        """Number of currently active WebSocket connections."""
        return len(self._active_connections)


# Singleton connection manager — shared across the application lifetime
connection_manager = ConnectionManager()

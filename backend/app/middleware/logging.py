"""
app/middleware/logging.py

Request/response logging middleware using Loguru.

Logs every incoming HTTP request with method, URL, status code,
and processing time. This gives us full request tracing without
adding a third-party APM tool in development.
"""

import time
from typing import Callable

from fastapi import Request, Response
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs every HTTP request with:
    - HTTP method and URL
    - Client IP address
    - Response status code
    - Processing duration in milliseconds
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()

        # Process the request
        response = await call_next(request)

        # Calculate processing time
        process_time_ms = (time.perf_counter() - start_time) * 1000

        # Log at appropriate level based on status code
        log_level = "INFO" if response.status_code < 400 else "WARNING"
        if response.status_code >= 500:
            log_level = "ERROR"

        logger.log(
            log_level,
            "{method} {url} -> {status} ({time:.1f}ms) [{client}]",
            method=request.method,
            url=str(request.url.path),
            status=response.status_code,
            time=process_time_ms,
            client=request.client.host if request.client else "unknown",
        )

        # Attach processing time to response headers for debugging
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.1f}"
        return response

from functools import wraps
from flask import request, jsonify, current_app, g
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import threading
from typing import Optional

# Simple in-memory rate limiter (for production, use Redis)
request_counts = defaultdict(list)
# Per-user rate limiting (keyed by user_id)
user_request_counts = defaultdict(list)
lock = threading.Lock()


def _get_client_ip() -> str:
    """Get the real client IP address, handling X-Forwarded-For.

    IMPORTANT: This implementation assumes a trusted reverse proxy configuration
    where the proxy correctly sets X-Forwarded-For. In production, configure
    your reverse proxy to overwrite X-Forwarded-For rather than append to it.

    X-Forwarded-For format: client, proxy1, proxy2, ...
    We take the first IP (original client) assuming trusted proxy setup.
    """
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        # X-Forwarded-For is a comma-separated list: client, proxy1, proxy2, ...
        # Use the first IP (original client) - this assumes trusted proxy
        ips = [ip.strip() for ip in xff.split(",")]
        if ips:
            return ips[0]
    return request.remote_addr or "unknown"


def rate_limit(max_requests: int = 100, window_minutes: int = 15, per_user: bool = False):
    """Rate limiting decorator.

    Args:
        max_requests: Maximum number of requests allowed in the window
        window_minutes: Time window in minutes
        per_user: If True, rate limit per authenticated user instead of IP
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_app.config.get("TESTING"):
                return f(*args, **kwargs)

            now = datetime.now(timezone.utc)
            window_start = now - timedelta(minutes=window_minutes)

            # Choose rate limit key based on per_user flag
            if per_user and hasattr(g, "user_id") and g.user_id:
                rate_key = f"user:{g.user_id}"
                counts_dict = user_request_counts
            else:
                rate_key = _get_client_ip()
                counts_dict = request_counts

            with lock:
                # Clean old requests
                counts_dict[rate_key] = [
                    req_time
                    for req_time in counts_dict[rate_key]
                    if req_time > window_start
                ]

                # Check rate limit
                if len(counts_dict[rate_key]) >= max_requests:
                    return (
                        jsonify(
                            {"error": "Rate limit exceeded. Please try again later."}
                        ),
                        429,
                    )

                # Add current request
                counts_dict[rate_key].append(now)

            return f(*args, **kwargs)

        return decorated_function

    return decorator

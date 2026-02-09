from functools import wraps
from flask import request, jsonify, current_app, g
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import threading
import ipaddress

# Simple in-memory rate limiter (for production, use Redis)
request_counts = defaultdict(list)
# Per-user rate limiting (keyed by user_id)
user_request_counts = defaultdict(list)
lock = threading.Lock()
MAX_TRACKED_KEYS = 10_000
PRUNE_INTERVAL = 250
_requests_since_prune = 0


def _as_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _extract_valid_ip(value: str) -> str | None:
    if not value:
        return None
    candidate = value.strip()
    if not candidate:
        return None

    # Strip optional port for simple host:port forms.
    if candidate.count(":") == 1 and "." in candidate and candidate.rsplit(":", 1)[1].isdigit():
        candidate = candidate.rsplit(":", 1)[0]

    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return None


def _prune_counts_dict(counts_dict, window_start: datetime) -> None:
    stale_keys = []
    for key, timestamps in counts_dict.items():
        trimmed = [t for t in timestamps if t > window_start]
        if trimmed:
            counts_dict[key] = trimmed
        else:
            stale_keys.append(key)

    for key in stale_keys:
        counts_dict.pop(key, None)

    if len(counts_dict) <= MAX_TRACKED_KEYS:
        return

    # Evict least recently used keys first.
    keys_by_recency = sorted(
        counts_dict.items(),
        key=lambda item: item[1][-1] if item[1] else datetime.min.replace(tzinfo=timezone.utc),
    )
    overflow = len(counts_dict) - MAX_TRACKED_KEYS
    for key, _ in keys_by_recency[:overflow]:
        counts_dict.pop(key, None)


def _get_client_ip() -> str:
    """Get the real client IP address, handling X-Forwarded-For.

    IMPORTANT: This implementation assumes a trusted reverse proxy configuration
    where the proxy correctly sets X-Forwarded-For. In production, configure
    your reverse proxy to overwrite X-Forwarded-For rather than append to it.

    X-Forwarded-For format: client, proxy1, proxy2, ...
    We take the first IP (original client) assuming trusted proxy setup.
    """
    trust_proxy = _as_bool(current_app.config.get("TRUST_PROXY_HEADERS", False))
    xff = request.headers.get("X-Forwarded-For")
    if trust_proxy and xff:
        # X-Forwarded-For is a comma-separated list: client, proxy1, proxy2, ...
        # Use the first IP (original client) - this assumes trusted proxy
        ips = [ip.strip() for ip in xff.split(",")]
        if ips:
            forwarded_ip = _extract_valid_ip(ips[0])
            if forwarded_ip:
                return forwarded_ip

    remote_ip = _extract_valid_ip(request.remote_addr or "")
    return remote_ip or "unknown"


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
            global _requests_since_prune

            # Choose rate limit key based on per_user flag
            if per_user and hasattr(g, "user_id") and g.user_id:
                rate_key = f"user:{g.user_id}"
                counts_dict = user_request_counts
            else:
                rate_key = _get_client_ip()
                counts_dict = request_counts

            with lock:
                _requests_since_prune += 1
                if _requests_since_prune >= PRUNE_INTERVAL:
                    _prune_counts_dict(request_counts, window_start)
                    _prune_counts_dict(user_request_counts, window_start)
                    _requests_since_prune = 0

                if rate_key not in counts_dict and len(counts_dict) >= MAX_TRACKED_KEYS:
                    _prune_counts_dict(counts_dict, window_start)

                # Clean old requests for current key
                counts_dict[rate_key] = [req_time for req_time in counts_dict[rate_key] if req_time > window_start]

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

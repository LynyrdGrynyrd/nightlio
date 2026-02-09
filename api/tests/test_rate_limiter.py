"""Tests for the rate limiter utility."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

import pytest
from flask import Flask

from api.utils.rate_limiter import (
    _as_bool,
    _extract_valid_ip,
    _prune_counts_dict,
    rate_limit,
    request_counts,
    user_request_counts,
)


class TestAsBool:
    def test_true_values(self):
        assert _as_bool(True) is True
        assert _as_bool("1") is True
        assert _as_bool("true") is True
        assert _as_bool("True") is True
        assert _as_bool("yes") is True
        assert _as_bool("on") is True

    def test_false_values(self):
        assert _as_bool(False) is False
        assert _as_bool(None) is False
        assert _as_bool("0") is False
        assert _as_bool("false") is False
        assert _as_bool("no") is False
        assert _as_bool("") is False


class TestExtractValidIp:
    def test_valid_ipv4(self):
        assert _extract_valid_ip("192.168.1.1") == "192.168.1.1"
        assert _extract_valid_ip("10.0.0.1") == "10.0.0.1"

    def test_ipv4_with_port(self):
        assert _extract_valid_ip("192.168.1.1:8080") == "192.168.1.1"

    def test_valid_ipv6(self):
        assert _extract_valid_ip("::1") == "::1"

    def test_empty_and_none(self):
        assert _extract_valid_ip("") is None
        assert _extract_valid_ip("   ") is None

    def test_invalid_ip(self):
        assert _extract_valid_ip("not-an-ip") is None
        assert _extract_valid_ip("999.999.999.999") is None


class TestPruneCountsDict:
    def test_removes_stale_entries(self):
        now = datetime.now(timezone.utc)
        old = now - timedelta(minutes=20)
        counts = defaultdict(list)
        counts["stale_ip"] = [old]
        counts["fresh_ip"] = [now]

        window_start = now - timedelta(minutes=15)
        _prune_counts_dict(counts, window_start)

        assert "stale_ip" not in counts
        assert "fresh_ip" in counts
        assert len(counts["fresh_ip"]) == 1

    def test_trims_old_timestamps_from_active_key(self):
        now = datetime.now(timezone.utc)
        old = now - timedelta(minutes=20)
        counts = defaultdict(list)
        counts["ip"] = [old, now]

        window_start = now - timedelta(minutes=15)
        _prune_counts_dict(counts, window_start)

        assert len(counts["ip"]) == 1
        assert counts["ip"][0] == now

    def test_evicts_lru_when_over_max(self):
        now = datetime.now(timezone.utc)
        counts = defaultdict(list)
        # Create more than MAX_TRACKED_KEYS entries
        for i in range(10_001):
            counts[f"ip_{i}"] = [now]

        _prune_counts_dict(counts, now - timedelta(minutes=15))
        assert len(counts) <= 10_000


class TestRateLimitDecorator:
    @pytest.fixture(autouse=True)
    def _clear_counts(self):
        """Clear global rate limiter state between tests."""
        request_counts.clear()
        user_request_counts.clear()
        yield
        request_counts.clear()
        user_request_counts.clear()

    @pytest.fixture
    def app(self):
        app = Flask(__name__)
        app.config["TESTING"] = False

        @app.route("/limited")
        @rate_limit(max_requests=3, window_minutes=1)
        def limited_route():
            return "ok"

        return app

    def test_allows_requests_under_limit(self, app):
        client = app.test_client()
        for _ in range(3):
            resp = client.get("/limited")
            assert resp.status_code == 200

    def test_blocks_requests_over_limit(self, app):
        client = app.test_client()
        for _ in range(3):
            client.get("/limited")

        resp = client.get("/limited")
        assert resp.status_code == 429
        data = resp.get_json()
        assert "Rate limit exceeded" in data["error"]

    def test_testing_mode_skips_limit(self, app):
        app.config["TESTING"] = True
        client = app.test_client()
        for _ in range(10):
            resp = client.get("/limited")
            assert resp.status_code == 200

    def test_xff_header_with_trust_proxy(self):
        app = Flask(__name__)
        app.config["TESTING"] = False
        app.config["TRUST_PROXY_HEADERS"] = True

        @app.route("/limited")
        @rate_limit(max_requests=2, window_minutes=1)
        def limited_route():
            return "ok"

        client = app.test_client()

        # Two different IPs should each get their own limit
        for _ in range(2):
            resp = client.get("/limited", headers={"X-Forwarded-For": "1.2.3.4"})
            assert resp.status_code == 200

        for _ in range(2):
            resp = client.get("/limited", headers={"X-Forwarded-For": "5.6.7.8"})
            assert resp.status_code == 200

        # First IP should now be blocked
        resp = client.get("/limited", headers={"X-Forwarded-For": "1.2.3.4"})
        assert resp.status_code == 429

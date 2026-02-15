"""Tests for the email service layer."""

from unittest.mock import MagicMock

from api.services.email_service import (
    EmailService,
    NullProvider,
    SMTPProvider,
    create_email_service,
)


class TestNullProvider:
    def test_send_returns_false(self):
        provider = NullProvider()
        assert provider.send("a@b.com", "Test", "<h1>Hi</h1>") is False

    def test_send_with_text_body(self):
        provider = NullProvider()
        assert provider.send("a@b.com", "Test", "<h1>Hi</h1>", "plain text") is False


class TestEmailService:
    def test_is_enabled_false_for_null(self):
        svc = EmailService(NullProvider(), "http://localhost", "Test")
        assert svc.is_enabled is False

    def test_is_enabled_true_for_real_provider(self):
        mock_provider = MagicMock()
        svc = EmailService(mock_provider, "http://localhost", "Test")
        assert svc.is_enabled is True

    def test_send_email_delegates_to_provider(self):
        mock_provider = MagicMock()
        mock_provider.send.return_value = True
        svc = EmailService(mock_provider, "http://localhost", "Test")
        result = svc.send_email("user@test.com", "Subject", "<p>Hi</p>")
        assert result is True
        mock_provider.send.assert_called_once_with(
            "user@test.com", "Subject", "<p>Hi</p>", None
        )

    def test_send_password_reset_calls_provider(self):
        mock_provider = MagicMock()
        mock_provider.send.return_value = True
        svc = EmailService(mock_provider, "http://localhost:5173", "Nightlio")
        result = svc.send_password_reset("user@test.com", "abc123", "testuser")
        assert result is True
        mock_provider.send.assert_called_once()
        call_args = mock_provider.send.call_args
        assert call_args[0][0] == "user@test.com"
        assert "Nightlio - Password Reset" in call_args[0][1]
        assert "abc123" in call_args[0][2]  # token in HTML body
        assert "http://localhost:5173/reset-password?token=abc123" in call_args[0][2]

    def test_send_email_verification_calls_provider(self):
        mock_provider = MagicMock()
        mock_provider.send.return_value = True
        svc = EmailService(mock_provider, "http://localhost:5173", "Nightlio")
        result = svc.send_email_verification("user@test.com", "tok456", "testuser")
        assert result is True
        call_args = mock_provider.send.call_args
        assert call_args[0][0] == "user@test.com"
        assert "Verify" in call_args[0][1]
        assert "tok456" in call_args[0][2]

    def test_app_url_trailing_slash_stripped(self):
        mock_provider = MagicMock()
        mock_provider.send.return_value = True
        svc = EmailService(mock_provider, "http://example.com/", "App")
        svc.send_password_reset("user@test.com", "tok", "user")
        html = mock_provider.send.call_args[0][2]
        assert "http://example.com/reset-password" in html
        assert "http://example.com//reset-password" not in html


class TestCreateEmailService:
    def test_none_provider_creates_null(self):
        cfg = MagicMock()
        cfg.EMAIL_PROVIDER = "none"
        cfg.APP_URL = "http://localhost"
        cfg.EMAIL_FROM_NAME = "Test"
        svc = create_email_service(cfg)
        assert not svc.is_enabled

    def test_empty_provider_creates_null(self):
        cfg = MagicMock()
        cfg.EMAIL_PROVIDER = ""
        cfg.APP_URL = "http://localhost"
        cfg.EMAIL_FROM_NAME = "Test"
        svc = create_email_service(cfg)
        assert not svc.is_enabled

    def test_sendgrid_without_key_falls_back_to_null(self):
        cfg = MagicMock()
        cfg.EMAIL_PROVIDER = "sendgrid"
        cfg.EMAIL_API_KEY = None
        cfg.APP_URL = "http://localhost"
        cfg.EMAIL_FROM_NAME = "Test"
        svc = create_email_service(cfg)
        assert not svc.is_enabled

    def test_smtp_without_host_falls_back_to_null(self):
        cfg = MagicMock()
        cfg.EMAIL_PROVIDER = "smtp"
        cfg.SMTP_HOST = None
        cfg.APP_URL = "http://localhost"
        cfg.EMAIL_FROM_NAME = "Test"
        svc = create_email_service(cfg)
        assert not svc.is_enabled

    def test_smtp_with_host_creates_real_provider(self):
        cfg = MagicMock()
        cfg.EMAIL_PROVIDER = "smtp"
        cfg.SMTP_HOST = "smtp.example.com"
        cfg.SMTP_PORT = 587
        cfg.SMTP_USERNAME = "user"
        cfg.SMTP_PASSWORD = "pass"
        cfg.SMTP_USE_TLS = True
        cfg.EMAIL_FROM_ADDRESS = "noreply@example.com"
        cfg.EMAIL_FROM_NAME = "Test"
        cfg.APP_URL = "http://localhost"
        svc = create_email_service(cfg)
        assert svc.is_enabled
        assert isinstance(svc._provider, SMTPProvider)

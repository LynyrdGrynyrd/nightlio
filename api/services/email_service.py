"""Email service with pluggable provider backends (SendGrid, SMTP)."""

from __future__ import annotations

import logging
import smtplib
from abc import ABC, abstractmethod
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Provider abstraction
# ---------------------------------------------------------------------------


class EmailProvider(ABC):
    """Abstract base for email delivery backends."""

    @abstractmethod
    def send(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        """Send an email. Returns True on success, False on failure."""
        ...


class SendGridProvider(EmailProvider):
    """SendGrid API-based email delivery."""

    def __init__(self, api_key: str, from_email: str, from_name: str):
        # Lazy import so the package is only required when this provider is used
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Email

        self._client = SendGridAPIClient(api_key)
        self._from_email = Email(from_email, from_name)

    def send(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        from sendgrid.helpers.mail import Content, Mail, To

        message = Mail(
            from_email=self._from_email,
            to_emails=To(to_email),
            subject=subject,
        )
        message.add_content(Content("text/html", html_body))
        if text_body:
            message.add_content(Content("text/plain", text_body))

        try:
            response = self._client.send(message)
            success = 200 <= response.status_code < 300
            if not success:
                logger.error("SendGrid error: status=%d", response.status_code)
            return success
        except Exception as exc:
            logger.error("SendGrid send failed: %s", exc)
            return False


class SMTPProvider(EmailProvider):
    """Standard SMTP email delivery (Gmail, custom mail servers)."""

    def __init__(
        self,
        host: str,
        port: int,
        username: Optional[str],
        password: Optional[str],
        use_tls: bool,
        from_email: str,
        from_name: str,
    ):
        self._host = host
        self._port = port
        self._username = username
        self._password = password
        self._use_tls = use_tls
        self._from_email = from_email
        self._from_name = from_name

    def send(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self._from_name} <{self._from_email}>"
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        try:
            if self._use_tls:
                server = smtplib.SMTP(self._host, self._port, timeout=30)
                server.ehlo()
                server.starttls()
                server.ehlo()
            else:
                server = smtplib.SMTP(self._host, self._port, timeout=30)
                server.ehlo()

            if self._username and self._password:
                server.login(self._username, self._password)

            server.sendmail(self._from_email, to_email, msg.as_string())
            server.quit()
            return True
        except Exception as exc:
            logger.error("SMTP send failed: %s", exc)
            return False


class NullProvider(EmailProvider):
    """No-op provider when email is disabled. Logs the attempt."""

    def send(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        logger.info(
            "Email sending disabled (NullProvider). Would have sent to=%s subject=%s",
            to_email,
            subject,
        )
        return False


# ---------------------------------------------------------------------------
# High-level service
# ---------------------------------------------------------------------------


class EmailService:
    """High-level email service with convenience methods."""

    def __init__(self, provider: EmailProvider, app_url: str, from_name: str):
        self._provider = provider
        self._app_url = app_url.rstrip("/")
        self._from_name = from_name

    @property
    def is_enabled(self) -> bool:
        """Whether email sending is actually available."""
        return not isinstance(self._provider, NullProvider)

    def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        return self._provider.send(to, subject, html_body, text_body)

    def send_password_reset(self, to: str, token: str, username: str) -> bool:
        reset_url = f"{self._app_url}/reset-password?token={token}"
        subject = f"{self._from_name} - Password Reset"
        html_body = _render_password_reset_html(
            reset_url=reset_url,
            username=username,
            app_name=self._from_name,
        )
        text_body = (
            f"Hi {username},\n\n"
            f"You requested a password reset. Visit this link within 1 hour:\n"
            f"{reset_url}\n\n"
            f"If you didn't request this, you can safely ignore this email.\n"
        )
        return self.send_email(to, subject, html_body, text_body)

    def send_email_verification(self, to: str, token: str, username: str) -> bool:
        verify_url = f"{self._app_url}/verify-email?token={token}"
        subject = f"{self._from_name} - Verify Your Email"
        html_body = _render_email_verification_html(
            verify_url=verify_url,
            username=username,
            app_name=self._from_name,
        )
        text_body = (
            f"Hi {username},\n\n"
            f"Please verify your email by visiting:\n"
            f"{verify_url}\n\n"
        )
        return self.send_email(to, subject, html_body, text_body)


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


def create_email_service(cfg) -> EmailService:
    """Build an EmailService from ConfigData. Called once in app.py."""
    provider_name = getattr(cfg, "EMAIL_PROVIDER", "none") or "none"

    if provider_name == "sendgrid":
        api_key = cfg.EMAIL_API_KEY
        if not api_key:
            logger.warning(
                "EMAIL_PROVIDER=sendgrid but EMAIL_API_KEY is missing; "
                "falling back to NullProvider"
            )
            provider: EmailProvider = NullProvider()
        else:
            try:
                provider = SendGridProvider(
                    api_key, cfg.EMAIL_FROM_ADDRESS, cfg.EMAIL_FROM_NAME
                )
            except Exception as exc:
                logger.warning(
                    "Failed to initialise SendGridProvider (%s); "
                    "falling back to NullProvider",
                    exc,
                )
                provider = NullProvider()
    elif provider_name == "smtp":
        if not cfg.SMTP_HOST:
            logger.warning(
                "EMAIL_PROVIDER=smtp but SMTP_HOST is missing; "
                "falling back to NullProvider"
            )
            provider = NullProvider()
        else:
            provider = SMTPProvider(
                host=cfg.SMTP_HOST,
                port=cfg.SMTP_PORT,
                username=cfg.SMTP_USERNAME,
                password=cfg.SMTP_PASSWORD,
                use_tls=cfg.SMTP_USE_TLS,
                from_email=cfg.EMAIL_FROM_ADDRESS,
                from_name=cfg.EMAIL_FROM_NAME,
            )
    else:
        provider = NullProvider()

    return EmailService(provider, cfg.APP_URL, cfg.EMAIL_FROM_NAME)


# ---------------------------------------------------------------------------
# HTML email templates (inline-styled for max client compatibility)
# ---------------------------------------------------------------------------


def _render_password_reset_html(
    reset_url: str, username: str, app_name: str
) -> str:
    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
        <tr><td>
          <h1 style="color:#333;margin:0 0 20px;">{app_name}</h1>
          <p style="color:#555;font-size:16px;">Hi {username},</p>
          <p style="color:#555;font-size:16px;">
            You requested a password reset. Click the button below to choose a new password.
            This link expires in <strong>1 hour</strong>.
          </p>
          <p style="text-align:center;margin:30px 0;">
            <a href="{reset_url}"
               style="background:#6366f1;color:#fff;padding:12px 32px;
                      border-radius:6px;text-decoration:none;font-size:16px;
                      display:inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color:#999;font-size:13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _render_email_verification_html(
    verify_url: str, username: str, app_name: str
) -> str:
    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
        <tr><td>
          <h1 style="color:#333;margin:0 0 20px;">{app_name}</h1>
          <p style="color:#555;font-size:16px;">Hi {username},</p>
          <p style="color:#555;font-size:16px;">
            Please verify your email address by clicking the button below.
          </p>
          <p style="text-align:center;margin:30px 0;">
            <a href="{verify_url}"
               style="background:#6366f1;color:#fff;padding:12px 32px;
                      border-radius:6px;text-decoration:none;font-size:16px;
                      display:inline-block;">
              Verify Email
            </a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

# Authentication System Documentation

## Overview

Twilightio supports multiple authentication methods:
- **Google OAuth** - Sign in with your Google account
- **Username/Password** - Traditional credentials-based authentication
- **Self-Host Mode** - Single-user local deployment (no authentication)

All authentication methods can coexist, allowing users to choose their preferred login method.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)
- [Password Requirements](#password-requirements)
- [Account Lockout](#account-lockout)
- [Default Admin Account](#default-admin-account)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

---

## Quick Start

### Enable Username/Password Authentication

1. **Set environment variables** in `.env`:
   ```bash
   # Enable Google OAuth (optional, can be disabled)
   ENABLE_GOOGLE_OAUTH=0

   # Enable user registration (optional)
   ENABLE_REGISTRATION=1

   # Set admin password (recommended)
   ADMIN_PASSWORD=YourSecurePassword123!

   # JWT secret (required)
   JWT_SECRET=your-random-secret-key-here
   ```

2. **Start the application**:
   ```bash
   python api/app.py
   ```

3. **Check logs for admin credentials** (if ADMIN_PASSWORD not set):
   ```
   ⚠️  DEFAULT ADMIN ACCOUNT CREATED
   ⚠️  Username: admin
   ⚠️  Password: aB3$kL9@pQrS2xYz
   ⚠️  SAVE THIS PASSWORD - IT WON'T BE SHOWN AGAIN!
   ```

4. **Login** at `/login` with:
   - Username: `admin`
   - Password: (from logs or your `ADMIN_PASSWORD`)

---

## Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ENABLE_GOOGLE_OAUTH` | boolean | `0` | Enable/disable Google OAuth |
| `ENABLE_REGISTRATION` | boolean | `0` | Allow new user registration |
| `ADMIN_PASSWORD` | string | *(generated)* | Default admin account password |
| `JWT_SECRET` | string | *(required)* | Secret key for JWT tokens |
| `GOOGLE_CLIENT_ID` | string | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | string | - | Google OAuth client secret |

### Feature Combinations

#### 1. Username/Password Only (Recommended for self-hosted)
```bash
ENABLE_GOOGLE_OAUTH=0
ENABLE_REGISTRATION=1
ADMIN_PASSWORD=YourPassword123!
```

#### 2. Google OAuth Only
```bash
ENABLE_GOOGLE_OAUTH=1
ENABLE_REGISTRATION=0
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### 3. Both Methods (Maximum flexibility)
```bash
ENABLE_GOOGLE_OAUTH=1
ENABLE_REGISTRATION=1
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
ADMIN_PASSWORD=YourPassword123!
```

#### 4. Self-Host Mode (No authentication)
```bash
ENABLE_GOOGLE_OAUTH=0
ENABLE_REGISTRATION=0
# Uses single default local user
```

---

## Security Features

### ✅ Implemented

#### 1. **Strong Password Requirements**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended (bonus points)

#### 2. **Account Lockout Protection**
- **Threshold**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Window**: Tracks attempts in last 30 minutes
- **Auto-unlock**: Account automatically unlocks after lockout duration
- **Reset on Success**: Successful login resets failed attempt counter

#### 3. **Password Security**
- **Hashing**: Bcrypt with automatic salt generation
- **No Plaintext Storage**: Only password hashes stored in database
- **Username Normalization**: Case-insensitive (prevents Admin vs admin duplicates)

#### 4. **Login Attempt Tracking**
- Records all login attempts (success and failure)
- Logs IP address and user agent
- Automatic cleanup of old records (30+ days)
- Indexed for fast lookups

#### 5. **Token Security**
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiry**: 1 hour (configurable)
- **Stored**: Browser localStorage
- **Transmission**: Bearer token in Authorization header

#### 6. **Input Validation**
- Username: 3-30 characters, alphanumeric + underscores, cannot start with number
- Password: Real-time strength indicator with detailed feedback
- SQL Injection protection: Parameterized queries
- XSS Protection: JSON responses, no HTML rendering

#### 7. **Rate Limiting**
- Login endpoint: 30 requests per minute
- Registration endpoint: 10 requests per minute
- Change password endpoint: 10 requests per minute

### ⏭️ Not Yet Implemented

See [Future Enhancements](#future-enhancements) below.

---

## API Endpoints

### POST /api/auth/register
Register a new user account.

**Requires**: `ENABLE_REGISTRATION=1`

**Request**:
```json
{
  "username": "johndoe",
  "password": "SecurePass123!",
  "email": "john@example.com",  // optional
  "name": "John Doe"             // optional
}
```

**Response (201)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": null
  }
}
```

**Errors**:
- `400`: Validation errors (weak password, invalid username)
- `403`: Registration disabled
- `409`: Username already exists

---

### POST /api/auth/login
Login with username and password.

**Request**:
```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": null
  }
}
```

**Errors**:
- `400`: Missing username or password
- `401`: Invalid credentials
- `429`: Account locked (too many failed attempts)

---

### POST /api/auth/change-password
Change user password (requires authentication).

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewSecurePass123!"
}
```

**Response (200)**:
```json
{
  "message": "Password changed successfully"
}
```

**Errors**:
- `400`: Validation errors, OAuth account (no password)
- `401`: Wrong current password
- `404`: User not found

---

### POST /api/auth/verify
Verify JWT token and get user info.

**Headers**:
```
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": null
  }
}
```

---

## Password Requirements

### Validation Rules

| Requirement | Status | Points |
|-------------|--------|--------|
| Minimum 8 characters | **Required** | +1 |
| Uppercase letter (A-Z) | **Required** | +1 |
| Lowercase letter (a-z) | **Required** | +1 |
| Number (0-9) | **Required** | +1 |
| Special character | Recommended | +1 |
| 12+ characters | Bonus | +1 |

### Strength Levels

- **Score 0-1**: 🔴 Very Weak (rejected)
- **Score 2**: 🟠 Weak (rejected)
- **Score 3**: 🟡 Fair (rejected)
- **Score 4**: 🟢 Strong (accepted)
- **Score 5**: 🟢 Very Strong (accepted)

### Examples

❌ **Rejected**:
- `password` - No uppercase, no numbers
- `Pass123` - Less than 8 characters
- `password123` - No uppercase
- `PASSWORD123` - No lowercase

✅ **Accepted**:
- `Password123` - Meets minimum requirements (Strong)
- `MyP@ssw0rd2024` - Includes special char + long (Very Strong)
- `SecurePass123!` - All requirements + special (Very Strong)

---

## Account Lockout

### How It Works

1. **Track Failed Attempts**: System records each failed login attempt
2. **Count Recent Failures**: Counts consecutive failures in last 30 minutes
3. **Apply Lockout**: After 5 failed attempts, account locks for 15 minutes
4. **Auto-Unlock**: Account automatically unlocks after lockout duration
5. **Reset on Success**: Successful login resets the counter

### Configuration

Edit `api/services/login_attempt_service.py`:

```python
class LoginAttemptService:
    MAX_FAILED_ATTEMPTS = 5          # Lock after N failures
    LOCKOUT_DURATION_MINUTES = 15    # Lock for N minutes
    ATTEMPT_WINDOW_MINUTES = 30      # Track last N minutes
```

### Lockout Response

When locked, API returns HTTP 429:

```json
{
  "error": "Account temporarily locked due to too many failed login attempts. Try again in 12m 34s."
}
```

### Data Retention

- Login attempts older than 30 days are automatically cleaned up
- Cleanup runs at regular intervals (via database maintenance)
- Manual cleanup: Call `login_attempt_service.cleanup_old_attempts(days=30)`

---

## Default Admin Account

### Auto-Generation

On first startup, if no `admin` user exists:

1. **Check environment**: Looks for `ADMIN_PASSWORD` variable
2. **Generate if missing**: Creates random 16-character password
3. **Log to console**: Displays password ONCE in startup logs
4. **Create account**: Creates admin user with generated/provided password

### Security Recommendations

#### ✅ DO:
- Set `ADMIN_PASSWORD` in environment variables
- Use a strong, unique password (16+ characters)
- Change default admin password after first login
- Store password in a password manager

#### ❌ DON'T:
- Rely on auto-generated password in production
- Use `admin/admin` (blocked by current implementation)
- Share admin credentials
- Commit `ADMIN_PASSWORD` to version control

### Changing Admin Password

1. **Login as admin**
2. **Call change-password endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/change-password \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "current_password": "OldAdminPassword",
       "new_password": "NewSecureAdminPass123!"
     }'
   ```

---

## Troubleshooting

### "Account temporarily locked"

**Cause**: Too many failed login attempts (5 in 30 minutes)
**Solution**: Wait 15 minutes, or contact admin to manually clear attempts in database

### "Registration is disabled"

**Cause**: `ENABLE_REGISTRATION=0`
**Solution**: Set `ENABLE_REGISTRATION=1` in `.env` and restart app

### "Cannot change password for OAuth accounts"

**Cause**: User authenticated via Google OAuth (no password set)
**Solution**: OAuth users cannot set passwords; they must use Google sign-in

### "Password does not meet requirements"

**Cause**: Password too weak (less than 8 chars, missing uppercase/lowercase/numbers)
**Solution**: Use password with 8+ characters including uppercase, lowercase, and numbers

### "JWT token expired"

**Cause**: Token older than 1 hour
**Solution**: Login again to get a new token

### "Google OAuth is enabled but GOOGLE_CLIENT_ID is not configured"

**Cause**: `ENABLE_GOOGLE_OAUTH=1` but `GOOGLE_CLIENT_ID` (and usually `GOOGLE_CLIENT_SECRET`) is not set in the runtime environment.
**Solution**: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your deployment `.env` or hosting provider config, then restart the API.

---

## Future Enhancements

These features are documented but require additional implementation:

### 📧 Email-Based Features

#### Password Reset Flow
**Status**: Infrastructure ready, needs email provider

**Requirements**:
- Email service (SendGrid, AWS SES, Mailgun, etc.)
- Email templates
- Reset token generation and validation
- Token expiration (typically 1 hour)

**Implementation**:
1. POST `/api/auth/forgot-password` - Generate reset token, send email
2. POST `/api/auth/reset-password` - Validate token, set new password

#### Email Verification
**Status**: Not implemented

**Requirements**:
- Email service
- Verification token system
- Unverified user restrictions (optional)

**Implementation**:
1. Send verification email on registration
2. POST `/api/auth/verify-email` - Validate token, mark email as verified
3. Add `email_verified` column to users table

### 🔐 Two-Factor Authentication (2FA)
**Status**: Not implemented

**Requirements**:
- TOTP library (pyotp)
- QR code generation
- Backup codes
- SMS provider (optional)

**Implementation**:
1. POST `/api/auth/2fa/enable` - Generate secret, show QR code
2. POST `/api/auth/2fa/verify` - Validate TOTP code
3. Update login flow to require 2FA code
4. Add `totp_secret` and `2fa_enabled` to users table

### 📱 Session Management
**Status**: Partially implemented

**Missing Features**:
- View all active sessions
- Logout from specific device
- Logout from all devices
- Session metadata (device, location, last active)

**Implementation**:
1. Create `sessions` table with device info
2. POST `/api/auth/sessions` - List active sessions
3. DELETE `/api/auth/sessions/<session_id>` - Logout specific session
4. DELETE `/api/auth/sessions` - Logout all devices

### 🔍 Security Audit Log
**Status**: Partially implemented (login attempts only)

**Missing Features**:
- Log password changes
- Log email changes
- Log security setting changes
- Export audit log

**Implementation**:
1. Create `security_audit_log` table
2. GET `/api/auth/audit-log` - View security events
3. Log all security-relevant actions

### 🌐 Social Login Providers
**Status**: Google OAuth implemented

**Missing Providers**:
- GitHub
- Microsoft
- Facebook
- Twitter/X

**Implementation**: Similar to existing Google OAuth flow

---

## Testing

### Run Unit Tests

```bash
# Run all auth tests
pytest api/tests/test_username_password_auth.py -v

# Run specific test
pytest api/tests/test_username_password_auth.py::TestUsernamePasswordAuth::test_login_success -v

# Run with coverage
pytest api/tests/test_username_password_auth.py --cov=api.routes.auth_routes --cov-report=html
```

### Manual Testing

```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!","email":"test@example.com"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!"}'

# Change password (replace <token> with actual JWT)
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"Test123!","new_password":"NewTest123!"}'
```

---

## Security Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Set `ADMIN_PASSWORD` in environment (don't use auto-generated)
- [ ] Enable HTTPS/TLS for all connections
- [ ] Configure `CORS_ORIGINS` to specific domains (not `*`)
- [ ] Review and adjust rate limits if needed
- [ ] Enable account lockout (enabled by default)
- [ ] Set up regular database backups
- [ ] Configure logging and monitoring
- [ ] Review and test authentication flow
- [ ] Document admin credentials securely
- [ ] Consider enabling 2FA (future enhancement)
- [ ] Set up email notifications for security events (future enhancement)

---

## Support

For issues, questions, or contributions:
- GitHub Issues: [Link to your repo]
- Documentation: This file
- Security Issues: Report privately to maintainers

---

**Last Updated**: {{ DATE }}
**Version**: 2.0.0
**Authors**: Claude Code

# Security Audit Residual Risks (2026-02-07, updated 2026-02-08)

This register tracks known findings and closure state after the major hardening wave.

## Resolved In This Wave

1. `gunicorn==21.2.0` (`CVE-2024-1135`, `CVE-2024-6827`)
- Status: resolved by upgrading to `gunicorn==23.0.0`.
- Verification: `pip-audit` no longer reports these advisories.

2. `flask-cors` 4.x line (`CVE-2024-6844`, `CVE-2024-6866`, `CVE-2024-6839`)
- Status: resolved by upgrading to `flask-cors==6.0.2`.
- Verification: `pip-audit` no longer reports these advisories.

## Accepted Residuals

1. `ecdsa` transitive advisory (`CVE-2024-23342`)
- Reason accepted: upstream no-fix advisory.
- Current mitigation: JWT verification path enforces `HS256` decoding and rejects unexpected/unsafe JWT algorithms.
- Owner: `@security-maintainers`
- Next review date: 2026-03-08
- Exit criterion: remove allowlist once a fixed ecdsa release is available and adopted transitively/directly.

## Closure Rule

Residuals are accepted only when:
1. There is no patch/minor fix, or
2. Upgrade is major-only and requires compatibility validation.

All accepted residuals must remain documented with owner and next review date until remediated.

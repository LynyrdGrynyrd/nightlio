# 🛡️ Sentinel Security Journal

This journal documents **critical security learnings** specific to the nightlio codebase.

---

## 2026-01-11 - Missing Media Ownership Authorization

**Vulnerability:** The `DELETE /api/media/<media_id>` endpoint allowed any authenticated user to delete any media file by ID, regardless of ownership.

**Learning:** The code explicitly acknowledged this gap with a TODO comment. Media is linked to entries via `entry_id`, and entries have `user_id`. The ownership chain (media → entry → user) must be verified for all CRUD operations on media.

**Prevention:** For any endpoint handling user-owned resources through indirect relationships (media → entry → user), always verify the full ownership chain before performing destructive operations.

---

## 2026-01-11 - Unauthenticated Static File Serving

**Vulnerability:** The `GET /api/media/<filename>` endpoint served media files without any authentication check.

**Learning:** Static file serving endpoints are easy to overlook during security reviews. Even if files are "just images," they may contain sensitive personal data.

**Prevention:** Default to requiring auth on all endpoints serving user-generated content. Add explicit comments when intentionally leaving endpoints public.

---

## 2026-01-11 - ValueError Exception Leakage

**Vulnerability:** The global `ValueError` error handler returned `str(error)` directly to clients, potentially exposing internal implementation details.

**Learning:** Python `ValueError` messages often contain variable names, file paths, or other implementation details that shouldn't be exposed.

**Prevention:** Always use generic client-facing error messages. Log detailed errors internally for debugging.

---

## 2026-01-11 - Bulk Error Message Leakage Pattern

**Vulnerability:** ~45 instances of `str(e)` in exception handlers exposed raw Python exception messages to API clients across 7 route files.

**Learning:** This pattern spreads virally through copy-paste development. Creating a centralized `secure_error_response()` utility makes it easy to adopt secure patterns consistently.

**Prevention:** 
1. Create a utility function for secure error responses early in the project
2. Use code search (`grep`) to find `str(e)` patterns during security audits
3. Consider adding a linting rule to flag `str(e)` in return statements

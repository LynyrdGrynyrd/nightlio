from __future__ import annotations

import base64
import hashlib
import io
import json
import logging
import threading
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

try:
    from api.database import MoodDatabase
except ImportError:  # pragma: no cover - fallback for running inside api/
    from database import MoodDatabase  # type: ignore

logger = logging.getLogger(__name__)


def _safe_int(value: Any) -> Optional[int]:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


class DaylioImportService:
    """Async Daylio backup import service with in-memory job tracking."""

    def __init__(self, db: MoodDatabase, max_workers: int = 2):
        self.db = db
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="daylio-import")
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def start_import(self, user_id: int, file_bytes: bytes, filename: str, dry_run: bool = False) -> str:
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        initial = {
            "job_id": job_id,
            "user_id": user_id,
            "filename": filename,
            "status": "queued",
            "progress": 0,
            "dry_run": bool(dry_run),
            "stats": {
                "total_entries": 0,
                "processed_entries": 0,
                "imported_entries": 0,
                "skipped_duplicates": 0,
                "created_groups": 0,
                "created_options": 0,
                "failed_entries": 0,
            },
            "errors": [],
            "created_at": now,
            "started_at": None,
            "finished_at": None,
        }
        with self._lock:
            self._jobs[job_id] = initial

        self._executor.submit(self._run_import_job, job_id, user_id, file_bytes, filename, dry_run)
        return job_id

    def get_job(self, job_id: str, user_id: int) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            if int(job.get("user_id", -1)) != int(user_id):
                return None
            # Hide internal ownership field from client.
            sanitized = dict(job)
            sanitized.pop("user_id", None)
            return sanitized

    def _update_job(self, job_id: str, **fields: Any) -> None:
        with self._lock:
            if job_id not in self._jobs:
                return
            self._jobs[job_id].update(fields)

    def _append_error(self, job_id: str, error: Dict[str, Any]) -> None:
        with self._lock:
            if job_id not in self._jobs:
                return
            self._jobs[job_id]["errors"].append(error)

    def _bump_stats(self, job_id: str, **increments: int) -> None:
        with self._lock:
            if job_id not in self._jobs:
                return
            stats = self._jobs[job_id]["stats"]
            for key, value in increments.items():
                stats[key] = int(stats.get(key, 0)) + int(value)

    def _run_import_job(
        self, job_id: str, user_id: int, file_bytes: bytes, filename: str, dry_run: bool
    ) -> None:
        self._update_job(
            job_id,
            status="running",
            started_at=datetime.now(timezone.utc).isoformat(),
            progress=1,
        )
        try:
            payload = self._extract_payload(file_bytes, filename)
            entries = self._extract_entries(payload)
            tag_map = self._extract_tag_map(payload)
            custom_moods = self._extract_custom_moods(payload)

            self._bump_stats(job_id, total_entries=len(entries))

            group_cache, option_cache = self._load_existing_group_state(user_id)
            created_groups = 0
            created_options = 0

            for idx, entry in enumerate(entries):
                try:
                    normalized = self._normalize_entry(entry, custom_moods)
                    if normalized is None:
                        self._bump_stats(job_id, failed_entries=1, processed_entries=1)
                        self._append_error(
                            job_id,
                            {
                                "index": idx,
                                "reason": "Could not parse entry payload",
                            },
                        )
                        continue

                    date_str = normalized["date"]
                    created_at = normalized["created_at"]
                    mood = normalized["mood"]
                    content = normalized["content"]
                    activity_ids = normalized["activity_ids"]
                    explicit_tags = normalized["explicit_tags"]

                    if self._is_duplicate_entry(user_id, created_at, mood, content):
                        self._bump_stats(job_id, skipped_duplicates=1, processed_entries=1)
                        self._update_progress(job_id, idx + 1, len(entries))
                        continue

                    resolved_tags = self._resolve_tags(activity_ids, explicit_tags, tag_map)
                    selected_options: List[int] = []

                    for tag in resolved_tags:
                        group_name = (tag.get("group") or "Activities").strip() or "Activities"
                        option_name = (tag.get("name") or "").strip()
                        if not option_name:
                            continue
                        icon = (tag.get("icon") or "").strip() or None

                        group_key = group_name.lower()
                        group_existed = group_key in group_cache
                        group_id = self._ensure_group(
                            user_id,
                            group_name,
                            group_cache,
                            dry_run,
                        )
                        if group_id is None:
                            continue
                        if not group_existed:
                            created_groups += 1

                        option_key = (group_id, option_name.lower())
                        option_existed = option_key in option_cache
                        option_id = self._ensure_option(
                            group_id,
                            option_name,
                            icon,
                            option_cache,
                            dry_run,
                        )
                        if option_id is None:
                            continue
                        if not option_existed:
                            created_options += 1
                        selected_options.append(option_id)

                    if not dry_run:
                        self.db.add_mood_entry(
                            user_id=user_id,
                            date=date_str,
                            mood=mood,
                            content=content,
                            time=created_at,
                            selected_options=selected_options,
                        )

                    self._bump_stats(job_id, imported_entries=1, processed_entries=1)
                except Exception as exc:  # keep import resilient; collect row error
                    self._bump_stats(job_id, failed_entries=1, processed_entries=1)
                    self._append_error(
                        job_id,
                        {
                            "index": idx,
                            "reason": str(exc),
                        },
                    )
                finally:
                    self._update_progress(job_id, idx + 1, len(entries))

            # Apply created entity counters from this run
            self._bump_stats(job_id, created_groups=created_groups, created_options=created_options)

            self._update_job(
                job_id,
                status="completed",
                progress=100,
                finished_at=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as exc:
            logger.exception("Daylio import job failed: %s", exc)
            self._append_error(job_id, {"index": None, "reason": str(exc)})
            self._update_job(
                job_id,
                status="failed",
                finished_at=datetime.now(timezone.utc).isoformat(),
            )

    def _update_progress(self, job_id: str, processed: int, total: int) -> None:
        if total <= 0:
            self._update_job(job_id, progress=100)
            return
        progress = min(99, max(1, int((processed / total) * 100)))
        self._update_job(job_id, progress=progress)

    def _extract_payload(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        raw_payload = file_bytes
        lower_name = filename.lower()

        if zipfile.is_zipfile(io.BytesIO(file_bytes)) or lower_name.endswith(".zip"):
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as archive:
                names = archive.namelist()
                preferred = next((n for n in names if n.lower().endswith("backup.daylio")), None)
                candidate = preferred or next(
                    (n for n in names if n.lower().endswith(".daylio") or n.lower().endswith(".json")),
                    None,
                )
                if not candidate:
                    raise ValueError("No Daylio backup file found inside ZIP")
                raw_payload = archive.read(candidate)

        text = raw_payload.decode("utf-8", errors="ignore").strip()
        if not text:
            raise ValueError("Empty Daylio payload")

        # Direct JSON payload support
        if text.startswith("{") or text.startswith("["):
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
            raise ValueError("Unsupported Daylio JSON format")

        # Sometimes backup.daylio is base64-encoded JSON.
        # It can be quoted as a JSON string; strip wrappers first.
        cleaned = text.strip().strip('"').strip("'")
        decoded = base64.b64decode(cleaned, validate=False)
        decoded_text = decoded.decode("utf-8", errors="ignore").strip()
        if not decoded_text:
            raise ValueError("Decoded Daylio payload is empty")
        parsed = json.loads(decoded_text)
        if not isinstance(parsed, dict):
            raise ValueError("Unsupported decoded Daylio JSON format")
        return parsed

    @staticmethod
    def _extract_entries(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        candidates = [
            payload.get("dayEntries"),
            payload.get("entries"),
            payload.get("records"),
            payload.get("moodEntries"),
        ]
        for candidate in candidates:
            if isinstance(candidate, list):
                return [item for item in candidate if isinstance(item, dict)]
        return []

    @staticmethod
    def _extract_custom_moods(payload: Dict[str, Any]) -> Dict[str, int]:
        lookup: Dict[str, int] = {}
        custom = payload.get("customMoods")
        if not isinstance(custom, list):
            return lookup
        for mood in custom:
            if not isinstance(mood, dict):
                continue
            mood_id = mood.get("id") or mood.get("uuid")
            if mood_id is None:
                continue
            raw_score = (
                mood.get("score")
                or mood.get("value")
                or mood.get("mood")
                or mood.get("moodLevel")
            )
            normalized = DaylioImportService._normalize_mood(raw_score)
            if normalized is not None:
                lookup[str(mood_id)] = normalized
        return lookup

    @staticmethod
    def _extract_tag_map(payload: Dict[str, Any]) -> Dict[str, Dict[str, str]]:
        tag_map: Dict[str, Dict[str, str]] = {}
        candidates: Iterable[Any] = (
            payload.get("tags"),
            payload.get("activities"),
            payload.get("tagDefinitions"),
        )
        for collection in candidates:
            if not isinstance(collection, list):
                continue
            for tag in collection:
                if not isinstance(tag, dict):
                    continue
                raw_id = tag.get("id") or tag.get("uuid") or tag.get("key")
                if raw_id is None:
                    continue
                name = (
                    tag.get("name")
                    or tag.get("label")
                    or tag.get("title")
                    or tag.get("text")
                    or ""
                )
                if not str(name).strip():
                    continue
                tag_map[str(raw_id)] = {
                    "name": str(name).strip(),
                    "group": str(tag.get("group") or tag.get("category") or "Activities").strip(),
                    "icon": str(tag.get("icon") or tag.get("emoji") or "").strip(),
                }
        return tag_map

    @staticmethod
    def _normalize_timestamp(entry: Dict[str, Any]) -> datetime:
        for key in ("created_at", "createdAt", "timestamp", "datetime", "time", "date"):
            value = entry.get(key)
            if value is None:
                continue

            if isinstance(value, (int, float)):
                ts = float(value)
                if ts > 1e12:
                    ts /= 1000.0
                return datetime.fromtimestamp(ts, tz=timezone.utc)

            if isinstance(value, str):
                text = value.strip()
                # Epoch stored as string
                if text.isdigit():
                    ts = int(text)
                    if ts > 1e12:
                        ts //= 1000
                    return datetime.fromtimestamp(ts, tz=timezone.utc)

                try:
                    return datetime.fromisoformat(text.replace("Z", "+00:00"))
                except ValueError:
                    pass

                for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                    try:
                        return datetime.strptime(text, fmt).replace(tzinfo=timezone.utc)
                    except ValueError:
                        continue

        return datetime.now(tz=timezone.utc)

    @staticmethod
    def _normalize_mood(value: Any) -> Optional[int]:
        if value is None:
            return None
        parsed = _safe_int(value)
        if parsed is None:
            return None
        if 1 <= parsed <= 5:
            return parsed
        if 0 <= parsed <= 4:
            return parsed + 1
        if parsed <= 0:
            return 1
        if parsed > 5:
            return 5
        return None

    def _normalize_entry(
        self, entry: Dict[str, Any], custom_moods: Dict[str, int]
    ) -> Optional[Dict[str, Any]]:
        timestamp = self._normalize_timestamp(entry)
        date_str = timestamp.strftime("%Y-%m-%d")
        created_at = timestamp.isoformat()

        raw_mood = None
        for key in ("mood", "moodValue", "value", "moodLevel"):
            candidate = entry.get(key)
            if candidate is not None:
                raw_mood = candidate
                break

        mood = self._normalize_mood(raw_mood)
        if mood is None:
            mood_id = entry.get("moodId") or entry.get("mood_id")
            if mood_id is not None:
                mood = custom_moods.get(str(mood_id))
        if mood is None:
            mood = 3

        content = (
            entry.get("note")
            or entry.get("notes")
            or entry.get("content")
            or entry.get("text")
            or ""
        )
        content = str(content).strip()

        activity_ids: List[str] = []
        explicit_tags: List[Dict[str, str]] = []
        for key in ("activities", "tags", "activityIds", "tagIds"):
            raw_tags = entry.get(key)
            if raw_tags is None:
                continue
            if isinstance(raw_tags, list):
                for item in raw_tags:
                    if isinstance(item, dict):
                        name = str(item.get("name") or item.get("label") or "").strip()
                        if name:
                            explicit_tags.append(
                                {
                                    "name": name,
                                    "group": str(item.get("group") or item.get("category") or "Activities").strip(),
                                    "icon": str(item.get("icon") or item.get("emoji") or "").strip(),
                                }
                            )
                        item_id = item.get("id") or item.get("uuid")
                        if item_id is not None:
                            activity_ids.append(str(item_id))
                    else:
                        activity_ids.append(str(item))

        return {
            "date": date_str,
            "created_at": created_at,
            "mood": mood,
            "content": content,
            "activity_ids": activity_ids,
            "explicit_tags": explicit_tags,
        }

    @staticmethod
    def _resolve_tags(
        activity_ids: List[str],
        explicit_tags: List[Dict[str, str]],
        tag_map: Dict[str, Dict[str, str]],
    ) -> List[Dict[str, str]]:
        resolved: List[Dict[str, str]] = []
        seen = set()

        for tag in explicit_tags:
            key = (tag.get("group", "").lower(), tag.get("name", "").lower())
            if key in seen:
                continue
            seen.add(key)
            resolved.append(tag)

        for tag_id in activity_ids:
            mapped = tag_map.get(str(tag_id))
            if not mapped:
                continue
            key = (mapped.get("group", "").lower(), mapped.get("name", "").lower())
            if key in seen:
                continue
            seen.add(key)
            resolved.append(mapped)

        return resolved

    def _load_existing_group_state(self, user_id: int) -> Tuple[Dict[str, int], Dict[Tuple[int, str], int]]:
        group_cache: Dict[str, int] = {}
        option_cache: Dict[Tuple[int, str], int] = {}
        groups = self.db.get_groups_for_user(user_id)
        for group in groups:
            group_name = str(group.get("name") or "").strip()
            group_id = _safe_int(group.get("id"))
            if not group_name or group_id is None:
                continue
            group_cache[group_name.lower()] = group_id
            for option in group.get("options", []) or []:
                option_name = str(option.get("name") or "").strip()
                option_id = _safe_int(option.get("id"))
                if option_name and option_id is not None:
                    option_cache[(group_id, option_name.lower())] = option_id
        return group_cache, option_cache

    def _ensure_group(
        self,
        user_id: int,
        group_name: str,
        group_cache: Dict[str, int],
        dry_run: bool,
    ) -> Optional[int]:
        key = group_name.lower()
        existing = group_cache.get(key)
        if existing is not None:
            return existing
        if dry_run:
            temp_group_id = -(len(group_cache) + 1)
            group_cache[key] = temp_group_id
            return temp_group_id
        group_id = self.db.create_group_for_user(user_id, group_name)
        group_cache[key] = group_id
        return group_id

    def _ensure_option(
        self,
        group_id: int,
        option_name: str,
        icon: Optional[str],
        option_cache: Dict[Tuple[int, str], int],
        dry_run: bool,
    ) -> Optional[int]:
        key = (group_id, option_name.lower())
        existing = option_cache.get(key)
        if existing is not None:
            return existing
        if dry_run:
            temp_option_id = -(len(option_cache) + 1)
            option_cache[key] = temp_option_id
            return temp_option_id
        option_id = self.db.create_group_option(group_id, option_name, icon=icon)
        option_cache[key] = option_id
        return option_id

    def _is_duplicate_entry(self, user_id: int, created_at: str, mood: int, content: str) -> bool:
        """Deterministic duplicate check using (created_at, mood, content_hash)."""
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        with self.db._connect() as conn:
            conn.row_factory = None
            rows = conn.execute(
                """
                SELECT content
                  FROM mood_entries
                 WHERE user_id = ? AND created_at = ? AND mood = ?
                """,
                (user_id, created_at, mood),
            ).fetchall()
        for row in rows:
            existing_content = str(row[0] or "")
            existing_hash = hashlib.sha256(existing_content.encode("utf-8")).hexdigest()
            if existing_hash == content_hash:
                return True
        return False

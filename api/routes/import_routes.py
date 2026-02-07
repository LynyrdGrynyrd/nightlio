from __future__ import annotations

from flask import Blueprint, jsonify, request

try:
    from api.utils.auth_middleware import require_auth, get_current_user_id
except ImportError:  # pragma: no cover - fallback for running inside api/
    from utils.auth_middleware import require_auth, get_current_user_id  # type: ignore


def _is_truthy(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def create_import_routes(daylio_import_service):
    bp = Blueprint("imports", __name__)

    @bp.route("/import/daylio", methods=["OPTIONS"])
    def import_daylio_options():
        return ("", 204)

    @bp.route("/import/daylio/<string:job_id>", methods=["OPTIONS"])
    def import_daylio_status_options(job_id: str):  # pragma: no cover - preflight
        _ = job_id
        return ("", 204)

    @bp.route("/import/daylio", methods=["POST"])
    @require_auth
    def import_daylio():
        user_id = get_current_user_id()
        if not isinstance(user_id, int):
            return jsonify({"error": "Unauthorized"}), 401

        upload = request.files.get("file")
        if upload is None:
            return jsonify({"error": "Missing file upload"}), 400
        if not upload.filename:
            return jsonify({"error": "Missing filename"}), 400

        file_bytes = upload.read()
        if not file_bytes:
            return jsonify({"error": "Uploaded file is empty"}), 400

        dry_run = _is_truthy(request.args.get("dry_run")) or _is_truthy(
            request.form.get("dry_run")
        )

        job_id = daylio_import_service.start_import(
            user_id=user_id,
            file_bytes=file_bytes,
            filename=upload.filename,
            dry_run=dry_run,
        )

        return jsonify({"job_id": job_id}), 202

    @bp.route("/import/daylio/<string:job_id>", methods=["GET"])
    @require_auth
    def get_daylio_import_status(job_id: str):
        user_id = get_current_user_id()
        if not isinstance(user_id, int):
            return jsonify({"error": "Unauthorized"}), 401

        job = daylio_import_service.get_job(job_id, user_id)
        if not job:
            return jsonify({"error": "Import job not found"}), 404
        return jsonify(job)

    return bp

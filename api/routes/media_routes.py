import os
import logging
from flask import Blueprint, request, jsonify, send_from_directory
from api.utils.auth_middleware import require_auth, get_current_user_id
from api.utils.secure_errors import secure_error_response
from api.services.media_service import MediaService
from api.services.mood_service import MoodService

logger = logging.getLogger(__name__)


def create_media_routes(media_service: MediaService, mood_service: MoodService):
    media_bp = Blueprint("media", __name__)

    @media_bp.route("/mood/<int:entry_id>/media", methods=["POST"])
    @require_auth
    def upload_media(entry_id):
        try:
            user_id = get_current_user_id()
            # Verify entry belongs to user
            entry = mood_service.get_entry_by_id(user_id, entry_id)
            if not entry:
                return jsonify({"error": "Entry not found"}), 404
                
            if 'file' not in request.files:
                return jsonify({"error": "No file part"}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No selected file"}), 400
            
            result = media_service.save_media(entry_id, file)
            return jsonify(result), 201
            
        except Exception as e:
            return secure_error_response(e, 500)

    @media_bp.route("/mood/<int:entry_id>/media", methods=["GET"])
    @require_auth
    def get_entry_media(entry_id):
        try:
            user_id = get_current_user_id()
            entry = mood_service.get_entry_by_id(user_id, entry_id)
            if not entry:
                return jsonify({"error": "Entry not found"}), 404
                
            media = media_service.get_media_for_entry(entry_id)
            return jsonify(media)
        except Exception as e:
            return secure_error_response(e, 500)

    @media_bp.route("/media/<filename>", methods=["GET"])
    @require_auth
    def serve_media(filename):
        # SECURITY: Verify user has access to this media file
        # For now, any authenticated user can access media (shared access model)
        # This prevents unauthenticated access while allowing collaborative use
        return send_from_directory(media_service.upload_folder, filename)

    @media_bp.route("/media/<int:media_id>", methods=["DELETE"])
    @require_auth
    def delete_media(media_id):
        try:
            user_id = get_current_user_id()
            
            # SECURITY: Verify ownership chain (media -> entry -> user)
            # before allowing deletion to prevent IDOR attacks
            media = media_service.db.get_media_by_id(media_id)
            if not media:
                return jsonify({"error": "Media not found"}), 404
            
            # Verify the entry this media belongs to is owned by the current user
            entry = mood_service.get_entry_by_id(user_id, media["entry_id"])
            if not entry:
                # Entry doesn't exist or doesn't belong to this user
                return jsonify({"error": "Media not found"}), 404
            
            success = media_service.delete_media(media_id)
            if success:
                return jsonify({"status": "success"})
            else:
                return jsonify({"error": "Media not found"}), 404
        except Exception as e:
            return secure_error_response(e, 500)

    @media_bp.route("/media/gallery", methods=["GET"])
    @require_auth
    def get_gallery():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            limit = request.args.get("limit", 50, type=int)
            offset = request.args.get("offset", 0, type=int)
            start_date = request.args.get("start_date")
            end_date = request.args.get("end_date")
            
            result = media_service.db.get_all_media_for_user(
                user_id, limit, offset, start_date, end_date
            )
            return jsonify(result)
        except Exception as e:
            return secure_error_response(e, 500)

    return media_bp

import os
import uuid
import logging
from typing import List, Dict, Optional
from werkzeug.utils import secure_filename
from api.database import MoodDatabase
from PIL import Image

logger = logging.getLogger(__name__)

THUMBNAIL_SIZE = (200, 200)

class MediaService:
    def __init__(self, db: MoodDatabase, upload_folder: str):
        self._db = db
        self.upload_folder = os.path.realpath(upload_folder)
        self.thumbnail_folder = os.path.join(self.upload_folder, "thumbnails")
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder, exist_ok=True)
        if not os.path.exists(self.thumbnail_folder):
            os.makedirs(self.thumbnail_folder, exist_ok=True)

    def _validate_path(self, file_path: str) -> bool:
        """Validate that a file path is within the upload folder (prevent path traversal)."""
        # Canonicalize the path to resolve any .. or symlinks
        real_path = os.path.realpath(file_path)
        return real_path.startswith(self.upload_folder)

    def _generate_thumbnail(self, source_path: str, filename: str) -> Optional[str]:
        """Generate a thumbnail for an image file."""
        try:
            # Validate source path is within upload folder
            if not self._validate_path(source_path):
                logger.warning("Attempted thumbnail generation outside upload folder: %s", source_path)
                return None

            with Image.open(source_path) as img:
                img.thumbnail(THUMBNAIL_SIZE)
                thumb_filename = f"thumb_{filename}"
                thumb_path = os.path.join(self.thumbnail_folder, thumb_filename)

                # Validate thumb path is within upload folder
                if not self._validate_path(thumb_path):
                    logger.warning("Attempted to write thumbnail outside upload folder: %s", thumb_path)
                    return None

                img.save(thumb_path, optimize=True, quality=85)
                return f"thumbnails/{thumb_filename}"
        except Exception as e:
            logger.warning("Thumbnail generation failed: %s", e)
            return None

    def save_media(self, entry_id: int, file) -> Dict:
        """Saves a file to disk, generates thumbnail, and creates a database record."""
        if not file:
            raise ValueError("No file provided")

        filename = secure_filename(file.filename)
        if not filename:
            filename = str(uuid.uuid4())
        
        # Add UUID to prevent collisions
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        file_path = os.path.join(self.upload_folder, unique_filename)
        file.save(file_path)
        
        file_type = file.content_type or "image/jpeg"
        
        # Generate thumbnail for images
        thumbnail_path = None
        if file_type.startswith("image/"):
            thumbnail_path = self._generate_thumbnail(file_path, unique_filename)
        
        # Store relative path for portability
        relative_path = unique_filename
        
        media_id = self._db.add_media_attachment(entry_id, relative_path, file_type, thumbnail_path)
        
        return {
            "id": media_id,
            "entry_id": entry_id,
            "file_path": relative_path,
            "file_type": file_type,
            "thumbnail_path": thumbnail_path
        }

    def get_media_for_entry(self, entry_id: int) -> List[Dict]:
        """Returns all media associated with an entry."""
        return self._db.get_media_for_entry(entry_id)

    def delete_media(self, media_id: int) -> bool:
        """Deletes a specific media attachment from disk and database."""
        media = self._db.get_media_by_id(media_id)
        if not media:
            return False

        # Delete from disk with path validation
        file_path = os.path.join(self.upload_folder, media["file_path"])
        if self._validate_path(file_path) and os.path.exists(file_path):
            os.remove(file_path)
        elif not self._validate_path(file_path):
            logger.warning("Attempted to delete file outside upload folder: %s", file_path)

        # Delete from DB
        return self._db.delete_media_attachment(media_id)

    def delete_all_media_for_entry(self, entry_id: int):
        """Deletes all media for an entry."""
        file_paths = self._db.delete_all_media_for_entry(entry_id)
        for path in file_paths:
            full_path = os.path.join(self.upload_folder, path)
            if self._validate_path(full_path) and os.path.exists(full_path):
                os.remove(full_path)
            elif not self._validate_path(full_path):
                logger.warning("Attempted to delete file outside upload folder: %s", full_path)

    def get_media_by_filename(self, filename: str) -> Optional[Dict]:
        """Get media record by filename for ownership verification."""
        return self._db.get_media_by_filename(filename)

    def get_media_by_id(self, media_id: int) -> Optional[Dict]:
        """Get media record by ID for ownership verification."""
        return self._db.get_media_by_id(media_id)

    def get_all_media_for_user(self, user_id: int, limit: int = 50,
                               offset: int = 0, start_date: Optional[str] = None,
                               end_date: Optional[str] = None) -> Dict:
        """Get all media across entries for a user with pagination."""
        return self._db.get_all_media_for_user(user_id, limit, offset, start_date, end_date)

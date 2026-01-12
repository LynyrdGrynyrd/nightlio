import os
import uuid
from typing import List, Dict, Optional
from werkzeug.utils import secure_filename
from api.database import MoodDatabase
from PIL import Image

THUMBNAIL_SIZE = (200, 200)

class MediaService:
    def __init__(self, db: MoodDatabase, upload_folder: str):
        self.db = db
        self.upload_folder = upload_folder
        self.thumbnail_folder = os.path.join(upload_folder, "thumbnails")
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder, exist_ok=True)
        if not os.path.exists(self.thumbnail_folder):
            os.makedirs(self.thumbnail_folder, exist_ok=True)

    def _generate_thumbnail(self, source_path: str, filename: str) -> Optional[str]:
        """Generate a thumbnail for an image file."""
        try:
            with Image.open(source_path) as img:
                img.thumbnail(THUMBNAIL_SIZE)
                thumb_filename = f"thumb_{filename}"
                thumb_path = os.path.join(self.thumbnail_folder, thumb_filename)
                img.save(thumb_path, optimize=True, quality=85)
                return f"thumbnails/{thumb_filename}"
        except Exception as e:
            print(f"Thumbnail generation failed: {e}")
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
        
        media_id = self.db.add_media_attachment(entry_id, relative_path, file_type, thumbnail_path)
        
        return {
            "id": media_id,
            "entry_id": entry_id,
            "file_path": relative_path,
            "file_type": file_type,
            "thumbnail_path": thumbnail_path
        }

    def get_media_for_entry(self, entry_id: int) -> List[Dict]:
        """Returns all media associated with an entry."""
        return self.db.get_media_for_entry(entry_id)

    def delete_media(self, media_id: int) -> bool:
        """Deletes a specific media attachment from disk and database."""
        media = self.db.get_media_by_id(media_id)
        if not media:
            return False
            
        # Delete from disk
        file_path = os.path.join(self.upload_folder, media["file_path"])
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # Delete from DB
        return self.db.delete_media_attachment(media_id)

    def delete_all_media_for_entry(self, entry_id: int):
        """Deletes all media for an entry."""
        file_paths = self.db.delete_all_media_for_entry(entry_id)
        for path in file_paths:
            full_path = os.path.join(self.upload_folder, path)
            if os.path.exists(full_path):
                os.remove(full_path)

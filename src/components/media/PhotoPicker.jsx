import { useState, useRef } from 'react';
import { Camera, X, ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import './PhotoPicker.css';

const PhotoPicker = ({ existingMedia = [], onFilesSelected, onMediaDeleted }) => {
    const [previews, setPreviews] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Limit to 3 files total (including existing)
        const totalCount = existingMedia.length + selectedFiles.length + files.length;
        if (totalCount > 3) {
            alert("Maximum 3 photos per entry.");
            return;
        }

        const compressedFiles = [];


        for (const file of files) {
            try {
                // Pre-compression preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => [...prev, reader.result]);
                };
                reader.readAsDataURL(file);

                // Compression
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);
                compressedFiles.push(compressedFile);
            } catch (error) {
                console.error("Compression error:", error);
                compressedFiles.push(file); // Fallback to original
            }
        }

        const updatedFiles = [...selectedFiles, ...compressedFiles];
        setSelectedFiles(updatedFiles);
        onFilesSelected(updatedFiles);
    };

    const removeNewPhoto = (index) => {
        const updatedPreviews = previews.filter((_, i) => i !== index);
        const updatedFiles = selectedFiles.filter((_, i) => i !== index);
        setPreviews(updatedPreviews);
        setSelectedFiles(updatedFiles);
        onFilesSelected(updatedFiles);
    };

    const removeExistingPhoto = (mediaId) => {
        if (window.confirm("Remove this photo permanently?")) {
            onMediaDeleted(mediaId);
        }
    };

    return (
        <div className="photo-picker-container">
            <h3 className="section-title"><Camera size={18} /> Photos</h3>

            <div className="photo-grid">
                {/* Existing Photos */}
                {existingMedia.map(media => (
                    <div key={media.id} className="photo-bubble existing">
                        <img src={`/api/media/${media.file_path}`} alt="Attachment" />
                        <button className="remove-btn" onClick={() => removeExistingPhoto(media.id)}>
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {/* New Previews */}
                {previews.map((src, index) => (
                    <div key={index} className="photo-bubble new">
                        <img src={src} alt="Preview" />
                        <button className="remove-btn" onClick={() => removeNewPhoto(index)}>
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {/* Add Button */}
                {(existingMedia.length + selectedFiles.length < 3) && (
                    <button className="add-photo-btn" onClick={() => fileInputRef.current?.click()}>
                        <Plus className="w-5 h-5" />
                        <span>Add</span>
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
            />
        </div>
    );
};

// Simple Plus icon if not imported correctly, but I use lucide
const Plus = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default PhotoPicker;

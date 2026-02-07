import { useState, useRef, ChangeEvent } from 'react';
import { Camera, X, Plus } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { Media } from '../../services/api';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../ui/ToastProvider';

interface PhotoPickerProps {
  existingMedia?: Media[];
  onFilesSelected: (files: File[]) => void;
  onMediaDeleted: (mediaId: number) => void;
}

const PhotoPicker = ({ existingMedia = [], onFilesSelected, onMediaDeleted }: PhotoPickerProps) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<number | null>(null);
  const { show } = useToast();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 3 files total (including existing)
    const totalCount = existingMedia.length + selectedFiles.length + files.length;
    if (totalCount > 3) {
      show("Maximum 3 photos per entry.", "info");
      return;
    }

    setIsCompressing(true);
    const compressedFiles: File[] = [];

    for (const file of files) {
      try {
        // Pre-compression preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
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
    setIsCompressing(false);
  };

  const removeNewPhoto = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const handleRemoveExistingPhoto = (mediaId: number) => {
    setMediaToDelete(mediaId);
    setDeleteConfirmOpen(true);
  };

  const confirmRemovePhoto = () => {
    if (mediaToDelete !== null) {
      onMediaDeleted(mediaToDelete);
      setMediaToDelete(null);
    }
  };

  const canAdd = existingMedia.length + selectedFiles.length < 3;

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
        <Camera size={16} /> Photos
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
          {existingMedia.length + selectedFiles.length}/3
        </Badge>
      </h3>

      <div className="flex flex-wrap gap-4">
        {/* Existing Photos */}
        {existingMedia.map(media => (
          <div key={media.id} className="relative group w-24 h-24 rounded-xl overflow-hidden shadow-sm border bg-muted">
            <img
              src={`/api/media/${media.file_path}`}
              alt="Attachment"
              width={96}
              height={96}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="destructive"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => handleRemoveExistingPhoto(media.id)}
                aria-label="Remove photo"
              >
                <X size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}

        {/* New Previews */}
        {previews.map((src, index) => (
          <div key={index} className="relative group w-24 h-24 rounded-xl overflow-hidden shadow-sm border bg-muted">
            <img
              src={src}
              alt="Preview"
              width={96}
              height={96}
              className={cn("w-full h-full object-cover", isCompressing && "opacity-50 grayscale")}
            />
            {!isCompressing && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => removeNewPhoto(index)}
                  aria-label="Remove photo"
                >
                  <X size={14} aria-hidden="true" />
                </Button>
              </div>
            )}
            {isCompressing && index === previews.length - 1 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[color:color-mix(in_oklab,var(--overlay-foreground),transparent_50%)] border-t-[color:var(--overlay-foreground)] rounded-full animate-spin" />
              </div>
            )}
          </div>
        ))}

        {/* Add Button */}
        {canAdd && (
          <Button
            variant="outline"
            className="w-24 h-24 rounded-xl border-dashed border-2 flex flex-col gap-2 items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-muted/50 p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            aria-label="Add photo"
          >
            <Plus className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs font-medium">Add</span>
          </Button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remove Photo"
        description="Are you sure you want to remove this photo? This action cannot be undone."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmRemovePhoto}
      />
    </div>
  );
};

export default PhotoPicker;

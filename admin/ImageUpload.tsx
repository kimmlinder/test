import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, Image as ImageIcon, Video, Upload } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  acceptVideo?: boolean;
  bucket?: string;
}

const isVideoUrl = (url: string) => {
  return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video');
};

export function ImageUpload({ value, onChange, disabled, acceptVideo = false, bucket = 'product-images' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Validate file type
    if (!isImage && !(acceptVideo && isVideo)) {
      setError(acceptVideo ? 'Please select an image or video file' : 'Please select an image file');
      return;
    }

    // Validate file size (max 50MB for both images and videos)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File must be less than 50MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [acceptVideo, onChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  }, [disabled, uploading, handleFile]);

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  const isVideo = value && isVideoUrl(value);
  const acceptTypes = acceptVideo ? 'image/*,video/mp4,video/webm,video/ogg,video/quicktime' : 'image/*';
  const fileTypes = acceptVideo ? 'PNG, JPG, MP4, WebM up to 50MB' : 'PNG, JPG up to 50MB';

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group">
          <div className="w-full h-40 rounded-lg overflow-hidden bg-secondary/50">
            {isVideo ? (
              <video 
                src={value} 
                className="w-full h-full object-cover"
                controls
                muted
              />
            ) : (
              <img 
                src={value} 
                alt="Media" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            w-full h-40 rounded-lg border-2 border-dashed
            flex flex-col items-center justify-center gap-2
            transition-all cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/10 scale-[1.02]' 
              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
            }
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : isDragging ? (
            <>
              <Upload className="h-8 w-8 text-primary animate-bounce" />
              <p className="text-sm font-medium text-primary">Drop file here</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-secondary flex gap-2">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                {acceptVideo && <Video className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground">{fileTypes}</p>
              </div>
            </>
          )}
        </div>
      )}

      <Input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* URL input as fallback */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">or</span>
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={acceptVideo ? "Paste image/video URL" : "Paste image URL"}
          disabled={disabled || uploading}
          className="flex-1 h-8 text-xs"
        />
      </div>
    </div>
  );
}

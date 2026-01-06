import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, FileArchive, Upload } from 'lucide-react';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  bucket?: string;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export function FileUpload({ 
  value, 
  onChange, 
  disabled, 
  bucket = 'digital-products',
  accept = '.zip,.rar,.pdf,.psd,.ai,.eps,.sketch,.fig',
  maxSizeMB = 100,
  label = 'Digital File'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-');
      const fileName = `${baseName}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Store just the file path (not full URL since bucket is private)
      onChange(data.path);
      setProgress(100);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
    setProgress(0);
  };

  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group p-4 rounded-lg border border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileArchive className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getFileName(value)}</p>
              <p className="text-xs text-muted-foreground">Digital file uploaded</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={`
            w-full p-6 rounded-lg border-2 border-dashed border-border
            flex flex-col items-center justify-center gap-2
            transition-colors cursor-pointer
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-secondary/30'}
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
              {progress > 0 && (
                <div className="w-full max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-secondary">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Upload {label}</p>
                <p className="text-xs text-muted-foreground">
                  ZIP, RAR, PDF, PSD up to {maxSizeMB}MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

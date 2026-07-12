'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void | Promise<void>;
  onUploadFiles?: (files: File[]) => Promise<string[]>;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Shows current image URLs and optional file upload.
 * If `onUploadFiles` is set, files are uploaded immediately and returned URLs merged.
 * Otherwise selected files are ignored until parent handles them (create-then-upload flow).
 */
export function ImageUploader({
  images,
  onChange,
  onUploadFiles,
  multiple = true,
  className,
  disabled,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (files: FileList | null) => {
    if (!files?.length || !onUploadFiles) return;
    setError(null);
    setPending(true);
    try {
      const urls = await onUploadFiles([...files]);
      await onChange(multiple ? [...images, ...urls] : urls.slice(0, 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onRemove = async (url: string) => {
    setError(null);
    setPending(true);
    try {
      await onChange(images.filter((u) => u !== url));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {images.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {images.map((url) => (
            <li
              key={url}
              className="relative size-20 overflow-hidden rounded-(--radius) border border-border bg-brand-blush/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Remove image"
                disabled={disabled || pending}
                onClick={() => void onRemove(url)}
                className="absolute top-1 right-1 rounded-full bg-surface-raised/90 p-0.5 text-status-error"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">No images yet.</p>
      )}

      {onUploadFiles ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="sr-only"
            onChange={(e) => void onPick(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || pending}
            isLoading={pending}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Upload image
          </Button>
        </>
      ) : null}
      {error ? <p className="text-xs text-status-error">{error}</p> : null}
      <p className="text-xs text-text-muted">Images up to 5 MB · image/* only</p>
    </div>
  );
}

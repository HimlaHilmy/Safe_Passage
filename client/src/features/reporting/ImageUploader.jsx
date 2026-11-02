import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Loader2,
  FileText,
} from 'lucide-react';
import Button from '../../components/common/Button';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUploader({
  images = [],
  onImagesChange,
  token,
  apiUrl = 'http://localhost:5000/api',
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Validate a single file for size and mime type
  const validateFile = (file) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Invalid file type "${file.name}". Permitted formats: JPEG, PNG, WebP, GIF.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return `File "${file.name}" exceeds maximum allowed size of 5MB (${sizeMb}MB).`;
    }
    return null;
  };

  // Upload an individual file to backend API
  const uploadFileToBackend = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'safe_passage/incidents');

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${apiUrl}/upload/image`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        return {
          url: data.data.secure_url || data.data.url,
          type: 'image',
          caption: file.name.replace(/\.[^/.]+$/, ''),
          filename: file.name,
          sizeBytes: file.size,
          format: data.data.format || 'webp',
          uploadedAt: new Date(),
        };
      }
      throw new Error(data.message || 'Server upload failed');
    } catch {
      // Client-side fallback: Convert to data URL preview so upload still works offline
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            url: e.target.result,
            type: 'image',
            caption: file.name.replace(/\.[^/.]+$/, ''),
            filename: file.name,
            sizeBytes: file.size,
            format: 'image',
            uploadedAt: new Date(),
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleFiles = async (fileList) => {
    setUploadError(null);
    const files = Array.from(fileList);
    if (files.length === 0) return;

    // Check maximum total images
    if (images.length + files.length > 5) {
      setUploadError('You can attach a maximum of 5 supporting images per incident.');
      return;
    }

    // Validate each file
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }
    }

    setIsUploading(true);
    try {
      const uploadedList = [];
      for (const file of files) {
        const uploaded = await uploadFileToBackend(file);
        uploadedList.push(uploaded);
      }
      onImagesChange([...images, ...uploadedList]);
    } catch (err) {
      setUploadError(`Upload encountered an error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    onImagesChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCaptionChange = (index, newCaption) => {
    const updated = images.map((img, idx) =>
      idx === index ? { ...img, caption: newCaption } : img
    );
    onImagesChange(updated);
  };

  // Quick sample images for demonstration
  const handleAddSampleImage = (categoryType) => {
    const samples = {
      vehicle: {
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
        caption: 'Radiator overheating & roadside warning light',
        filename: 'sample_breakdown.jpg',
      },
      medical: {
        url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        caption: 'First aid treatment kit and prescription medicine',
        filename: 'sample_medical.jpg',
      },
      passport: {
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
        caption: 'Police station report slip and passport photocopy',
        filename: 'sample_document.jpg',
      },
    };

    const chosen = samples[categoryType] || samples.vehicle;
    onImagesChange([
      ...images,
      {
        url: chosen.url,
        type: 'image',
        caption: chosen.caption,
        filename: chosen.filename,
        sizeBytes: 1024 * 350,
        uploadedAt: new Date(),
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-bold text-brand-navy">
            Attach Scene Photos or Documents <span className="text-xs font-normal text-slate-500">(Optional)</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Helps dispatch teams assess vehicle damage, medical symptoms, or property context.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-400">
          {images.length}/5 photos
        </span>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center transition-all duration-200
          ${
            dragActive
              ? 'border-brand-teal bg-teal-50/60 ring-4 ring-brand-teal/20'
              : 'border-slate-300 bg-white hover:bg-slate-50/70 hover:border-slate-400'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="incident-file-input"
          disabled={isUploading || images.length >= 5}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-brand-teal">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <label
              htmlFor="incident-file-input"
              className="text-sm font-bold text-brand-teal hover:underline cursor-pointer"
            >
              Click to browse files
            </label>{' '}
            <span className="text-sm text-slate-600">or drag and drop your images here</span>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports JPEG, PNG, WebP, GIF (Max 5MB each, up to 5 photos)
            </p>
          </div>
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-emergency-red flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Quick Sample Attachments */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-slate-400 font-semibold text-[11px]">Quick Samples:</span>
        <button
          type="button"
          onClick={() => handleAddSampleImage('vehicle')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
        >
          + Breakdown Photo
        </button>
        <button
          type="button"
          onClick={() => handleAddSampleImage('medical')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
        >
          + First Aid Photo
        </button>
        <button
          type="button"
          onClick={() => handleAddSampleImage('passport')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
        >
          + Document Copy
        </button>
      </div>

      {/* Attached Images List Preview */}
      {images.length > 0 && (
        <div className="space-y-3 pt-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Attached Images ({images.length})
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3 shadow-2xs relative group"
              >
                <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                  <img
                    src={img.url}
                    alt={img.caption || 'Incident attachment'}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 bg-brand-navy/80 text-white text-[9px] px-1 font-mono uppercase">
                    {img.format || 'img'}
                  </span>
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="text-xs font-bold text-brand-navy truncate">
                    {img.filename || `Photo ${idx + 1}`}
                  </div>
                  {img.sizeBytes && (
                    <div className="text-[10px] text-slate-400">
                      {(img.sizeBytes / 1024).toFixed(0)} KB
                    </div>
                  )}

                  <input
                    type="text"
                    value={img.caption || ''}
                    onChange={(e) => handleCaptionChange(idx, e.target.value)}
                    placeholder="Add brief caption..."
                    className="mt-1.5 w-full text-xs px-2 py-1 rounded border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-emergency-red hover:bg-red-50 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


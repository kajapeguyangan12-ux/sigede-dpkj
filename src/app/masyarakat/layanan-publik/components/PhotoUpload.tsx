"use client";

import React, { useState, useRef } from 'react';

interface PhotoUploadProps {
  label: string;
  fileType: 'foto_kk' | 'foto_ktp';
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export default function PhotoUpload({ 
  label, 
  fileType, 
  file, 
  previewUrl, 
  onChange,
  disabled = false 
}: PhotoUploadProps) {
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onChange(selectedFile);
    }
    setShowOptions(false);
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
    setShowOptions(false);
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
    setShowOptions(false);
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Preview or Upload Area */}
      {previewUrl || file ? (
        <div className="relative">
          <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-gray-50">
            <img 
              src={previewUrl || (file ? URL.createObjectURL(file) : '')} 
              alt={label}
              className="w-full h-48 object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            disabled={disabled}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-gray-700 font-semibold">Pilih file atau drag & drop</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, JPEG (max 5MB)</p>
              </div>
            </div>
          </button>

          {/* Options Menu */}
          {showOptions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              <button
                type="button"
                onClick={handleCameraClick}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3"
              >
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-800">Ambil Foto</p>
                  <p className="text-xs text-gray-500">Gunakan kamera</p>
                </div>
              </button>
              <button
                type="button"
                onClick={handleGalleryClick}
                className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors flex items-center gap-3 border-t border-gray-200"
              >
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-800">Pilih dari Galeri</p>
                  <p className="text-xs text-gray-500">Pilih foto yang tersimpan</p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">
        💡 Tip: Pastikan foto jelas dan mudah dibaca
      </p>
    </div>
  );
}

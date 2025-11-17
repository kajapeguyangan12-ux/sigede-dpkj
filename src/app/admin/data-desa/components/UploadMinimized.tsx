"use client";
import React from "react";

interface UploadMinimizedProps {
  progress: number;
  stats: {
    processed: number;
    added: number;
    updated: number;
    skipped: number;
  };
  estimatedTime: string;
  paused: boolean;
  onMaximize: () => void;
  onPause: () => void;
  onCancel: () => void;
}

export default function UploadMinimized({
  progress,
  stats,
  estimatedTime,
  paused,
  onMaximize,
  onPause,
  onCancel
}: UploadMinimizedProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-500 w-80 overflow-hidden">
        {/* Header minimized */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-semibold text-sm">Upload Berjalan</span>
          </div>
          <button
            onClick={onMaximize}
            className="text-white hover:bg-white/20 p-1 rounded transition-all"
            title="Maximize"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
        
        {/* Progress content */}
        <div className="p-4 space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span className="font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* Stats mini */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-blue-600 font-semibold">{stats.processed}</div>
              <div className="text-gray-600">Diproses</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-green-600 font-semibold">{stats.added}</div>
              <div className="text-gray-600">Ditambah</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-2">
              <div className="text-orange-600 font-semibold">{stats.updated}</div>
              <div className="text-gray-600">Diperbarui</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-600 font-semibold">{stats.skipped}</div>
              <div className="text-gray-600">Dilewati</div>
            </div>
          </div>
          
          {/* Estimasi waktu */}
          {estimatedTime && (
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Sisa: <strong>{estimatedTime}</strong></span>
            </div>
          )}
          
          {/* Control buttons */}
          <div className="flex gap-2">
            <button
              onClick={onPause}
              className="flex-1 px-3 py-2 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-all"
            >
              {paused ? '▶ Lanjutkan' : '⏸ Jeda'}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-all"
            >
              ✕ Batalkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

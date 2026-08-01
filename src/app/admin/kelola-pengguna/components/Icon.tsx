"use client";
import React from 'react';

export default function Icon({ name, className = 'w-6 h-6' }: { name: string; className?: string }) {
  const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, className } as any;
  switch (name) {
    case 'admin':
      return (
        <svg {...base}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      );
    case 'kepala':
      return (
        <svg {...base}>
          <path d="M12 2l9 6.5v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9L12 2z" />
        </svg>
      );
    case 'user':
      return (
        <svg {...base}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'group':
      return (
        <svg {...base}>
          <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

"use client";
import React from 'react';
import Icon from './Icon';

export type RoleCardType = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
};

export default function RoleCard({ role, onClick }: { role: RoleCardType; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-7 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transform transition-all duration-300 cursor-pointer hover:border-red-200"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
          <Icon name={role.icon || 'user'} className="w-8 h-8 text-red-600" />
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-800 group-hover:text-red-600 transition-colors">{role.title}</div>
          <div className="text-sm text-gray-500 mt-1 group-hover:text-gray-700 transition-colors">{role.description}</div>
        </div>
      </div>
    </button>
  );
}

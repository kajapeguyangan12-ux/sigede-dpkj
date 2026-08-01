"use client";
import React, { useState, useEffect } from 'react';
import userManagementService, { FirestoreUser } from '../lib/userManagementService';
import { getRoleTitle } from '../lib/rolePermissions';

interface UserLoginHelpProps {
  onUserSelect?: (user: FirestoreUser) => void;
}

export default function UserLoginHelp({ onUserSelect }: UserLoginHelpProps) {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Get users with active status
      const allUsers = await userManagementService.getUsersByRole();
      const activeUsers = allUsers.filter(user => user.status === 'active').slice(0, 10); // Limit to 10 users
      setUsers(activeUsers);
    } catch (error) {
      console.error('Error loading users for help:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Lihat ID User yang terdaftar
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">ID User Terdaftar (untuk testing):</h4>
        <button
          onClick={() => setShowHelp(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 mt-2">Memuat data...</p>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          <div className="grid gap-2">
            {users.map((user) => (
              <div
                key={user.uid}
                onClick={() => onUserSelect?.(user)}
                className="p-2 bg-white rounded border hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                    <div className="text-xs text-gray-500">
                      ID: <code className="bg-gray-100 px-1 rounded">{user.uid}</code>
                    </div>
                    <div className="text-xs text-gray-500">
                      Email: <code className="bg-gray-100 px-1 rounded">{user.email}</code>
                    </div>
                    {user.userName && (
                      <div className="text-xs text-gray-500">
                        Username: <code className="bg-gray-100 px-1 rounded">{user.userName}</code>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-blue-600">
                      {getRoleTitle(user.role)}
                    </div>
                    <div className="text-xs text-green-600 capitalize">{user.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Belum ada user aktif yang terdaftar
            </div>
          )}
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500 border-t pt-2">
        <strong>Cara login:</strong> Gunakan salah satu dari ID User, Email, atau Username di atas. 
        Password sementara diabaikan (development mode).
      </div>
    </div>
  );
}
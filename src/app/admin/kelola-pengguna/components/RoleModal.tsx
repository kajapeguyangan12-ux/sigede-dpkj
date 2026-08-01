"use client";
import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { db } from '../../../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

type Role = { id: string; title: string; description?: string; icon?: string };

export default function RoleModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const [users, setUsers] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Try to load users where 'role' field equals role.id
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', role.id));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (mounted) setUsers(docs);
      } catch {
        // If query fails (no rules or missing fields), fallback to empty list
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [role]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 z-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-red-50 flex items-center justify-center">
              <Icon name={role.icon || 'user'} className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{role.title}</h3>
              <p className="text-sm text-gray-500">{role.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-600">Daftar pengguna</label>
          <div className="mt-2 space-y-2">
            {loading && <div className="text-sm text-gray-500">Memuat pengguna...</div>}
            {!loading && users.length === 0 && (
              <div className="text-sm text-gray-500">Tidak ada pengguna terdaftar untuk peran ini.</div>
            )}
            {!loading && users.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 grid place-items-center text-red-600">{(u.displayName || u.email || 'U')[0]}</div>
                  <div>
                    <div className="font-medium text-gray-800">{u.displayName || u.name || u.email}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">Peran: {role.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">Batal</button>
          <button onClick={() => { alert('Perubahan disimpan (simulasi)'); onClose(); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">Simpan Perubahan</button>
        </div>
      </div>
    </div>
  );
}

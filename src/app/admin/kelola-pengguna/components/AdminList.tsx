"use client";
import React, { useEffect, useState, useContext } from 'react';
import { db, auth } from '../../../../lib/firebase';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { AdminContext } from '../../components/AdminContext';

export default function AdminList({ roleId = 'admin' }: { roleId?: string }) {
  const { user } = useContext(AdminContext);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ displayName: '', username: '', phone: '', email: '', password: '', confirmPassword: '', role: roleId });
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', roleId));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (mounted) setUsers(docs);
      } catch {
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [roleId]);

  async function reload() {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', roleId));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(docs);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    setForm({ displayName: '', username: '', phone: '', email: '', password: '', confirmPassword: '', role: roleId });
    setEditing(null);
    setServerError(null);
    setShowForm(true);
  }

  async function handleEdit(u: any) {
    setForm({ displayName: u.displayName || '', username: u.username || '', phone: u.phone || '', email: u.email || '', password: '', confirmPassword: '', role: u.role || roleId });
    setEditing(u);
    setServerError(null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Anda harus login untuk melakukan perubahan');
      return;
    }
    try {
      // Validation: on create require password and confirmation match
      if (!editing) {
        if (!form.password || form.password.length < 6) {
          alert('Password minimal 6 karakter');
          return;
        }
        if (form.password !== form.confirmPassword) {
          alert('Konfirmasi password tidak cocok');
          return;
        }

        // Call server API to create user securely (uses Firebase Admin SDK)
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              displayName: form.displayName,
              username: form.username,
              phone: form.phone,
              email: form.email,
              password: form.password,
              role: form.role || roleId,
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const message = body?.error || 'Gagal membuat pengguna';
            setServerError(message);
            throw new Error(message);
          }
          await reload();
          setShowForm(false);
        } catch (err: any) {
          console.error('create-user api error', err);
          setServerError(err?.message || 'Gagal membuat pengguna');
        }
      } else {
        // Edit existing user doc (do not change auth password here)
        const ref = doc(db, 'users', editing.id);
        await updateDoc(ref, { displayName: form.displayName, username: form.username || '', phone: form.phone || '', email: form.email, role: form.role });
        await reload();
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan');
    }
  }

  async function handleDelete(u: any) {
    if (!user) { alert('Anda harus login untuk melakukan penghapusan'); return; }
    const ok = confirm(`Hapus pengguna ${u.displayName || u.email}?`);
    if (!ok) return;
    try {
      const ref = doc(db, 'users', u.id);
      await deleteDoc(ref);
      await reload();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus pengguna');
    }
  }

  return (
    <div className="relative">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">List User Administrator</h2>

      {loading && <div className="text-sm text-gray-500">Memuat pengguna...</div>}

      {!loading && users.length === 0 && (
        <div className="text-sm text-gray-500">Belum ada user untuk peran ini.</div>
      )}

      <div className="space-y-3">
        <div className="flex justify-end mb-3">
          <button onClick={handleAdd} className="px-4 py-2 rounded-md bg-red-600 text-white">Tambah Pengguna</button>
        </div>
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-4 bg-white border border-gray-100 p-3 rounded-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-md grid place-items-center">{(u.displayName || u.email || 'U')[0]}</div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">{u.displayName || u.email}</div>
              <div className="text-sm text-gray-500">{u.email}</div>
              <div className="text-sm text-gray-500 mt-1">Role: {u.role}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(u)} className="px-3 py-1 rounded-md bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
              <button onClick={() => handleDelete(u)} className="px-3 py-1 rounded-md bg-white border border-red-200 text-sm text-red-600 hover:bg-red-50">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div role="dialog" aria-modal="true" className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">{editing ? 'Edit Pengguna' : 'Tambah Pengguna'}</h3>
            {serverError && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 p-3 rounded">{serverError}</div>
            )}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">User Name</label>
                <input placeholder="Masukkan Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">No. Telp</label>
                <input placeholder="Masukkan No. Telp" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input placeholder="Masukkan Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kata Sandi</label>
                <input placeholder="masukkan Kata Sandi" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" aria-describedby="pwd-help" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Konfirmasi Kata Sandi</label>
                <input placeholder="masukkan Kata Sandi Ulang" type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" aria-describedby="pwd-help" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input value="admin" disabled className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-100 text-gray-600" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-md bg-white border border-gray-200">Batal</button>
                <button type="submit" className="px-3 py-2 rounded-md bg-red-600 text-white">{editing ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button aria-label="Tambah pengguna" onClick={handleAdd} className="fixed right-8 bottom-8 w-14 h-14 rounded-full bg-red-600 text-white shadow-lg grid place-items-center hover:bg-red-700">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>
  );
}

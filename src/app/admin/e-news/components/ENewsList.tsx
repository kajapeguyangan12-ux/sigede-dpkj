"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

interface ENewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt?: string;
}

export default function ENewsList() {
  const [items, setItems] = useState<ENewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "e_news"));
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ENewsItem));
        if (mounted) setItems(docs);
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Hapus E-News ini?")) return;
    try {
      await deleteDoc(doc(db, "e_news", id));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("Gagal menghapus E-News");
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Berita</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <span>Buat E-News</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      {loading ? (
        <div className="text-gray-500">Memuat data...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">Belum ada E-News.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border rounded-lg shadow p-4 flex gap-4 items-center">
              <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="Foto" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-gray-400">Foto</span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">{item.title}</div>
                <div className="text-sm text-gray-500">{item.createdAt || "Tanggal Upload"}</div>
                <div className="text-sm text-gray-700 mt-1">{item.description}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 flex items-center gap-1">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                  Edit
                </button>
                <button onClick={() => handleDelete(item.id)} className="px-3 py-1 rounded bg-red-600 text-white flex items-center gap-1">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6v14h8V6"/><path d="M10 10v6"/><path d="M14 10v6"/></svg>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

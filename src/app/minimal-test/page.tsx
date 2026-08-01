"use client";

import { useEffect, useState } from "react";
import { getPublishedENewsItems } from "@/lib/enewsService";

export default function MinimalTestPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const test = async () => {
      try {
        console.log("🟢 Calling getPublishedENewsItems()...");
        const data = await getPublishedENewsItems();
        console.log("✅ Got data:", data);
        setResult({
          count: data.length,
          berita: data.filter(i => i.jenis === 'berita').length,
          pengumuman: data.filter(i => i.jenis === 'pengumuman').length,
          items: data.slice(0, 5), // Show first 5
        });
      } catch (err) {
        console.error("❌ Error:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    test();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Minimal E-News Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <p><strong>Total Items:</strong> {result.count}</p>
            <p><strong>Berita:</strong> {result.berita}</p>
            <p><strong>Pengumuman:</strong> {result.pengumuman}</p>
          </div>

          {result.items.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Sample Items:</h2>
              {result.items.map((item: any, i: number) => (
                <div key={i} className="bg-gray-100 p-4 rounded border">
                  <p><strong>Type:</strong> {item.jenis}</p>
                  <p><strong>Title:</strong> {item.judul}</p>
                  <p><strong>Date:</strong> {item.tanggal}</p>
                  <p><strong>Image:</strong> {item.gambar}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-200 rounded">
        <p className="text-sm">Check browser console for detailed logs (F12)</p>
      </div>
    </div>
  );
}

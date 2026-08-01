"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching e-news_berita collection...");
        const col1 = await getDocs(collection(db, "e-news_berita"));
        console.log("e-news_berita docs:", col1.size);
        const beritaDocs = col1.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        console.log("Fetching e-news_pengumuman collection...");
        const col2 = await getDocs(collection(db, "e-news_pengumuman"));
        console.log("e-news_pengumuman docs:", col2.size);
        const pengumumanDocs = col2.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        setData({
          berita: beritaDocs,
          pengumuman: pengumumanDocs,
          totalBerita: col1.size,
          totalPengumuman: col2.size,
        });
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-4">Debug E-News Data</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">Berita ({data.totalBerita})</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(data.berita, null, 2)}
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">Pengumuman ({data.totalPengumuman})</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(data.pengumuman, null, 2)}
        </pre>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TestPage() {
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    const test = async () => {
      try {
        addLog("🟢 Starting comprehensive Firestore test...");

        addLog("🟡 Checking e-news_berita collection...");
        const beritaSnap = await getDocs(collection(db, "e-news_berita"));
        addLog(`✅ e-news_berita: ${beritaSnap.size} documents`);
        
        if (beritaSnap.size === 0) {
          addLog("⚠️  No documents in e-news_berita");
        } else {
          beritaSnap.forEach(doc => {
            const d = doc.data();
            addLog(`📄 Doc: ${doc.id}`);
            addLog(`   title: ${d.title || "undefined"}`);
            addLog(`   description: ${d.description?.substring(0, 30) || "undefined"}...`);
            addLog(`   imageUrl: ${d.imageUrl ? "exists" : "empty/undefined"}`);
            addLog(`   createdAt: ${d.createdAt?.toDate?.()?.toISOString() || "undefined"}`);
            addLog(`   All fields: ${JSON.stringify(Object.keys(d))}`);
          });
        }

        addLog("🟡 Checking e-news_pengumuman collection...");
        const pengSnap = await getDocs(collection(db, "e-news_pengumuman"));
        addLog(`✅ e-news_pengumuman: ${pengSnap.size} documents`);
        
        if (pengSnap.size === 0) {
          addLog("⚠️  No documents in e-news_pengumuman");
        } else {
          pengSnap.forEach(doc => {
            const d = doc.data();
            addLog(`📄 Doc: ${doc.id}`);
            addLog(`   title: ${d.title || "undefined"}`);
            addLog(`   description: ${d.description?.substring(0, 30) || "undefined"}...`);
            addLog(`   imageUrl: ${d.imageUrl ? "exists" : "empty/undefined"}`);
            addLog(`   createdAt: ${d.createdAt?.toDate?.()?.toISOString() || "undefined"}`);
            addLog(`   All fields: ${JSON.stringify(Object.keys(d))}`);
          });
        }

        setData({
          berita: beritaSnap.size,
          pengumuman: pengSnap.size,
          total: beritaSnap.size + pengSnap.size,
        });

        addLog("🟢 Test completed!");
      } catch (error) {
        addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        addLog(`Stack: ${error instanceof Error ? error.stack : "N/A"}`);
      }
    };

    test();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">E-News Database Test</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="font-semibold text-blue-900">Summary:</p>
        <p className="text-blue-800">Berita Documents: {data?.berita ?? "Loading..."}</p>
        <p className="text-blue-800">Pengumuman Documents: {data?.pengumuman ?? "Loading..."}</p>
      </div>

      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-auto h-96">
        {logs.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LembagaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/masyarakat/profil-desa/lembaga/kemasyarakatan");
  }, [router]);

  return (
    <main className="min-h-[100svh] bg-red-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-500 text-sm sm:text-base">Memuat...</div>
      </div>
    </main>
  );
}

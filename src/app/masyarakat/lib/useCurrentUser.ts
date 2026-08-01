import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type UserRole =
  | "super_admin"      // Akses penuh sistem dengan wewenang tertinggi
  | "administrator"     // Semua akses panel admin
  | "admin_desa"       // Semua fitur admin kecuali data desa & kelola pengguna
  | "kepala_desa"      // Hanya data desa & layanan publik admin + akses masyarakat
  | "kepala_dusun"     // Hanya pengaduan & layanan publik admin + akses masyarakat
  | "warga_dpkj"       // Full akses masyarakat, tidak bisa akses panel admin
  | "warga_luar_dpkj"  // Terbatas: profil desa, umkm, wisata budaya, e-news
  | "unknown";

export interface CurrentUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  nik?: string; // NIK untuk filtering daerah
}

export function useCurrentUser(): { user: CurrentUser | null; loading: boolean } {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsub = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          role: (data.role as UserRole) || "unknown",
          nik: data.nik || data.idNumber || undefined,
        });
      } catch {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          role: "unknown",
        });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return { user, loading };
}
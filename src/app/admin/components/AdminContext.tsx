"use client";
import React, { createContext, useEffect, useState } from 'react';
import { subscribeToAuthChanges } from '../../../lib/authService';

type AdminContextType = {
  search: string;
  setSearch: (s: string) => void;
  user: unknown | null;
};

export const AdminContext = createContext<AdminContextType>({
  search: '',
  setSearch: () => {},
  user: null,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<unknown | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuthChanges((u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <AdminContext.Provider value={{ search, setSearch, user }}>
      {children}
    </AdminContext.Provider>
  );
}

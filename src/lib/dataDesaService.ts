import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  where,
  limit,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";

export interface DataDesaItem {
  id?: string;
  noKK: string;
  namaLengkap: string;
  nik: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat?: string;
  daerah?: string;
  statusNikah?: string;
  agama?: string;
  sukuBangsa?: string;
  kewarganegaraan?: string;
  pendidikanTerakhir?: string;
  pekerjaan?: string;
  penghasilan?: string;
  golonganDarah?: string;
  shdk?: string;
  desil?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  [key: string]: any; // Untuk mendukung field dinamis
}

export interface DataDesaAreaSummary {
  code: string;
  name: string;
  total: number;
  categories: Record<string, Record<string, number>>;
}

export interface DataDesaPublicSummary {
  total: number;
  categories: Record<string, Record<string, number>>;
  areas: Record<string, DataDesaAreaSummary>;
  updatedAt: Timestamp;
}

const COLLECTION_NAME = "data-desa";
const DATA_DESA_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedDataDesa: DataDesaItem[] | null = null;
let cachedDataDesaAt = 0;
let dataDesaRequest: Promise<DataDesaItem[]> | null = null;

export const invalidateDataDesaCache = () => {
  cachedDataDesa = null;
  cachedDataDesaAt = 0;
  dataDesaRequest = null;
};

// Add new data desa item
export const addDataDesa = async (data: any) => {
  try {
    // Validasi field wajib
    if (!data.noKK || !data.nik || !data.namaLengkap) {
      throw new Error('Field wajib tidak lengkap: noKK, nik, atau namaLengkap');
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    invalidateDataDesaCache();
    
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// Find existing data by NIK
export const findDataDesaByNIK = async (nik: string): Promise<DataDesaItem | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("nik", "==", nik.trim()),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as DataDesaItem;
  } catch (error) {
    console.error("Error finding data desa by NIK:", error);
    throw error;
  }
};

// Add or update data desa item (upsert operation) - Optimized
export const upsertDataDesa = async (data: any) => {
  try {
    // Validasi field wajib
    if (!data.noKK || !data.nik || !data.namaLengkap) {
      throw new Error('Field wajib tidak lengkap: noKK, nik, atau namaLengkap');
    }

    // Check if data already exists by NIK
    const existingData = await findDataDesaByNIK(data.nik);
    
    if (existingData) {
      // Update existing data - merge fields
      const mergedData = {
        ...data,
        updatedAt: Timestamp.now(),
      };
      
      const docRef = doc(db, COLLECTION_NAME, existingData.id!);
      await updateDoc(docRef, mergedData);
      invalidateDataDesaCache();
      return { id: existingData.id, isUpdate: true };
    } else {
      // Add new data
      const newId = await addDataDesa(data);
      return { id: newId, isUpdate: false };
    }
  } catch (error) {
    console.error("Error upserting data desa:", error);
    throw error;
  }
};

// Update data desa item
export const updateDataDesa = async (id: string, data: Partial<Omit<DataDesaItem, "id" | "createdAt" | "updatedAt">>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    invalidateDataDesaCache();
  } catch (error) {
    console.error("Error updating data desa:", error);
    throw error;
  }
};

// Delete data desa item
export const deleteDataDesa = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    invalidateDataDesaCache();
  } catch (error) {
    console.error("Error deleting data desa:", error);
    throw error;
  }
};

// Get all data desa items
export const getDataDesa = async (): Promise<DataDesaItem[]> => {
  const now = Date.now();
  if (cachedDataDesa && now - cachedDataDesaAt < DATA_DESA_CACHE_TTL_MS) {
    return cachedDataDesa;
  }

  if (dataDesaRequest) {
    return dataDesaRequest;
  }

  dataDesaRequest = (async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DataDesaItem));
    cachedDataDesa = data;
    cachedDataDesaAt = Date.now();
    return data;
  } catch (error) {
    console.error("Error fetching data desa:", error);
    throw error;
  } finally {
    dataDesaRequest = null;
  }
  })();

  return dataDesaRequest;
};

// Fetch only residents needed by a feature instead of scanning the collection.
export const getDataDesaByNIKs = async (niks: string[]): Promise<DataDesaItem[]> => {
  const uniqueNiks = Array.from(
    new Set(niks.map((nik) => String(nik || '').trim()).filter(Boolean))
  );

  if (uniqueNiks.length === 0) return [];

  const chunks: string[][] = [];
  for (let index = 0; index < uniqueNiks.length; index += 30) {
    chunks.push(uniqueNiks.slice(index, index + 30));
  }

  const snapshots = await Promise.all(
    chunks.map((nikChunk) =>
      getDocs(
        query(
          collection(db, COLLECTION_NAME),
          where('nik', 'in', nikChunk)
        )
      )
    )
  );

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    } as DataDesaItem))
  );
};

const DATA_DESA_SUMMARY_FIELDS = [
  'agama',
  'jenisKelamin',
  'pekerjaan',
  'sukuBangsa',
  'pendidikanTerakhir',
] as const;

const normalizeSummaryValue = (field: string, value: unknown) => {
  const text = String(value || 'Tidak Diketahui').trim();
  const lowerValue = text.toLowerCase();

  if (field === 'pendidikanTerakhir') {
    if (lowerValue.includes('belum tamat') || lowerValue.includes('belum sekolah') || lowerValue.includes('tidak bersekolah')) {
      return 'Tidak/Belum Sekolah';
    }
    if (lowerValue.includes('sarjana') || lowerValue.includes('strata') || /\bs[123]\b/.test(lowerValue) || lowerValue.includes('magister') || lowerValue.includes('master') || lowerValue.includes('doktor') || lowerValue.includes('profesor') || lowerValue.includes('diploma iv') || lowerValue.includes('diploma 4')) {
      return 'Sarjana/Sederajat';
    }
    if (lowerValue.includes('diploma')) return 'Diploma/Sederajat';
    if (lowerValue.includes('smp') || lowerValue.includes('sltp') || lowerValue.includes('sekolah menengah pertama')) return 'SLTP/Sederajat';
    if (lowerValue.includes('sma') || lowerValue.includes('slta') || lowerValue.includes('sekolah menengah atas')) return 'SLTA/Sederajat';
    if (lowerValue.includes('sd') || lowerValue.includes('sekolah dasar') || lowerValue.includes('tamat sd')) return 'Tamat SD/Sederajat';
  }

  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const incrementSummaryCategory = (
  categories: Record<string, Record<string, number>>,
  field: string,
  value: unknown
) => {
  const normalizedValue = normalizeSummaryValue(field, value);
  categories[field] ||= {};
  categories[field][normalizedValue] = (categories[field][normalizedValue] || 0) + 1;
};

export const buildDataDesaPublicSummary = (
  data: DataDesaItem[]
): DataDesaPublicSummary => {
  const summary: DataDesaPublicSummary = {
    total: data.length,
    categories: {},
    areas: {},
    updatedAt: Timestamp.now(),
  };

  data.forEach((resident) => {
    const rawArea = String(resident.daerah || 'Tidak Diketahui').trim();
    const areaParts = rawArea.split(' ');
    const areaCode = areaParts[0] || 'unknown';
    const areaName = areaParts.length > 1
      ? areaParts.slice(1).join(' ')
      : rawArea;

    summary.areas[areaCode] ||= {
      code: areaCode,
      name: areaName,
      total: 0,
      categories: {},
    };
    summary.areas[areaCode].total += 1;

    DATA_DESA_SUMMARY_FIELDS.forEach((field) => {
      incrementSummaryCategory(summary.categories, field, resident[field]);
      incrementSummaryCategory(summary.areas[areaCode].categories, field, resident[field]);
    });
  });

  return summary;
};

export const saveDataDesaPublicSummary = async (data: DataDesaItem[]) => {
  const summary = buildDataDesaPublicSummary(data);
  await setDoc(doc(db, 'public-summaries', 'data-desa'), summary);
  return summary;
};

export const getDataDesaPublicSummary = async (): Promise<DataDesaPublicSummary> => {
  const summaryRef = doc(db, 'public-summaries', 'data-desa');
  const summarySnapshot = await getDoc(summaryRef);

  if (summarySnapshot.exists()) {
    return summarySnapshot.data() as DataDesaPublicSummary;
  }

  // One-time bootstrap for existing installations. Subsequent visitors read one document.
  const data = await getDataDesa();
  return saveDataDesaPublicSummary(data);
};

// Subscribe to data desa changes
export const subscribeToDataDesa = (callback: (data: DataDesaItem[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (querySnapshot) => {
    const data: DataDesaItem[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as DataDesaItem);
    });
    callback(data);
  });
};

// Search data desa by name or NIK
export const searchDataDesa = async (searchTerm: string): Promise<DataDesaItem[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("namaLengkap", ">=", searchTerm),
      where("namaLengkap", "<=", searchTerm + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DataDesaItem));
  } catch (error) {
    console.error("Error searching data desa:", error);
    throw error;
  }
};

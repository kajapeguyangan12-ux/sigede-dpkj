import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

// Simplified Service Content Type - hanya 2 field rich text
export type ServiceContent = {
  serviceId: string;
  serviceName: string;
  syaratPermohonan: string; // Rich text HTML
  keteranganTambahan: string; // Rich text HTML
  lastUpdated?: Date;
  updatedBy?: string;
};

const COLLECTION = 'taring-dukcapil-content';

// Service list based on the image
export const TARING_SERVICES = [
  { id: 'paket-akta-lahir', name: 'Paket Akta Lahir' },
  { id: 'paket-akta-perkawinan', name: 'Paket Akta Perkawinan' },
  { id: 'paket-akta-perceraian', name: 'Paket Akta Perceraian' },
  { id: 'paket-akta-kematian', name: 'Paket Akta Kematian' },
  { id: 'kartu-keluarga', name: 'Kartu Keluarga' },
  { id: 'surat-pindah-domisili', name: 'Surat Pindah Domisili' },
  { id: 'akta-surat-lainnya', name: 'Akta/Surat Lainnya' },
  { id: 'ktp-elektronik-denpasar', name: 'KTP Elektronik Denpasar' },
  { id: 'ktp-elektronik-luar-denpasar', name: 'KTP Elektronik Luar Denpasar' },
  { id: 'kartu-identitas-anak', name: 'Kartu Identitas Anak' }
];

// Get content for specific service
export async function getServiceContent(serviceId: string): Promise<ServiceContent | null> {
  try {
    const docRef = doc(db, COLLECTION, serviceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        serviceId,
        serviceName: data.serviceName || '',
        syaratPermohonan: data.syaratPermohonan || '',
        keteranganTambahan: data.keteranganTambahan || '',
        lastUpdated: data.lastUpdated?.toDate(),
        updatedBy: data.updatedBy,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching service content:', error);
    throw error;
  }
}

// Save content for specific service
export async function saveServiceContent(
  serviceId: string,
  serviceName: string,
  content: {
    syaratPermohonan: string;
    keteranganTambahan: string;
  },
  userId?: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, serviceId);
    await setDoc(docRef, {
      serviceId,
      serviceName,
      syaratPermohonan: content.syaratPermohonan,
      keteranganTambahan: content.keteranganTambahan,
      lastUpdated: new Date(),
      updatedBy: userId,
    });
  } catch (error) {
    console.error('Error saving service content:', error);
    throw error;
  }
}

// Get all services content status
export async function getAllServicesContent(): Promise<Record<string, ServiceContent>> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const contents: Record<string, ServiceContent> = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      contents[doc.id] = {
        serviceId: doc.id,
        serviceName: data.serviceName || '',
        syaratPermohonan: data.syaratPermohonan || '',
        keteranganTambahan: data.keteranganTambahan || '',
        lastUpdated: data.lastUpdated?.toDate(),
        updatedBy: data.updatedBy,
      };
    });
    
    return contents;
  } catch (error) {
    console.error('Error fetching all services content:', error);
    throw error;
  }
}

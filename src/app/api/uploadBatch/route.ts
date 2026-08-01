import { NextRequest, NextResponse } from "next/server";
import type { ServiceAccount } from "firebase-admin";

// Lazy imports to avoid bundling issues in Vercel
let adminInitialized = false;

async function initializeFirebaseAdmin() {
  if (adminInitialized) return;

  try {
    const admin = await import("firebase-admin/app");
    
    if (!admin.getApps().length) {
      // Check if we have service account file path
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Option A: Use service account file
        if (process.env.NODE_ENV === 'development') {
          console.log('Initializing Firebase Admin with service account file');
        }
        admin.initializeApp({
          credential: admin.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
          projectId: process.env.FIREBASE_PROJECT_ID || "dpkj-ffc01",
        });
      } else if (process.env.FIREBASE_PROJECT_ID && 
                 process.env.FIREBASE_PRIVATE_KEY && 
                 process.env.FIREBASE_CLIENT_EMAIL) {
        // Option B: Use individual environment variables
        if (process.env.NODE_ENV === 'development') {
          console.log('Initializing Firebase Admin with environment variables');
        }
        const serviceAccount: ServiceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };

        admin.initializeApp({
          credential: admin.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      } else {
        console.warn('Firebase Admin credentials not configured. Upload functionality will be disabled.');
        throw new Error('Firebase Admin not configured');
      }
      adminInitialized = true;
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin dynamically
    await initializeFirebaseAdmin();
    
    // Import Firestore dynamically
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();
    const { batch, batchNumber } = await request.json();

    if (!batch || !Array.isArray(batch)) {
      return NextResponse.json(
        { error: "Batch data harus berupa array" },
        { status: 400 }
      );
    }

    console.log(`Processing batch ${batchNumber} with ${batch.length} records`);

    // Process each record in the batch
    const batchRef = db.batch();
    let processedCount = 0;

    for (const record of batch) {
      try {
        // Validate required fields
        if (!record.namaLengkap || !record.nik) {
          console.log("Skipping invalid record:", record);
          continue;
        }

        // Create document reference
        const docRef = db.collection("data-desa").doc();
        
        // Prepare data with timestamps
        const dataToSave = {
          noKK: record.noKK || "",
          namaLengkap: record.namaLengkap || "",
          nik: record.nik || "",
          jenisKelamin: record.jenisKelamin || "",
          tempatLahir: record.tempatLahir || "",
          tanggalLahir: record.tanggalLahir || "",
          alamat: record.alamat || "",
          daerah: record.daerah || "",
          statusNikah: record.statusNikah || "",
          agama: record.agama || "",
          sukuBangsa: record.sukuBangsa || "",
          kewarganegaraan: record.kewarganegaraan || "",
          pendidikanTerakhir: record.pendidikanTerakhir || "",
          pekerjaan: record.pekerjaan || "",
          penghasilan: record.penghasilan || "",
          golonganDarah: record.golonganDarah || "",
          shdk: record.shdk || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        batchRef.set(docRef, dataToSave);
        processedCount++;
      } catch (recordError) {
        console.error("Error processing record:", recordError);
      }
    }

    // Commit the batch
    if (processedCount > 0) {
      await batchRef.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Batch ${batchNumber} berhasil diproses`,
      processedCount,
      totalInBatch: batch.length,
    });

  } catch (error) {
    console.error("Error in uploadBatch API:", error);
    return NextResponse.json(
      { 
        error: "Terjadi kesalahan saat menyimpan data", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
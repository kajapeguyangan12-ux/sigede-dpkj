import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
let serviceAccount;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || join(__dirname, '../serviceAccountKey.json');

try {
  serviceAccount = JSON.parse(
    readFileSync(serviceAccountPath, 'utf8')
  );
} catch (error) {
  console.error('❌ ERROR: serviceAccountKey.json tidak ditemukan!');
  console.error('\n📝 Cara setup:');
  console.error('   1. Download serviceAccountKey.json dari Firebase Console');
  console.error('   2. Letakkan di root project: D:\\Nextjs\\backup\\SiGede\\DPKJ\\serviceAccountKey.json');
  console.error('   3. Atau set environment variable: FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/key.json\n');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

/**
 * Auto-approve layanan yang sudah 24 jam belum diapprove oleh kepala dusun
 * Status approved_admin -> auto_approved jika sudah lebih dari 24 jam
 */
async function autoApproveLayanan() {
  try {
    console.log('🔄 Memulai proses auto-approve layanan...\n');

    // Get layanan dengan status approved_admin
    const layananSnapshot = await db.collection('layanan-publik')
      .where('status', '==', 'approved_admin')
      .get();

    if (layananSnapshot.empty) {
      console.log('✅ Tidak ada layanan yang perlu di-auto-approve\n');
      return;
    }

    console.log(`📋 Ditemukan ${layananSnapshot.size} layanan dengan status approved_admin\n`);

    const now = Timestamp.now();
    const oneDayInSeconds = 24 * 60 * 60; // 24 jam dalam detik
    
    let autoApprovedCount = 0;
    const batch = db.batch();

    for (const doc of layananSnapshot.docs) {
      const data = doc.data();
      const layananId = doc.id;
      
      // Cek kapan terakhir kali diapprove oleh admin
      const approvedAdminAt = data.approvedAdminAt;
      
      if (!approvedAdminAt) {
        console.log(`⚠️ Layanan ${layananId} tidak memiliki approvedAdminAt, skip...`);
        continue;
      }

      // Hitung selisih waktu dalam detik
      const timeDiff = now.seconds - approvedAdminAt.seconds;
      
      if (timeDiff >= oneDayInSeconds) {
        console.log(`⏰ Layanan ${layananId} (${data.namaLengkap}) sudah ${Math.floor(timeDiff / 3600)} jam, auto-approve...`);
        
        // Update status menjadi auto_approved
        batch.update(doc.ref, {
          status: 'auto_approved',
          autoApprovedAt: now,
          autoApprovedReason: 'Kepala Dusun tidak merespon dalam 24 jam',
          updatedAt: now
        });
        
        autoApprovedCount++;
      } else {
        const remainingHours = Math.ceil((oneDayInSeconds - timeDiff) / 3600);
        console.log(`⏳ Layanan ${layananId} (${data.namaLengkap}) masih ${remainingHours} jam lagi`);
      }
    }

    if (autoApprovedCount > 0) {
      await batch.commit();
      console.log(`\n✅ Berhasil auto-approve ${autoApprovedCount} layanan\n`);
    } else {
      console.log('\n⏳ Belum ada layanan yang perlu di-auto-approve (belum 24 jam)\n');
    }

    // Summary
    console.log('📊 RINGKASAN:');
    console.log(`   Total diperiksa: ${layananSnapshot.size}`);
    console.log(`   Auto-approved: ${autoApprovedCount}`);
    console.log(`   Masih menunggu: ${layananSnapshot.size - autoApprovedCount}\n`);

  } catch (error) {
    console.error('❌ Error auto-approve layanan:', error);
    throw error;
  }
}

// Run the script
autoApproveLayanan()
  .then(() => {
    console.log('✅ Script selesai dijalankan');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script gagal:', error);
    process.exit(1);
  });

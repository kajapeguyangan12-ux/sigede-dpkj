# Layanan Publik - Approval Workflow Update

## Summary
Sistem persetujuan layanan publik telah diperbarui dari alur 3-tingkat menjadi **2-tingkat** yang lebih efisien.

## Alur Persetujuan Baru

### Flow Diagram
```
Masyarakat Mengajukan
        ↓
[pending_kadus] → Kepala Dusun Review
        ↓
[approved_kadus] → Admin Desa Review
        ↓
[approved_admin] → Surat Siap Diambil / Print
        ↓
[completed] → Selesai (dokumen diambil)
```

### Status Types
1. **pending_kadus** - Menunggu persetujuan Kepala Dusun
2. **approved_kadus** - Disetujui Kepala Dusun, menunggu Admin Desa
3. **approved_admin** - Disetujui Admin Desa, surat siap diambil
4. **completed** - Selesai, dokumen telah diambil
5. **ditolak** - Permohonan ditolak
6. **auto_approved** - Disetujui otomatis (lebih dari 3 hari tidak direspon)

## Perubahan Yang Dilakukan

### 1. Backend Services

#### src/lib/layananPublikService.ts
- ✅ Updated `LayananPublik` interface status type
- ✅ Modified `addLayananPublik()` - initial status: `pending_kadus`
- ✅ Updated `approveByKadus()` - changes status to `approved_kadus` with notification
- ✅ Updated `approveByAdmin()` - changes status to `approved_admin` with buktiApproval & notification
- ✅ Removed `approveByKades()` function
- ✅ Updated `autoApprove()` - only handles `pending_kadus` → `approved_kadus`
- ✅ Updated `getLayananStats()` - removed old status counts

#### src/lib/notificationService.ts
- ✅ Updated `generateLayananMessage()` function:
  - `pending_kadus`: "Menunggu persetujuan Kepala Dusun"
  - `approved_kadus`: "Disetujui Kadus, menunggu Admin Desa"
  - `approved_admin`: "Dokumen siap diambil di Kantor Desa"

### 2. Admin Panel

#### src/app/admin/layanan-publik/page.tsx
- ✅ Removed `approveByKades` import
- ✅ Updated role-based filtering:
  - **Kepala Dusun**: hanya melihat `pending_kadus` dari daerah mereka
  - **Admin Desa**: hanya melihat `approved_kadus` (sudah disetujui Kadus)
- ✅ Updated `getStatusText()` mappings untuk semua role
- ✅ Updated approval button logic:
  - Kepala Dusun: approve button muncul saat status = `pending_kadus`
  - Admin Desa: approve button muncul saat status = `approved_kadus`
- ✅ Removed Kepala Desa approval section
- ✅ Updated Download/Print Surat button: hanya muncul saat status = `approved_admin` atau `completed`

### 3. Masyarakat Panel

#### src/app/masyarakat/layanan-publik/page.tsx
- ✅ Updated `getStatusLabel()` function:
  - `pending_kadus`: "Menunggu Persetujuan Kepala Dusun"
  - `approved_kadus`: "Disetujui Kadus - Menunggu Admin Desa"
  - `approved_admin`: "Disetujui Admin Desa - Surat Siap Diambil"
  - `completed`: "Selesai - Dokumen Telah Diambil"
- ✅ Updated `getStatusColor()` for new status types
- ✅ Updated workflow progress visualization: Kepala Dusun → Admin Desa → Selesai
- ✅ Updated bukti approval display: shows when status = `approved_admin`

## User Experience

### Kepala Dusun
1. Login ke panel admin
2. Melihat permohonan dengan status `pending_kadus` dari daerah mereka
3. Input nomor surat pengantar
4. Approve → status berubah ke `approved_kadus`
5. Notifikasi dikirim ke masyarakat

### Admin Desa
1. Login ke panel admin
2. Melihat permohonan dengan status `approved_kadus` (sudah disetujui Kadus)
3. Review permohonan
4. Approve → status berubah ke `approved_admin`
5. Bukti approval (kode) di-generate otomatis
6. Notifikasi dikirim ke masyarakat
7. Button "Download Surat" muncul untuk print dokumen

### Masyarakat
1. Ajukan permohonan layanan
2. Status awal: `pending_kadus` - "Menunggu Persetujuan Kepala Dusun"
3. Setelah Kadus approve: `approved_kadus` - "Disetujui Kadus - Menunggu Admin Desa"
4. Setelah Admin approve: `approved_admin` - "Disetujui Admin Desa - Surat Siap Diambil"
5. Lihat kode bukti approval di notifikasi
6. Ambil dokumen di kantor desa dengan kode bukti
7. Status akhir: `completed` - "Selesai - Dokumen Telah Diambil"

## Auto-Approval
- Jika Kepala Dusun tidak merespon dalam **3 hari**, status otomatis berubah dari `pending_kadus` → `approved_kadus`
- Admin Desa dapat langsung melakukan approval

## Keuntungan Alur Baru
1. ✅ **Lebih cepat**: 2 tingkat persetujuan vs 3 tingkat sebelumnya
2. ✅ **Lebih jelas**: Setiap role tahu persis apa yang harus dilakukan
3. ✅ **Lebih efisien**: Admin Desa dapat langsung print setelah approval
4. ✅ **Transparansi**: Masyarakat dapat tracking progress dengan jelas
5. ✅ **Akuntabilitas**: Setiap approval tercatat dengan timestamp

## Testing Checklist
- [ ] Masyarakat dapat mengajukan permohonan (status awal: `pending_kadus`)
- [ ] Kepala Dusun melihat permohonan dari daerahnya saja
- [ ] Kepala Dusun dapat approve dengan input nomor surat
- [ ] Notifikasi terkirim ke masyarakat setelah approve Kadus
- [ ] Admin Desa melihat permohonan yang sudah approved_kadus
- [ ] Admin Desa dapat approve (status → `approved_admin`)
- [ ] Bukti approval ter-generate otomatis
- [ ] Notifikasi terkirim ke masyarakat setelah approve Admin
- [ ] Button Download/Print Surat muncul setelah `approved_admin`
- [ ] Workflow progress di panel masyarakat update dengan benar
- [ ] Auto-approval bekerja setelah 3 hari

## Files Modified
1. `src/lib/layananPublikService.ts` - Core approval logic
2. `src/lib/notificationService.ts` - Notification messages
3. `src/app/admin/layanan-publik/page.tsx` - Admin panel UI & logic
4. `src/app/masyarakat/layanan-publik/page.tsx` - Masyarakat panel UI

## Deployment Notes
- ✅ No database migration needed (status field supports all new values)
- ✅ Existing data with old status types will still work (backward compatible)
- ✅ TypeScript compilation successful (no errors)
- ⚠️ Recommend testing on staging environment first
- ⚠️ Notify users about new approval workflow

---
**Last Updated**: 2025-01-XX
**Developer**: GitHub Copilot
**Status**: ✅ Ready for Testing

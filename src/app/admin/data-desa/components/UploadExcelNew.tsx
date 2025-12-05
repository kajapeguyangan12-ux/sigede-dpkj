"use client";
import React, { useState, useRef } from "react";
import * as XLSX from 'xlsx';
import { upsertDataDesa, findDataDesaByNIK } from '../../../../lib/dataDesaService';
import UploadMinimized from './UploadMinimized';

interface UploadExcelProps {
  onUploadComplete?: () => void;
  onMinimize?: () => void; // Callback saat minimize
  onMaximize?: () => void; // Callback saat maximize
  isMinimizedFromParent?: boolean; // Control dari parent
}

interface UploadStats {
  total: number;
  processed: number;
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  retries: number;
  duplicates: number;
}

interface ProgressLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'retry';
  message: string;
}

interface ParsedData {
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
}

type UploadStep = 'select' | 'preview' | 'uploading' | 'complete';
type UploadMode = 'add-new' | 'update'; // Mode: tambah baru atau update data

export default function UploadExcel({ onUploadComplete, onMinimize, onMaximize, isMinimizedFromParent }: UploadExcelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('add-new'); // Default: add-new mode untuk speed
  const [previewData, setPreviewData] = useState<ParsedData[]>([]);
  const [parsedDataAll, setParsedDataAll] = useState<ParsedData[]>([]);
  const isMinimized = isMinimizedFromParent !== undefined ? isMinimizedFromParent : false;
  const [stats, setStats] = useState<UploadStats>({
    total: 0,
    processed: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    retries: 0,
    duplicates: 0
  });
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [step, setStep] = useState<UploadStep>('select');
  const [startTime, setStartTime] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const cancelRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const processedCountRef = useRef<number>(0);
  const nikCacheRef = useRef<Map<string, any>>(new Map());
  const statsAccumulatorRef = useRef<{
    added: number;
    updated: number;
    skipped: number;
    errors: number;
  }>({ added: 0, updated: 0, skipped: 0, errors: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls)$/)) {
        alert("File harus berformat Excel (.xlsx atau .xls)");
        return;
      }
      setFile(selectedFile);
      setStep('select');
      setProgress(0);
      setShowPreview(false);
      setPreviewData([]);
      setParsedDataAll([]);
      setStats({ total: 0, processed: 0, added: 0, updated: 0, skipped: 0, errors: 0, retries: 0, duplicates: 0 });
      setErrorMessages([]);
      setProgressLogs([]);
    }
  };

  const addLog = (type: ProgressLog['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setProgressLogs(prev => [...prev, { timestamp, type, message }]);
  };

  const normalizeColumnName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  };

  // Helper function untuk membersihkan NIK dan No KK dari karakter non-numeric
  const cleanNumericField = (value: string): string => {
    // Hapus semua karakter selain angka (termasuk tanda kutip, spasi, dll)
    return value.replace(/[^0-9]/g, '');
  };

  // Helper function untuk konversi format tanggal
  const convertDateFormat = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      const dateStr = String(dateValue).trim();
      
      // Handle Excel serial number (pure digits, 4-6 digits)
      if (/^\d{4,6}$/.test(dateStr)) {
        console.log('📅 Excel serial detected:', dateStr);
        const excelEpoch = new Date(1899, 11, 30);
        const daysOffset = parseInt(dateStr);
        const jsDate = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        
        const day = String(jsDate.getDate()).padStart(2, '0');
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const year = jsDate.getFullYear();
        return `${day}-${month}-${year}`;
      }
      
      // Handle DD/MM/YYYY or DD-MM-YYYY format (convert to DD-MM-YYYY)
      if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(dateStr)) {
        const parts = dateStr.split(/[\/\-]/);
        return `${parts[0]}-${parts[1]}-${parts[2]}`; // DD-MM-YYYY
      }
      
      // Handle YYYY/MM/DD or YYYY-MM-DD format (convert to DD-MM-YYYY)
      if (/^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(dateStr)) {
        const parts = dateStr.split(/[\/\-]/);
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
      }
      
      // Handle MM/DD/YYYY (American format, less common but possible)
      // Already in DD/MM/YYYY or DD-MM-YYYY format, just standardize separator
      return dateStr.replace(/\//g, '-');
      
    } catch (error) {
      console.error('Error converting date:', error);
      return String(dateValue);
    }
  };

  const parseExcelFile = async (file: File): Promise<ParsedData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length < 2) {
            reject(new Error("File Excel kosong atau tidak memiliki data"));
            return;
          }

          const headers = jsonData[0].map((h: any) => String(h).trim());
          const normalizedHeaders = headers.map(normalizeColumnName);

          const columnMap: { [key: string]: string } = {
            'nokk': 'noKK', 'kartukeluarga': 'noKK', 'nik': 'nik',
            'namalengkap': 'namaLengkap', 'nama': 'namaLengkap',
            'jeniskelamin': 'jenisKelamin', 'jk': 'jenisKelamin',
            'tempatlahir': 'tempatLahir', 'tanggallahir': 'tanggalLahir', 'tgllahir': 'tanggalLahir',
            'alamat': 'alamat', 'daerah': 'daerah', 'banjar': 'daerah',
            'statusnikah': 'statusNikah', 'statusperkawinan': 'statusNikah',
            'agama': 'agama', 'sukubangsa': 'sukuBangsa', 'suku': 'sukuBangsa',
            'kewarganegaraan': 'kewarganegaraan',
            'pendidikanterakhir': 'pendidikanTerakhir', 'pendidikan': 'pendidikanTerakhir',
            'pekerjaan': 'pekerjaan', 'penghasilan': 'penghasilan',
            'golongandarah': 'golonganDarah', 'goldarah': 'golonganDarah',
            'shdk': 'shdk', 'statusdalamkeluarga': 'shdk', 'hubungan': 'shdk',
            'desil': 'desil'
          };

          const parsedData: ParsedData[] = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const rowData: any = {};
            
            headers.forEach((header, index) => {
              const normalizedHeader = normalizedHeaders[index];
              const mappedKey = columnMap[normalizedHeader];
              
              if (mappedKey && row[index] !== undefined && row[index] !== null && String(row[index]).trim() !== '') {
                rowData[mappedKey] = String(row[index]).trim();
              }
            });

            // Normalisasi nilai SHDK untuk konsistensi
            if (rowData.shdk) {
              const shdkLower = rowData.shdk.toLowerCase();
              if (shdkLower.includes('kepala') || shdkLower === 'kk') {
                rowData.shdk = 'Kepala Keluarga';
              } else if (shdkLower.includes('istri')) {
                rowData.shdk = 'Istri';
              } else if (shdkLower.includes('suami')) {
                rowData.shdk = 'Suami';
              } else if (shdkLower.includes('anak')) {
                rowData.shdk = 'Anak';
              }
            }
            
            // Bersihkan NIK dan No KK dari karakter non-numeric (hapus tanda kutip, spasi, dll)
            if (rowData.nik) {
              rowData.nik = cleanNumericField(rowData.nik);
            }
            if (rowData.noKK) {
              rowData.noKK = cleanNumericField(rowData.noKK);
            }
            
            // Konversi format tanggal lahir
            if (rowData.tanggalLahir) {
              const originalDate = rowData.tanggalLahir;
              rowData.tanggalLahir = convertDateFormat(rowData.tanggalLahir);
              console.log(`📅 Date conversion: ${originalDate} → ${rowData.tanggalLahir}`);
            }
            
            // Validasi data wajib - log baris yang di-skip
            if (rowData.noKK && rowData.nik && rowData.namaLengkap) {
              parsedData.push(rowData as ParsedData);
            } else {
              // Log baris yang di-skip untuk debugging
              console.warn(`Baris ${i + 1} di-skip:`, {
                noKK: rowData.noKK || '(kosong)',
                nik: rowData.nik || '(kosong)',
                namaLengkap: rowData.namaLengkap || '(kosong)',
                rawData: row
              });
            }
          }

          if (parsedData.length === 0) {
            reject(new Error("Tidak ada data valid. Pastikan file memiliki kolom: No KK, NIK, dan Nama Lengkap"));
            return;
          }

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleParseAndPreview = async () => {
    if (!file) return;

    try {
      setCurrentStatus("Membaca file Excel...");
      const parsed = await parseExcelFile(file);
      setParsedDataAll(parsed);
      setPreviewData(parsed.slice(0, 10));
      setStep('preview');
      setStats(prev => ({ ...prev, total: parsed.length }));
    } catch (error: any) {
      alert(`Error membaca file: ${error.message}`);
      setFile(null);
      setStep('select');
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const calculateEstimatedTime = (processed: number, total: number, elapsedMs: number): string => {
    if (processed === 0) return "Menghitung...";
    
    const avgTimePerItem = elapsedMs / processed;
    const remainingItems = total - processed;
    const estimatedRemainingMs = avgTimePerItem * remainingItems;
    
    const seconds = Math.floor(estimatedRemainingMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} jam ${minutes % 60} menit`;
    } else if (minutes > 0) {
      return `${minutes} menit ${seconds % 60} detik`;
    } else {
      return `${seconds} detik`;
    }
  };

  const compareData = (existing: any, newData: any): boolean => {
    // Optimasi: perbandingan cepat dengan early exit pada field penting
    if (existing.nik !== newData.nik) return false;
    if (String(existing.noKK || '').trim() !== String(newData.noKK || '').trim()) return false;
    if (String(existing.namaLengkap || '').trim() !== String(newData.namaLengkap || '').trim()) return false;
    
    // Field lainnya untuk perbandingan detail
    const fieldsToCompare = ['jenisKelamin', 'tempatLahir', 'tanggalLahir', 
                           'alamat', 'daerah', 'statusNikah', 'agama', 'sukuBangsa', 
                           'kewarganegaraan', 'pendidikanTerakhir', 'pekerjaan', 'penghasilan', 
                           'golonganDarah', 'shdk', 'desil'];
    
    return fieldsToCompare.every(key => 
      String(existing[key] || '').trim() === String(newData[key] || '').trim()
    );
  };

  const uploadBatch = async (batch: ParsedData[], batchIndex: number, totalBatches: number) => {
    const results = { added: 0, updated: 0, skipped: 0, errors: 0, retries: 0, duplicates: 0 };

    for (let i = 0; i < batch.length; i++) {
      while (pauseRef.current && !cancelRef.current) {
        await delay(500);
      }

      if (cancelRef.current) {
        throw new Error("Upload dibatalkan oleh pengguna");
      }

      const item = batch[i];
      
      try {
        // MODE: ADD NEW - Auto-retry, auto-skip duplicate
        if (uploadMode === 'add-new') {
          // Check if NIK already exists to skip duplicate (hanya cek NIK, bukan field lain)
          let existing = nikCacheRef.current.get(item.nik);
          if (existing === undefined) {
            existing = await findDataDesaByNIK(item.nik);
            nikCacheRef.current.set(item.nik, existing || null);
          }
          
          if (existing && existing !== null) {
            // Auto-skip duplicate berdasarkan NIK saja
            results.duplicates++;
            statsAccumulatorRef.current.skipped++;
            processedCountRef.current += 1;
            
            if ((i + 1) % 100 === 0) {
              addLog('warning', `Batch ${batchIndex + 1}: ${results.duplicates} NIK duplikat di-skip`);
            }
            
            // Update stats every 50 items
            if ((i + 1) % 50 === 0) {
              setStats(prev => {
                const newProcessed = processedCountRef.current;
                const progressPercent = Math.round((newProcessed / prev.total) * 100);
                setProgress(progressPercent);
                
                if (startTime > 0) {
                  const elapsed = Date.now() - startTime;
                  const estimate = calculateEstimatedTime(newProcessed, prev.total, elapsed);
                  setEstimatedTime(estimate);
                }
                
                return {
                  ...prev,
                  processed: newProcessed,
                  duplicates: statsAccumulatorRef.current.skipped
                };
              });
            }
            
            continue;
          }
          
          // Auto-retry logic (max 3 attempts)
          let success = false;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (!success && retryCount < maxRetries) {
            try {
              if (retryCount > 0) {
                const backoffDelay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
                await delay(backoffDelay);
                addLog('retry', `Retry ${retryCount}/${maxRetries}: ${item.namaLengkap} (NIK: ${item.nik})`);
                results.retries++;
                statsAccumulatorRef.current.errors++;
              }
              
              await upsertDataDesa(item);
              nikCacheRef.current.set(item.nik, item);
              results.added++;
              statsAccumulatorRef.current.added++;
              success = true;
              
              if ((i + 1) % 100 === 0) {
                addLog('success', `Batch ${batchIndex + 1}: ${results.added} data ditambahkan`);
              }
            } catch (error: any) {
              retryCount++;
              if (retryCount >= maxRetries) {
                throw error;
              }
            }
          }
          
          processedCountRef.current += 1;
          
          // Update stats setiap 50 item untuk performa
          if ((i + 1) % 50 === 0) {
            setStats(prev => {
              const newProcessed = processedCountRef.current;
              const progressPercent = Math.round((newProcessed / prev.total) * 100);
              setProgress(progressPercent);
              
              if (startTime > 0) {
                const elapsed = Date.now() - startTime;
                const estimate = calculateEstimatedTime(newProcessed, prev.total, elapsed);
                setEstimatedTime(estimate);
              }
              
              return {
                ...prev,
                processed: newProcessed,
                added: statsAccumulatorRef.current.added,
                retries: results.retries
              };
            });
          }
          
          continue; // Lanjut ke item berikutnya
        }
        
        // MODE: UPDATE - Cek existing data dan update jika berbeda
        // Check cache, jika tidak ada baru query (on-demand, lebih efisien)
        let existing = nikCacheRef.current.get(item.nik);
        if (existing === undefined) {
          existing = await findDataDesaByNIK(item.nik);
          nikCacheRef.current.set(item.nik, existing || null);
        }
        
        // Quick skip jika data tidak ada perubahan
        if (existing && existing !== null) {
          const isSame = compareData(existing, item);
          
          if (isSame) {
            // ⚡ SKIP CEPAT: Data identik, langsung skip tanpa query
            results.skipped++;
            statsAccumulatorRef.current.skipped++;
            // Tidak perlu set status untuk skip (lebih cepat)
            
            processedCountRef.current += 1;
            
            // Update progress setiap 20 item untuk performa
            if ((i + 1) % 20 === 0) {
              setStats(prev => {
                const newProcessed = processedCountRef.current;
                const progressPercent = Math.round((newProcessed / prev.total) * 100);
                setProgress(progressPercent);
                
                if (startTime > 0) {
                  const elapsed = Date.now() - startTime;
                  const estimate = calculateEstimatedTime(newProcessed, prev.total, elapsed);
                  setEstimatedTime(estimate);
                }
                
                return {
                  ...prev,
                  processed: newProcessed,
                  skipped: statsAccumulatorRef.current.skipped
                };
              });
            }
            
            continue; // Skip ke item berikutnya
          }
        }
        
        // Ada perubahan atau data baru, tampilkan status
        setCurrentStatus(`Memproses: ${item.namaLengkap} (NIK: ${item.nik})`);
        
        // Update atau tambah data
        if (existing && existing !== null) {
          // Data sudah ada tapi berbeda, update
          await upsertDataDesa(item);
          nikCacheRef.current.set(item.nik, item); // Update cache
          results.updated++;
          statsAccumulatorRef.current.updated++;
          setCurrentStatus(`✏️ Diperbarui: ${item.namaLengkap}`);
        } else {
          // Data baru, tambahkan
          await upsertDataDesa(item);
          nikCacheRef.current.set(item.nik, item); // Simpan di cache
          results.added++;
          statsAccumulatorRef.current.added++;
          setCurrentStatus(`✨ Ditambahkan: ${item.namaLengkap}`);
        }
        
        processedCountRef.current += 1;
        
        setStats(prev => {
          const newProcessed = processedCountRef.current;
          const newStats = {
            ...prev,
            processed: newProcessed,
            added: statsAccumulatorRef.current.added,
            updated: statsAccumulatorRef.current.updated,
            skipped: statsAccumulatorRef.current.skipped
          };
          
          // Update progress dan estimasi waktu
          const progressPercent = Math.round((newProcessed / prev.total) * 100);
          setProgress(progressPercent);
          
          // Hitung estimasi waktu
          if (startTime > 0) {
            const elapsed = Date.now() - startTime;
            const estimate = calculateEstimatedTime(newProcessed, prev.total, elapsed);
            setEstimatedTime(estimate);
          }
          
          return newStats;
        });
        
      } catch (error: any) {
        console.error(`Error processing ${item.namaLengkap}:`, error);
        results.errors++;
        statsAccumulatorRef.current.errors++;
        const errorMsg = `${item.namaLengkap} (NIK: ${item.nik}): ${error.message}`;
        setErrorMessages(prev => [...prev, errorMsg]);
        addLog('error', errorMsg);
        
        processedCountRef.current += 1;
        setStats(prev => {
          const newStats = { 
            ...prev, 
            processed: processedCountRef.current, 
            errors: statsAccumulatorRef.current.errors 
          };
          const progressPercent = Math.round((processedCountRef.current / prev.total) * 100);
          setProgress(progressPercent);
          
          if (startTime > 0) {
            const elapsed = Date.now() - startTime;
            const estimate = calculateEstimatedTime(processedCountRef.current, prev.total, elapsed);
            setEstimatedTime(estimate);
          }
          
          return newStats;
        });
      }
      
      // Micro-delay setiap 50 item untuk update UI (lebih cepat)
      if ((i + 1) % 50 === 0) {
        await delay(5);
      }
    }

    // Status setelah batch selesai
    const batchStats = uploadMode === 'add-new' 
      ? `+${results.added} baru, 🔁${results.retries} retry, ⚠${results.duplicates} duplikat, ✗${results.errors} error`
      : `+${results.added} baru, ~${results.updated} update, ↷${results.skipped} skip, ✗${results.errors} error`;
    setCurrentStatus(`✓ Batch ${batchIndex + 1}/${totalBatches} selesai (${batchStats})`);
    addLog('success', `Batch ${batchIndex + 1}/${totalBatches} selesai: ${batchStats}`);

    return results;
  };

  const handleUpload = async () => {
    if (!file || parsedDataAll.length === 0) {
      alert("Tidak ada data untuk diupload");
      return;
    }

    setUploading(true);
    setStep('uploading');
    cancelRef.current = false;
    pauseRef.current = false;
    setPaused(false);
    setProgress(0);
    setErrorMessages([]);
    setEstimatedTime("Menghitung...");
    processedCountRef.current = 0;
    
    // Reset accumulator statistik
    statsAccumulatorRef.current = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
    
    // Reset stats
    setStats(prev => ({
      ...prev,
      processed: 0,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      retries: 0,
      duplicates: 0
    }));
    
    try {
      nikCacheRef.current.clear(); // Reset cache sebelum upload baru
      setProgressLogs([]);
      setStartTime(Date.now());
      setCurrentStatus(`Memulai upload ${parsedDataAll.length} data...`);
      
      const BATCH_SIZE = uploadMode === 'add-new' ? 400 : 300; // 400 untuk add-new, 300 untuk update
      addLog('info', `Mode: ${uploadMode === 'add-new' ? 'Tambah Baru' : 'Update Data'} | Batch size: ${BATCH_SIZE}`);
      
      const totalBatches = Math.ceil(parsedDataAll.length / BATCH_SIZE);
      addLog('info', `Total ${totalBatches} batch akan diproses (${parsedDataAll.length} data)`);

      for (let i = 0; i < totalBatches; i++) {
        if (cancelRef.current) break;

        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, parsedDataAll.length);
        const batch = parsedDataAll.slice(start, end);

        setCurrentStatus(`Memproses batch ${i + 1}/${totalBatches} (${batch.length} data)...`);
        await uploadBatch(batch, i, totalBatches);
        
        // Delay 1 detik antar batch untuk mencegah Firebase rate limiting
        if (i < totalBatches - 1 && !cancelRef.current) {
          setCurrentStatus(`Batch ${i + 1} selesai. Lanjut ke batch berikutnya...`);
          await delay(1000);
        }
      }

      if (!cancelRef.current) {
        setStep('complete');
        setCurrentStatus("Upload selesai!");
        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        addLog('success', `✓ Upload selesai! Total waktu: ${totalTime} menit`);
      }
      
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setCurrentStatus(`Error: ${error.message}`);
      addLog('error', `Upload gagal: ${error.message}`);
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setUploading(false);
      setPaused(false);
      cancelRef.current = false;
      pauseRef.current = false;
    }
  };

  const handlePause = () => {
    pauseRef.current = !pauseRef.current;
    setPaused(!paused);
    setCurrentStatus(paused ? "Melanjutkan upload..." : "Upload dijeda");
  };

  const handleCancel = () => {
    if (confirm("Apakah Anda yakin ingin membatalkan upload?")) {
      cancelRef.current = true;
      setCurrentStatus("Membatalkan upload...");
    }
  };

  const handleMinimize = () => {
    // Beritahu parent untuk minimize
    if (onMinimize) {
      onMinimize();
    }
  };

  const handleMaximize = () => {
    // Beritahu parent untuk maximize
    if (onMaximize) {
      onMaximize();
    }
  };

  const handleCloseModal = () => {
    // Close sepenuhnya - stop upload jika sedang berjalan
    if (step === 'uploading') {
      if (confirm('Upload sedang berjalan. Apakah Anda yakin ingin membatalkan dan menutup?')) {
        cancelRef.current = true;
        if (onUploadComplete) {
          onUploadComplete();
        }
      }
    } else {
      // Jika tidak upload, langsung close
      if (onUploadComplete) {
        onUploadComplete();
      }
    }
  };

  return (
    <>
      {/* Minimized Widget - selalu render jika isMinimized */}
      {isMinimized && step === 'uploading' && (
        <UploadMinimized
          progress={progress}
          stats={stats}
          estimatedTime={estimatedTime}
          paused={paused}
          onMaximize={handleMaximize}
          onPause={handlePause}
          onCancel={handleCancel}
        />
      )}

      {/* Modal Utama dengan wrapper - hanya render jika tidak minimize */}
      {!isMinimized && (
        <div className="modern-modal-overlay">
          <div className="modern-modal-container">
            <div className="modern-modal-content">
    <div className="min-h-[600px] flex flex-col bg-white relative">
      {/* Tombol Minimize dan Close di pojok kanan atas */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {/* Tombol Minimize - hanya muncul saat uploading */}
        {step === 'uploading' && (
          <button
            onClick={handleMinimize}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
            title="Minimize"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        )}
        
        {/* Tombol Close */}
        <button
          onClick={handleCloseModal}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
          title="Tutup"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Header dengan Progress Steps */}
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6 pr-24">{/* Extra padding untuk 2 tombol */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upload File Excel</h2>
              <p className="text-sm text-gray-600 mt-1">Import data warga dari file Excel (.xlsx atau .xls)</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {/* Step 1 */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            step === 'select' ? 'bg-blue-100 text-blue-700 font-semibold' : 
            ['preview', 'uploading', 'complete'].includes(step) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'select' ? 'bg-blue-500 text-white' : 
              ['preview', 'uploading', 'complete'].includes(step) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {['preview', 'uploading', 'complete'].includes(step) ? '✓' : '1'}
            </div>
            <span className="text-sm">Pilih File</span>
          </div>
          
          <div className={`w-12 h-0.5 ${['preview', 'uploading', 'complete'].includes(step) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          
          {/* Step 2 */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            step === 'preview' ? 'bg-blue-100 text-blue-700 font-semibold' : 
            ['uploading', 'complete'].includes(step) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'preview' ? 'bg-blue-500 text-white' : 
              ['uploading', 'complete'].includes(step) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {['uploading', 'complete'].includes(step) ? '✓' : '2'}
            </div>
            <span className="text-sm">Preview</span>
          </div>
          
          <div className={`w-12 h-0.5 ${['uploading', 'complete'].includes(step) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          
          {/* Step 3 */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            step === 'uploading' ? 'bg-blue-100 text-blue-700 font-semibold' : 
            step === 'complete' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'uploading' ? 'bg-blue-500 text-white' : 
              step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {step === 'complete' ? '✓' : '3'}
            </div>
            <span className="text-sm">Upload</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {step === 'select' && (
          <SelectFileStep 
            file={file}
            uploading={uploading}
            uploadMode={uploadMode}
            onModeChange={setUploadMode}
            onFileChange={handleFileChange}
            onCancel={() => {setFile(null); setStep('select');}}
            onNext={handleParseAndPreview}
          />
        )}

        {step === 'preview' && (
          <PreviewStep 
            parsedDataAll={parsedDataAll}
            previewData={previewData}
            uploadMode={uploadMode}
            onModeChange={setUploadMode}
            onBack={() => {setStep('select'); setPreviewData([]); setParsedDataAll([]);}}
            onUpload={handleUpload}
          />
        )}

        {step === 'uploading' && (
          <UploadingStep 
            progress={progress}
            paused={paused}
            currentStatus={currentStatus}
            stats={stats}
            errorMessages={errorMessages}
            progressLogs={progressLogs}
            estimatedTime={estimatedTime}
            onPause={handlePause}
            onCancel={handleCancel}
          />
        )}

        {step === 'complete' && (
          <CompleteStep 
            stats={stats}
            onComplete={onUploadComplete}
          />
        )}
      </div>
    </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Sub-components untuk setiap step
interface SelectFileStepProps {
  file: File | null;
  uploading: boolean;
  uploadMode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onNext: () => void;
}

function SelectFileStep({ file, uploading, uploadMode, onModeChange, onFileChange, onCancel, onNext }: SelectFileStepProps) {
  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6">
        <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Pilih Mode Upload
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Tambah Baru Mode */}
          <button
            onClick={() => onModeChange('add-new')}
            className={`relative p-6 rounded-xl border-3 transition-all transform hover:scale-105 text-left ${
              uploadMode === 'add-new'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-600 shadow-xl scale-105'
                : 'bg-white border-gray-300 hover:border-green-400 hover:shadow-lg'
            }`}
          >
            {uploadMode === 'add-new' && (
              <div className="absolute top-3 right-3">
                <div className="bg-white rounded-full p-1">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            <div className={`flex items-center gap-3 mb-3 ${
              uploadMode === 'add-new' ? 'text-white' : 'text-green-600'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                uploadMode === 'add-new' ? 'bg-white/20' : 'bg-green-100'
              }`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h4 className={`font-bold text-xl ${
                  uploadMode === 'add-new' ? 'text-white' : 'text-gray-900'
                }`}>Tambah Baru</h4>
                <p className={`text-sm font-medium ${
                  uploadMode === 'add-new' ? 'text-green-100' : 'text-green-600'
                }`}>Batch 400 • Auto Retry</p>
              </div>
            </div>
            <ul className={`space-y-2 text-sm ${
              uploadMode === 'add-new' ? 'text-white/90' : 'text-gray-700'
            }`}>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚡</span>
                <span><strong>Super Cepat:</strong> Insert langsung tanpa perbandingan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">🔁</span>
                <span><strong>Auto Retry:</strong> 3x percobaan otomatis jika gagal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span><strong>Skip Duplikat:</strong> NIK duplikat otomatis dilewati</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">📋</span>
                <span><strong>Progress Log:</strong> Tracking detil per batch</span>
              </li>
            </ul>
            <div className={`mt-4 pt-4 border-t ${
              uploadMode === 'add-new' ? 'border-white/20' : 'border-gray-200'
            }`}>
              <p className={`text-xs font-semibold ${
                uploadMode === 'add-new' ? 'text-white' : 'text-gray-600'
              }`}>⏱️ Estimasi: ~2-3 menit untuk 18,000 data</p>
            </div>
          </button>

          {/* Update Data Mode */}
          <button
            onClick={() => onModeChange('update')}
            className={`relative p-6 rounded-xl border-3 transition-all transform hover:scale-105 text-left ${
              uploadMode === 'update'
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-600 shadow-xl scale-105'
                : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-lg'
            }`}
          >
            {uploadMode === 'update' && (
              <div className="absolute top-3 right-3">
                <div className="bg-white rounded-full p-1">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            <div className={`flex items-center gap-3 mb-3 ${
              uploadMode === 'update' ? 'text-white' : 'text-blue-600'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                uploadMode === 'update' ? 'bg-white/20' : 'bg-blue-100'
              }`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h4 className={`font-bold text-xl ${
                  uploadMode === 'update' ? 'text-white' : 'text-gray-900'
                }`}>Update Data</h4>
                <p className={`text-sm font-medium ${
                  uploadMode === 'update' ? 'text-blue-100' : 'text-blue-600'
                }`}>Batch 300 • Smart Sync</p>
              </div>
            </div>
            <ul className={`space-y-2 text-sm ${
              uploadMode === 'update' ? 'text-white/90' : 'text-gray-700'
            }`}>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">🔍</span>
                <span><strong>Cek NIK:</strong> Bandingkan dengan data existing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">✏️</span>
                <span><strong>Update Otomatis:</strong> Hanya update yang berubah</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">↷</span>
                <span><strong>Skip Sama:</strong> Data identik langsung dilewati</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">✨</span>
                <span><strong>Insert Baru:</strong> NIK baru otomatis ditambahkan</span>
              </li>
            </ul>
            <div className={`mt-4 pt-4 border-t ${
              uploadMode === 'update' ? 'border-white/20' : 'border-gray-200'
            }`}>
              <p className={`text-xs font-semibold ${
                uploadMode === 'update' ? 'text-white' : 'text-gray-600'
              }`}>⏱️ Estimasi: ~6-8 menit untuk 18,000 data</p>
            </div>
          </button>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group">
        <input type="file" accept=".xlsx,.xls" onChange={onFileChange} className="hidden" id="excel-upload" disabled={uploading} />
        <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">
            {file ? file.name : "Klik atau drag file Excel di sini"}
          </p>
          <p className="text-sm text-gray-500 mb-4">Format: .xlsx atau .xls</p>
          {file && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              File dipilih • {(file.size / 1024).toFixed(2)} KB
            </div>
          )}
        </label>
      </div>

      {file && (
        <div className="flex justify-center gap-3">
          <button onClick={onCancel} className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all">
            Batalkan
          </button>
          <button onClick={onNext} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview Data
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Format Excel yang Dibutuhkan
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-900">
          <div>
            <p className="font-semibold mb-2">✅ Kolom Wajib:</p>
            <ul className="space-y-1 ml-4">
              <li>• No KK (Nomor Kartu Keluarga)</li>
              <li>• NIK (16 digit)</li>
              <li>• Nama Lengkap</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">📋 Kolom Opsional:</p>
            <ul className="space-y-1 ml-4">
              <li>• Jenis Kelamin, Tempat/Tanggal Lahir</li>
              <li>• Alamat, Daerah, Status Nikah</li>
              <li>• Agama, Pendidikan, Pekerjaan, dll</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Smart Upload:</strong> Data yang sama akan dilewati, data yang berubah akan diperbarui otomatis
          </p>
        </div>
      </div>
    </div>
  );
}

interface PreviewStepProps {
  parsedDataAll: ParsedData[];
  previewData: ParsedData[];
  uploadMode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
  onBack: () => void;
  onUpload: () => void;
}

function PreviewStep({ parsedDataAll, previewData, onBack, onUpload }: PreviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-sm font-semibold text-blue-700 mb-1">Total Data</div>
          <div className="text-3xl font-bold text-blue-900">{parsedDataAll.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="text-sm font-semibold text-green-700 mb-1">Laki-laki</div>
          <div className="text-3xl font-bold text-green-900">
            {parsedDataAll.filter(d => d.jenisKelamin === 'Laki-laki').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
          <div className="text-sm font-semibold text-pink-700 mb-1">Perempuan</div>
          <div className="text-3xl font-bold text-pink-900">
            {parsedDataAll.filter(d => d.jenisKelamin === 'Perempuan').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="text-sm font-semibold text-purple-700 mb-1">Kepala Keluarga</div>
          <div className="text-3xl font-bold text-purple-900">
            {parsedDataAll.filter(d => d.shdk === 'Kepala Keluarga').length}
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Preview Data (Menampilkan 10 dari {parsedDataAll.length} data)
          </h3>
        </div>
        
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">No KK</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">NIK</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nama Lengkap</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">JK</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tempat/Tgl Lahir</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Daerah</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">SHDK</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Desil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {previewData.map((item, index) => (
                <tr key={index} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono font-bold">{item.noKK}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono font-bold">{item.nik}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.namaLengkap}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                      item.jenisKelamin === 'Laki-laki' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                      {item.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.tempatLahir && item.tanggalLahir ? `${item.tempatLahir}, ${item.tanggalLahir}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.daerah || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      item.shdk === 'Kepala Keluarga' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.shdk || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.desil || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {parsedDataAll.length > 10 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center text-sm text-gray-600">
            Dan {parsedDataAll.length - 10} data lainnya...
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <button onClick={onBack} className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali
        </button>
        <button onClick={onUpload} className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Mulai Upload ({parsedDataAll.length} Data)
        </button>
      </div>
    </div>
  );
}

interface UploadingStepProps {
  progress: number;
  paused: boolean;
  currentStatus: string;
  stats: UploadStats;
  errorMessages: string[];
  progressLogs: ProgressLog[];
  estimatedTime: string;
  onPause: () => void;
  onCancel: () => void;
}

function UploadingStep({ progress, paused, currentStatus, stats, errorMessages, progressLogs, estimatedTime, onPause, onCancel }: UploadingStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-bold text-gray-900">Progress Upload</span>
          <span className="text-2xl font-bold text-blue-600">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-6 mb-5 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-6 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-3"
            style={{ width: `${progress}%` }}
          >
            {progress > 15 && (
              <span className="text-xs text-white font-bold">{progress}%</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!paused ? (
                <div className="relative">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full relative"></div>
                </div>
              ) : (
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              )}
              <span className="text-sm font-medium text-gray-900">{currentStatus}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-600 font-medium">Sisa: {estimatedTime}</span>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
            <div className="text-xs text-gray-600 mb-1 font-semibold">Total Data</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
            <div className="text-xs text-blue-700 mb-1 font-semibold">Diproses</div>
            <div className="text-2xl font-bold text-blue-600">{stats.processed}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
            <div className="text-xs text-green-700 mb-1 font-semibold">Ditambahkan</div>
            <div className="text-2xl font-bold text-green-600">{stats.added}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200">
            <div className="text-xs text-orange-700 mb-1 font-semibold">Diperbarui</div>
            <div className="text-2xl font-bold text-orange-600">{stats.updated}</div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-200">
            <div className="text-xs text-gray-700 mb-1 font-semibold">Dilewati</div>
            <div className="text-2xl font-bold text-gray-600">{stats.skipped + stats.duplicates}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
            <div className="text-xs text-purple-700 mb-1 font-semibold">Retry</div>
            <div className="text-2xl font-bold text-purple-600">{stats.retries}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-2 border-yellow-200">
            <div className="text-xs text-yellow-700 mb-1 font-semibold">Duplikat</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.duplicates}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
            <div className="text-xs text-red-700 mb-1 font-semibold">Error</div>
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
          </div>
        </div>

        {/* Progress Logs */}
        {progressLogs.length > 0 && (
          <div className="mt-4 bg-white border-2 border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm sticky top-0 bg-white pb-2 border-b">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Progress Log ({progressLogs.length} entri)
            </h4>
            <div className="space-y-1">
              {progressLogs.slice(-20).reverse().map((log, idx) => (
                <div key={idx} className={`text-xs px-3 py-2 rounded flex items-start gap-2 ${
                  log.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                  log.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                  log.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                  log.type === 'retry' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                  'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  <span className="font-mono font-bold shrink-0">{log.timestamp}</span>
                  <span className={`font-bold shrink-0 ${
                    log.type === 'success' ? 'text-green-600' :
                    log.type === 'warning' ? 'text-yellow-600' :
                    log.type === 'error' ? 'text-red-600' :
                    log.type === 'retry' ? 'text-purple-600' :
                    'text-blue-600'
                  }`}>
                    {log.type === 'success' ? '✓' :
                     log.type === 'warning' ? '⚠' :
                     log.type === 'error' ? '✗' :
                     log.type === 'retry' ? '↻' : 'ℹ'}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3 mt-5">
          <button onClick={onPause} className="flex-1 px-5 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
            {paused ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Lanjutkan Upload
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z" />
                </svg>
                Jeda Upload
              </>
            )}
          </button>
          <button onClick={onCancel} className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Batalkan Upload
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {errorMessages.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-5 max-h-48 overflow-y-auto">
          <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2 text-lg">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Error Log ({errorMessages.length} item)
          </h4>
          <ul className="space-y-2">
            {errorMessages.slice(0, 5).map((msg, idx) => (
              <li key={idx} className="text-sm text-red-800 bg-white rounded px-3 py-2">
                <span className="font-bold">#{idx + 1}:</span> {msg}
              </li>
            ))}
            {errorMessages.length > 5 && (
              <li className="text-sm font-bold text-red-900 bg-red-200 rounded px-3 py-2">
                ... dan {errorMessages.length - 5} error lainnya
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

interface CompleteStepProps {
  stats: UploadStats;
  onComplete?: () => void;
}

function CompleteStep({ stats, onComplete }: CompleteStepProps) {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h3 className="text-3xl font-bold text-gray-900 mb-2">Upload Berhasil!</h3>
      <p className="text-gray-600 mb-8">Data telah berhasil diupload ke database</p>

      {/* Success Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
          <div className="text-sm font-semibold text-blue-700 mb-2">Total Data</div>
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200">
          <div className="text-sm font-semibold text-green-700 mb-2">Ditambahkan</div>
          <div className="text-3xl font-bold text-green-900">{stats.added}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200">
          <div className="text-sm font-semibold text-orange-700 mb-2">Diperbarui</div>
          <div className="text-3xl font-bold text-orange-900">{stats.updated}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-2">Dilewati</div>
          <div className="text-3xl font-bold text-gray-900">{stats.skipped}</div>
        </div>
      </div>

      {stats.errors > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 max-w-md mx-auto">
          <p className="text-red-800 font-semibold">⚠️ {stats.errors} data gagal diupload</p>
        </div>
      )}

      <button
        onClick={() => {
          if (onComplete) {
            onComplete();
          }
        }}
        className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
      >
        Selesai
      </button>
    </div>
  );
}

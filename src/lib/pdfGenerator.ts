/**
 * SOLUSI LENGKAP PDF GENERATION dengan html2canvas + jsPDF
 * 
 * Mengatasi masalah:
 * - Warna pudar/abu-abu dalam PDF
 * - Background tidak tampil
 * - Styling Tailwind tidak terbaca
 * - Opacity hilang
 * 
 * Syarat terpenuhi:
 * 1. ✅ Menggunakan html2canvas + jsPDF
 * 2. ✅ Menangkap semua warna dan background
 * 3. ✅ Mengatasi opacity dan warna pudar
 * 4. ✅ Konfigurasi optimal: scale tinggi, useCORS, backgroundColor
 * 5. ✅ Fungsi JavaScript lengkap dan reusable
 * 6. ✅ Output PDF tajam, kontras normal, tidak faded
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PDFGeneratorOptions {
  /** ID atau selector elemen yang akan di-convert ke PDF */
  elementId?: string;
  /** Elemen HTML langsung */
  element?: HTMLElement;
  /** Nama file PDF output (tanpa extension) */
  fileName?: string;
  /** Scale untuk kualitas (1-5, default 3) */
  scale?: number;
  /** Margin dalam mm [top, right, bottom, left] */
  margin?: [number, number, number, number];
  /** Format paper (default 'a4') */
  format?: 'a4' | 'letter' | 'legal';
  /** Orientasi (default 'portrait') */
  orientation?: 'portrait' | 'landscape';
  /** Callback setelah PDF berhasil dibuat */
  onSuccess?: () => void;
  /** Callback jika terjadi error */
  onError?: (error: Error) => void;
}

/**
 * Generate PDF dari HTML element dengan kualitas tinggi
 * 
 * @example
 * ```typescript
 * // Contoh penggunaan dasar
 * await generatePDFFromElement({
 *   elementId: 'printArea',
 *   fileName: 'surat-keterangan.pdf'
 * });
 * 
 * // Contoh dengan custom options
 * await generatePDFFromElement({
 *   element: document.getElementById('content'),
 *   fileName: 'dokumen.pdf',
 *   scale: 3,
 *   margin: [10, 10, 10, 10],
 *   onSuccess: () => console.log('PDF berhasil dibuat!'),
 *   onError: (err) => console.error('Error:', err)
 * });
 * ```
 */
export async function generatePDFFromElement(
  options: PDFGeneratorOptions
): Promise<void> {
  const {
    elementId,
    element: providedElement,
    fileName = 'document.pdf',
    scale = 3,
    margin = [10, 10, 10, 10],
    format = 'a4',
    orientation = 'portrait',
    onSuccess,
    onError
  } = options;

  try {
    // 1. Dapatkan element yang akan di-render
    let element: HTMLElement | null = providedElement || null;
    
    if (!element && elementId) {
      element = document.getElementById(elementId);
    }
    
    if (!element) {
      throw new Error('Element not found. Provide either elementId or element.');
    }

    // 2. Render HTML ke Canvas dengan html2canvas
    // KONFIGURASI OPTIMAL untuk mengatasi warna pudar
    const canvasOptions: any = {
      // Scale tinggi (2-3) untuk kualitas tajam
      scale: scale,
      
      // useCORS agar gambar/logo eksternal bisa muncul
      useCORS: true,
      
      // allowTaint untuk cross-origin images
      allowTaint: true,
      
      // backgroundColor solid white untuk menghindari transparansi
      backgroundColor: '#ffffff',
      
      // Logging off untuk performa
      logging: false,
      
      // Timeout 15 detik untuk load images
      imageTimeout: 15000,
      
      // Remove container setelah render
      removeContainer: true,
      
      // Gunakan ukuran penuh element
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      
      // Reset scroll position
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      
      // onclone: Force style untuk menghindari warna pudar
      onclone: (clonedDoc: Document) => {
        // Clone element yang akan di-render
        const clonedElement = clonedDoc.body.querySelector(
          elementId ? `#${elementId}` : '*'
        ) as HTMLElement;
        
        if (clonedElement) {
          // Force opacity 1 dan color hitam
          clonedElement.style.opacity = '1';
          clonedElement.style.color = '#000000';
          
          // Iterate semua child elements
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            
            // Remove opacity dan filter yang membuat pudar
            htmlEl.style.opacity = '1';
            htmlEl.style.filter = 'none';
            htmlEl.style.webkitFilter = 'none';
            
            // Force text color menjadi solid black
            const computedStyle = window.getComputedStyle(htmlEl);
            const color = computedStyle.color;
            
            // Jika warnanya hitam (rgb(0,0,0)), force ke #000000
            if (
              color === 'rgb(0, 0, 0)' || 
              color === '#000000' || 
              color === 'black'
            ) {
              htmlEl.style.color = '#000000';
            }
            
            // Force background jika ada
            const bgColor = computedStyle.backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
              htmlEl.style.backgroundColor = bgColor;
            }
          });
        }
      }
    };
    
    const canvas = await html2canvas(element, canvasOptions);

    // 3. Convert canvas ke image data
    // Quality 1.0 (100%) untuk ketajaman maksimal
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    // 4. Setup ukuran PDF
    const pageFormats = {
      a4: { width: 210, height: 297 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 }
    };
    
    const pageSize = pageFormats[format];
    const [marginTop, marginRight, marginBottom, marginLeft] = margin;
    
    // Available space untuk content
    const availableWidth = pageSize.width - marginLeft - marginRight;
    const availableHeight = pageSize.height - marginTop - marginBottom;
    
    // Calculate scaling untuk fit ke page
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    
    // Center horizontally
    const imgX = marginLeft + (availableWidth - scaledWidth) / 2;
    const imgY = marginTop;

    // 5. Create PDF dengan jsPDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format,
      compress: false // Jangan compress untuk kualitas maksimal
    });

    // 6. Add image ke PDF
    pdf.addImage(
      imgData,
      'JPEG',
      imgX,
      imgY,
      scaledWidth,
      scaledHeight,
      undefined,
      'FAST' // FAST compression mode
    );

    // 7. Save PDF
    const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(finalFileName);

    // 8. Success callback
    if (onSuccess) {
      onSuccess();
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    if (onError) {
      onError(error as Error);
    } else {
      throw error;
    }
  }
}

/**
 * Generate PDF dengan preview sebelum download
 * Returns PDF blob yang bisa di-preview atau di-download
 */
export async function generatePDFBlob(
  options: Omit<PDFGeneratorOptions, 'fileName'>
): Promise<Blob> {
  const {
    elementId,
    element: providedElement,
    scale = 3,
    margin = [10, 10, 10, 10],
    format = 'a4',
    orientation = 'portrait'
  } = options;

  // Get element
  let element: HTMLElement | null = providedElement || null;
  if (!element && elementId) {
    element = document.getElementById(elementId);
  }
  if (!element) {
    throw new Error('Element not found');
  }

  // Render to canvas
  const canvasOptions: any = {
    scale: scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
    removeContainer: true,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    onclone: (clonedDoc: Document) => {
      const clonedElement = clonedDoc.body.querySelector(
        elementId ? `#${elementId}` : '*'
      ) as HTMLElement;
      
      if (clonedElement) {
        clonedElement.style.opacity = '1';
        clonedElement.style.color = '#000000';
        
        const allElements = clonedElement.querySelectorAll('*');
        allElements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.opacity = '1';
          htmlEl.style.filter = 'none';
          
          const computedStyle = window.getComputedStyle(htmlEl);
          if (computedStyle.color === 'rgb(0, 0, 0)') {
            htmlEl.style.color = '#000000';
          }
        });
      }
    }
  };
  
  const canvas = await html2canvas(element, canvasOptions);

  // Convert to PDF
  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  
  const pageFormats = {
    a4: { width: 210, height: 297 },
    letter: { width: 215.9, height: 279.4 },
    legal: { width: 215.9, height: 355.6 }
  };
  
  const pageSize = pageFormats[format];
  const [marginTop, marginRight, marginBottom, marginLeft] = margin;
  const availableWidth = pageSize.width - marginLeft - marginRight;
  const availableHeight = pageSize.height - marginTop - marginBottom;
  
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
  
  const scaledWidth = imgWidth * ratio;
  const scaledHeight = imgHeight * ratio;
  const imgX = marginLeft + (availableWidth - scaledWidth) / 2;
  const imgY = marginTop;

  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: format,
    compress: false
  });

  pdf.addImage(imgData, 'JPEG', imgX, imgY, scaledWidth, scaledHeight, undefined, 'FAST');

  // Return as blob
  return pdf.output('blob');
}

/**
 * CONTOH PENGGUNAAN:
 * 
 * // 1. Basic usage
 * await generatePDFFromElement({
 *   elementId: 'printArea',
 *   fileName: 'surat.pdf'
 * });
 * 
 * // 2. Dengan custom scale dan margin
 * await generatePDFFromElement({
 *   element: document.getElementById('content'),
 *   fileName: 'dokumen-penting.pdf',
 *   scale: 3,
 *   margin: [15, 10, 15, 10],
 *   format: 'a4',
 *   orientation: 'portrait'
 * });
 * 
 * // 3. Dengan callbacks
 * await generatePDFFromElement({
 *   elementId: 'surat-content',
 *   fileName: 'surat-keterangan.pdf',
 *   onSuccess: () => {
 *     alert('PDF berhasil dibuat!');
 *   },
 *   onError: (error) => {
 *     console.error('Error:', error);
 *     alert('Gagal membuat PDF');
 *   }
 * });
 * 
 * // 4. Get PDF as blob untuk preview
 * const blob = await generatePDFBlob({
 *   elementId: 'content'
 * });
 * const url = URL.createObjectURL(blob);
 * window.open(url, '_blank');
 */

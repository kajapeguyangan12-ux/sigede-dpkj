/**
 * Generate PDF from Hidden Print Area
 * 
 * Fungsi ini akan:
 * 1. Mengambil element #print-area yang hidden
 * 2. Memberi delay untuk memastikan images loaded
 * 3. Capture dengan html2canvas
 * 4. Convert ke PDF dengan jsPDF
 * 5. Return sebagai Blob untuk ZIP
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generate PDF dari surat dan return sebagai Blob
 * @param {Object} dataSurat - Data surat yang akan digenerate
 * @param {string} nomorSurat - Nomor surat untuk filename
 * @returns {Promise<Blob>} - PDF sebagai Blob
 */
export async function generateSuratPDF(dataSurat, nomorSurat = 'surat') {
  try {
    console.log('📄 Starting PDF generation for:', nomorSurat);
    console.log('📋 Data surat:', dataSurat);
    
    // 1. Ambil element #print-area
    const printArea = document.getElementById('print-area');
    
    if (!printArea) {
      throw new Error('Element #print-area tidak ditemukan. Pastikan sudah ada di DOM.');
    }
    
    // Get the actual content inside print-area
    const content = printArea.querySelector('div');
    if (!content) {
      throw new Error('No content found inside #print-area');
    }
    
    console.log('✅ Found print area with content');
    console.log('Content HTML length:', content.innerHTML.length);
    
    // 2. Save original styles
    const originalPosition = printArea.style.position;
    const originalLeft = printArea.style.left;
    const originalTop = printArea.style.top;
    const originalOpacity = printArea.style.opacity;
    const originalZIndex = printArea.style.zIndex;
    
    // 3. Force render dengan visibility - KEEP OFF-SCREEN
    printArea.style.position = 'fixed';
    printArea.style.left = '-9999px'; // Keep hidden from user
    printArea.style.top = '0';
    printArea.style.opacity = '1';
    printArea.style.zIndex = '10000';
    printArea.style.backgroundColor = '#ffffff';
    
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 3. Check dimensions after making visible
    const rect = content.getBoundingClientRect();
    console.log('📐 Content dimensions:', {
      width: rect.width,
      height: rect.height,
      scrollWidth: content.scrollWidth,
      scrollHeight: content.scrollHeight
    });
    
    if (rect.width === 0 || rect.height === 0) {
      // Try to force dimensions
      content.style.width = '210mm';
      content.style.minHeight = '297mm';
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newRect = content.getBoundingClientRect();
      console.log('📐 After forcing dimensions:', newRect.width, 'x', newRect.height);
      
      if (newRect.width === 0 || newRect.height === 0) {
        throw new Error('Element masih memiliki ukuran 0 setelah dipaksa visible');
      }
    }
    
    // 4. Wait for images to load
    console.log('⏳ Waiting for images to load...');
    await waitForImagesToLoad(content);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('📸 Starting html2canvas capture...');
    
    // 5. Capture dengan html2canvas
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: true,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('#print-area div');
        if (clonedElement) {
          clonedElement.style.opacity = '1';
          clonedElement.style.visibility = 'visible';
          clonedElement.style.display = 'block';
          clonedElement.style.width = '210mm';
          clonedElement.style.backgroundColor = '#ffffff';
          
          // Force all children visible
          const allChildren = clonedElement.querySelectorAll('*');
          allChildren.forEach(el => {
            el.style.opacity = '1';
            el.style.visibility = 'visible';
          });
          
          console.log('✅ Cloned element prepared, children count:', allChildren.length);
        }
      }
    });
    
    // 6. Restore original styles
    printArea.style.position = originalPosition;
    printArea.style.left = originalLeft;
    printArea.style.top = originalTop;
    printArea.style.opacity = originalOpacity;
    printArea.style.zIndex = originalZIndex;
    
    console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);
    
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas kosong (0 dimensions). Periksa content element.');
    }
    
    // 7. Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // 8. Create PDF (A4 size)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    
    // Calculate aspect ratio to fit A4
    const canvasAspectRatio = canvas.height / canvas.width;
    const pdfAspectRatio = pdfHeight / pdfWidth;
    
    let imgWidth = pdfWidth;
    let imgHeight = pdfWidth * canvasAspectRatio;
    
    // If image is too tall, scale to fit height
    if (imgHeight > pdfHeight) {
      imgHeight = pdfHeight;
      imgWidth = pdfHeight / canvasAspectRatio;
    }
    
    // Center the image on the page
    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = (pdfHeight - imgHeight) / 2;
    
    console.log('📄 Adding image to PDF...');
    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);
    
    // 9. Convert PDF to Blob
    const pdfBlob = pdf.output('blob');
    
    console.log('✅ PDF generated successfully as Blob:', pdfBlob.size, 'bytes');
    
    return pdfBlob;
    
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    throw new Error(`Gagal generate PDF: ${error.message}`);
  }
}

/**
 * Wait for all images in element to load
 * @param {HTMLElement} element - Element yang mengandung images
 * @returns {Promise<void>}
 */
async function waitForImagesToLoad(element) {
  const images = element.querySelectorAll('img');
  
  if (images.length === 0) {
    console.log('ℹ️ No images found in element');
    return;
  }
  
  console.log(`🖼️ Waiting for ${images.length} images to load...`);
  
  const imagePromises = Array.from(images).map(img => {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve();
      } else {
        img.addEventListener('load', resolve);
        img.addEventListener('error', () => {
          console.warn('⚠️ Image failed to load:', img.src);
          resolve(); // Resolve anyway to not block
        });
        // Timeout after 10 seconds
        setTimeout(resolve, 10000);
      }
    });
  });
  
  await Promise.all(imagePromises);
  console.log('✅ All images loaded');
}

/**
 * Generate multiple PDFs and add to ZIP
 * @param {Array} suratList - Array of surat data
 * @param {JSZip} zip - JSZip instance
 * @returns {Promise<void>}
 */
export async function generateMultipleSuratPDF(suratList, zip) {
  console.log(`📦 Generating ${suratList.length} PDFs for ZIP...`);
  
  for (let i = 0; i < suratList.length; i++) {
    const surat = suratList[i];
    const nomorSurat = surat.nomorSurat || `surat-${i + 1}`;
    
    console.log(`📄 [${i + 1}/${suratList.length}] Generating: ${nomorSurat}`);
    
    try {
      // Update hidden element dengan data surat
      const printArea = document.getElementById('print-area');
      if (printArea) {
        // Trigger re-render dengan data baru
        // (implementasi spesifik tergantung struktur component)
        printArea.setAttribute('data-surat-id', surat.id);
      }
      
      // Generate PDF
      const pdfBlob = await generateSuratPDF(surat, nomorSurat);
      
      // Add to ZIP
      const filename = `${nomorSurat.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
      zip.file(filename, pdfBlob);
      
      console.log(`✅ Added to ZIP: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Failed to generate PDF for ${nomorSurat}:`, error);
      // Continue with next surat
    }
  }
  
  console.log('✅ All PDFs added to ZIP');
}

export default generateSuratPDF;

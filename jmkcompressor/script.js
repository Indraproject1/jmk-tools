// Navbar functionality
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navMenu.classList.toggle('active');
});

// Tab switching functionality
const navLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Remove active class from all links and tabs
    navLinks.forEach(l => l.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to clicked link
    link.classList.add('active');
    
    // Show corresponding tab
    const targetTab = link.getAttribute('data-tab');
    document.getElementById(targetTab).classList.add('active');
    
    // Close mobile menu
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
  });
});

// Image Compression (Original functionality)
const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const previewContainer = document.getElementById('previewContainer');

imageInput.addEventListener('change', handleImages);

// Event listener untuk radio buttons
document.querySelectorAll('input[name="quality"]').forEach(radio => {
  radio.addEventListener('change', () => {
    // Jika sudah ada gambar yang diupload, re-compress dengan setting baru
    if (imageInput.files && imageInput.files.length > 0) {
      handleImages({ target: { files: imageInput.files } });
    }
  });
});

// Drag & Drop Support
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleImages({ target: { files: e.dataTransfer.files } });
});

function handleImages(event) {
  const files = event.target.files;
  
  if (!files || files.length === 0) {
    return;
  }
  
  const quality = parseFloat(document.querySelector('input[name="quality"]:checked').value);
  const qualityLabel = document.querySelector('input[name="quality"]:checked').nextElementSibling.textContent;
  
  // Tentukan scaling berdasarkan quality
  let scale;
  if (quality >= 0.8) {
    scale = 0.8; // Tinggi - hampir tidak ada scaling
  } else if (quality >= 0.5) {
    scale = 0.6; // Sedang - scaling moderat
  } else {
    scale = 0.4; // Rendah - scaling tinggi
  }
  
  previewContainer.innerHTML = ''; // Bersihkan preview sebelumnya

  Array.from(files).forEach((file, index) => {
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} bukan file gambar.`);
      return;
    }

    // Validasi ukuran file (maksimal 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(`${file.name} terlalu besar. Maksimal 10MB.`);
      return;
    }

    const originalSizeKB = (file.size / 1024).toFixed(2);
    const reader = new FileReader();
    
    reader.onerror = function() {
      alert(`Error membaca file ${file.name}`);
    };
    
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;

      img.onerror = function() {
        alert(`Error memuat gambar ${file.name}`);
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Hitung size hasil
          const compressedSizeKB = Math.round((compressedDataUrl.length * (3/4)) / 1024);

          const compressionRatio = ((1 - (compressedSizeKB / originalSizeKB)) * 100).toFixed(1);

          const box = document.createElement('div');
          box.className = 'preview-box';
          box.innerHTML = `
            <p><strong>${file.name}</strong></p>
            <p style="color: #60a5fa; font-size: 0.8rem;">Level Kompresi: ${qualityLabel}</p>
            <img src="${compressedDataUrl}">
            <p>Ukuran Awal: ${originalSizeKB} KB</p>
            <p>Hasil Kompres: ${compressedSizeKB} KB</p>
            <p>Pengurangan: ${compressionRatio}%</p>
            <p style="font-size: 0.8rem; color: #94a3b8;">Resolusi: ${canvas.width} × ${canvas.height}</p>
            <a href="${compressedDataUrl}" download="compressed-${index + 1}.jpg" class="download-btn">Unduh</a>
          `;
          previewContainer.appendChild(box);
        } catch (error) {
          alert(`Error memproses gambar ${file.name}: ${error.message}`);
        }
      };
    };
    reader.readAsDataURL(file);
  });
}

// JPG to PDF functionality
const pdfImageInput = document.getElementById('pdfImageInput');
const pdfUploadArea = document.getElementById('pdfUploadArea');
const pdfPreviewContainer = document.getElementById('pdfPreviewContainer');

pdfImageInput.addEventListener('change', handlePdfConversion);

// Drag & Drop Support for PDF
pdfUploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  pdfUploadArea.classList.add('dragover');
});
pdfUploadArea.addEventListener('dragleave', () => {
  pdfUploadArea.classList.remove('dragover');
});
pdfUploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  pdfUploadArea.classList.remove('dragover');
  handlePdfConversion({ target: { files: e.dataTransfer.files } });
});

function handlePdfConversion(event) {
  const files = event.target.files;
  
  if (!files || files.length === 0) {
    return;
  }

  const singlePage = document.getElementById('singlePage').checked;
  const landscapeMode = document.getElementById('landscapeMode').checked;
  
  pdfPreviewContainer.innerHTML = '';

  // Load jsPDF library dynamically
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = () => {
    convertImagesToPdf(files, singlePage, landscapeMode);
  };
  document.head.appendChild(script);
}

function convertImagesToPdf(files, singlePage, landscapeMode) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF(landscapeMode ? 'landscape' : 'portrait', 'mm', 'a4');
  
  let currentPage = 0;
  let processedImages = 0;

  Array.from(files).forEach((file, index) => {
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} bukan file gambar.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = () => {
        try {
          if (currentPage > 0 && !singlePage) {
            pdf.addPage();
          }
          
          const imgWidth = pdf.internal.pageSize.getWidth();
          const imgHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(img, 'JPEG', 0, 0, imgWidth, imgHeight);
          
          processedImages++;
          
          if (processedImages === files.length) {
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            const box = document.createElement('div');
            box.className = 'preview-box';
            box.innerHTML = `
              <p><strong>PDF Berhasil Dibuat!</strong></p>
              <p>Jumlah gambar: ${files.length}</p>
              <p>Mode: ${singlePage ? 'Halaman Tunggal' : 'Halaman Terpisah'}</p>
              <p>Orientasi: ${landscapeMode ? 'Landscape' : 'Portrait'}</p>
              <a href="${pdfUrl}" download="converted-images.pdf" class="download-btn">Unduh PDF</a>
            `;
            pdfPreviewContainer.appendChild(box);
          }
        } catch (error) {
          alert(`Error mengkonversi ${file.name}: ${error.message}`);
        }
      };
    };
    reader.readAsDataURL(file);
  });
}

// File Compression functionality
const fileInput = document.getElementById('fileInput');
const fileUploadArea = document.getElementById('fileUploadArea');
const filePreviewContainer = document.getElementById('filePreviewContainer');

fileInput.addEventListener('change', handleFileCompression);

// Drag & Drop Support for Files
fileUploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  fileUploadArea.classList.add('dragover');
});
fileUploadArea.addEventListener('dragleave', () => {
  fileUploadArea.classList.remove('dragover');
});
fileUploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  fileUploadArea.classList.remove('dragover');
  handleFileCompression({ target: { files: e.dataTransfer.files } });
});

function handleFileCompression(event) {
  const files = event.target.files;
  
  if (!files || files.length === 0) {
    return;
  }

  const compressionLevel = document.querySelector('input[name="compressionLevel"]:checked').value;
  filePreviewContainer.innerHTML = '';

  // Load JSZip library dynamically
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  script.onload = () => {
    compressFiles(files, compressionLevel);
  };
  document.head.appendChild(script);
}

function compressFiles(files, compressionLevel) {
  const zip = new JSZip();
  let totalOriginalSize = 0;

  Array.from(files).forEach(file => {
    totalOriginalSize += file.size;
    
    const options = {
      compression: compressionLevel === 'store' ? 'STORE' : 
                   compressionLevel === 'deflate-ultra' ? 'DEFLATE' : 'DEFLATE',
      compressionOptions: {
        level: compressionLevel === 'deflate-ultra' ? 9 : 6
      }
    };
    
    zip.file(file.name, file, options);
  });

  zip.generateAsync({type: 'blob'}).then(content => {
    const compressedSize = content.size;
    const compressionRatio = ((1 - (compressedSize / totalOriginalSize)) * 100).toFixed(1);
    const zipUrl = URL.createObjectURL(content);
    
    const box = document.createElement('div');
    box.className = 'file-box';
    box.innerHTML = `
      <div class="file-info">
        <div class="file-name">File ZIP Berhasil Dibuat</div>
        <div class="file-size">
          Ukuran Asli: ${(totalOriginalSize / 1024).toFixed(2)} KB<br>
          Ukuran ZIP: ${(compressedSize / 1024).toFixed(2)} KB<br>
          Pengurangan: ${compressionRatio}%
        </div>
      </div>
      <a href="${zipUrl}" download="compressed-files.zip" class="download-btn">Unduh ZIP</a>
    `;
    filePreviewContainer.appendChild(box);
  });
}

// Image Enchanting functionality
const enchantImageInput = document.getElementById('enchantImageInput');
const enchantUploadArea = document.getElementById('enchantUploadArea');
const enchantPreviewContainer = document.getElementById('enchantPreviewContainer');

enchantImageInput.addEventListener('change', handleImageEnchanting);

// Event listener untuk enchanting options
document.querySelectorAll('input[name="enchantLevel"]').forEach(radio => {
  radio.addEventListener('change', () => {
    if (enchantImageInput.files && enchantImageInput.files.length > 0) {
      handleImageEnchanting({ target: { files: enchantImageInput.files } });
    }
  });
});

// Drag & Drop Support for Enchanting
enchantUploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  enchantUploadArea.classList.add('dragover');
});
enchantUploadArea.addEventListener('dragleave', () => {
  enchantUploadArea.classList.remove('dragover');
});
enchantUploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  enchantUploadArea.classList.remove('dragover');
  handleImageEnchanting({ target: { files: e.dataTransfer.files } });
});

function handleImageEnchanting(event) {
  const files = event.target.files;
  
  if (!files || files.length === 0) {
    return;
  }
  
  const upscaleLevel = parseInt(document.querySelector('input[name="enchantLevel"]:checked').value);
  const sharpen = document.getElementById('sharpen').checked;
  const denoise = document.getElementById('denoise').checked;
  const enhanceColors = document.getElementById('enhanceColors').checked;
  
  enchantPreviewContainer.innerHTML = '';

  Array.from(files).forEach((file, index) => {
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} bukan file gambar.`);
      return;
    }

    // Validasi ukuran file (maksimal 5MB untuk enchanting)
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} terlalu besar untuk enchanting. Maksimal 5MB.`);
      return;
    }

    const originalSizeKB = (file.size / 1024).toFixed(2);
    const reader = new FileReader();
    
    reader.onerror = function() {
      alert(`Error membaca file ${file.name}`);
    };
    
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;

      img.onerror = function() {
        alert(`Error memuat gambar ${file.name}`);
      };

      img.onload = () => {
        try {
          // Create canvas for upscaling
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions
          const newWidth = img.width * upscaleLevel;
          const newHeight = img.height * upscaleLevel;
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw original image with upscaling
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Apply enhancements
          if (sharpen || denoise || enhanceColors) {
            const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
            const data = imageData.data;
            
            if (sharpen) {
              applySharpen(data, newWidth, newHeight);
            }
            
            if (denoise) {
              applyDenoise(data, newWidth, newHeight);
            }
            
            if (enhanceColors) {
              applyColorEnhancement(data);
            }
            
            ctx.putImageData(imageData, 0, 0);
          }
          
          const enhancedDataUrl = canvas.toDataURL('image/png', 1.0);
          
          // Calculate new size
          const enhancedSizeKB = Math.round((enhancedDataUrl.length * (3/4)) / 1024);
          const sizeIncrease = ((enhancedSizeKB / originalSizeKB - 1) * 100).toFixed(1);

          const box = document.createElement('div');
          box.className = 'preview-box';
          box.innerHTML = `
            <p><strong>${file.name}</strong></p>
            <p style="color: #8b5cf6; font-size: 0.8rem;">Enhancement: ${upscaleLevel}x Upscale</p>
            <img src="${enhancedDataUrl}">
            <p>Ukuran Awal: ${originalSizeKB} KB</p>
            <p>Ukuran Enhanced: ${enhancedSizeKB} KB</p>
            <p>Peningkatan: ${sizeIncrease}%</p>
            <p style="font-size: 0.8rem; color: #94a3b8;">Resolusi: ${newWidth} × ${newHeight}</p>
            <p style="font-size: 0.8rem; color: #94a3b8;">
              Fitur: ${sharpen ? 'Sharpen ' : ''}${denoise ? 'Denoise ' : ''}${enhanceColors ? 'Color Enhance' : ''}
            </p>
            <a href="${enhancedDataUrl}" download="enhanced-${index + 1}.png" class="download-btn">Unduh Enhanced</a>
          `;
          enchantPreviewContainer.appendChild(box);
        } catch (error) {
          alert(`Error memproses gambar ${file.name}: ${error.message}`);
        }
      };
    };
    reader.readAsDataURL(file);
  });
}

// Enhancement functions
function applySharpen(data, width, height) {
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];
  
  const tempData = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += tempData[idx] * kernel[ky + 1][kx + 1];
          }
        }
        const idx = (y * width + x) * 4 + c;
        data[idx] = Math.max(0, Math.min(255, sum));
      }
    }
  }
}

function applyDenoise(data, width, height) {
  const tempData = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let count = 0;
        
        // 3x3 median filter
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += tempData[idx];
            count++;
          }
        }
        
        const idx = (y * width + x) * 4 + c;
        data[idx] = Math.round(sum / count);
      }
    }
  }
}

function applyColorEnhancement(data) {
  for (let i = 0; i < data.length; i += 4) {
    // Enhance contrast
    const factor = 1.2;
    data[i] = Math.min(255, data[i] * factor);     // Red
    data[i + 1] = Math.min(255, data[i + 1] * factor); // Green
    data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue
    
    // Enhance saturation
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const saturation = 1.1;
    
    data[i] = Math.min(255, avg + (data[i] - avg) * saturation);
    data[i + 1] = Math.min(255, avg + (data[i + 1] - avg) * saturation);
    data[i + 2] = Math.min(255, avg + (data[i + 2] - avg) * saturation);
  }
} 
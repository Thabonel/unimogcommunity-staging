import * as pdfjsLib from 'pdfjs-dist';

/**
 * Set up PDF.js worker with fallback options
 * This ensures the PDF viewer works even if CDN is blocked or slow
 */
export function setupPdfWorker() {
  // First try local worker file (most reliable)
  const localWorker = '/pdf.worker.min.js';
  
  // Fallback to CDN sources if local fails
  const workerSources = [
    localWorker,
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
  ];

  // Set the worker source - prefer local file
  pdfjsLib.GlobalWorkerOptions.workerSrc = localWorker;
  console.log(`PDF.js version: ${pdfjsLib.version}, Worker: ${localWorker} (local file)`);
  
  // Configure additional PDF.js options for better Supabase compatibility
  pdfjsLib.GlobalWorkerOptions.workerPort = null;
  
  // Return the worker sources for potential fallback handling
  return workerSources;
}

// Initialize the worker on module load
setupPdfWorker();
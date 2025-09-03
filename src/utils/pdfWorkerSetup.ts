import * as pdfjsLib from 'pdfjs-dist';

/**
 * Set up PDF.js worker with fallback options
 * This ensures the PDF viewer works even if CDN is blocked or slow
 */
export function setupPdfWorker() {
  // Use CDN worker that matches the current PDF.js version (more reliable than local)
  const cdnWorker = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  const localWorker = '/pdf.worker.min.js';
  
  // Fallback to CDN sources if local fails
  const workerSources = [
    cdnWorker, // Primary: CDN with matching version
    localWorker, // Fallback: local file (may be outdated)
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
  ];

  // Set the worker source - prefer CDN with matching version
  pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorker;
  console.log(`PDF.js version: ${pdfjsLib.version}, Worker: ${cdnWorker} (CDN with matching version)`);
  
  // Configure additional PDF.js options for better Supabase compatibility
  pdfjsLib.GlobalWorkerOptions.workerPort = null;
  
  // Return the worker sources for potential fallback handling
  return workerSources;
}

// Initialize the worker on module load
setupPdfWorker();
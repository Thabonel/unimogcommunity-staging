import * as pdfjsLib from 'pdfjs-dist';

/**
 * PDF.js worker configuration - DEPRECATED
 * This file is kept for backwards compatibility but no longer sets worker source
 * Worker is now configured in SimplePDFViewer.tsx to auto-match library version
 */
export function setupPdfWorker() {
  // Fallback CDN sources for reference (not actively used)
  const workerSources = [
    '/pdf.worker.min.js',
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
  ];

  // Do NOT set worker source here - it's handled in SimplePDFViewer.tsx
  // This prevents configuration conflicts that cause version mismatch errors
  console.log(`PDF.js version: ${pdfjsLib.version}, Worker: configured in component`);
  
  // Configure additional PDF.js options for better Supabase compatibility
  pdfjsLib.GlobalWorkerOptions.workerPort = null;
  
  // Return the worker sources for reference
  return workerSources;
}
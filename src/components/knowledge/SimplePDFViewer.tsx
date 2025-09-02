import React from 'react';
import { PDFViewerLayout } from './PDFViewerLayout';
import * as pdfjsLib from 'pdfjs-dist';
import { usePdfSearch } from '@/hooks/use-pdf-search';
import { PdfCanvas } from './pdf-viewer/PdfCanvas';
import { PdfSearchBar } from './pdf-viewer/PdfSearchBar';
import { usePdfViewerState } from './pdf-viewer/usePdfViewerState';
import { usePdfLoader } from './pdf-viewer/usePdfLoader';
import { toast } from '@/hooks/use-toast';

// Set up the worker source with fallback options
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

interface SimplePDFViewerProps {
  url: string;
  onClose: () => void;
}

export function SimplePDFViewer({ url, onClose }: SimplePDFViewerProps) {
  // Use our custom hooks for state management and PDF loading
  const {
    currentPage,
    setCurrentPage,
    numPages,
    setNumPages,
    scale,
    isLoading,
    setIsLoading,
    isContinuousMode,
    error,
    setError,
    pdfDoc,
    setPdfDoc,
    handleZoomIn,
    handleZoomOut,
    handleToggleViewMode
  } = usePdfViewerState();

  // Load PDF when component mounts or URL changes
  usePdfLoader({
    url,
    setPdfDoc,
    setNumPages,
    setCurrentPage,
    setIsLoading,
    setError
  });

  // Set up search functionality
  const { 
    searchTerm, 
    searchResults,
    currentSearchResultIndex,
    searchResultsCount,
    handleSearch,
    navigateToNextResult,
    navigateToPrevResult
  } = usePdfSearch({ 
    pdfDoc, 
    numPages, 
    currentPage, 
    setCurrentPage 
  });

  // Explicitly handle page changes
  const handlePageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
    }
  };

  // Handle document download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    
    // Try to get the filename from the URL
    const urlParts = url.split('/');
    let fileName = urlParts[urlParts.length - 1].split('?')[0];
    
    // Ensure it has a .pdf extension
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      fileName += '.pdf';
    }
    
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your PDF is being downloaded"
    });
  };

  // Handle print functionality
  const handlePrint = () => {
    toast({
      title: "Preparing document",
      description: "Opening browser print dialog..."
    });
    
    // Use browser's print functionality
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <PDFViewerLayout
      isLoading={isLoading}
      error={error}
      controls={{
        currentPage,
        numPages,
        scale,
        isContinuousMode
      }}
      actions={{
        onPageChange: handlePageChange,
        onZoomIn: handleZoomIn,
        onZoomOut: handleZoomOut,
        onClose,
        onToggleViewMode: handleToggleViewMode,
        onPrint: handlePrint,
        onDownload: handleDownload
      }}
      searchComponent={
        <PdfSearchBar
          searchTerm={searchTerm}
          searchResultsCount={searchResultsCount}
          currentSearchResultIndex={currentSearchResultIndex}
          onSearchChange={handleSearch}
          onNextResult={navigateToNextResult}
          onPrevResult={navigateToPrevResult}
        />
      }
    >
      <div className="flex justify-center p-4">
        {pdfDoc && (
          <PdfCanvas
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            scale={scale}
            searchTerm={searchTerm}
            searchResults={searchResults}
            currentSearchResultIndex={currentSearchResultIndex}
          />
        )}
      </div>
    </PDFViewerLayout>
  );
}

import React from 'react';
import { PDFViewerLayout } from './PDFViewerLayout';
import * as pdfjsLib from 'pdfjs-dist';
import { usePdfSearch } from '@/hooks/use-pdf-search';
import { PdfCanvas } from './pdf-viewer/PdfCanvas';
import { PdfSearchBar } from './pdf-viewer/PdfSearchBar';
import { usePdfViewerState } from './pdf-viewer/usePdfViewerState';
import { usePdfLoader } from './pdf-viewer/usePdfLoader';
import { toast } from '@/hooks/use-toast';
import '@/utils/pdfWorkerSetup'; // Initialize PDF.js worker

interface SimplePDFViewerProps {
  url: string;
  onClose: () => void;
}

export function SimplePDFViewer({ url, onClose }: SimplePDFViewerProps) {
  console.log('🎯 SimplePDFViewer rendered with URL:', url);
  
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

  // Fallback: Open PDF in new tab
  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
    toast({
      title: "Opening PDF",
      description: "PDF will open in a new tab"
    });
  };

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
    console.log(`Changing to page ${page} of ${numPages}`);
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
    }
  };

  // Add keyboard and mouse wheel navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdfDoc) return;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          handlePageChange(currentPage - 1);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          handlePageChange(currentPage + 1);
          break;
        case 'Home':
          e.preventDefault();
          handlePageChange(1);
          break;
        case 'End':
          e.preventDefault();
          handlePageChange(numPages);
          break;
      }
    };
    
    // Add mouse wheel navigation
    const handleWheel = (e: WheelEvent) => {
      if (!pdfDoc) return;
      
      // Only handle wheel events when the PDF viewer is open
      const pdfViewerElement = document.querySelector('.pdf-container');
      if (!pdfViewerElement) return;
      
      e.preventDefault();
      
      // Scroll down = next page, scroll up = previous page
      if (e.deltaY > 0) {
        handlePageChange(currentPage + 1);
      } else if (e.deltaY < 0) {
        handlePageChange(currentPage - 1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    // Use passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [currentPage, numPages, pdfDoc]);

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

  // If there's an error and we have a URL, show option to open directly
  console.log('🚨 PDF Viewer Error Check:', { error, url, isLoading });
  if (error && url) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
          <h2 className="text-lg font-semibold mb-4">PDF Viewer Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleOpenInNewTab}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Open PDF in New Tab
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2 border border-input rounded hover:bg-accent"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

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

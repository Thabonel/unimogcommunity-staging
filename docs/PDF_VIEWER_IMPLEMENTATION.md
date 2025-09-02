# PDF Viewer Implementation Guide

## 🎯 Overview
This document details the complete implementation of the in-app PDF viewer for the Technical Manuals system. This viewer displays all 45 Unimog manuals with full functionality including mouse wheel scrolling, search, zoom, and navigation controls.

## 🚨 Critical Success Factors

### ✅ What Makes It Work
1. **Correct PDF.js Worker Version**: Must match API version exactly
2. **No "New Tab Fallback"**: Original implementation doesn't have aggressive error handling
3. **Mouse Wheel Scrolling**: Essential for user experience
4. **CDN Worker Source**: More reliable than local worker files

### ❌ What Breaks It
1. **Version Mismatches**: API vs Worker version conflicts cause immediate failures
2. **New Tab Error Dialogs**: Any fallback to `window.open()` breaks the in-app experience
3. **Missing Worker Files**: PDF.js cannot function without the worker
4. **CORS Issues**: Local worker files can have MIME type problems

## 📁 Key Files & Their Purpose

### 1. SimplePDFViewer.tsx
**Location**: `src/components/knowledge/SimplePDFViewer.tsx`
**Purpose**: Main PDF viewer component with in-app display

**Critical Configuration**:
```javascript
// MUST use CDN worker that matches PDF.js version dynamically
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
```

**Key Features**:
- Mouse wheel scrolling through pages
- Keyboard navigation (arrow keys, Page Up/Down, Home/End)
- Zoom controls and page navigation
- Search functionality
- Print and download options
- NO new tab fallback dialogs

### 2. KnowledgeManuals.tsx
**Location**: `src/pages/KnowledgeManuals.tsx`
**Purpose**: Main page that lists all manuals and handles PDF viewing

**Critical Implementation**:
```jsx
{/* PDF Viewer Component - MUST be conditionally rendered */}
{viewingPdf && (
  <SimplePDFViewer url={viewingPdf} onClose={() => setViewingPdf(null)} />
)}
```

### 3. useManuals Hook
**Location**: `src/hooks/manuals/use-manuals.ts`
**Purpose**: Manages manual fetching and PDF URL generation

**Critical Function**:
```javascript
const handleViewPdf = async (fileName: string) => {
  try {
    const url = await getManualUrl(fileName);
    setViewingPdf(url); // This triggers the in-app viewer
  } catch (error) {
    // Error handling without new tab fallback
  }
};
```

### 4. Manual Storage Service
**Location**: `src/services/manuals/getPublicUrl.ts`
**Purpose**: Generates signed URLs for PDF access from Supabase storage

**Process**:
1. Try signed URL first (more secure)
2. Fallback to public URL if needed
3. Returns Supabase storage URL with auth token

## 🔧 Working Implementation Details

### PDF.js Configuration
```javascript
// Worker source - MUST match installed PDF.js version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// PDF loading options for Supabase compatibility
const loadingTask = pdfjsLib.getDocument({
  url,
  withCredentials: false,
  disableRange: false,
  disableStream: false,
  isEvalSupported: false,
  disableAutoFetch: false,
  disableFontFace: false,
  cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/standard_fonts/'
});
```

### Mouse Wheel Scrolling Implementation
```javascript
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

window.addEventListener('wheel', handleWheel, { passive: false });
```

### Component Flow
1. User clicks "View PDF" button in ManualCard
2. `onView(manual.name)` is called
3. `handleViewPdf()` generates signed URL
4. `setViewingPdf(url)` triggers conditional render
5. `SimplePDFViewer` loads with PDF URL
6. PDF.js loads worker and renders PDF
7. Mouse wheel and keyboard events enable navigation

## 🏥 Recovery Procedures

### If PDFs Open in New Tabs Instead of In-App Viewer

**Root Cause**: Error dialog with "Open PDF in New Tab" is showing
**Solution**: Remove error fallback dialog from SimplePDFViewer

```javascript
// WRONG - This causes new tab fallback
if (error && url) {
  return (
    <div>
      <button onClick={() => window.open(url, '_blank')}>Open PDF in New Tab</button>
    </div>
  );
}

// CORRECT - Let PDFViewerLayout handle errors internally
return (
  <PDFViewerLayout isLoading={isLoading} error={error} ...>
```

### If PDF Loading Fails with Version Mismatch

**Error**: `"The API version "X.X.XXX" does not match the Worker version "X.X.XXX"`
**Solution**: Update worker source to match API version

```bash
# Check installed PDF.js version
npm list pdfjs-dist

# Update worker URL to match
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
```

### If Worker Fails to Load

**Error**: `"Failed to fetch dynamically imported module"`
**Solutions**:
1. Use CDN worker (preferred): `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
2. Copy worker to public folder: `cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js`

### If Mouse Wheel Scrolling Doesn't Work

**Check**: Ensure event listeners are properly added in useEffect
**Restore**: Copy mouse wheel implementation from commit `cfa41be`

## 📚 Storage & Database Details

### Supabase Storage
- **Bucket**: `manuals`
- **Files**: 45 PDF files (G600-Data-Summary.pdf, G603-Unimog-all-types-Light-Repair.pdf, etc.)
- **Access**: Public bucket with signed URL generation
- **Size**: Total ~150MB of PDF files

### Manual Fetching Service
**Location**: `src/services/manuals/fetchManuals.ts`
**Process**:
1. List files in `manuals` bucket
2. Filter out folders and placeholders
3. Transform to `StorageManual` type with metadata
4. Returns array of manual objects for display

## 🔄 Git Recovery Commands

### Restore from Working Commits
```bash
# Original working PDF viewer (commit fe78bf7)
git show fe78bf7:src/components/knowledge/SimplePDFViewer.tsx

# Mouse wheel scrolling implementation (commit cfa41be)
git show cfa41be:src/components/knowledge/SimplePDFViewer.tsx | grep -A 30 "handleWheel"

# Complete working state (current)
git checkout 818fd15 -- src/components/knowledge/SimplePDFViewer.tsx
```

### Emergency Recovery
If completely broken, restore these key files:
1. `src/components/knowledge/SimplePDFViewer.tsx` (from commit 818fd15)
2. `src/pages/KnowledgeManuals.tsx` (from commit 3cf26e8)
3. `src/hooks/manuals/use-manuals.ts` (current state)

## ✅ Testing Checklist

When restoring or modifying the PDF viewer, verify:

### Functional Tests
- [ ] PDFs open in in-app viewer (NOT new tabs)
- [ ] Mouse wheel scrolls through pages
- [ ] Keyboard navigation works (arrows, Page Up/Down)
- [ ] Zoom in/out functions properly
- [ ] Search functionality works
- [ ] Print and download options available
- [ ] Close button returns to manual list

### Technical Tests
- [ ] No console errors about version mismatches
- [ ] No "Failed to fetch worker" errors
- [ ] PDF loading logs show success: "✅ PDF loaded successfully! Pages: X"
- [ ] Canvas rendering works without duplicate render warnings

### Browser Tests
- [ ] Chrome/Safari/Firefox compatibility
- [ ] Mobile responsiveness
- [ ] Fast loading times
- [ ] No CORS errors

## 🎯 Success Indicators

### Visual
- PDF displays in overlay modal with controls
- Page navigation controls visible and functional
- Search bar present and working
- Zoom controls responsive

### Console Logs (Good)
```
🔍 Loading PDF from URL: https://ydevatqwkoccxhtejdor.supabase.co/...
🔍 PDF.js version: 5.4.149
📄 PDF loading task created, waiting for document...
✅ PDF loaded successfully! Pages: 8
Successfully rendered page 1
```

### Console Logs (Bad)
```
❌ PDF loading failed: UnknownErrorException
❌ Error details: {message: The API version "5.4.149" does not match the Worker version "5.4.54"}
Error: Setting up fake worker failed
```

## 🔒 Security Considerations

### URL Security
- Uses signed URLs with expiry (1 hour)
- No direct file access or permanent URLs
- Supabase auth integration

### Content Security
- PDF.js sandboxing enabled
- No eval() execution in PDF parsing
- Font loading restricted to known CDNs

## 📈 Performance Optimizations

### Loading Strategy
- Lazy loading of PDF content
- Streaming enabled for large PDFs
- Range requests for progressive loading
- CDN worker for faster initialization

### Memory Management
- Proper cleanup of event listeners
- PDF document disposal on component unmount
- Canvas reuse prevention

---

## 🚨 EMERGENCY RESTORE COMMANDS

If the PDF viewer is completely broken and needs immediate restoration:

```bash
# 1. Restore working SimplePDFViewer
git checkout 818fd15 -- src/components/knowledge/SimplePDFViewer.tsx

# 2. Ensure correct worker configuration
sed -i '' 's|pdfjsLib.GlobalWorkerOptions.workerSrc = .*|pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;|' src/components/knowledge/SimplePDFViewer.tsx

# 3. Commit and push
git add .
git commit -m "emergency: restore working PDF viewer"
git push staging main:main
```

This document serves as the definitive guide to maintain and restore the PDF viewer functionality. Keep it updated with any changes to the implementation.
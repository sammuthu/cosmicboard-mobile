# Photo, Screenshots, and PDF Feature - Mobile Implementation Guide

## Overview
This document tracks all UI/UX and architectural changes made in the CosmicBoard web application for Photos, Screenshots, and PDFs features. Use this as a reference when implementing these features in the mobile application.

## Feature Components Structure

### 1. Photos Feature

#### UI Components
```typescript
// PhotoGrid Component
- Grid layout: 3 columns on tablet, 2 on phone
- Thumbnail size: 200x200px with aspect-ratio cover
- Glassmorphic PrismCard wrapper
- Hover effects: scale(1.05) with shadow
- Loading skeleton during fetch
- Empty state: "No photos yet" with upload prompt

// PhotoLightbox Component  
- Full-screen modal overlay
- Swipe gestures for navigation
- Pinch-to-zoom support
- Share and download buttons
- ESC key or backdrop click to close
```

#### User Interactions
- **Upload**: Tap FAB or drag-drop area
- **View**: Tap thumbnail opens lightbox
- **Delete**: Long-press shows delete option
- **Multiple Select**: Checkbox mode for bulk actions
- **Rename**: Tap edit icon on thumbnail

### 2. Screenshots Feature

#### UI Components
```typescript
// ScreenshotCapture Component
- Paste area with dashed border
- "Paste from clipboard" button
- Auto-detect clipboard content
- Preview before save
- Name input field (auto-generated timestamp default)

// ScreenshotGallery Component
- Timeline view sorted by date
- Group by date (Today, Yesterday, This Week)
- Quick preview on hover
- Annotation tools button on each item
```

#### Platform-Specific Implementation
- **iOS**: Use UIPasteboard for clipboard access
- **Android**: Use ClipboardManager
- **Permissions**: Request photo library access

### 3. PDF Viewer Feature

#### UI Components
```typescript
// PDFList Component
- List view with file icon
- Show: filename, size, page count, upload date
- Search/filter by name
- Sort options: name, date, size

// PDFViewer Component
- Full-screen viewer with toolbar
- Page navigation (prev/next, go to page)
- Zoom controls (fit, 100%, 150%, 200%)
- Download button
- Page thumbnails sidebar (collapsible)
- Smooth scrolling between pages
```

#### Mobile Optimizations
- Lazy load PDF pages
- Cache recently viewed PDFs
- Reduce quality for thumbnails
- Progressive rendering

## Enhanced PrismCard Design

### Card Variants
```css
/* Base PrismCard - unchanged */
.prism-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Media PrismCard - for photos/screenshots */
.prism-card-media {
  padding: 0;
  overflow: hidden;
  aspect-ratio: 1;
}

/* Document PrismCard - for PDFs */
.prism-card-document {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Gallery PrismCard - container for media grid */
.prism-card-gallery {
  padding: 16px;
  min-height: 400px;
}
```

### Responsive Breakpoints
- Mobile: < 640px (1-2 columns)
- Tablet: 640-1024px (3-4 columns)  
- Desktop: > 1024px (4-6 columns)

## Navigation Flow

```
Project List
    ↓
Project Details (Enhanced)
    ├── Tasks Tab (existing)
    ├── Photos Tab (new)
    ├── Screenshots Tab (new)
    ├── PDFs Tab (new)
    └── References Tab (existing)
         ↓
    Media Views
        ├── Photo Lightbox
        ├── Screenshot Editor
        └── PDF Viewer
```

## State Management

### Store Structure (Zustand)
```typescript
interface MediaStore {
  // State
  photos: Media[];
  screenshots: Media[];
  pdfs: Media[];
  selectedMedia: Media | null;
  isLightboxOpen: boolean;
  uploadProgress: number;
  
  // Actions
  fetchMedia: (projectId: string, type: MediaType) => Promise<void>;
  uploadMedia: (file: File, projectId: string) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  updateMedia: (id: string, updates: Partial<Media>) => Promise<void>;
  openLightbox: (media: Media) => void;
  closeLightbox: () => void;
}
```

## Mobile-Specific Considerations

### 1. Performance
- **Image Loading**: Use react-native-fast-image for caching
- **PDF Rendering**: Use react-native-pdf with page virtualization
- **Thumbnails**: Generate and cache on device
- **Batch Operations**: Queue uploads for better UX

### 2. Native Features
```typescript
// Camera Integration
- Direct camera capture for photos
- Document scanner mode for PDFs
- Screenshot annotation tools

// File Management  
- Share sheet integration
- Save to device gallery
- Open in external apps

// Gestures
- Pinch to zoom in viewers
- Swipe between photos
- Pull to refresh lists
- Long press for context menu
```

### 3. Offline Support
- Cache viewed media locally
- Queue uploads when offline
- Sync when connection restored
- Show offline indicator

## API Integration Points

### Headers Required
```typescript
headers: {
  'Content-Type': 'multipart/form-data', // for uploads
  'Authorization': 'Bearer {token}', // if auth implemented
  'X-Project-ID': projectId, // for project context
}
```

### Error Handling
```typescript
const errorMessages = {
  413: 'File too large. Max size is 10MB for images, 50MB for PDFs',
  415: 'Unsupported file type',
  429: 'Too many uploads. Please wait and try again',
  507: 'Storage quota exceeded',
};
```

## Testing Scenarios

### Photos
- [ ] Upload multiple photos at once
- [ ] Test with various formats (JPEG, PNG, HEIC on iOS)
- [ ] Verify thumbnail generation
- [ ] Test lightbox swipe gestures
- [ ] Verify deletion removes from gallery

### Screenshots  
- [ ] Paste from clipboard (different sources)
- [ ] Test with various screen sizes
- [ ] Verify auto-naming with timestamp
- [ ] Test rename functionality
- [ ] Verify screenshot editing/annotation

### PDFs
- [ ] Upload large PDFs (>10 pages)
- [ ] Test page navigation
- [ ] Verify zoom functionality
- [ ] Test download to device
- [ ] Verify text selection (if supported)

## Styling Guidelines

### Colors (Dark Theme)
```css
--media-overlay: rgba(0, 0, 0, 0.9);
--media-toolbar: rgba(30, 30, 30, 0.95);
--media-border: rgba(255, 255, 255, 0.1);
--media-hover: rgba(255, 255, 255, 0.05);
--media-selected: rgba(100, 100, 255, 0.2);
```

### Animations
```css
/* Thumbnail appear */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Lightbox open */
@keyframes lightboxOpen {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## Accessibility

- **VoiceOver/TalkBack**: Label all media items
- **Keyboard Navigation**: Support Tab/Arrow keys
- **Screen Reader**: Announce upload progress
- **High Contrast**: Ensure buttons are visible
- **Haptic Feedback**: On long press and actions

## Version Compatibility

- **iOS**: 13.0+ (for modern photo picker)
- **Android**: API 21+ (for camera2 API)
- **React Native**: 0.70+ (for new architecture)

## Implementation Priority

1. **Phase 1**: Basic upload and view
2. **Phase 2**: Lightbox and PDF viewer
3. **Phase 3**: Screenshot paste and edit
4. **Phase 4**: Batch operations and sharing
5. **Phase 5**: Offline support and caching

## Known Limitations

- Screenshot paste may require additional permissions on iOS 14+
- PDF text selection not supported in basic viewer
- Large files (>50MB) may cause memory issues on older devices
- HEIC format requires conversion on Android

---
Last Updated: 2025-01-05
Web Implementation Reference: cosmicboard/src/components/media/
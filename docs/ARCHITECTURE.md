# 🏛️ Photoview Enhanced Edition: Technical Architecture

This document outlines the architectural design, frontend component hierarchy, streaming buffer management algorithms, and testing principles of the **Photoview Enhanced Edition**.

---

## 1. System Overview

Photoview is a client-server web application comprised of:
- **Backend**: High-performance Go microservice exposing a GraphQL API (gqlgen), REST endpoints for optimized media streaming, automated EXIF parsing, facial detection, and background thumbnail encoding.
- **Frontend**: Single-Page Application (SPA) built with React, TypeScript, Apollo Client GraphQL, styled-components, and Vite.
- **Storage**: Media cache hierarchy stored as WebP/JPEG thumbnails and original media assets on the local filesystem, backed by PostgreSQL / SQLite / MariaDB.

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Client (SPA)                     │
│  React 18 + TypeScript + Styled-Components + Apollo Client  │
└──────────────┬───────────────────────────────┬──────────────┘
               │ GraphQL Query/Mutation        │ HTTP 206 Partial Content
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Photoview Go Backend                    │
│   • gqlgen GraphQL API           • Range-based media server │
│   • EXIF Extraction (exiftool)   • Video Web stream muxer   │
└──────────────┬───────────────────────────────┬──────────────┘
               │ Metadata                      │ File I/O
               ▼                               ▼
     PostgreSQL / MariaDB             Disk Cache & Storage
```

---

## 2. Presentation Viewer Architecture

The full-screen presentation viewer (`PresentView`) coordinates three distinct modes:
1. **Interactive Image Viewing**: Smooth hardware-accelerated zoom, pan, and rotate via `react-zoom-pan-pinch`.
2. **Photo Editor Studio**: In-browser client-side canvas studio (`PresentPhotoEditor`).
3. **Cinematic Video Player**: Custom Netflix-style presentation video player (`PresentVideoPlayer`).

### Component Hierarchy

```
PresentView
 └── PreventScroll (Global style disabling background scrolling)
 └── PresentNavigationOverlay (Handles swipe gestures & gallery arrow buttons)
      └── PresentMedia (Switch on MediaType: Photo vs Video)
           ├── MediaType.Photo:
           │    ├── TransformWrapper / TransformComponent (Zoom & Pan)
           │    │    └── StyledPhoto (Dual low-res thumbnail + eager high-res layer)
           │    ├── PresentFilmstrip (Adjacent media carousel)
           │    ├── ZoomToolbar (Floating glassmorphic controls)
           │    └── PresentExifBadge (Camera & EXIF HUD)
           │
           └── MediaType.Video:
                └── PresentVideoPlayer
                     ├── StyledVideoElement (<video preload="auto" playsinline>)
                     ├── BufferingOverlay (Animated spinner & buffer cushion HUD)
                     ├── CenterPulse (Play/Pause/Speed ripple indicator)
                     ├── TopScrim (Media title & details toggle)
                     ├── BottomScrim (Scrubber rail & playback controls row)
                     └── FilmstripWrapper -> PresentFilmstrip
```

---

## 3. Smart Progressive Buffer Management Algorithm

To solve buffering starvation when streaming heavy 4K UHD smartphone videos (e.g. 215MB, 60fps) over remote VPN connections (such as Tailscale), `PresentVideoPlayer` implements an active buffer management algorithm:

### Buffer Metric Calculation
HTML5 video exposes `video.buffered` as a `TimeRanges` object. The player evaluates the specific time range containing `video.currentTime`:

```typescript
const updateBufferMetrics = () => {
  const ct = video.currentTime;
  let ahead = 0;
  let rangeEnd = 0;
  let totalBuffered = 0;

  for (let i = 0; i < video.buffered.length; i++) {
    const start = video.buffered.start(i);
    const end = video.buffered.end(i);
    totalBuffered += (end - start);
    if (ct >= start && ct <= end) {
      ahead = Math.max(0, end - ct);
      rangeEnd = end;
    }
  }
  // Target cushion: 5 seconds ahead of current playback position
  const target = Math.min(TARGET_BUFFER_CUSHION_SEC, duration - ct);
  const cushionPct = target > 0 ? Math.min(100, Math.round((ahead / target) * 100)) : 100;

  return { ahead, target, cushionPct, totalBuffered };
};
```

### Buffer Starvation Recovery Flow

```
   [Video Playing]
          │
          ▼
   [Buffer Starves] ──> 'waiting' / 'stalled' event fired
          │
          ▼
   [Enter Buffering State]
     • Pause video playback
     • Render glowing Netflix-red center spinner HUD
     • Display live cushion percentage (0% ➔ 100%)
          │
          ▼
   [Accumulate Buffer Cushion]
     • On 'progress' event: update bufferAheadSec
     • Check: Is bufferAheadSec >= 5.0s OR readyState >= 4?
          │
          ├── No ──> Keep buffering, update percentage
          │
          └── Yes ─> [Resume Smooth Playback]
                     • Call video.play()
                     • Hide Buffering HUD with 250ms fade
```

---

## 4. Client-Side Photo Editor Canvas Pipeline

The in-browser photo editor (`PresentPhotoEditor` & `editorUtils.ts`) executes non-destructive edits in real time:
1. **Live Preview (60fps)**:
   - Live adjustments (brightness, contrast, saturation, exposure, warmth, sepia) are rendered using CSS hardware-accelerated filter matrices applied to the viewport canvas.
2. **Crop & Geometry**:
   - Normalized crop coordinates `[0.0, 1.0]` map accurately across arbitrary aspect ratios (`1:1`, `4:3`, `16:9`, `Freeform`).
3. **Full-Resolution Export**:
   - An offscreen `HTMLCanvasElement` is allocated matching the original source image's full physical pixel dimensions (e.g. 24MP / 48MP).
   - Rotation and coordinate translations are applied to the canvas context.
   - Pixel color matrix filters are baked into the 2D context.
   - The cropped region is exported as a Blob via `canvas.toBlob('image/jpeg', 0.92)`.
   - A download anchor is synthesized to trigger client-side download without consuming server CPU or memory.

---

## 5. Automated Verification & Testing Strategy

Testing is powered by **Vitest** and **@testing-library/react**:
- **Viewer Component Tests** ([`PresentMedia.test.tsx`](../ui/src/components/photoGallery/presentView/PresentMedia.test.tsx)): Tests photo high-res swap, video element attributes, controls visibility, and hover state preservation.
- **Video Player Tests** ([`PresentVideoPlayer.test.tsx`](../ui/src/components/photoGallery/presentView/PresentVideoPlayer.test.tsx)): Full behavioral test suite covering playback states, speed cycling, buffer HUD display, seek operations, volume/mute toggles, and global mouse wakeup.
- **Navigation Tests** ([`PresentNavigationOverlay.test.tsx`](../ui/src/components/photoGallery/presentView/PresentNavigationOverlay.test.tsx)): Swipe event handlers and gallery navigation dispatchers.

Run tests anytime with:
```bash
npm --prefix ui test -- --run src/components/photoGallery/presentView/
```

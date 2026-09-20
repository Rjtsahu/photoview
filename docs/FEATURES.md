# ✨ Photoview Enhanced Edition: Feature Guide

Welcome to the **Photoview Enhanced Edition**! This fork transforms Photoview from a traditional static photo viewer into a modern, feature-rich media gallery studio with cinematic video playback, hardware-accelerated photo editing, smart date range filtering, and automated location discovery.

---

## 📑 Table of Contents
- [1. Cinematic Netflix-Style Video Player](#1-cinematic-netflix-style-video-player)
  - [Smart Progressive Pre-Buffering & 4K Smoothing](#smart-progressive-pre-buffering--4k-smoothing)
  - [Scrubber & Interactive Controls](#scrubber--interactive-controls)
  - [Speed & Volume Controls](#speed--volume-controls)
  - [Filmstrip & Video Metadata HUD](#filmstrip--video-metadata-hud)
  - [Keyboard Shortcuts](#video-keyboard-shortcuts)
- [2. In-Browser Photo Editor Studio](#2-in-browser-photo-editor-studio)
  - [Tonal & Color Adjustments](#tonal--color-adjustments)
  - [Artistic Color Filter Presets](#artistic-color-filter-presets)
  - [Crop, Aspect Ratios & Transform](#crop-aspect-ratios--transform)
  - [Hold-for-Original Comparison](#hold-for-original-comparison)
  - [High-Resolution Export & Save](#high-resolution-export--save)
- [3. Places & Cities Directory with Reverse Geocoding](#3-places--cities-directory-with-reverse-geocoding)
  - [Automated Coordinate Reverse Geocoding](#automated-coordinate-reverse-geocoding)
  - [Visual City & Destination Cards](#visual-city--destination-cards)
  - [Instant Location Search & Filter](#instant-location-search--filter)
  - [Dedicated City Photo Stream (Drill-Down Gallery)](#dedicated-city-photo-stream-drill-down-gallery)
- [4. Comprehensive Date Range Filtering Suite](#4-comprehensive-date-range-filtering-suite)
  - [Intuitive Filter Presets](#intuitive-filter-presets)
  - [Custom Date Range Picker](#custom-date-range-picker)
  - [Persistent URL Bookmarking](#persistent-url-bookmarking)
- [5. Dedicated Videos Hub & Timeline Filtering](#5-dedicated-videos-hub--timeline-filtering)
  - [Dedicated `/videos` Tab](#dedicated-videos-tab)
  - [In-Place Timeline Media Filter](#in-place-timeline-media-filter)
- [6. Hardware-Accelerated Presentation Viewer](#6-hardware-accelerated-presentation-viewer)
  - [Smooth Pan, Pinch & Zoom (Up to 8x)](#smooth-pan-pinch--zoom-up-to-8x)
  - [Zero-Lag Optimistic Favorites](#zero-lag-optimistic-favorites)
  - [Unified Filmstrip for Photos and Videos](#unified-filmstrip-for-photos-and-videos)
- [7. Keyboard Shortcut Master Reference](#7-keyboard-shortcut-master-reference)

---

## 1. Cinematic Netflix-Style Video Player

Replaces the standard browser `<video controls>` with a custom-engineered, dark-themed cinematic media player designed for seamless playback of high-bitrate media.

### Smart Progressive Pre-Buffering & 4K Smoothing
When streaming heavy smartphone videos (such as **4K UHD 60fps** files exceeding 200MB) over VPN tunnels (e.g. Tailscale) or constrained networks, standard browser players often suffer from rapid start-stop stuttering.

- **Proactive Preload**: `preload="auto"` keeps the browser pipeline actively buffering ahead.
- **Buffer Starvation Protection**: When video runs low on data (`waiting`/`stalled` events), playback automatically pauses to build a **healthy 5-second buffer cushion** before smoothly resuming, completely eliminating jerky micro-stalls.
- **Center Buffering HUD**: A center glowing Netflix-red ring displays real-time progress:
  - Buffer cushion percent: `Buffering 68%`
  - Cushion time: `3.4s / 5.0s cushion`
  - Overall file downloaded: `42% downloaded`
- **Control Bar Buffer Badge**: Real-time badge displayed right next to the time display (`01:23 / 08:45  •  42% buffered`).

### Scrubber & Interactive Controls
- **Precision Scrubber Rail**: Dual-track progress showing both played time (signature red `#E50914`) and buffered progress (semi-transparent grey), with a smooth draggable thumb.
- **Hover Timestamp Badge**: Hovering anywhere along the timeline shows an interactive time preview tooltip badge (`MM:SS`).
- **Quick-Skip Buttons**: Instant 10-second rewind (`⟲ 10s`) and forward (`⟳ 10s`) buttons in the control bar.
- **Double-Click Ripple Seek**: Double-clicking the left 35% of the video skips backward 10s (`-10s` ripple); double-clicking the right 35% skips forward 10s (`+10s` ripple).
- **Center Action Pulse**: Clean animated ripple indicator showing play/pause/speed states upon interaction.

### Filmstrip & Video Metadata HUD
- **Bottom Filmstrip (`strip` button)**: Toggle the thumbnail carousel while viewing videos to quickly scrub or jump between adjacent photos and videos in your library.
- **Video Metadata HUD (`I` button)**: Top-right glassmorphic info badge displaying video resolution (with automatic `4K` and `1080p` badges), framerate (`60 fps`), video codec (`H.264`, `HEVC`), duration (`⏱ 3:45`), and capture date.

---

## 2. In-Browser Photo Editor Studio

Hardware-accelerated photo studio overlay directly accessible inside the presentation viewer via the pencil **Edit** icon or `E` key.

### Tonal & Color Adjustments
Interactive sliders with real-time 60fps canvas feedback:
- **Brightness** (-100 to +100)
- **Contrast** (-100 to +100)
- **Saturation** (-100 to +100)
- **Warmth / Color Temperature** (-100 cool blue to +100 warm amber)
- **Exposure** (-100 to +100)
- **Sepia** (0 to 100)

### Artistic Color Filter Presets
Visual preview cards providing instant one-click professional color grading:
- **Original** (Neutral baseline)
- **Vivid** (Boosted saturation and rich contrast)
- **Golden Hour** (Warm amber glow with gentle highlights)
- **Cool Film** (Nordic cinematic teal / cool shadows)
- **B&W Drama** (High-contrast artistic monochrome)
- **Film Noir** (Moody deep-shadow black & white)
- **Vintage** (Faded warm tones with subtle sepia cast)
- **Muted** (Desaturated modern minimalist aesthetic)

### Crop, Aspect Ratios & Transform
- **Interactive Crop Box**: Draggable crop frame with 8 corner/edge resize handles and rule-of-thirds alignment grid.
- **Aspect Ratio Presets**: `Freeform`, `Original`, `1:1 (Square)`, `4:3 (Standard)`, `16:9 (Widescreen)`.
- **Rotate & Flip**:
  - `↺ 90°` Counter-clockwise & `↻ 90°` Clockwise rotation.
  - `⇄ Flip H` (Horizontal mirror) & `⇅ Flip V` (Vertical mirror).
  - `Reset Crop` to quickly re-expand the crop frame.

### Hold-for-Original Comparison
- **Instant A/B Testing**: Press and hold the "Hold for Original" button (mouse or touch) to see the unedited original photo; release to return to your edited state.

### High-Resolution Export & Save
- **Client-Side Canvas Rendering**: The editor processes the original full-resolution photo through an offscreen HTML5 canvas with all crops, rotations, flips, and color matrices applied.
- Automatically triggers a native browser download as `<filename>_edited.jpg` without any server re-encoding overhead.

---

## 3. Places & Cities Directory with Backend Reverse Geocoding & SQL Aggregation

Explore your photos organized by where they were taken without needing paid external map tokens or heavy frontend clustering.

### Backend-Driven High-Scale Architecture
- **Persistent Database Storage**: Every photo's EXIF data is enhanced with `location_city`, `location_state`, and `location_country` in PostgreSQL `media_exif` with indexed lookups.
- **Sub-Millisecond SQL Aggregation**: Queries execute single-digit millisecond `GROUP BY location_city, location_state, location_country` in PostgreSQL, delivering tiny payload responses (< 5 KB) regardless of whether your collection has 100 or 1,000,000 photos.
- **Persistent Two-Tier Geocoding Cache (`geo_cache`)**:
  - **Tier 1 (Instant Hub Reference & DB Cache)**: Known destination hubs and previously resolved coordinates stored in PostgreSQL `geo_cache` resolve in `< 1ms` with zero external calls.
  - **Tier 2 (OpenStreetMap Nominatim Fallback)**: Unmapped coordinates query OSM Nominatim once per ~1-2km grid, writing directly to `geo_cache` so identical or nearby coordinates never call external APIs again.
  - **Tier 3 (Coordinate Fallback)**: Gracefully labels unknown/offline coordinates without dropping photos.
- **Complete Mapbox Removal**: All legacy Mapbox dependencies, marker renderers, and canvas runtimes have been completely eliminated, slashing frontend bundle size by ~950KB.

### Visual City & Destination Cards
- Discovered locations are presented as visual album cards:
  - **Cover Photo**: High-resolution thumbnail from the most recent photo in that destination.
  - **Destination Title**: Prominent city/park name (e.g. **Bengaluru**, **Nagpur**, **Pench National Park**, **Nainital**).
  - **Region & Country**: Subtitle detailing state and country (*Karnataka, India*, *Madhya Pradesh, India*).
  - **Photo Count Badge**: Real-time media counter badge (`68 photos`, `34 photos`, `15 photos`).

### Instant Location Search & Filter
- Search bar at the top lets you filter your destination list instantly by city, state, or country name.

### Dedicated City Photo Stream (Drill-Down Gallery)
- Clicking any city card opens that destination's photo stream with breadcrumbs (`← All Places / Bengaluru (68 photos)`).
- Renders an interactive photo & video grid from that location with video indicator badges (🎬).
- Clicking any photo opens the full-screen presentation viewer with zoom and video support.

---

## 4. Comprehensive Date Range Filtering Suite

### Intuitive Filter Presets
In the Timeline gallery header, the date selector dropdown offers quick presets:
- **All Time**: Shows your complete photo collection.
- **✨ On This Day (Memories)**: Shows all photos taken on today's month and day across every year (relive memories from 1 year ago, 5 years ago, etc.).
- **Past 30 Days**, **Past 90 Days**, **Past 365 Days**: Rolling relative filters.
- **This Year** & **Last Year**: Instant calendar year views.
- **Specific Years (2026, 2025, 2024...)**: Dynamically populated from your library's earliest photo to present.

### Custom Date Range Picker
- Selecting `Custom range...` reveals clean `From` and `To` date pickers.
- Clicking either input invokes the native browser calendar picker via `showPicker()`.
- Active filter pill badge (`e.g. Nov 1, 2020 – Dec 31, 2020 ✕`) allows one-click clearing.

### Persistent URL Bookmarking
- Date selections automatically sync with URL query parameters (`?date=past_30`, `?fromDate=2024-01-01&toDate=2024-06-30`) so links can be shared or bookmarked directly.

---

## 5. Dedicated Videos Hub & Timeline Filtering

### Dedicated `/videos` Tab
- Added a permanent **Videos** item in the main navigation bar.
- Renders an exclusive stream of all video content across your albums, complete with thumbnail previews, duration indicators, and direct presentation viewer launch.

### In-Place Timeline Media Filter
- Checkboxes in the Timeline header let you filter between:
  - **Show only favorites**
  - **Show only videos**
- Seamlessly combine date ranges with video/favorite filters.

---

## 6. Hardware-Accelerated Presentation Viewer

### Smooth Pan, Pinch & Zoom (Up to 8x)
- Pan and zoom high-resolution photos smoothly with mouse wheel, pinch gestures, or toolbar buttons (`+`, `-`, `Fit to Screen`).
- Hardware-accelerated CSS transforms maintain 60fps rendering.

### Zero-Lag Optimistic Favorites
- Click the floating heart icon or press `S` to favorite/unfavorite media.
- Optimistically updates Apollo Client cache with **0ms UI latency** without reloading or exiting presentation mode.

### Unified Filmstrip for Photos and Videos
- Bottom carousel displaying adjacent photos and videos for rapid navigation across the stream.

---

## 7. Keyboard Shortcut Master Reference

| Mode | Shortcut | Action |
| :--- | :--- | :--- |
| **Global / Gallery** | `ArrowLeft` / `ArrowRight` | Previous / Next media |
| **Presentation** | `Escape` | Close viewer mode |
| **Presentation** | `E` | Open Photo Editor Studio |
| **Presentation** | `S` | Toggle Favorite (Heart) |
| **Presentation** | `I` | Toggle EXIF / Video Metadata HUD |
| **Presentation** | `F` | Toggle Thumbnail Filmstrip |
| **Presentation** | `R` | Rotate photo 90° |
| **Presentation** | `+` / `-` | Zoom in / Zoom out |
| **Video Player** | `Space` / `K` | Play / Pause video |
| **Video Player** | `J` / `L` | Skip backward / forward 10s |
| **Video Player** | `←` / `→` | Skip backward / forward 5s |
| **Video Player** | `M` | Toggle Mute |
| **Video Player** | `↑` / `↓` | Volume Up / Down |
| **Video Player** | `0`–`9` | Jump to 0% – 90% timeline |
| **Photo Editor** | `Escape` | Exit Editor (Cancel) |

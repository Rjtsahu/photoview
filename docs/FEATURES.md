# ✨ Photoview Enhanced Edition: Feature Guide

Welcome to the **Photoview Enhanced Edition**! This fork transforms Photoview from a traditional static photo viewer into a modern, feature-rich media gallery studio with cinematic video playback, hardware-accelerated photo editing, and advanced navigation.

---

## 📑 Table of Contents
- [1. Cinematic Netflix-Style Video Player](#1-cinematic-netflix-style-video-player)
  - [Smart Progressive Pre-Buffering & 4K Smoothing](#smart-progressive-pre-buffering--4k-smoothing)
  - [Scrubber & Interactive Controls](#scrubber--interactive-controls)
  - [Speed & Volume Controls](#speed--volume-controls)
  - [Keyboard Shortcuts](#video-keyboard-shortcuts)
- [2. In-Browser Photo Editor Studio](#2-in-browser-photo-editor-studio)
  - [Tonal & Color Adjustments](#tonal--color-adjustments)
  - [Artistic Color Filter Presets](#artistic-color-filter-presets)
  - [Crop, Aspect Ratios & Transform](#crop-aspect-ratios--transform)
  - [Hold-for-Original Comparison](#hold-for-original-comparison)
  - [High-Resolution Export & Save](#high-resolution-export--save)
- [3. Dedicated Videos Hub & Timeline Filtering](#3-dedicated-videos-hub--timeline-filtering)
  - [Dedicated `/videos` Tab](#dedicated-videos-tab)
  - [In-Place Timeline Media Filter](#in-place-timeline-media-filter)
- [4. Hardware-Accelerated Presentation Viewer](#4-hardware-accelerated-presentation-viewer)
  - [Smooth Pan, Pinch & Zoom (Up to 8x)](#smooth-pan-pinch--zoom-up-to-8x)
  - [Zero-Lag Optimistic Favorites](#zero-lag-optimistic-favorites)
  - [EXIF Metadata HUD & Filmstrip](#exif-metadata-hud--filmstrip)
- [5. Keyboard Shortcut Master Reference](#5-keyboard-shortcut-master-reference)

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

### Speed & Volume Controls
- **One-Click Speed Cycling**: Click the speed badge to cycle directly between `1x` ➔ `1.25x` ➔ `1.5x` ➔ `2x` ➔ `0.5x` ➔ `0.75x`.
- **Speed Popover Menu**: Click the dropdown caret (`▾`) to pick specific playback rates from an anchored menu.
- **Expandable Volume Bar**: Hover-to-expand horizontal slider with dynamic mute/low/high speaker icon.

### Video Keyboard Shortcuts
| Key | Action |
| :--- | :--- |
| `Space` or `K` | Toggle Play / Pause |
| `J` / `←` | Seek backward 10s / 5s |
| `L` / `→` | Seek forward 10s / 5s |
| `M` | Toggle Mute |
| `↑` / `↓` | Volume Up / Down (+/- 5%) |
| `F` | Toggle Fullscreen |
| `0`–`9` | Seek to 0% – 90% of duration |

---

## 2. In-Browser Photo Editor Studio

An interactive, hardware-accelerated studio overlay accessible directly from full-screen presentation mode via the **Edit (Pencil)** toolbar button or the `E` key.

### Tonal & Color Adjustments
Interactive sliders with real-time feedback rendered at 60fps:
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

## 3. Dedicated Videos Hub & Timeline Filtering

### Dedicated `/videos` Tab
- Added a permanent **Videos** item in the main navigation bar.
- Renders an exclusive stream of all video content across your albums, complete with thumbnail previews, duration indicators, and direct presentation viewer launch.

### In-Place Timeline Media Filter
- Filter pills in the Timeline header let you switch between:
  - **All Media**
  - **Photos Only**
  - **Videos Only**
- Automatically synchronizes with the URL query parameter (`?videos=1`) for easy bookmarking and sharing.

---

## 4. Hardware-Accelerated Presentation Viewer

### Smooth Pan, Pinch & Zoom (Up to 8x)
- Pan and zoom high-resolution photos smoothly with mouse wheel, pinch gestures, or toolbar buttons (`+`, `-`, `Fit to Screen`).
- Smooth CSS transforms maintain 60fps rendering.

### Zero-Lag Optimistic Favorites
- Click the floating heart icon or press `S` to favorite/unfavorite media.
- Optimistically updates Apollo Client cache with **0ms UI latency** without reloading the page or dropping out of presentation mode.

### EXIF Metadata HUD & Filmstrip
- **EXIF HUD (`I` key)**: Displays camera model, lens, aperture, shutter speed, ISO, focal length, date, and dimensions.
- **Thumbnail Filmstrip (`F` key)**: Bottom carousel displaying adjacent photos/videos in the current album for rapid navigation.

---

## 5. Keyboard Shortcut Master Reference

| Mode | Shortcut | Action |
| :--- | :--- | :--- |
| **Global / Gallery** | `ArrowLeft` / `ArrowRight` | Previous / Next media |
| **Presentation** | `Escape` | Close viewer mode |
| **Presentation** | `E` | Open Photo Editor Studio |
| **Presentation** | `S` | Toggle Favorite (Heart) |
| **Presentation** | `I` | Toggle EXIF Metadata HUD |
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

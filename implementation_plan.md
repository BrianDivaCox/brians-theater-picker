# Implementation Plan: Only Streaming Filter (v1.0.1)

## Overview
Add a dedicated "Only Streaming" filter toggle to Brian's Theater Picker. When active, it ensures that only movies available on subscription streaming (e.g. Netflix, Prime Video, Disney+, Max, Hulu, Paramount+, Peacock, Starz) or free ad-supported streaming (Tubi, Pluto, Freevee) are suggested, strictly excluding movies that are only available for paid digital rental/purchase ("VOD / Rent") or exclusively in theaters.

---

## Technical Design

### 1. UI Placement & Styling
- Add a prominent modern toggle switch / interactive checkbox in the filter controls:
  - Label: `⚡ Only Streaming (Exclude Rent/Buy)` or `📺 Only Streaming Platforms`.
  - Styled with cinema red glow when enabled, custom toggle switch or illuminated checkbox button.
  - Positioned adjacent to the platform pill section or within the controls grid for maximum visibility.
  - Defaults to checked/active (`true`) so users immediately get streamable movies by default, or allows 1-click toggling.
  - When "Theaters" platform pill is explicitly selected, disable or uncheck "Only Streaming" automatically with clear visual feedback.

### 2. TMDB Query & Client-Side Filtering
- **TMDB Query Level**:
  - When "Only Streaming" is active and "Any Platform" is selected:
    Append `&watch_region=US&with_watch_monetization_types=flatrate|free|ads` to the TMDB discover query.
  - When a specific streaming provider (e.g., Netflix, Hulu) is selected:
    Retain the specific provider filter while keeping monetization types set to `flatrate|free|ads`.
- **Client-Side Validation & Fallback Guard**:
  - In `parseMovieDetails()`, verify that the movie has active US streaming providers under `flatrate`, `free`, or `ads`.
  - If a movie's source would be classified as `"VOD / Rent"` or `"Unknown"` and "Only Streaming" is enabled, discard it from the suggestion pool and pick an alternative candidate to ensure 100% compliance.

### 3. Verification & Testing
- Update `test/verify_picker.js`:
  - Assert the "Only Streaming" toggle element exists and is interactive.
  - Verify discovery with "Only Streaming" enabled yields movies with confirmed streaming sources (`source !== 'VOD / Rent'`).
  - Test responsive layout and ensure zero console errors across viewports.

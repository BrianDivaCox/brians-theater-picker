# Implementation Plan: Brian's Theater Live Movie Picker Overhaul (v1.0.0)

## Overview
Overhaul `brians-theater-picker` from a basic text snippet into a high-production, cinematic web tool matching the Brian's Theater aesthetic. It features multi-page randomized TMDB movie discovery, comprehensive genre coverage, visual movie card display with poster art, ratings badges, runtime calculations, and 1-click clipboard copy buttons (both classic Brian's Theater format and Discord markdown format).

---

## Architecture & Design

### 1. Visual & UX Layer
- **Theme**: Brian's Theater Dark Cinema aesthetic (`#0b0d10` background, `#e50914` signature red accents, `#f5c518` gold stars, acrylic frosted glass cards).
- **Platform / Source Filter Pills (matching user screenshot)**:
  - Interactive pill buttons for:
    - 📺 All Platforms / Any
    - HBO Max (ID: 1899|1825)
    - Disney+/ Hulu (ID: 337|15)
    - Netflix (ID: 8|1796)
    - Tubi (ID: 73)
    - Peacock (ID: 386|387|2553)
    - Paramount+ (ID: 531|2303|2616|582)
    - Starz (ID: 43|1794|1855|634)
    - Theaters (In Theaters / Theatrical releases)
    - Prime (ID: 9|119|2100)
  - Helper subtitle: *"Click a platform to help Brian locate where to stream it."*
- **Bulk Suggestions & Quantity Selector**:
  - Quantity control: 1 (Spotlight), 3, 5, 10, or 15 suggestions.
  - Generates a responsive grid of movie cards with posters, badges, runtimes, ratings, streaming tags, and summaries.
  - Interactive movie selection checkboxes (all selected by default).
  - Bulk actions bar:
    - `📋 Copy Selected (Theater Format)`
    - `💬 Copy Selected (Discord Format)`
    - `Select All` / `Deselect All`
  - Floating toast notifications confirming clipboard operations.

### 2. TMDB Engine & Discovery Logic
- **API Key**: Retain default key (`ab209bae2d49ee12d5a1f8601c11ef6a`) with user fallback option.
- **True Multi-Page Random Discovery**:
  - In the original code, only `page=1` was ever queried, returning the same top 20 movies repeatedly.
  - In v1.0.0, the picker queries the initial discovery endpoint to obtain `total_pages`, selects a random page between 1 and `Math.min(total_pages, 20)`, queries that specific page, and randomly samples a movie from that pool.
- **Expanded Genre Coverage**: All 19 official TMDB movie genres plus an "Any Genre" option.
- **Expanded Year Range**: Dynamic generation from current year down to 1960 plus an "Any Year" wildcard option.
- **Safe Fallbacks**: Graceful fallback when certification, poster, trailer, or providers are unlisted.

### 3. Verification & Pre-Commit Standards
- Local HTTP server running headless Chrome via `puppeteer-core`.
- Automated test script:
  - Verifies DOM elements render cleanly.
  - Simulates genre selection, year selection, clicking "Find Next Movie".
  - Asserts poster image loads, metadata elements mutate in DOM, copy buttons trigger successfully.
  - Verifies zero console errors and clean responsive layout (375px mobile, 768px tablet, 1280px desktop).

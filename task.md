# Task List: Add "Only Streaming" Filter (v1.0.1)

- [x] Clean house and backup repository to `backups/movie_picker_backup_v1.0.1_pre_streaming_filter.tar.gz` (strict 2-backup retention) <!-- id: 0 -->
- [x] Create implementation plan `implementation_plan.md` detailing the "Only Streaming" filter toggle and TMDB monetization integration <!-- id: 1 -->
- [x] Add the "Only Streaming" toggle switch/checkbox to `index.html` with cinema styling and wire up TMDB monetization query logic <!-- id: 2 -->
- [x] Ensure strict client-side validation so non-streaming/rental-only movies are filtered out when "Only Streaming" is active <!-- id: 3 -->
- [x] Bump version to `1.0.1` across `package.json`, `version.json`, and `index.html`, and update `CHANGELOG.md` with App Store style bullets (strict <= 10 words) <!-- id: 4 -->
- [x] Update automated test suite `test/verify_picker.js` and verify with headless Chrome (`puppeteer-core`) confirming toggle behavior, zero console errors, and responsive layouts <!-- id: 5 -->
- [x] Commit and push to GitHub remote `origin/main` with version title and Mini Summary <!-- id: 6 -->
- [x] Clean house, close background tasks, and finalize task closure <!-- id: 7 -->

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8899;
const ROOT_DIR = path.resolve(__dirname, '..');

// Simple static test server
function createServer() {
    return http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/favicon.ico') {
            res.writeHead(204);
            return res.end();
        }
        if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
        const filePath = path.join(ROOT_DIR, reqPath);
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.json': 'application/json',
                '.css': 'text/css'
            };
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(fs.readFileSync(filePath));
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });
}

async function runTests() {
    console.log('--- STARTING VERIFICATION TEST SUITE: BRIAN\'S THEATER PICKER ---');
    const server = createServer();
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`[PASS] Test HTTP server listening on http://127.0.0.1:${PORT}`);

    const errors = [];
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const page = await browser.newPage();

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`[BROWSER ERROR] ${msg.text()}`);
                errors.push(`Browser Console Error: ${msg.text()}`);
            }
        });

        page.on('pageerror', err => {
            console.error(`[BROWSER UNHANDLED ERROR] ${err.message}`);
            errors.push(`Page Uncaught Exception: ${err.message}`);
        });

        // 1. Load Page at Desktop Viewport
        await page.setViewport({ width: 1280, height: 900 });
        await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle2' });
        console.log('[PASS] Page successfully loaded on desktop viewport (1280px)');

        // 2. Assert Header & Controls rendered
        const titleText = await page.$eval('.header-logo', el => el.textContent.trim());
        if (!titleText.includes("BRIAN'S THEATER PICKER")) {
            throw new Error(`Expected header title, got: ${titleText}`);
        }
        console.log(`[PASS] Header rendered: "${titleText}"`);

        // 3. Assert Platform Filter Pills
        const pills = await page.$$('.platform-btn');
        if (pills.length < 9) {
            throw new Error(`Expected at least 9 platform pills, found: ${pills.length}`);
        }
        console.log(`[PASS] Found ${pills.length} platform filter pills.`);

        // Test clicking Netflix pill
        const netflixBtn = await page.$('.platform-btn[data-platform="netflix"]');
        if (!netflixBtn) throw new Error("Netflix platform button not found!");
        await netflixBtn.click();
        const isNetflixActive = await page.evaluate(el => el.classList.contains('active'), netflixBtn);
        if (!isNetflixActive) throw new Error("Netflix pill failed to activate on click");
        console.log('[PASS] Platform filter pill clicked and activated (Netflix)');

        // 4. Test Year Dropdown population
        const yearOptionsCount = await page.$eval('#year-select', el => el.options.length);
        if (yearOptionsCount < 60) {
            throw new Error(`Year dropdown insufficiently populated: ${yearOptionsCount} options`);
        }
        console.log(`[PASS] Year dropdown populated with ${yearOptionsCount} years (current down to 1960).`);

        // 5. Test Bulk Suggestions Generation (5 Movies)
        await page.select('#count-select', '5');
        const buttonLabel = await page.$eval('#btn-discover-label', el => el.textContent.trim());
        if (!buttonLabel.includes('5 Bulk Suggestions')) {
            throw new Error(`Discover button label mismatch: ${buttonLabel}`);
        }
        console.log(`[PASS] Button label dynamically updated: "${buttonLabel}"`);

        // Switch platform back to Any for robust test discovery
        const anyPlatformBtn = await page.$('.platform-btn[data-platform=""]');
        await anyPlatformBtn.click();

        // Trigger movie discovery
        console.log('[RUN] Triggering discovery...');
        await page.click('#btn-discover');

        // Wait for results container to render movie cards
        await page.waitForSelector('.movie-card', { timeout: 15000 });
        const cardCount = await page.$$eval('.movie-card', els => els.length);
        if (cardCount !== 5) {
            throw new Error(`Expected 5 movie cards, found: ${cardCount}`);
        }
        console.log(`[PASS] Bulk discovery successfully rendered ${cardCount} movie cards in DOM!`);

        // Assert movie details within cards
        const firstMovieTitle = await page.$eval('.movie-title-area h3', el => el.textContent.trim());
        if (!firstMovieTitle) throw new Error("First movie card missing title!");
        console.log(`[PASS] Discovered candidate title: "${firstMovieTitle}"`);

        // Check badges
        const badgesCount = await page.$$eval('.movie-card .badge', els => els.length);
        if (badgesCount < 5) throw new Error("Movie cards missing badges!");
        console.log(`[PASS] Discovered movies rendered ${badgesCount} metadata badges.`);

        // 6. Test Bulk Action Selection & Checkbox Toggles
        const initialSelectionText = await page.$eval('#bulk-selection-count', el => el.textContent.trim());
        console.log(`[PASS] Initial bulk counter: "${initialSelectionText}"`);

        // Test unchecking first movie
        const firstCheckbox = await page.$('.card-select-checkbox input');
        await firstCheckbox.click();
        const updatedSelectionText = await page.$eval('#bulk-selection-count', el => el.textContent.trim());
        if (!updatedSelectionText.includes('4 Selected')) {
            throw new Error(`Expected 4 Selected after uncheck, got: ${updatedSelectionText}`);
        }
        console.log(`[PASS] Checkbox toggle successfully updated counter: "${updatedSelectionText}"`);

        // Test Deselect All / Select All
        const toggleAllBtn = await page.$('.bulk-actions-group button:last-child');
        // Since 1 was unselected, clicking now should Select All (5 Selected)
        await toggleAllBtn.click();
        const allSelectedText = await page.$eval('#bulk-selection-count', el => el.textContent.trim());
        if (!allSelectedText.includes('5 Selected')) {
            throw new Error(`Expected 5 Selected after clicking Select All, got: ${allSelectedText}`);
        }
        console.log(`[PASS] Select All state: "${allSelectedText}"`);

        // Clicking again should Deselect All (0 Selected)
        await toggleAllBtn.click();
        const zeroSelectedText = await page.$eval('#bulk-selection-count', el => el.textContent.trim());
        if (!zeroSelectedText.includes('0 Selected')) {
            throw new Error(`Expected 0 Selected after clicking Deselect All, got: ${zeroSelectedText}`);
        }
        console.log(`[PASS] Deselect All state: "${zeroSelectedText}"`);

        // Clicking again should restore Select All (5 Selected)
        await toggleAllBtn.click();
        const reselectedText = await page.$eval('#bulk-selection-count', el => el.textContent.trim());
        if (!reselectedText.includes('5 Selected')) {
            throw new Error(`Expected 5 Selected after re-select, got: ${reselectedText}`);
        }
        console.log(`[PASS] Select All successfully restored all selections: "${reselectedText}"`);

        // 7. Test Bulk Copy Trigger & Toast Feedback
        const copyTheaterBtn = await page.$('.btn-action-primary');
        await copyTheaterBtn.click();
        await page.waitForSelector('#toast.show', { timeout: 3000 });
        const toastMsg = await page.$eval('#toast-msg', el => el.textContent.trim());
        console.log(`[PASS] Toast alert appeared with confirmation: "${toastMsg}"`);

        // 8. Test Single Spotlight Mode
        console.log('[RUN] Testing Single Spotlight mode (1 Movie)...');
        await page.select('#count-select', '1');
        await page.click('#btn-discover');
        await page.waitForSelector('.movies-grid.single-spotlight .movie-card', { timeout: 15000 });
        const spotlightCount = await page.$$eval('.movie-card', els => els.length);
        if (spotlightCount !== 1) {
            throw new Error(`Expected 1 spotlight card, found: ${spotlightCount}`);
        }
        console.log('[PASS] Single Spotlight mode rendered 1 prominent card.');

        // 9. Responsive Layout Audits (Zero Horizontal Overflow across 375px, 768px, 1280px)
        const viewports = [
            { name: 'Mobile', width: 375, height: 667 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Desktop', width: 1280, height: 900 }
        ];

        for (const vp of viewports) {
            await page.setViewport(vp);
            await new Promise(r => setTimeout(r, 400));
            const overflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth - document.documentElement.clientWidth;
            });
            if (overflow > 1) {
                throw new Error(`Horizontal overflow detected on ${vp.name} (${vp.width}px): ${overflow}px`);
            }
            console.log(`[PASS] ${vp.name} (${vp.width}px) responsive audit passed: 0px horizontal overflow.`);
        }

        if (errors.length > 0) {
            throw new Error(`Test failed with browser errors:\n${errors.join('\n')}`);
        }

        console.log('\n======================================================');
        console.log('✅ ALL TEST ASSERTIONS PASSED WITH ZERO CONSOLE ERRORS');
        console.log('======================================================\n');

    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
        console.log('[PASS] Test server and browser cleaned up cleanly.');
    }
}

runTests().catch(err => {
    console.error('❌ TEST HARNESS FAILED:', err);
    process.exit(1);
});

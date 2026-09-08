const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.REPORT_BROWSER_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => {
    localStorage.setItem('fileflow', JSON.stringify({user: {id: 'report-check', name: 'Report Check', role: 'Admin', token: 'local-report-check'}}));
  });
  // Exercise UI without touching application records or requiring branch backends.
  await page.route('**/api/**', route => route.fulfill({status: 503, contentType: 'application/json', body: '{"message":"Report service unavailable during UI smoke check"}'}));
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  const ids = ['my-report', 'incoming-project-report', 'daily-allotment-status', 'rework-analysis', 'customer-feedback', 'due-date-delivery', 'error-reports', 'internal-feedback', 'technical-query-reports', 'delivery-production-count', 'production-pipeline'];
  for (const id of ids) {
    await page.goto(`http://127.0.0.1:5179/reports/${id}`);
    await page.locator('.github-reports').waitFor();
    await page.waitForTimeout(700);
    const text = await page.locator('.github-reports').innerText();
    if (!text.trim() || /Something went wrong|Cannot read properties|is not defined/.test(text)) failures.push(`${id}: ${text.slice(0, 300)}`);
    console.log(`${id}: ${text.trim().slice(0, 90).replace(/\n/g, ' ')}`);
  }
  await browser.close();
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('All 11 Reports pages rendered without uncaught browser errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });

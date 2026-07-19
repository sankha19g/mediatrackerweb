const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log("Successfully loaded home page");
    
    // Check if there is a react error overlay
    const overlay = await page.$('vite-error-overlay');
    if (overlay) {
      console.log("Vite error overlay detected!");
    }
  } catch (e) {
    console.log("Navigation error:", e.message);
  }
  
  await browser.close();
})();

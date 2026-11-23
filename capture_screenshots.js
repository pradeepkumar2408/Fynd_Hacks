const { chromium } = require('./frontend/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, 'submission_evidence');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Checkout Page with items
  await page.goto('http://localhost:5173');
  await page.getByTestId('add-to-cart-1').click();
  await page.getByTestId('add-to-cart-2').click();
  await page.getByTestId('customer-name-input').fill('Sarah Connor');
  await page.getByTestId('customer-email-input').fill('sarah@resistance.org');
  await page.screenshot({ path: path.join(outDir, '1_checkout_page_with_items.png'), fullPage: true });

  // 2. Validation error - missing name
  await page.goto('http://localhost:5173');
  await page.getByTestId('add-to-cart-1').click();
  await page.getByTestId('place-order-btn').click();
  await page.screenshot({ path: path.join(outDir, '2_validation_missing_name_error.png'), fullPage: true });

  // 3. Validation error - empty cart
  await page.goto('http://localhost:5173');
  await page.getByTestId('customer-name-input').fill('John Doe');
  await page.getByTestId('place-order-btn').click();
  await page.screenshot({ path: path.join(outDir, '3_validation_empty_cart_error.png'), fullPage: true });

  // 4. Successful Order Confirmation
  await page.goto('http://localhost:5173');
  await page.getByTestId('add-to-cart-1').click();
  await page.getByTestId('add-to-cart-2').click();
  await page.getByTestId('customer-name-input').fill('Sarah Connor');
  await page.getByTestId('place-order-btn').click();
  await page.waitForSelector('[data-testid="order-confirmation"]');
  await page.screenshot({ path: path.join(outDir, '4_order_confirmation_screen.png'), fullPage: true });

  await browser.close();
  console.log('Screenshots generated successfully in ' + outDir);
})();

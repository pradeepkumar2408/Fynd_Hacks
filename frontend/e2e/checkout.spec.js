import { test, expect } from '@playwright/test';

test.describe('Checkout Customer Journey & Mistake Handling', () => {

  test.beforeEach(async ({ page }) => {
    // Each check starts from a clean browser state
    await page.goto('/');
    // Verify products are loaded and catalog is visible
    await expect(page.getByTestId('product-card-1')).toBeVisible();
    await expect(page.getByTestId('product-card-2')).toBeVisible();
  });

  /**
   * CHECK 1: Verify a successful checkout produces a confirmation
   * Requirements:
   * - Add items to cart
   * - Enter required customer name
   * - Submit order
   * - Assert customer visible confirmation, reference code, customer greeting, and line items
   */
  test('Check 1: Successful checkout produces a clear order confirmation with reference', async ({ page }) => {
    // Customer adds Headphones ($99.99) and Mouse ($29.99)
    await page.getByTestId('add-to-cart-1').click();
    await page.getByTestId('add-to-cart-2').click();

    // Verify items appear in cart summary
    await expect(page.getByTestId('cart-item-1')).toBeVisible();
    await expect(page.getByTestId('cart-item-2')).toBeVisible();
    await expect(page.getByTestId('order-total')).toHaveText('$129.98');

    // Customer fills in required name field
    const customerInput = page.getByTestId('customer-name-input');
    await customerInput.fill('Sarah Connor');
    await expect(customerInput).toHaveValue('Sarah Connor');

    // Optional email
    await page.getByTestId('customer-email-input').fill('sarah@resistance.org');

    // Customer clicks Place Order
    const placeOrderBtn = page.getByTestId('place-order-btn');
    await placeOrderBtn.click();

    // Customer visible assertions: Confirmation view is displayed
    const confirmation = page.getByTestId('order-confirmation');
    await expect(confirmation).toBeVisible();

    // Assert customer greeting and confirmation text
    await expect(page.locator('.confirmation-title')).toHaveText('Order Placed Successfully!');
    await expect(page.locator('.confirmation-subtitle')).toContainText('Sarah Connor');

    // Assert unique order reference code exists and matches ORD-XXXXXX format
    const refCode = page.getByTestId('order-reference');
    await expect(refCode).toBeVisible();
    await expect(refCode).toHaveText(/ORD-\d{6}/);

    // Assert confirmed total matches customer total
    await expect(page.getByTestId('confirmed-total')).toHaveText('$129.98');

    // Ensure no validation error banner is visible
    await expect(page.getByTestId('validation-error')).not.toBeVisible();
  });

  /**
   * CHECK 2: Verify a missing field blocks checkout and preserves customer inputs
   * Requirements:
   * - Missing required field (name left blank)
   * - Attempt checkout
   * - Verify checkout blocked, validation message shown, and cart state preserved
   */
  test('Check 2: Missing required name field blocks checkout and preserves cart state', async ({ page }) => {
    // Customer adds Headphones ($99.99)
    await page.getByTestId('add-to-cart-1').click();
    await expect(page.getByTestId('cart-item-1')).toBeVisible();
    await expect(page.getByTestId('line-total-1')).toHaveText('$99.99');

    // Customer intentionally leaves required Name field blank
    const nameInput = page.getByTestId('customer-name-input');
    await nameInput.fill('');

    // Customer enters optional email
    const emailInput = page.getByTestId('customer-email-input');
    await emailInput.fill('test@example.com');

    // Click Place Order
    await page.getByTestId('place-order-btn').click();

    // Assert: Order confirmation MUST NOT be shown
    await expect(page.getByTestId('order-confirmation')).not.toBeVisible();

    // Assert: Customer sees clear validation error banner
    const errorBanner = page.getByTestId('validation-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Customer name is required');

    // Assert: Input error highlight and inline field error
    await expect(nameInput).toHaveClass(/input-error/);
    await expect(page.getByTestId('name-error')).toHaveText('Customer name is required');

    // Assert: Customer entered information and cart contents ARE PRESERVED
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(page.getByTestId('cart-item-1')).toBeVisible();
    await expect(page.getByTestId('order-total')).toHaveText('$99.99');
  });

  /**
   * CHECK 3: Verify a quantity change updates line totals and the exact order total
   * Requirements:
   * - Dynamic quantity adjustments with +/- and manual input
   * - Assert exact line totals and order total recalculate instantly
   */
  test('Check 3: Quantity change updates line totals and exact order total dynamically', async ({ page }) => {
    // Add Headphones ($99.99)
    await page.getByTestId('add-to-cart-1').click();
    await expect(page.getByTestId('line-total-1')).toHaveText('$99.99');
    await expect(page.getByTestId('order-total')).toHaveText('$99.99');

    // Increase quantity using '+' stepper button (1 -> 2)
    await page.getByTestId('quantity-increase-1').click();
    await expect(page.getByTestId('quantity-input-1')).toHaveValue('2');
    await expect(page.getByTestId('line-total-1')).toHaveText('$199.98');
    await expect(page.getByTestId('order-total')).toHaveText('$199.98');

    // Increase quantity again (2 -> 3)
    await page.getByTestId('quantity-increase-1').click();
    await expect(page.getByTestId('quantity-input-1')).toHaveValue('3');
    await expect(page.getByTestId('line-total-1')).toHaveText('$299.97');
    await expect(page.getByTestId('order-total')).toHaveText('$299.97');

    // Add second product: Mouse ($29.99)
    await page.getByTestId('add-to-cart-2').click();
    await expect(page.getByTestId('line-total-2')).toHaveText('$29.99');
    // Total should now be $299.97 + $29.99 = $329.96
    await expect(page.getByTestId('order-total')).toHaveText('$329.96');

    // Decrease Headphones quantity (3 -> 2)
    await page.getByTestId('quantity-decrease-1').click();
    await expect(page.getByTestId('quantity-input-1')).toHaveValue('2');
    await expect(page.getByTestId('line-total-1')).toHaveText('$199.98');
    // Total should now be $199.98 + $29.99 = $229.97
    await expect(page.getByTestId('order-total')).toHaveText('$229.97');

    // Test direct manual quantity input (Mouse: 1 -> 4)
    const mouseQtyInput = page.getByTestId('quantity-input-2');
    await mouseQtyInput.fill('4');
    await expect(page.getByTestId('line-total-2')).toHaveText('$119.96');
    // Total should now be $199.98 + $119.96 = $319.94
    await expect(page.getByTestId('order-total')).toHaveText('$319.94');

    // Remove Mouse from cart
    await page.getByTestId('remove-item-2').click();
    await expect(page.getByTestId('cart-item-2')).not.toBeVisible();
    // Total returns to Headphones line total: $199.98
    await expect(page.getByTestId('order-total')).toHaveText('$199.98');
  });

  /**
   * CHECK 4 (Risk Case 1): Block checkout when cart is empty and preserve entered customer data
   */
  test('Check 4: Empty cart blocks checkout and preserves entered customer name', async ({ page }) => {
    // Customer fills name but adds NO items to cart
    const nameInput = page.getByTestId('customer-name-input');
    await nameInput.fill('David Miller');

    // Verify empty cart state is displayed
    await expect(page.getByTestId('empty-cart-message')).toBeVisible();

    // Click Place Order
    await page.getByTestId('place-order-btn').click();

    // Assert: Order confirmation NOT shown
    await expect(page.getByTestId('order-confirmation')).not.toBeVisible();

    // Assert: Customer sees empty cart validation message
    const errorBanner = page.getByTestId('validation-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Your cart is empty');

    // Assert: Customer name input is preserved
    await expect(nameInput).toHaveValue('David Miller');
  });

  /**
   * CHECK 5 (Risk Case 2): Rapid double-click on Place Order produces only ONE confirmation
   */
  test('Check 5: Rapid double-click on Place Order creates exactly one order and one confirmation', async ({ page }) => {
    // Add product to cart
    await page.getByTestId('add-to-cart-1').click();
    await expect(page.getByTestId('cart-item-1')).toBeVisible();

    // Fill customer name
    await page.getByTestId('customer-name-input').fill('Emma Watson');

    const placeOrderBtn = page.getByTestId('place-order-btn');

    // Perform rapid double click
    await Promise.all([
      placeOrderBtn.click({ clickCount: 2 }),
    ]);

    // Assert single confirmation appears
    const confirmation = page.getByTestId('order-confirmation');
    await expect(confirmation).toBeVisible();

    // Assert exactly one order reference element exists on screen
    const references = page.getByTestId('order-reference');
    await expect(references).toHaveCount(1);
    await expect(references).toHaveText(/ORD-\d{6}/);

    // Verify confirmation content is solid and stable
    await expect(page.locator('.confirmation-subtitle')).toContainText('Emma Watson');
    await expect(page.getByTestId('confirmed-total')).toHaveText('$99.99');
  });

});

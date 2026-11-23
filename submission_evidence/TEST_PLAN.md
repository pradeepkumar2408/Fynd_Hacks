# Checkout Page Test Plan & Execution Report

## 1. Executive Summary & Context
This document outlines the test strategy, risk prioritization, automated browser test suite, and manual test execution results for the single-page checkout journey of the online store.

- **Application Under Test (AUT)**: TechStore Single-Page Checkout
- **Tech Stack**:
  - Frontend: React (Vite, CSS Modules / Modern UI, Lucide Icons)
  - Backend: Spring Boot 3.4.2 (Java 21 LTS, Spring Data JPA, Hibernate, Bean Validation)
  - Database: MySQL 8.0 (Database: `checkout_db`)
  - End-to-End Test Engine: Playwright (Chromium)

---

## 2. Key Checkout Risks & Priority Matrix

| Risk ID | Risk Description | Severity / Priority | Impact | Mitigation / Test Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **R-01** | **Duplicate Order Placement on Rapid Double-Click** | **P0 (Critical)** | Customer charged twice; duplicate inventory decrement; customer disputes. | Synchronous ref guard (`submittingRef`) + UI button disabling + Backend idempotency key caching. Automated Check 5 & Manual Test. |
| **R-02** | **Empty Cart Checkout Submission** | **P0 (Critical)** | Zero-dollar ghost orders processed; database pollution. | Client-side cart length validation + backend `@NotEmpty` and `@Valid` constraints. Automated Check 4 & Manual Test. |
| **R-03** | **Missing Customer Identification (Blank Name)** | **P0 (Critical)** | Inability to identify order owner, dispatch goods, or send confirmation. | Mandatory field validation (`@NotBlank`), inline field error state, blocking submission. Automated Check 2 & Manual Test. |
| **R-04** | **Calculation Errors (Line Totals / Order Total Drift)** | **P0 (Critical)** | Customer overcharged or undercharged; cart mismatch. | Explicit decimal math with `toFixed(2)` and server-side authoritative `BigDecimal` recalculation from database catalog prices. Automated Check 3. |
| **R-05** | **Input Wiping on Validation Failure** | **P1 (High)** | Customer frustration if form fields or cart selections reset when validation fails. | Controlled React state; submission handlers preserve existing input and cart state upon validation rejection. Automated Check 2 & Check 4. |
| **R-06** | **Unclear or Missing Order Confirmation** | **P1 (High)** | Customer uncertain if order succeeded, leading to repeated manual attempts. | Prominent confirmation view with order reference (`ORD-XXXXXX`), recipient name, line item table, and total. Automated Check 1. |

---

## 3. Automated Browser Test Suite (Playwright)

Automated tests are located at `frontend/e2e/checkout.spec.js`. Each test initiates from a clean state (`page.goto('/')`), interacts with real DOM elements, and asserts customer-visible elements without brittle arbitrary delays.

### Summary of Automated Test Results

| Check # | Test Name | Expected Result | Customer-Visible Assertion | Status | Duration |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **Check 1** | **Successful Checkout Confirmation** | Adding products & filling Name produces confirmation with unique reference. | `data-testid="order-confirmation"` visible; reference matches `/ORD-\d{6}/`; customer name displayed; total `$129.98`. | **PASS** | 4.1s |
| **Check 2** | **Missing Field Blocks Checkout** | Blank name blocks order, displays error, and preserves cart & entered email. | `data-testid="order-confirmation"` not visible; `data-testid="validation-error"` visible; cart preserved; email value preserved. | **PASS** | 0.5s |
| **Check 3** | **Quantity Change Updates Totals** | Modifying quantity via `+`/`-` or input dynamically updates line & order totals. | Line total `$99.99` -> `$199.98` -> `$299.97`; combined with second item `$329.96`; removal returns total to `$199.98`. | **PASS** | 0.9s |
| **Check 4** | **Empty Cart Checkout Blocked** | Clicking Place Order with empty cart shows error and preserves entered name. | `data-testid="validation-error"` visible ("Your cart is empty"); name input preserved. | **PASS** | 0.7s |
| **Check 5** | **Double-Click Idempotency** | Rapid double-clicking Place Order produces exactly one order reference and confirmation. | `data-testid="order-reference"` count is exactly 1; exactly one record saved in MySQL database. | **PASS** | 0.8s |

**Total Suite Run**: 5 passed (28.2s execution including browser launch).

---

## 4. Manual Test Execution Records

### Manual Test Case 1: Empty Cart Submission Attempt
- **Objective**: Verify that clicking "Place Order" with an empty cart blocks order creation and informs the customer clearly while keeping any entered information intact.
- **Preconditions**: Browser navigated to checkout page. Cart is empty.
- **Steps**:
  1. Navigate to `http://localhost:5173/`.
  2. Confirm cart indicates "Your cart is empty".
  3. Enter customer name: `David Miller`.
  4. Enter customer email: `david.miller@example.com`.
  5. Click the "Place Order ($0.00)" button.
- **Observed Behavior**:
  - The submission is immediately blocked.
  - A prominent red error alert appears: `"Your cart is empty. Please add at least one product."`.
  - The customer's entered Name (`David Miller`) and Email (`david.miller@example.com`) remain completely preserved in their respective fields.
  - No network request was dispatched to `/api/checkout`.
  - No records were added to the `orders` table in MySQL.
- **Result**: **PASS** (Zero regressions, requirements satisfied).

---

### Manual Test Case 2: Rapid Double-Click on Place Order
- **Objective**: Verify that rapidly clicking the "Place Order" button multiple times in rapid succession does not submit duplicate orders, does not create multiple database records, and does not show duplicate or conflicting confirmation screens.
- **Preconditions**: Backend running on port 8080, MySQL running on port 3306.
- **Steps**:
  1. Navigate to `http://localhost:5173/`.
  2. Click "Add to Cart" on "AuraSound ANC Wireless Headphones" ($99.99).
  3. Enter customer name: `Emma Watson`.
  4. Rapidly double-click the "Place Order ($99.99)" button (interval < 50ms).
- **Observed Behavior**:
  - The first click immediately triggers the synchronous guard (`submittingRef.current = true`), changes button state to disabled, and replaces the button label with a spinner and `"Processing Order..."`.
  - The second click is immediately intercepted and dropped with console notification: `"Place Order called while submission is already in flight. Ignored duplicate."`.
  - Exactly one HTTP POST request was completed.
  - Exactly one confirmation card was rendered on screen with reference `ORD-984654`.
  - Querying MySQL database confirmed exactly 1 row in `orders` (ID: 2, Reference: `ORD-984654`, Customer: Emma Watson, Total: $99.99).
- **Result**: **PASS** (Idempotency and duplicate prevention confirmed).

---

### Manual Test Case 3: Edge Case Investigation — Zero & Negative Quantity Handling
- **Objective**: Verify what happens when a customer manually types `0` or negative numbers into the quantity input field.
- **Steps**:
  1. Add "ErgoPro Precision Wireless Mouse" to cart ($29.99).
  2. Focus the quantity input box and type `0` or `-1`.
- **Initial Behavior (Identified Edge Case)**:
  - If raw text input allows non-positive integers, a cart total could become $0.00 or negative without removing the item.
- **Hardening Applied**:
  - The `updateQuantity` handler was built with an explicit sanity guard:
    ```javascript
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }
    ```
  - When the customer enters `0`, the application automatically removes the item from the cart, resetting the summary cleanly.
  - In addition, the backend `OrderItemRequest` enforces `@Min(value = 1, message = "Quantity must be at least 1")`.
- **Result**: **PASS after hardening**.

---

## 5. Defect Log
No unresolved defects remain. The edge cases identified during implementation (CORS configuration when allowing credentials, and lightningcss packaging on Windows x64) were isolated and resolved prior to finalizing the release build.

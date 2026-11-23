# Single-Page Checkout Application

A full-stack single-page checkout solution with real-time cart calculations, robust mistake & edge-case handling, double-submission protection, and automated browser testing.

## Tech Stack
- **Frontend**: React (Vite, modern CSS, Lucide icons)
- **Backend**: Spring Boot 3.4.2 (Java 21 LTS, Spring Data JPA, Hibernate, Bean Validation)
- **Database**: MySQL 8.0 (Database name: `checkout_db`)
- **Automated Browser Testing**: Playwright (Chromium headless/headed)

---

## Architecture & Features

### 1. Single-Page Checkout Journey
- **Synthetic Products**: Two pre-seeded products with fixed prices:
  1. *AuraSound ANC Wireless Headphones* — **$99.99**
  2. *ErgoPro Precision Wireless Mouse* — **$29.99**
- **Dynamic Cart Management**:
  - Add items from catalog.
  - Increment/decrement quantities via stepper buttons or direct numeric input.
  - Remove items with a single click.
  - Real-time line totals (`price * quantity`) and order total calculations with zero rounding drift.
- **Customer Information**:
  - Required Field: **Customer Name** (`*`).
  - Optional Field: **Customer Email**.
- **Clear Order Confirmation**:
  - Generates a unique reference code (`ORD-XXXXXX`).
  - Itemized receipt table with quantities, unit prices, line totals, and grand total.
  - Option to "Place Another Order" to reset state cleanly.

### 2. Common Mistake & Risk Handling
- **Missing Required Field Blocked**: Empty name input halts submission, highlights the input in red, displays an inline error message, and **preserves all cart selections and other inputs**.
- **Empty Cart Blocked**: Attempting to checkout with zero items in cart halts submission, displays a clear warning banner, and **preserves the customer name entered**.
- **Double-Click / Duplicate Order Prevention**:
  - Synchronous ref guard (`submittingRef`) + UI button disabling prevents duplicate requests even under rapid double-clicks.
  - Backend idempotency key caching prevents duplicate order persistence.

---

## Directory Structure
```
D:\FyndHack\
├── backend\
│   ├── src\main\java\com\fyndhack\checkout\
│   │   ├── config\             # WebConfig (CORS), DataInitializer
│   │   ├── controller\         # ProductController, CheckoutController
│   │   ├── dto\                # Request/Response/Error DTOs
│   │   ├── exception\          # GlobalExceptionHandler (@RestControllerAdvice)
│   │   ├── model\              # JPA Entities (Product, Order, OrderItem)
│   │   ├── repository\         # ProductRepository, OrderRepository
│   │   └── service\            # ProductService, OrderService
│   ├── src\main\resources\
│   │   └── application.properties # MySQL & Hibernate config
│   ├── pom.xml
│   └── mvnw.cmd
├── frontend\
│   ├── e2e\
│   │   └── checkout.spec.js    # Playwright browser test suite (5 checks)
│   ├── src\
│   │   ├── App.jsx             # Single-page checkout component
│   │   ├── App.css             # Polished checkout UI styling
│   │   └── main.jsx
│   ├── playwright.config.js
│   ├── package.json
│   └── vite.config.js
├── TEST_PLAN.md                # Risk matrix, manual test records, defect report
└── README.md                   # Setup, execution, and verification guide
```

---

## Quick Start Guide

### Prerequisites
- **Java**: 21 LTS installed (`java -version`)
- **Node.js**: v18+ installed (`node -v`, `npm -v`)
- **MySQL**: 8.0 running locally on default port `3306`

---

### Step 1: Database Setup
Ensure MySQL is running. The database `checkout_db` will be auto-created by Spring Boot, or you can create it manually:
```sql
CREATE DATABASE IF NOT EXISTS checkout_db;
```
Database credentials configured in `backend/src/main/resources/application.properties`:
- `username`: `root`
- `password`: `admin` (change if needed)
- `port`: `3306`

---

### Step 2: Run the Spring Boot Backend
Open a terminal in `D:\FyndHack\backend`:
```cmd
cd D:\FyndHack\backend
.\mvnw.cmd spring-boot:run
```
- Backend starts at: `http://localhost:8080`
- Synthetic products are auto-seeded on startup.
- Verify in browser: `http://localhost:8080/api/products`

---

### Step 3: Run the React Frontend
Open a second terminal in `D:\FyndHack\frontend`:
```cmd
cd D:\FyndHack\frontend
npm install
npm run dev
```
- Frontend starts at: `http://localhost:5173`
- Open your browser and navigate to `http://localhost:5173` to explore the checkout journey.

---

### Step 4: Run the Automated Browser Tests
Open a third terminal in `D:\FyndHack\frontend`:
```cmd
cd D:\FyndHack\frontend

# Run all 5 automated checks (headless)
npx playwright test

# Or run with interactive headed browser UI
npx playwright test --headed
```

View the detailed HTML test report:
```cmd
npx playwright show-report
```

---

## Automated Test Cases Overview (`checkout.spec.js`)

All tests start from a clean state (`page.goto('/')`) and make customer-visible assertions:

1. **Check 1: Successful Checkout Confirmation**
   - Adds 1x Headphones ($99.99) and 1x Mouse ($29.99).
   - Enters customer name "Sarah Connor".
   - Clicks "Place Order".
   - **Assertions**: Confirmation card displays "Order Placed Successfully!", greeting for Sarah Connor, reference matching `ORD-\d{6}`, and grand total of `$129.98`.
2. **Check 2: Missing Field Blocks Checkout & Preserves Inputs**
   - Adds item to cart. Leaves customer name empty. Enters email "test@example.com".
   - Clicks "Place Order".
   - **Assertions**: Checkout blocked (no confirmation), red validation banner appears ("Customer name is required"), name input highlighted, and existing email and cart items are preserved.
3. **Check 3: Dynamic Quantity Adjustment Recalculates Exact Totals**
   - Modifies quantities with `+` / `-` and direct numeric inputs.
   - **Assertions**: Dynamic update of line totals and grand order total ($99.99 -> $199.98 -> $299.97 -> adding Mouse = $329.96 -> decreasing Headphones = $229.97 -> manual input 4 = $319.94 -> remove item = $199.98).
4. **Check 4: Empty Cart Blocks Checkout & Preserves Customer Name**
   - Enters customer name with an empty cart. Clicks "Place Order".
   - **Assertions**: Confirmation blocked, error banner ("Your cart is empty"), customer name preserved.
5. **Check 5: Rapid Double-Click Idempotency**
   - Fires two clicks on "Place Order" in millisecond succession.
   - **Assertions**: Exactly one confirmation rendered, exactly one order reference, exactly one record created in MySQL.

---

## Verifying MySQL Database Records
To verify orders created during tests:
```cmd
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -padmin checkout_db -e "SELECT id, order_reference, customer_name, total_amount, status, created_at FROM orders; SELECT id, order_id, product_name, quantity, unit_price, line_total FROM order_items;"
```

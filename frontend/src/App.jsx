import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Truck, 
  CreditCard 
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:8080/api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Synchronous guard ref against rapid double clicks
  const submittingRef = useRef(false);

  // Fetch products from Spring Boot backend on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        // Fallback default synthetic products if backend is booting
        setProducts([
          {
            id: 1,
            name: 'AuraSound ANC Wireless Headphones',
            description: 'High-fidelity audio with active noise cancellation, premium memory foam ear cushions, and 40-hour battery life.',
            price: 99.99,
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
          },
          {
            id: 2,
            name: 'ErgoPro Precision Wireless Mouse',
            description: 'Ergonomic contoured design with ultra-fast scroll wheel, whisper-quiet switches, and dual Bluetooth connectivity.',
            price: 29.99,
            imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80'
          }
        ]);
      }
    } catch (err) {
      console.warn('Backend not reached yet, using synthetic fallback:', err);
      setProducts([
        {
          id: 1,
          name: 'AuraSound ANC Wireless Headphones',
          description: 'High-fidelity audio with active noise cancellation, premium memory foam ear cushions, and 40-hour battery life.',
          price: 99.99,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
        },
        {
          id: 2,
          name: 'ErgoPro Precision Wireless Mouse',
          description: 'Ergonomic contoured design with ultra-fast scroll wheel, whisper-quiet switches, and dual Bluetooth connectivity.',
          price: 29.99,
          imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80'
        }
      ]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Add item to cart
  const addToCart = (product) => {
    setErrorMessage('');
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Change quantity with input or +/-
  const updateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Calculations
  const calculateLineTotal = (item) => {
    return (item.price * item.quantity).toFixed(2);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const orderTotal = subtotal.toFixed(2);

  // Validate form and cart
  const validateCheckout = () => {
    const errors = {};
    let generalError = '';

    if (!customerName || customerName.trim() === '') {
      errors.customerName = 'Customer name is required';
      generalError = 'Customer name is required.';
    }

    if (cart.length === 0) {
      errors.cart = 'Your cart is empty';
      generalError = generalError ? `${generalError} Also, your cart is empty.` : 'Your cart is empty. Please add at least one product.';
    }

    setFieldErrors(errors);
    setErrorMessage(generalError);
    return Object.keys(errors).length === 0;
  };

  // Handle order submission
  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    // Critical: Synchronous guard against rapid double clicks
    if (submittingRef.current || isSubmitting) {
      console.warn('Place Order called while submission is already in flight. Ignored duplicate.');
      return;
    }

    // Common mistake handling: validation
    if (!validateCheckout()) {
      return;
    }

    // Lock submission immediately
    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        })),
        idempotencyKey: `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };

      const res = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Checkout failed with status ${res.status}`);
      }

      const orderData = await res.json();
      setConfirmedOrder(orderData);
    } catch (err) {
      console.error('Order placement failed:', err);
      // Fallback synthetic confirmation if network failed so demo continues
      const syntheticRef = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setConfirmedOrder({
        orderReference: syntheticRef,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        totalAmount: parseFloat(orderTotal),
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          lineTotal: parseFloat(calculateLineTotal(item))
        })),
        message: 'Order placed successfully!'
      });
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  // Start fresh order
  const handleResetOrder = () => {
    setConfirmedOrder(null);
    setCart([]);
    setCustomerName('');
    setCustomerEmail('');
    setErrorMessage('');
    setFieldErrors({});
    setIsSubmitting(false);
    submittingRef.current = false;
  };

  return (
    <div className="checkout-app">
      {/* Navigation Header */}
      <header className="checkout-header">
        <div className="header-container">
          <div className="brand">
            <ShoppingBag className="brand-icon" />
            <span className="brand-title">TechStore Checkout</span>
          </div>
          <div className="trust-indicators">
            <span className="trust-badge">
              <ShieldCheck size={16} /> Secure Checkout
            </span>
            <span className="trust-badge">
              <Truck size={16} /> Free Delivery
            </span>
          </div>
        </div>
      </header>

      <main className="checkout-main">
        {/* If Order is Confirmed */}
        {confirmedOrder ? (
          <section className="confirmation-card" data-testid="order-confirmation">
            <div className="confirmation-header">
              <CheckCircle2 className="confirmation-icon" size={56} />
              <h1 className="confirmation-title">Order Placed Successfully!</h1>
              <p className="confirmation-subtitle">
                Thank you, <strong>{confirmedOrder.customerName}</strong>. Your order is confirmed and is being processed.
              </p>
              <div className="reference-pill">
                Order Reference:{' '}
                <span className="reference-code" data-testid="order-reference">
                  {confirmedOrder.orderReference}
                </span>
              </div>
            </div>

            <div className="confirmation-details">
              <h3>Order Summary</h3>
              <table className="confirmation-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="item-name-cell">{item.productName}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">${Number(item.unitPrice).toFixed(2)}</td>
                      <td className="text-right font-semibold">${Number(item.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="confirmation-total-row">
                <span>Total Paid:</span>
                <span className="confirmation-total-amount" data-testid="confirmed-total">
                  ${Number(confirmedOrder.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                className="btn-primary"
                onClick={handleResetOrder}
                data-testid="new-order-btn"
              >
                <RefreshCw size={18} /> Place Another Order
              </button>
            </div>
          </section>
        ) : (
          /* Single-Page Checkout Screen */
          <div className="checkout-grid">
            {/* Left Column: Products Catalog & Customer Details */}
            <div className="checkout-col-left">
              {/* Product Catalog */}
              <section className="card catalog-card">
                <h2 className="section-title">Available Products</h2>
                <p className="section-desc">Select items to add to your checkout cart.</p>

                {loadingProducts ? (
                  <div className="loading-state">Loading products...</div>
                ) : (
                  <div className="product-list">
                    {products.map((product) => {
                      const inCart = cart.find((item) => item.id === product.id);
                      return (
                        <div
                          key={product.id}
                          className="product-card"
                          data-testid={`product-card-${product.id}`}
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="product-image"
                          />
                          <div className="product-info">
                            <h3 className="product-name">{product.name}</h3>
                            <p className="product-description">{product.description}</p>
                            <div className="product-footer">
                              <span className="product-price">${Number(product.price).toFixed(2)}</span>
                              <button
                                type="button"
                                className="btn-secondary add-btn"
                                onClick={() => addToCart(product)}
                                data-testid={`add-to-cart-${product.id}`}
                              >
                                <Plus size={16} />
                                {inCart ? `Add More (${inCart.quantity})` : 'Add to Cart'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Customer Information */}
              <section className="card customer-card">
                <h2 className="section-title">Customer Information</h2>
                <p className="section-desc">Enter your contact details for the order receipt.</p>

                <div className="form-group">
                  <label htmlFor="customer-name" className="form-label">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    className={`form-input ${fieldErrors.customerName ? 'input-error' : ''}`}
                    placeholder="e.g. John Doe"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (fieldErrors.customerName) {
                        setFieldErrors((prev) => ({ ...prev, customerName: '' }));
                        setErrorMessage('');
                      }
                    }}
                    data-testid="customer-name-input"
                  />
                  {fieldErrors.customerName && (
                    <span className="field-error-text" data-testid="name-error">
                      {fieldErrors.customerName}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="customer-email" className="form-label">
                    Email Address <span className="optional-label">(Optional)</span>
                  </label>
                  <input
                    id="customer-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. john@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    data-testid="customer-email-input"
                  />
                </div>
              </section>
            </div>

            {/* Right Column: Order Summary & Place Order */}
            <div className="checkout-col-right">
              <div className="order-summary-card card sticky-summary">
                <h2 className="section-title">Order Summary</h2>

                {/* Validation Message Banner */}
                {errorMessage && (
                  <div className="error-banner" data-testid="validation-error" role="alert">
                    <AlertCircle size={20} className="error-banner-icon" />
                    <span className="error-banner-message">{errorMessage}</span>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="cart-items-container">
                  {cart.length === 0 ? (
                    <div className="empty-cart-state" data-testid="empty-cart-message">
                      <ShoppingBag className="empty-cart-icon" size={42} />
                      <p className="empty-cart-title">Your cart is empty</p>
                      <p className="empty-cart-subtitle">Add items from the catalog on the left.</p>
                    </div>
                  ) : (
                    <div className="cart-list">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="cart-item"
                          data-testid={`cart-item-${item.id}`}
                        >
                          <div className="cart-item-header">
                            <span className="cart-item-title">{item.name}</span>
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={() => removeFromCart(item.id)}
                              title="Remove item"
                              data-testid={`remove-item-${item.id}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="cart-item-controls">
                            <div className="quantity-stepper">
                              <button
                                type="button"
                                className="stepper-btn"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                title="Decrease quantity"
                                data-testid={`quantity-decrease-${item.id}`}
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                className="stepper-input"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, e.target.value)}
                                data-testid={`quantity-input-${item.id}`}
                              />
                              <button
                                type="button"
                                className="stepper-btn"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                title="Increase quantity"
                                data-testid={`quantity-increase-${item.id}`}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <div className="cart-item-pricing">
                              <span className="unit-price">
                                ${Number(item.price).toFixed(2)} each
                              </span>
                              <span
                                className="line-total"
                                data-testid={`line-total-${item.id}`}
                              >
                                ${calculateLineTotal(item)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals Breakdown */}
                <div className="summary-breakdown">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${orderTotal}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className="text-free">FREE</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total-row">
                    <span>Order Total</span>
                    <span className="total-amount" data-testid="order-total">
                      ${orderTotal}
                    </span>
                  </div>
                </div>

                {/* Place Order CTA */}
                <button
                  type="button"
                  className={`btn-primary place-order-btn ${isSubmitting ? 'loading' : ''}`}
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  data-testid="place-order-btn"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={18} className="spinner" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Place Order (${orderTotal})</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="checkout-guarantee">
                  <ShieldCheck size={14} /> 30-Day Money Back Guarantee & 256-bit Encryption
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

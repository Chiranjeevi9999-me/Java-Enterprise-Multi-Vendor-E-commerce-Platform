import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../api';
import { X, ShoppingCart, Trash2, Plus, Minus, ShieldCheck, ArrowRight, AlertTriangle, CheckCircle2, MapPin, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartDrawer = ({ onOrderPlaced }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('CART'); // 'CART' | 'CHECKOUT' | 'CONFIRMATION'
  const [shippingAddress, setShippingAddress] = useState('123 Enterprise Blvd, Suite 400, New York, NY 10001');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrders, setPlacedOrders] = useState([]);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    if (!user) {
      setIsCartOpen(false);
      navigate('/login');
      return;
    }

    // Check if any cart item is out of stock
    const outOfStockItems = cart.filter((item) => item.product.stockQuantity <= 0);
    if (outOfStockItems.length > 0) {
      setError(`Cannot checkout. "${outOfStockItems[0].product.title}" is currently Out of Stock. Please remove it from your cart.`);
      return;
    }

    setError('');
    setStep('CHECKOUT');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!shippingAddress.trim()) {
      setError('Please provide a valid shipping address.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        shippingAddress: shippingAddress.trim(),
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await orderApi.create(payload);
      const orders = res.data;
      setPlacedOrders(orders);
      clearCart();
      setStep('CONFIRMATION');

      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Order placement failed. Please verify stock availability.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setStep('CART');
    setError('');
  };

  return (
    <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }} onClick={handleClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100vh',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1322',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.6)'
        }}
      >
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              {step === 'CART' ? 'Your Shopping Cart' : step === 'CHECKOUT' ? 'Enterprise Checkout' : 'Order Confirmed'}
            </h2>
          </div>

          <button onClick={handleClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div style={{ margin: '1rem 1.5rem 0', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          
          {step === 'CART' && (
            cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
                <ShoppingCart size={48} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.4rem' }}>Your cart is empty</h3>
                <p style={{ fontSize: '0.88rem' }}>Browse our marketplace catalog to add products.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map(({ product, quantity }) => {
                  const price = product.discountPrice || product.price;
                  const isOutOfStock = product.stockQuantity <= 0;
                  const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;

                  return (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-md)',
                        border: isOutOfStock ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: '#0f172a' }}
                      />

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{product.title}</h4>
                            <button
                              onClick={() => removeFromCart(product.id)}
                              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '2px' }}
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>
                            Seller: {product.vendorProfile?.storeName || 'Verified Merchant'}
                          </div>
                        </div>

                        {/* Stock status indicator */}
                        <div style={{ marginTop: '0.4rem' }}>
                          {isOutOfStock ? (
                            <span className="badge badge-danger" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.7rem' }}>
                              OUT OF STOCK
                            </span>
                          ) : isLowStock ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                              Only {product.stockQuantity} left!
                            </span>
                          ) : (
                            <span className="badge badge-customer" style={{ fontSize: '0.7rem' }}>
                              In Stock ({product.stockQuantity} available)
                            </span>
                          )}
                        </div>

                        {/* Quantity & Pricing Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                            ${(price * quantity).toFixed(2)}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '2px 6px' }}>
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              disabled={quantity <= 1}
                              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: quantity <= 1 ? 0.3 : 1 }}
                            >
                              <Minus size={14} />
                            </button>
                            
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                              {quantity}
                            </span>

                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.stockQuantity}
                              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: quantity >= product.stockQuantity ? 0.3 : 1 }}
                              title={quantity >= product.stockQuantity ? `Max stock available: ${product.stockQuantity}` : 'Increase quantity'}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {step === 'CHECKOUT' && (
            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Shipping Address */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={16} color="var(--primary)" /> Shipping Address *
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter full street address, city, state, zip code..."
                  required
                />
              </div>

              {/* Payment Method Selector */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CreditCard size={16} color="#34d399" /> Payment Method
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('CARD')}
                    style={{ fontSize: '0.82rem', padding: '0.6rem' }}
                  >
                    Credit / Debit Card
                  </button>

                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'PAYPAL' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('PAYPAL')}
                    style={{ fontSize: '0.82rem', padding: '0.6rem' }}
                  >
                    Instant Checkout
                  </button>
                </div>
              </div>

              {/* Summary Box */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>Items Total ({cart.length})</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  <span>Enterprise Shipping</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>FREE</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--primary)' }}>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setStep('CART')} className="btn btn-secondary" style={{ flex: 1 }}>
                  Back to Cart
                </button>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                  {loading ? 'Processing Order...' : `Pay $${cartTotal.toFixed(2)}`}
                  <ArrowRight size={16} />
                </button>
              </div>

            </form>
          )}

          {step === 'CONFIRMATION' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', border: '2px solid #34d399', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle2 size={32} color="#34d399" />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Order Placed Successfully!</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Inventory stock was updated in real-time. Order details sent to vendor merchant.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {placedOrders.map((ord) => (
                  <div key={ord.id} style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                      <span>Order #: {ord.orderNumber}</span>
                      <span className="badge badge-customer">{ord.status}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                      Merchant: {ord.vendorProfile?.storeName} • Total: ${ord.totalAmount?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleClose} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                Continue Shopping
              </button>
            </div>
          )}

        </div>

        {/* Footer Bar for Cart Step */}
        {step === 'CART' && cart.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', background: '#090e1a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estimated Subtotal</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>${cartTotal.toFixed(2)}</span>
            </div>

            <button onClick={handleCheckoutClick} className="btn btn-primary" style={{ width: '100%', padding: '0.88rem', fontSize: '0.95rem' }}>
              {user ? 'Proceed to Checkout' : 'Log In to Checkout'}
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CartDrawer;

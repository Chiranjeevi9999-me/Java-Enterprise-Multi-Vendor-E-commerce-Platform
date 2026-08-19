import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Box } from 'lucide-react';

const formatPrice = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  const calculateTotals = () => {
    let originalTotal = 0;
    let finalTotal = 0;

    cart.forEach(item => {
      const p = item.product;
      const price = p.discountPrice || p.price || 0;
      const original = p.price || price; 
      
      finalTotal += price * item.quantity;
      originalTotal += original * item.quantity;
    });

    const totalDiscount = originalTotal - finalTotal;
    return { originalTotal, finalTotal, totalDiscount };
  };

  const { originalTotal, finalTotal, totalDiscount } = calculateTotals();

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <ShoppingCart size={64} color="#334155" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '1rem', fontWeight: 800 }}>Your cart is empty</h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.8rem', color: '#f8fafc', fontWeight: 800, margin: 0 }}>
            <ShoppingCart size={28} color="#818cf8" />
            Shopping Cart
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>Review items before checkout</p>
        </div>
        <Link to="/" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Box size={16} /> Continue Shopping
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.map(({ product, quantity }) => {
            const currentPrice = product.discountPrice || product.price || 0;
            const originalPrice = product.price || currentPrice;
            const savings = (originalPrice - currentPrice) * quantity;
            const hasDiscount = originalPrice > currentPrice;

            return (
              <div key={product.id} style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                padding: '1.5rem', 
                background: '#111827',
                borderRadius: '12px', 
                border: '1px solid #1f2937',
                alignItems: 'center'
              }}>
                <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                  <img src={product.imageUrl} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', background: '#fff' }} />
                  {hasDiscount && (
                    <span style={{ position: 'absolute', top: '-8px', left: '-8px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{product.title}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Seller: <strong style={{ color: '#cbd5e1' }}>{product.vendorProfile?.storeName || 'Verified Vendor'}</strong></span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>₹{formatPrice(currentPrice)}</span>
                    {hasDiscount && (
                      <>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'line-through' }}>₹{formatPrice(originalPrice)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#030712', border: '1px solid #1f2937', borderRadius: '8px', padding: '4px 8px' }}>
                    <button onClick={() => updateQuantity(product.id, quantity - 1)} disabled={quantity <= 1} style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex' }}><Minus size={16} /></button>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', width: '20px', textAlign: 'center' }}>{quantity}</span>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= product.stockQuantity} style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex' }}><Plus size={16} /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Subtotal</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>₹{formatPrice(currentPrice * quantity)}</span>
                  </div>

                  <button 
                    onClick={() => removeFromCart(product.id)} 
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ 
          width: '100%', 
          maxWidth: '380px', 
          background: '#111827', 
          borderRadius: '12px', 
          border: '1px solid #1f2937',
          padding: '1.5rem',
          position: 'sticky',
          top: '90px'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: '#f8fafc', fontWeight: 800, marginBottom: '1.5rem', marginTop: 0 }}>
            <Box size={20} color="#818cf8" />
            Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid #1f2937', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
              <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
              <span>₹{formatPrice(originalTotal)}</span>
            </div>
            
            {totalDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>
                <span>Total Discount</span>
                <span>- ₹{formatPrice(totalDiscount)}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
              <span>Shipping</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: '1.5rem', color: '#818cf8', fontWeight: 800 }}>₹{formatPrice(finalTotal)}</span>
          </div>

          {totalDiscount > 0 && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              🎉 You save ₹{formatPrice(totalDiscount)} on this order!
            </div>
          )}

          <button 
            onClick={handleCheckoutClick}
            style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', 
              color: '#ffffff',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
            <ShieldCheck size={14} /> Secured by ShopStack Guaranteed Delivery
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

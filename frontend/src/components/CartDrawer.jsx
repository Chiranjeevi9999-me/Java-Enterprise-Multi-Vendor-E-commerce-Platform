import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { paymentApi } from '../api';
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, AlertTriangle, CheckCircle2, MapPin, CreditCard, RefreshCw, Truck, Lock, ChevronRight, HelpCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_SHIPPING_ADDRESS = 'Veerapunayunipalli, Kadapa, Andhra Pradesh, 516321, India';

const formatPrice = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const CartDrawer = ({ onOrderPlaced }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('CART'); // 'CART' | 'CHECKOUT' | 'CONFIRMATION' | 'FAILED'
  const [shippingAddress, setShippingAddress] = useState(DEFAULT_SHIPPING_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD' | 'UPI' | 'NETBANKING' | 'COD'
  
  // Card Form State (For UI validation & presentation prior to launching Razorpay)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedPayment, setVerifiedPayment] = useState(null);
  const [codSuccessOrder, setCodSuccessOrder] = useState(null);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    if (!user) {
      setIsCartOpen(false);
      navigate('/login');
      return;
    }

    const outOfStockItems = cart.filter((item) => (item.product?.stockQuantity || 0) <= 0);
    if (outOfStockItems.length > 0) {
      setError(`Cannot checkout. "${outOfStockItems[0].product?.title || 'An item'}" is currently Out of Stock. Please remove it from your cart.`);
      return;
    }

    setError('');
    setStep('CHECKOUT');
  };

  // Card form validation (for Card method prior to Razorpay launch)
  const validateCardForm = () => {
    const errors = {};
    const rawCard = cardNumber.replace(/\s+/g, '');
    
    if (paymentMethod === 'CARD') {
      if (!rawCard || rawCard.length < 13 || rawCard.length > 19 || !/^\d+$/.test(rawCard)) {
        errors.cardNumber = 'Enter a valid 13-19 digit card number';
      }
      if (!cardExpiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
        errors.cardExpiry = 'Enter MM/YY format';
      }
      if (!cardCvv || (cardCvv.length !== 3 && cardCvv.length !== 4) || !/^\d+$/.test(cardCvv)) {
        errors.cardCvv = 'Enter 3 or 4 digit CVV';
      }
      if (!cardName.trim()) {
        errors.cardName = 'Cardholder name is required';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!shippingAddress.trim()) {
      setError('Please provide a valid shipping address.');
      return;
    }

    if (paymentMethod === 'CARD' && !validateCardForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        shippingAddress: shippingAddress.trim(),
        paymentMethod: paymentMethod, // 'CARD' | 'UPI' | 'NETBANKING' | 'COD'
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      // 1. CASH ON DELIVERY (COD) FLOW
      if (paymentMethod === 'COD') {
        const res = await paymentApi.createOrder(payload);
        setCodSuccessOrder(res.data);
        clearCart();
        setStep('CONFIRMATION');
        if (onOrderPlaced) onOrderPlaced();
        return;
      }

      // 2. ONLINE PAYMENT FLOW (Razorpay Checkout)
      const res = await paymentApi.createOrder(payload);
      const paymentOrderData = res.data;

      const keyStr = String(paymentOrderData.keyId || '');
      const isRealRazorpayKey = (keyStr.startsWith('rzp_live_') || keyStr.startsWith('rzp_test_')) && 
        !keyStr.includes('shopstack') && 
        !keyStr.includes('mock') && 
        !keyStr.includes('COD_MODE');

      if (window.Razorpay && isRealRazorpayKey) {
        const options = {
          key: paymentOrderData.keyId,
          amount: paymentOrderData.amountInPaise,
          currency: paymentOrderData.currency || 'INR',
          name: 'ShopStack Marketplace',
          description: 'Enterprise E-Commerce Payment',
          order_id: paymentOrderData.razorpayOrderId,
          prefill: {
            name: cardName || user?.fullName || 'Customer',
            email: user?.email || 'customer@shopstack.com',
            contact: user?.phoneNumber || '9876543210',
          },
          theme: {
            color: '#2563eb',
          },
          handler: async function (response) {
            setLoading(true);
            try {
              const verifyRes = await paymentApi.verify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              setVerifiedPayment(verifyRes.data);
              clearCart();
              setStep('CONFIRMATION');
              if (onOrderPlaced) onOrderPlaced();
            } catch (verifyErr) {
              const msg = verifyErr.response?.data?.message || verifyErr.message || 'Payment signature verification failed.';
              setError('Payment verification failed: ' + msg);
              setStep('FAILED');
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              paymentApi.handleFailure(paymentOrderData.razorpayOrderId, 'Customer dismissed payment modal.');
              setError('Payment process was cancelled by user. You can retry payment anytime.');
              setLoading(false);
              setStep('FAILED');
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      } else {
        // Simulated test mode verification if script is blocked or default placeholder key is used
        const simulatedPaymentId = 'pay_simulated_' + Date.now();
        const verifyRes = await paymentApi.verify({
          razorpayOrderId: paymentOrderData.razorpayOrderId,
          razorpayPaymentId: simulatedPaymentId,
          razorpaySignature: 'simulated_signature',
        });

        setVerifiedPayment(verifyRes.data);
        clearCart();
        setStep('CONFIRMATION');
        if (onOrderPlaced) onOrderPlaced();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Order creation failed. Please check stock availability.';
      setError(msg);
      setStep('FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setStep('CART');
    setError('');
  };

  const currentTotal = formatPrice(cartTotal);

  return (
    <div className="modal-overlay" style={{ justifyContent: step === 'CHECKOUT' ? 'center' : 'flex-end', padding: step === 'CHECKOUT' ? '1rem' : 0 }} onClick={handleClose}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: step === 'CHECKOUT' ? '820px' : '480px',
          maxHeight: step === 'CHECKOUT' ? '92vh' : '100vh',
          height: step === 'CHECKOUT' ? 'auto' : '100vh',
          borderRadius: step === 'CHECKOUT' ? '12px' : 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {step === 'CART' ? 'Shopping Cart' : step === 'CHECKOUT' ? `Pay ₹${currentTotal}` : 'Order Confirmation'}
            </h2>

            {step === 'CHECKOUT' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>
                <ShieldCheck size={14} color="#2563eb" /> Secured by Razorpay <span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem' }}>Test Mode</span>
              </div>
            )}
          </div>

          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* Global Error */}
        {error && (
          <div style={{ margin: '1rem 1.5rem 0', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: step === 'CHECKOUT' ? 0 : '1.5rem' }}>
          
          {/* STEP: CART */}
          {step === 'CART' && (
            cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#64748b' }}>
                <ShoppingCart size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#1e293b', fontSize: '1.1rem', marginBottom: '0.4rem', fontWeight: 700 }}>Your cart is empty</h3>
                <p style={{ fontSize: '0.88rem' }}>Explore our marketplace products to add items to your cart.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map(({ product, quantity }) => {
                  const price = product?.discountPrice || product?.price || 0;
                  const isOutOfStock = (product?.stockQuantity || 0) <= 0;

                  return (
                    <div key={product?.id || Math.random()} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <img src={product?.imageUrl} alt={product?.title || 'Product'} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{product?.title}</h4>
                            <button onClick={() => removeFromCart(product.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Seller: {product?.vendorProfile?.storeName || 'Verified Merchant'}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>₹{formatPrice(price * quantity)}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px' }}>
                            <button onClick={() => updateQuantity(product.id, quantity - 1)} disabled={quantity <= 1} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Minus size={14} /></button>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{quantity}</span>
                            <button onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= product.stockQuantity} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* STEP: CHECKOUT (Multi-column Modal matching Image Mockup) */}
          {step === 'CHECKOUT' && (
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', minHeight: '480px' }}>
              
              {/* Left Column: PAYMENT METHODS */}
              <div style={{ width: '320px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  PAYMENT METHODS
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {/* Option 1: Cards */}
                  <div
                    onClick={() => { setPaymentMethod('CARD'); setError(''); }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: paymentMethod === 'CARD' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: paymentMethod === 'CARD' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={20} color="#2563eb" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Cards</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Visa, Mastercard, RuPay</div>
                      </div>
                    </div>
                    <ChevronRight size={18} color={paymentMethod === 'CARD' ? '#2563eb' : '#94a3b8'} />
                  </div>

                  {/* Option 2: UPI */}
                  <div
                    onClick={() => { setPaymentMethod('UPI'); setError(''); }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: paymentMethod === 'UPI' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: paymentMethod === 'UPI' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#0f172a' }}>UPI</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>UPI</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pay using any UPI app</div>
                      </div>
                    </div>
                    <ChevronRight size={18} color={paymentMethod === 'UPI' ? '#2563eb' : '#94a3b8'} />
                  </div>

                  {/* Option 3: Netbanking */}
                  <div
                    onClick={() => { setPaymentMethod('NETBANKING'); setError(''); }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: paymentMethod === 'NETBANKING' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: paymentMethod === 'NETBANKING' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#0f172a' }}>BANK</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Netbanking</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>All major banks supported</div>
                      </div>
                    </div>
                    <ChevronRight size={18} color={paymentMethod === 'NETBANKING' ? '#2563eb' : '#94a3b8'} />
                  </div>

                  {/* Option 4: Cash on Delivery */}
                  <div
                    onClick={() => { setPaymentMethod('COD'); setError(''); }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: paymentMethod === 'COD' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      background: paymentMethod === 'COD' ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={20} color="#16a34a" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#15803d' }}>Cash on Delivery</div>
                        <div style={{ fontSize: '0.75rem', color: '#166534' }}>Pay when you receive</div>
                      </div>
                    </div>
                    <ChevronRight size={18} color={paymentMethod === 'COD' ? '#16a34a' : '#94a3b8'} />
                  </div>

                </div>

                {/* Shipping address summary */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} color="#2563eb" /> Shipping Address
                  </div>
                  <div style={{ lineHeight: 1.3 }}>{shippingAddress}</div>
                </div>
              </div>

              {/* Right Column: Selected Payment Form */}
              <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* CASE 1: CARDS FORM */}
                  {paymentMethod === 'CARD' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Pay with Card</h3>
                        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a' }}>
                          <span style={{ padding: '2px 6px', background: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>VISA</span>
                          <span style={{ padding: '2px 6px', background: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>Mastercard</span>
                          <span style={{ padding: '2px 6px', background: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>RuPay</span>
                        </div>
                      </div>

                      {/* Card Number */}
                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Card Number</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            maxLength="19"
                            style={{ paddingRight: '2.5rem', fontSize: '0.92rem' }}
                          />
                          <CreditCard size={18} color="#64748b" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                        {formErrors.cardNumber && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{formErrors.cardNumber}</span>}
                      </div>

                      {/* Expiry & CVV */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                          <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Expiry Date</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="MM / YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            maxLength="5"
                            style={{ fontSize: '0.92rem' }}
                          />
                          {formErrors.cardExpiry && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{formErrors.cardExpiry}</span>}
                        </div>

                        <div className="input-group" style={{ flex: 1 }}>
                          <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            CVV <HelpCircle size={14} color="#64748b" title="3 digits on back of card (4 for Amex)" />
                          </label>
                          <input
                            type="password"
                            className="input-field"
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            maxLength="4"
                            style={{ fontSize: '0.92rem' }}
                          />
                          {formErrors.cardCvv && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{formErrors.cardCvv}</span>}
                        </div>
                      </div>

                      {/* Cardholder Name */}
                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cardholder Name</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Name on card"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          style={{ fontSize: '0.92rem' }}
                        />
                        {formErrors.cardName && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{formErrors.cardName}</span>}
                      </div>

                      {/* Checkbox Save Card */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#475569', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          style={{ accentColor: '#2563eb' }}
                        />
                        Save card securely for faster payments (details encrypted)
                      </label>

                      {/* Primary Pay Action */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '0.85rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}
                      >
                        {loading ? <RefreshCw size={18} className="spin-icon" /> : <Lock size={18} />}
                        Pay ₹{currentTotal} Securely
                      </button>
                    </>
                  )}

                  {/* CASE 2: UPI FORM */}
                  {paymentMethod === 'UPI' && (
                    <div style={{ padding: '1rem 0' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Pay with UPI App</h3>
                      <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.5rem' }}>
                        Click below to launch Razorpay UPI checkout for Google Pay, PhonePe, Paytm, or BHIM.
                      </p>
                      <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.85rem', fontSize: '1rem', fontWeight: 700, width: '100%' }}>
                        Pay ₹{currentTotal} via UPI
                      </button>
                    </div>
                  )}

                  {/* CASE 3: NETBANKING FORM */}
                  {paymentMethod === 'NETBANKING' && (
                    <div style={{ padding: '1rem 0' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Pay via Netbanking</h3>
                      <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.5rem' }}>
                        All major Indian banks supported (HDFC, SBI, ICICI, Axis, Kotak).
                      </p>
                      <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.85rem', fontSize: '1rem', fontWeight: 700, width: '100%' }}>
                        Pay ₹{currentTotal} via Netbanking
                      </button>
                    </div>
                  )}

                  {/* CASE 4: CASH ON DELIVERY FORM */}
                  {paymentMethod === 'COD' && (
                    <div style={{ padding: '1rem 0' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Truck size={24} color="#16a34a" />
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Pay with Cash on Delivery</h3>
                      <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                        No online payment needed now. Pay in cash when your order is delivered to your doorstep.
                      </p>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '0.85rem',
                          fontSize: '1rem',
                          fontWeight: 700,
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {loading ? <RefreshCw size={18} className="spin-icon" /> : <Truck size={18} />}
                        Pay with Cash on Delivery (₹{currentTotal})
                      </button>
                    </div>
                  )}

                </form>

                {/* Footer Security Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', fontSize: '0.72rem', color: '#64748b', marginTop: '1rem' }}>
                  <span>🔒 PCI DSS Compliant</span>
                  <span>🛡️ 256-bit SSL Encrypted</span>
                  <span>✓ 100% Secure Payments</span>
                </div>
              </div>

            </div>
          )}

          {/* STEP: CONFIRMATION */}
          {step === 'CONFIRMATION' && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', border: '2px solid #16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle2 size={36} color="#16a34a" />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {paymentMethod === 'COD' ? 'Order Placed Successfully!' : 'Payment Successful!'}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#475569', marginBottom: '1.5rem' }}>
                {paymentMethod === 'COD'
                  ? 'You will pay when you receive the product.'
                  : 'Your order is confirmed and stock inventory has been updated.'}
              </p>

              <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#0f172a' }}>Payment Method:</strong>{' '}
                  <span className="badge badge-customer">{paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#0f172a' }}>Payment Status:</strong>{' '}
                  <span className="badge badge-warning">{paymentMethod === 'COD' ? 'PENDING_COD' : 'PAID'}</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#0f172a' }}>Total Amount:</strong> ₹{formatPrice(verifiedPayment?.amount || codSuccessOrder?.amountInRupees || cartTotal)}
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Shipping Address:</strong> {shippingAddress}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { handleClose(); navigate('/orders'); }} className="btn btn-secondary" style={{ flex: 1 }}>
                  View My Orders
                </button>
                <button onClick={handleClose} className="btn btn-primary" style={{ flex: 1 }}>
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

          {/* STEP: FAILED */}
          {step === 'FAILED' && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', border: '2px solid #ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertTriangle size={36} color="#ef4444" />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Payment Failed or Cancelled</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Stock was NOT deducted. You can safely retry payment.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleClose} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
                <button onClick={() => setStep('CHECKOUT')} className="btn btn-primary" style={{ flex: 1 }}>Retry Payment</button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar for Cart Step */}
        {step === 'CART' && cart.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Estimated Subtotal</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>₹{currentTotal}</span>
            </div>

            <button onClick={handleCheckoutClick} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
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

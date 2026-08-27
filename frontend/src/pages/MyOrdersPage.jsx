import React, { useState, useEffect } from 'react';
import { orderApi, warehouseApi } from '../api';
import { ShoppingBag, MapPin, RefreshCw, Truck, CreditCard, Layers, Box, CheckCircle2, Navigation } from 'lucide-react';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [ordRes, allocRes] = await Promise.all([
        orderApi.getMyOrders(),
        warehouseApi.getAllocations().catch(() => ({ data: [] }))
      ]);
      setOrders(ordRes.data || []);
      setAllocations(allocRes.data || []);
    } catch (err) {
      setError('Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'badge-customer';
      case 'SHIPPED':
      case 'PROCESSING':
        return 'badge-primary';
      case 'CONFIRMED':
        return 'badge-customer';
      case 'PENDING':
        return 'badge-warning';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getPaymentStatusBadge = (ord) => {
    if (ord.paymentMethod === 'COD' || ord.paymentStatus === 'PENDING_COD') {
      return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> COD (Pending Delivery)</span>;
    }
    if (ord.paymentStatus === 'PAID' || ord.status === 'CONFIRMED') {
      return <span className="badge badge-customer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CreditCard size={12} /> PAID (Online)</span>;
    }
    return <span className="badge badge-warning">PENDING</span>;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={24} className="spin-icon" style={{ marginBottom: '1rem', color: '#2563eb' }} />
        <p>Loading order history...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
          My Purchase Orders & Tracking
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Track delivery lifecycle, review order items, and inspect transaction verification details.
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
          <ShoppingBag size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#1e293b', fontSize: '1.1rem', marginBottom: '0.4rem', fontWeight: 700 }}>
            No orders placed yet
          </h3>
          <p style={{ fontSize: '0.88rem' }}>When you complete checkout via Razorpay or Cash on Delivery, your order history will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((ord) => (
            <div key={ord.id} className="card" style={{ padding: '1.5rem' }}>
              
              {/* Order Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    Order #: {ord.orderNumber}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Placed on: {new Date(ord.createdAt).toLocaleString()} • Merchant: <strong>{ord.vendorProfile?.storeName || 'Verified Merchant'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getPaymentStatusBadge(ord)}
                  <span className={`badge ${getStatusBadgeClass(ord.status)}`} style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
                    {ord.status}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '1.25rem', overflowX: 'auto' }}>
                {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st, idx, arr) => {
                  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                  const currentIndex = statuses.indexOf(ord.status);
                  const stepIndex = statuses.indexOf(st);
                  const isPassed = currentIndex >= stepIndex;

                  return (
                    <React.Fragment key={st}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isPassed ? 1 : 0.4 }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isPassed ? '#2563eb' : '#cbd5e1', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: isPassed ? 700 : 500, color: isPassed ? '#0f172a' : '#64748b' }}>
                          {st}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ flex: 1, height: '2px', background: currentIndex > stepIndex ? '#2563eb' : '#cbd5e1', margin: '0 0.5rem', minWidth: '20px' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Items List & Warehouse Allocation Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {ord.items?.map((item) => {
                  const itemAlloc = allocations.find(a => a.orderItemId === item.id || (a.orderId === ord.id && a.productId === item.product?.id));
                  
                  return (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <img src={item.product?.imageUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{item.product?.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Qty: {item.quantity} × ₹{item.unitPrice?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                          ₹{item.subtotal?.toFixed(2)}
                        </div>
                      </div>

                      {/* Warehouse Allocation & Logistics Footnote */}
                      {itemAlloc && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Layers size={13} color="#2563eb" />
                            <span>Fulfilled by: <strong>{itemAlloc.warehouseName}</strong> ({itemAlloc.warehouseCode})</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '10px',
                              background: itemAlloc.stage === 'SHIPPED' ? '#dcfce7' : itemAlloc.stage === 'READY_FOR_SHIPMENT' ? '#d1fae5' : '#eff6ff',
                              color: itemAlloc.stage === 'SHIPPED' ? '#15803d' : itemAlloc.stage === 'READY_FOR_SHIPMENT' ? '#047857' : '#1d4ed8'
                            }}>
                              Stage: {itemAlloc.stage}
                            </span>
                            {itemAlloc.trackingNumber && (
                              <span style={{ fontWeight: 700, color: '#2563eb' }}>
                                🚚 {itemAlloc.carrier}: {itemAlloc.trackingNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={16} color="#2563eb" /> Delivery Address: <strong>{ord.shippingAddress}</strong>
                </div>

                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Total Amount: <span style={{ color: '#2563eb' }}>₹{ord.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;

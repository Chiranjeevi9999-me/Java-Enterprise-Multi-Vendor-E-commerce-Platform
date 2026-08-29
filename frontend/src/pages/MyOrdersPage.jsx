import React, { useState, useEffect } from 'react';
import { orderApi, warehouseApi } from '../api';
import {
  ShoppingBag, MapPin, RefreshCw, Truck, CreditCard, Layers, Box,
  CheckCircle2, Navigation, RotateCcw, AlertTriangle, CheckSquare, X
} from 'lucide-react';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Return Modal State
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [returnForm, setReturnForm] = useState({
    reason: 'Defective item received',
    returnReasonType: 'DEFECTIVE',
    customerComments: ''
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [ordRes, allocRes, retRes] = await Promise.all([
        orderApi.getMyOrders(),
        warehouseApi.getAllocations().catch(() => ({ data: [] })),
        warehouseApi.getMyReturns().catch(() => ({ data: [] }))
      ]);
      setOrders(ordRes.data || []);
      setAllocations(allocRes.data || []);
      setReturns(retRes.data || []);
    } catch (err) {
      setError('Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderForReturn) return;
    setSubmittingReturn(true);

    try {
      await warehouseApi.requestReturn({
        orderId: selectedOrderForReturn.id,
        reason: returnForm.reason,
        returnReasonType: returnForm.returnReasonType,
        customerComments: returnForm.customerComments
      });
      alert('Return request submitted successfully! Our Admin team and Warehouse Staff will review and process your return.');
      setSelectedOrderForReturn(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit return request.');
    } finally {
      setSubmittingReturn(false);
    }
  };

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
      case 'RETURN_REJECTED':
        return 'badge-danger';
      case 'RETURN_REQUESTED':
      case 'RETURN_APPROVED':
      case 'RETURNED':
        return 'badge-warning';
      case 'REFUNDED':
        return 'badge-customer';
      default:
        return 'badge-secondary';
    }
  };

  const getPaymentStatusBadge = (ord) => {
    if (ord.status === 'REFUNDED') {
      return <span className="badge badge-customer" style={{ background: '#10b98120', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🟢 REFUND PROCESSED</span>;
    }
    if (ord.paymentMethod === 'COD' || ord.paymentStatus === 'PENDING_COD') {
      return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> COD (Pending Delivery)</span>;
    }
    if (ord.paymentStatus === 'PAID' || ord.status === 'CONFIRMED' || ord.status === 'SHIPPED' || ord.status === 'DELIVERED') {
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
    <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1100px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
          My Purchase Orders & Warehouse Tracking
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Track delivery lifecycle, regional fulfillment routing, and customer return/replacement requests.
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
          {orders.map((ord) => {
            const existingReturn = returns.find(r => r.orderId === ord.id);
            const canRequestReturn = (ord.status === 'DELIVERED' || ord.status === 'SHIPPED') && !existingReturn;

            return (
              <div key={ord.id} className="card" style={{ padding: '1.5rem', border: existingReturn ? '1px solid #f472b6' : '1px solid #e2e8f0' }}>
                
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

                {/* Return Status Banner if Active */}
                {existingReturn && (
                  <div style={{
                    background: '#fdf2f8',
                    border: '1px solid #fbcfe8',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#be185d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RotateCcw size={16} /> Return Request: {existingReturn.status}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        Reason: <strong>{existingReturn.reason}</strong> • Assigned QC Hub: <strong>{existingReturn.warehouseName || 'Regional Hub'}</strong>
                      </div>
                      {existingReturn.adminNotes && (
                        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>Admin Note: {existingReturn.adminNotes}</div>
                      )}
                      {existingReturn.qcNotes && (
                        <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600, marginTop: '2px' }}>Warehouse QC Note: {existingReturn.qcNotes}</div>
                      )}
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      background: existingReturn.status === 'QC_PASSED_RESTOCKED' ? '#dcfce7' : existingReturn.status === 'QC_FAILED_DAMAGED' ? '#fee2e2' : '#fce7f3',
                      color: existingReturn.status === 'QC_PASSED_RESTOCKED' ? '#15803d' : existingReturn.status === 'QC_FAILED_DAMAGED' ? '#b91c1c' : '#be185d'
                    }}>
                      {existingReturn.status}
                    </span>
                  </div>
                )}

                {/* Status Timeline */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '1.25rem', overflowX: 'auto' }}>
                  {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st, idx, arr) => {
                    const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                    const currentIndex = statuses.indexOf(ord.status);
                    const stepIndex = statuses.indexOf(st);
                    const isPassed = currentIndex >= stepIndex || ord.status === 'DELIVERED' || ord.status === 'REFUNDED' || ord.status === 'RETURNED';

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
                          <div style={{ flex: 1, height: '2px', background: isPassed ? '#2563eb' : '#cbd5e1', margin: '0 0.5rem', minWidth: '20px' }} />
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
                              <span>Dispatched from: <strong>{itemAlloc.warehouseName}</strong> ({itemAlloc.warehouseCode})</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{
                                fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '10px',
                                background: itemAlloc.stage === 'SHIPPED' ? '#dcfce7' : '#eff6ff',
                                color: itemAlloc.stage === 'SHIPPED' ? '#15803d' : '#1d4ed8'
                              }}>
                                Status: {itemAlloc.stage}
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

                {/* Footer Row with Return Action Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={16} color="#2563eb" /> Delivery Address: <strong>{ord.shippingAddress}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {canRequestReturn && (
                      <button
                        onClick={() => {
                          setSelectedOrderForReturn(ord);
                          setReturnForm({
                            reason: 'Defective item received',
                            returnReasonType: 'DEFECTIVE',
                            customerComments: ''
                          });
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#be185d', borderColor: '#fbcfe8', background: '#fdf2f8', fontWeight: 700 }}
                      >
                        <RotateCcw size={14} /> Request Return / Refund
                      </button>
                    )}

                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                      Total: <span style={{ color: '#2563eb' }}>₹{ord.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL: CUSTOMER REQUEST RETURN
      ========================================================================= */}
      {selectedOrderForReturn && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={20} color="#be185d" /> Request Return & Refund
              </h3>
              <button onClick={() => setSelectedOrderForReturn(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Order #: <strong>{selectedOrderForReturn.orderNumber}</strong> • Eligible for Full Refund (₹{selectedOrderForReturn.totalAmount?.toFixed(2)})
            </p>

            <form onSubmit={handleReturnSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Return Category Reason *
                </label>
                <select
                  value={returnForm.returnReasonType}
                  onChange={(e) => setReturnForm({ ...returnForm, returnReasonType: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="DEFECTIVE">Defective / Malfunctioning Hardware</option>
                  <option value="DAMAGED_IN_TRANSIT">Damaged during shipping transit</option>
                  <option value="WRONG_ITEM">Wrong item / variant received</option>
                  <option value="CHANGED_MIND">Performance / expectations not met</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Primary Reason Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Left button unresponsive, cracked glass"
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Additional Comments (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe the issue in detail for warehouse QC staff inspection..."
                  value={returnForm.customerComments}
                  onChange={(e) => setReturnForm({ ...returnForm, customerComments: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSelectedOrderForReturn(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="btn btn-primary"
                  style={{ background: '#be185d', borderColor: '#be185d', color: '#fff', fontWeight: 700 }}
                >
                  {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyOrdersPage;

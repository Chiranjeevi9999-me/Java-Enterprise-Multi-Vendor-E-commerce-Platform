import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vendorApi, productApi, categoryApi, orderApi } from '../api';
import AddProductModal from '../components/AddProductModal';
import UpdateStockModal from '../components/UpdateStockModal';
import { Store, Plus, Package, DollarSign, TrendingUp, AlertTriangle, Trash2, CheckCircle, RefreshCw, ShoppingBag, Edit3, MapPin } from 'lucide-react';

const VendorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('CATALOG'); // 'CATALOG' | 'ORDERS'
  
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profRes, catsRes] = await Promise.all([
        vendorApi.getMyProfile(),
        categoryApi.getAll(),
      ]);
      setProfile(profRes.data);
      setCategories(catsRes.data);

      if (profRes.data?.id) {
        const [prodsRes, ordsRes] = await Promise.all([
          productApi.getByVendor(profRes.data.id),
          orderApi.getByVendor(profRes.data.id).catch(() => ({ data: [] })),
        ]);
        setProducts(prodsRes.data);
        setOrders(ordsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to remove this product listing?')) {
      await productApi.delete(id);
      fetchData();
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await productApi.updateStatus(id, nextStatus);
    fetchData();
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      fetchData();
    } catch (err) {
      alert('Failed to update order status.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin-icon" style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
        <p>Loading Vendor Merchant Portal...</p>
      </div>
    );
  }

  const totalInventory = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0 || p.status === 'OUT_OF_STOCK').length;
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 10).length;
  const catalogValue = products.reduce((acc, p) => acc + ((p.discountPrice || p.price) * (p.stockQuantity || 0)), 0);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#0f172a', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profile?.logoUrl ? <img src={profile.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={32} color="var(--primary)" />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{profile?.storeName || 'Vendor Merchant Portal'}</h1>
              <span className="badge badge-customer"><CheckCircle size={12} /> {profile?.status || 'APPROVED'}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>{profile?.description}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add New Product
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`btn ${activeTab === 'CATALOG' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.88rem', borderRadius: 'var(--radius-sm)' }}
        >
          <Package size={16} /> Inventory Catalog ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`btn ${activeTab === 'ORDERS' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.88rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ShoppingBag size={16} /> Incoming Orders ({orders.length})
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>LISTED CATALOG</span>
            <Package size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{products.length}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>TOTAL UNITS IN STOCK</span>
            <TrendingUp size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{totalInventory} units</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>OUT OF STOCK ITEMS</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: outOfStockCount > 0 ? '#ef4444' : '#fff' }}>
            {outOfStockCount} items
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>CATALOG VALUE</span>
            <DollarSign size={18} color="#f472b6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>${catalogValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Tab 1: Catalog Inventory Management */}
      {activeTab === 'CATALOG' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Inventory & Stock Management</h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
              Click "Update Stock" on any item to modify real-time inventory quantity
            </span>
          </div>

          {products.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No products in your store catalog yet. Click "Add New Product" to start selling.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Product & SKU</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Unit Price</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Stock Quantity</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Listing Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isOut = p.stockQuantity <= 0 || p.status === 'OUT_OF_STOCK';
                    const isLow = p.stockQuantity > 0 && p.stockQuantity < 10;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <img src={p.imageUrl} alt="" style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', background: '#0f172a' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{p.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>SKU: {p.sku}</div>
                          </div>
                        </td>

                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.category?.name}</td>

                        <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>
                          ${p.discountPrice || p.price}
                        </td>

                        {/* Stock Quantity Column */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: isOut ? '#ef4444' : isLow ? '#fbbf24' : '#34d399' }}>
                              {p.stockQuantity} units
                            </span>

                            {isOut ? (
                              <span className="badge badge-danger" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.7rem' }}>
                                OUT OF STOCK
                              </span>
                            ) : isLow ? (
                              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>LOW STOCK</span>
                            ) : null}
                          </div>
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${p.status === 'ACTIVE' ? 'badge-customer' : p.status === 'OUT_OF_STOCK' ? 'badge-danger' : 'badge-warning'}`}>
                            {p.status}
                          </span>
                        </td>

                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => setSelectedStockProduct(p)}
                              className="btn btn-secondary btn-sm"
                              style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}
                              title="Update stock quantity"
                            >
                              <Edit3 size={14} /> Stock
                            </button>

                            <button
                              onClick={() => handleToggleStatus(p.id, p.status)}
                              className="btn btn-secondary btn-sm"
                            >
                              {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="btn btn-danger btn-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incoming Orders */}
      {activeTab === 'ORDERS' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>Merchant Order Management</h2>

          {orders.length === 0 ? (
            <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No customer orders received yet for your store.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {orders.map((ord) => (
                <div key={ord.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Order #: {ord.orderNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Customer: <strong>{ord.customer?.fullName}</strong> ({ord.customer?.email})
                      </div>
                    </div>

                    {/* Order Status Select Control */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <select
                        value={ord.status}
                        onChange={(e) => handleOrderStatusUpdate(ord.id, e.target.value)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid var(--border-color)',
                          color: '#fff',
                          padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem',
                          fontWeight: 700
                        }}
                      >
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>

                      <span className="badge badge-customer">{ord.status}</span>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {ord.items?.map((item) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <img src={item.product?.imageUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                          <div>
                            <span style={{ fontWeight: 700, color: '#fff' }}>{item.product?.title}</span>
                            <span style={{ color: 'var(--text-subtle)', marginLeft: '0.6rem', fontSize: '0.8rem' }}>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: '#fff' }}>${item.subtotal?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <MapPin size={14} /> Deliver to: {ord.shippingAddress}
                    </div>

                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                      Total Revenue: <span style={{ color: 'var(--primary)' }}>${ord.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal categories={categories} onClose={() => setShowAddModal(false)} onSuccess={fetchData} />
      )}

      {/* Update Stock Modal */}
      {selectedStockProduct && (
        <UpdateStockModal
          product={selectedStockProduct}
          onClose={() => setSelectedStockProduct(null)}
          onSuccess={fetchData}
        />
      )}

    </div>
  );
};

export default VendorDashboard;

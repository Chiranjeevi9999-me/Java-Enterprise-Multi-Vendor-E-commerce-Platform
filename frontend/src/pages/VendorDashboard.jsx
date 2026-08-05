import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vendorApi, productApi, categoryApi } from '../api';
import AddProductModal from '../components/AddProductModal';
import { Store, Plus, Package, DollarSign, TrendingUp, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';

const VendorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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
        const prodsRes = await productApi.getByVendor(profRes.data.id);
        setProducts(prodsRes.data);
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

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Vendor Dashboard...</div>;
  }

  const totalInventory = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const catalogValue = products.reduce((acc, p) => acc + ((p.discountPrice || p.price) * p.stockQuantity), 0);

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

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>LISTED PRODUCTS</span>
            <Package size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{products.length}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TOTAL STOCK QUANTITY</span>
            <TrendingUp size={20} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{totalInventory} units</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ESTIMATED CATALOG VALUE</span>
            <DollarSign size={20} color="#f472b6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>${catalogValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>COMMISSION RATE</span>
            <Store size={20} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{profile?.commissionRate || 10.0}%</div>
        </div>
      </div>

      {/* Product Inventory Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Inventory & Catalog Management</h2>

        {products.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products in your store catalog yet. Click "Add New Product" to start selling.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Product</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Price</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Stock</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <img src={p.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: '#0f172a' }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>SKU: {p.sku}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.category?.name}</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>
                      ${p.discountPrice || p.price}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 700, color: p.stockQuantity < 10 ? '#f87171' : '#34d399' }}>
                        {p.stockQuantity} units
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${p.status === 'ACTIVE' ? 'badge-customer' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddProductModal categories={categories} onClose={() => setShowAddModal(false)} onSuccess={fetchData} />
      )}

    </div>
  );
};

export default VendorDashboard;

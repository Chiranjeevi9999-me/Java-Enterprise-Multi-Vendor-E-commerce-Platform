import React, { useState, useEffect } from 'react';
import { vendorApi, productApi, categoryApi } from '../api';
import { ShieldCheck, Store, Users, Package, Check, X, PlusCircle, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, pRes, cRes] = await Promise.all([
        vendorApi.getAll(),
        productApi.getAll({}),
        categoryApi.getAll(),
      ]);
      setVendors(vRes.data);
      setProducts(pRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateVendorStatus = async (vendorId, status) => {
    await vendorApi.updateStatus(vendorId, status);
    loadData();
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    await categoryApi.create({ name: newCatName, description: newCatDesc, icon: 'Grid' });
    setNewCatName('');
    setNewCatDesc('');
    loadData();
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Admin Portal...</div>;
  }

  const pendingVendors = vendors.filter(v => v.status === 'PENDING');

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      
      {/* Admin Title */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="badge badge-admin" style={{ marginBottom: '0.4rem' }}>
            <ShieldCheck size={14} /> System Administrator Portal
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>ShopStack Governance & Operations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Manage vendor approvals, marketplace taxonomy, and platform metrics.</p>
        </div>
      </div>

      {/* Overview KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>REGISTERED VENDORS</span>
            <Store size={20} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{vendors.length}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE CATALOG PRODUCTS</span>
            <Package size={20} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{products.length}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TAXONOMY CATEGORIES</span>
            <Users size={20} color="#f472b6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{categories.length}</div>
        </div>
      </div>

      {/* Vendor Approvals Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
          Vendor Onboarding & Approvals ({vendors.length})
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Store Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Owner Email</th>
                <th style={{ padding: '0.75rem 1rem' }}>Commission Rate</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>
                    {v.storeName}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{v.user?.email}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{v.commissionRate}%</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${v.status === 'APPROVED' ? 'badge-customer' : v.status === 'PENDING' ? 'badge-warning' : 'btn-danger'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {v.status !== 'APPROVED' ? (
                      <button onClick={() => handleUpdateVendorStatus(v.id, 'APPROVED')} className="btn btn-primary btn-sm">
                        <Check size={14} /> Approve Store
                      </button>
                    ) : (
                      <button onClick={() => handleUpdateVendorStatus(v.id, 'REJECTED')} className="btn btn-danger btn-sm">
                        <X size={14} /> Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Creation & Management */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
          Marketplace Categories Taxonomy
        </h2>

        <form onSubmit={handleCreateCategory} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '1rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="New Category Name (e.g. Books)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            required
          />
          <input
            type="text"
            className="input-field"
            placeholder="Short Description"
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <PlusCircle size={16} /> Add Category
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {categories.map(c => (
            <div key={c.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, color: '#fff' }}>{c.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>{c.description}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;

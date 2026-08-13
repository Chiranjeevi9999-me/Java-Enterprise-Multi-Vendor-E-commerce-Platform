import React, { useState, useEffect } from 'react';
import { vendorApi, productApi, categoryApi, adminApi } from '../api';
import { ShieldCheck, Store, Users, Package, Check, X, PlusCircle, DollarSign, ShoppingBag, Lock, Unlock } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'USERS' | 'VENDORS' | 'TAXONOMY'
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, vRes, uRes, cRes] = await Promise.all([
        adminApi.getStats().catch(() => null),
        vendorApi.getAll(),
        adminApi.getUsers().catch(() => ({ data: [] })),
        categoryApi.getAll(),
      ]);

      if (statsRes) setStats(statsRes.data);
      setVendors(vRes.data || []);
      setUsers(uRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
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

  const handleToggleUser = async (userId) => {
    await adminApi.toggleUserStatus(userId);
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
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b' }}>Loading System Administrator Portal...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      
      {/* Title */}
      <div className="card" style={{ padding: '1.75rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="badge badge-admin" style={{ marginBottom: '0.4rem', background: '#eff6ff', color: '#1e40af' }}>
            <ShieldCheck size={14} /> System Administrator Portal
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>ShopStack Governance & Analytics</h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Real-time database metrics, user role governance, and vendor merchant approvals.</p>
        </div>
      </div>

      {/* Overview KPI Grid from Database */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>PAID REVENUE</span>
            <DollarSign size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>₹{stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>PAID TRANSACTIONS</span>
            <Check size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{stats?.paidTransactions || 0}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>TOTAL PRODUCTS</span>
            <Package size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{stats?.totalProducts || 0}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>REGISTERED VENDORS</span>
            <Store size={18} color="#9333ea" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{stats?.totalVendors || vendors.length}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>CUSTOMERS</span>
            <Users size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{stats?.totalCustomers || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveTab('OVERVIEW')} className={`btn ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'}`}>
          <Store size={16} /> Vendor Approvals ({vendors.length})
        </button>
        <button onClick={() => setActiveTab('USERS')} className={`btn ${activeTab === 'USERS' ? 'btn-primary' : 'btn-secondary'}`}>
          <Users size={16} /> User Management ({users.length})
        </button>
        <button onClick={() => setActiveTab('TAXONOMY')} className={`btn ${activeTab === 'TAXONOMY' ? 'btn-primary' : 'btn-secondary'}`}>
          <Package size={16} /> Categories ({categories.length})
        </button>
      </div>

      {/* Tab 1: Vendor Onboarding */}
      {activeTab === 'OVERVIEW' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Vendor Store Approvals & Commission Management
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Store Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Owner Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Commission Rate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>{v.storeName}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{v.user?.email}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{v.commissionRate}%</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${v.status === 'APPROVED' ? 'badge-customer' : v.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
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
      )}

      {/* Tab 2: User Governance */}
      {activeTab === 'USERS' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Platform Users & Role Authorization
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>{u.fullName}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : u.role === 'VENDOR' ? 'badge-primary' : 'badge-customer'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${u.enabled ? 'badge-customer' : 'badge-danger'}`}>
                        {u.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handleToggleUser(u.id)} className={`btn ${u.enabled ? 'btn-danger' : 'btn-primary'} btn-sm`}>
                        {u.enabled ? <Lock size={14} /> : <Unlock size={14} />} {u.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Category Taxonomy */}
      {activeTab === 'TAXONOMY' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
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
              <div key={c.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{c.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

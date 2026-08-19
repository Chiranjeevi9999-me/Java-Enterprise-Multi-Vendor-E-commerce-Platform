import React, { useState, useEffect, useMemo } from 'react';
import { adminApi, categoryApi, vendorApi } from '../api';
import {
  ShieldCheck, Store, Users, Package, Check, X, PlusCircle, DollarSign,
  ShoppingBag, Lock, Unlock, TrendingUp, BarChart3, Activity,
  FileText, Download, Printer, Search, Filter, Clock, AlertTriangle,
  CheckCircle, Eye, RefreshCw, Sliders, CreditCard, Cpu, Database,
  Server, Star, ArrowUpRight, ChevronRight, Layers, HelpCircle
} from 'lucide-react';

const AdminDashboard = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  // 'OVERVIEW' | 'VENDORS' | 'ANALYTICS' | 'ORDERS' | 'COMMISSIONS' | 'SYSTEM' | 'REPORTS' | 'USERS' | 'TAXONOMY'

  // Global State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  // Vendor Management State
  const [vendors, setVendors] = useState([]);
  const [selectedVendorForModal, setSelectedVendorForModal] = useState(null);
  const [newCommissionRate, setNewCommissionRate] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');

  // Analytics State
  const [analyticsRange, setAnalyticsRange] = useState('30D');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderUpdatingId, setOrderUpdatingId] = useState(null);

  // Commission State
  const [commissionSummary, setCommissionSummary] = useState(null);

  // System Health State
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthPingMs, setHealthPingMs] = useState(12);

  // Business Reports State
  const [reportType, setReportType] = useState('SALES');
  const [reportRange, setReportRange] = useState('30D');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Users & Taxonomy State
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Main Data
  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, vRes, uRes, cRes] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getVendorsWithMetrics().catch(() => ({ data: [] })),
        adminApi.getUsers().catch(() => ({ data: [] })),
        categoryApi.getAll().catch(() => ({ data: [] })),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      setVendors(vRes.data || []);
      setUsers(uRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      console.error('Error loading admin portal data:', err);
      showToast('Failed to sync portal data with backend database.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load Analytics when Tab or Range Changes
  const loadAnalytics = async (range = analyticsRange) => {
    setAnalyticsLoading(true);
    try {
      const res = await adminApi.getAnalytics(range);
      setAnalyticsData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ANALYTICS' || activeTab === 'OVERVIEW') {
      loadAnalytics(analyticsRange);
    }
  }, [activeTab, analyticsRange]);

  // Load Orders when Orders Tab is Active
  const loadOrders = async () => {
    try {
      const params = {};
      if (orderSearch) params.search = orderSearch;
      if (orderStatusFilter !== 'ALL') params.status = orderStatusFilter;
      const res = await adminApi.getAllOrders(params);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'ORDERS' || activeTab === 'OVERVIEW') {
      loadOrders();
    }
  }, [activeTab, orderStatusFilter]);

  // Load Commission Summary
  const loadCommissions = async () => {
    try {
      const res = await adminApi.getCommissionSummary();
      setCommissionSummary(res.data);
    } catch (err) {
      console.error('Failed to load commission summary:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'COMMISSIONS') {
      loadCommissions();
    }
  }, [activeTab]);

  // Load System Health
  const loadSystemHealth = async () => {
    const start = performance.now();
    try {
      const res = await adminApi.getSystemHealth();
      const end = performance.now();
      setHealthPingMs(Math.round(end - start));
      setSystemHealth(res.data);
    } catch (err) {
      console.error('Failed to load system health:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'SYSTEM') {
      loadSystemHealth();
    }
  }, [activeTab]);

  // Load Business Report
  const loadReport = async (type = reportType, range = reportRange) => {
    setReportLoading(true);
    try {
      const res = await adminApi.getReport(type, range);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to generate business report:', err);
      showToast('Error generating business report from database.', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'REPORTS') {
      loadReport(reportType, reportRange);
    }
  }, [activeTab, reportType, reportRange]);

  // Actions
  const handleUpdateVendorStatus = async (vendorId, status) => {
    try {
      await vendorApi.updateStatus(vendorId, status);
      showToast(`Vendor store status updated to ${status}.`);
      loadDashboardData(true);
    } catch (err) {
      showToast('Failed to update vendor status.', 'error');
    }
  };

  const handleSaveCommissionRate = async (e) => {
    e.preventDefault();
    if (!selectedVendorForModal || !newCommissionRate) return;
    try {
      await adminApi.updateVendorCommission(selectedVendorForModal.id, parseFloat(newCommissionRate));
      showToast(`Commission rate updated to ${newCommissionRate}% for ${selectedVendorForModal.storeName}.`);
      setSelectedVendorForModal(null);
      setNewCommissionRate('');
      loadDashboardData(true);
      if (activeTab === 'COMMISSIONS') loadCommissions();
    } catch (err) {
      showToast('Failed to update commission rate.', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setOrderUpdatingId(orderId);
    try {
      const res = await adminApi.updateOrderStatus(orderId, newStatus);
      showToast(`Order #${res.data.orderNumber} updated to ${newStatus}.`);
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails(res.data);
      }
      loadOrders();
      loadDashboardData(true);
    } catch (err) {
      showToast('Failed to update order status.', 'error');
    } finally {
      setOrderUpdatingId(null);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await adminApi.toggleUserStatus(userId);
      showToast('User account authorization status toggled.');
      loadDashboardData(true);
    } catch (err) {
      showToast('Failed to toggle user status.', 'error');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await categoryApi.create({ name: newCatName, description: newCatDesc, icon: 'Grid' });
      setNewCatName('');
      setNewCatDesc('');
      showToast(`Category "${newCatName}" created successfully.`);
      loadDashboardData(true);
    } catch (err) {
      showToast('Failed to create category.', 'error');
    }
  };

  // Report Export: CSV
  const handleExportCSV = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) {
      showToast('No report records available to export.', 'error');
      return;
    }

    const headers = reportData.columns.map(c => `"${c.label}"`).join(',');
    const rowsCsv = reportData.rows.map(row => {
      return reportData.columns.map(c => {
        let val = row[c.key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'string') val = val.replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    }).join('\n');

    const csvContent = `data:text/csv;charset=utf-8,${encodeURIComponent(headers + '\n' + rowsCsv)}`;
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `ShopStack_${reportData.reportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report CSV successfully generated and downloaded.');
  };

  // Report Export: JSON
  const handleExportJSON = () => {
    if (!reportData) return;
    const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `ShopStack_${reportData.reportType}_Report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report JSON dataset exported successfully.');
  };

  // Filtered Vendors for table
  const filteredVendors = useMemo(() => {
    if (!vendorSearch.trim()) return vendors;
    const q = vendorSearch.toLowerCase();
    return vendors.filter(v =>
      v.storeName?.toLowerCase().includes(q) ||
      v.ownerEmail?.toLowerCase().includes(q) ||
      v.ownerName?.toLowerCase().includes(q)
    );
  }, [vendors, vendorSearch]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="spinning" style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Connecting to ShopStack Enterprise Control Plane...</div>
        <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>Authenticating Spring Boot backend connection and synchronizing marketplace schemas.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastMessage.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#fff',
          padding: '0.85rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {toastMessage.msg}
        </div>
      )}

      {/* Top Header Card */}
      <div className="card" style={{ padding: '1.75rem 2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
        <div>
          <div className="badge badge-admin" style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={14} /> Enterprise Governance Portal
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Admin Dashboard & Business Intelligence
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Central management for marketplace merchants, sales analytics, multi-vendor orders, commissions, system health, and audit reports.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh database live stats"
          >
            <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Syncing DB...' : 'Sync Database'}
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`btn ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <BarChart3 size={15} /> Overview Summary
        </button>

        <button
          onClick={() => setActiveTab('VENDORS')}
          className={`btn ${activeTab === 'VENDORS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Store size={15} /> Vendor Management ({vendors.length})
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`btn ${activeTab === 'ANALYTICS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <TrendingUp size={15} /> Marketplace Analytics
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`btn ${activeTab === 'ORDERS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <ShoppingBag size={15} /> Order Monitoring
        </button>

        <button
          onClick={() => setActiveTab('COMMISSIONS')}
          className={`btn ${activeTab === 'COMMISSIONS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <DollarSign size={15} /> Commission Management
        </button>

        <button
          onClick={() => setActiveTab('SYSTEM')}
          className={`btn ${activeTab === 'SYSTEM' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Activity size={15} /> System Monitoring
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`btn ${activeTab === 'REPORTS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <FileText size={15} /> Business Reports
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`btn ${activeTab === 'USERS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Users size={15} /> User Governance ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('TAXONOMY')}
          className={`btn ${activeTab === 'TAXONOMY' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Layers size={15} /> Taxonomy ({categories.length})
        </button>
      </div>

      {/* =========================================================================
          MODULE 1: OVERVIEW SUMMARY
      ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            <div className="card" style={{ padding: '1.35rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid Revenue (GMV)</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={18} color="#34d399" />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>₹{stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : '0.00'}</div>
              <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowUpRight size={14} /> Total Settled Inflow
              </div>
            </div>

            <div className="card" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marketplace Commission</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} color="#818cf8" />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>₹{stats?.totalCommissionEarned ? stats.totalCommissionEarned.toLocaleString() : '0.00'}</div>
              <div style={{ fontSize: '0.78rem', color: '#818cf8', marginTop: '0.35rem' }}>
                Net Platform Earnings
              </div>
            </div>

            <div className="card" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={18} color="#fbbf24" />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{stats?.totalOrders || 0}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {stats?.completedOrders || 0} Completed • {stats?.pendingOrders || 0} Pending
              </div>
            </div>

            <div className="card" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Vendors</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={18} color="#c084fc" />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{stats?.totalVendors || vendors.length}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {stats?.pendingVendors || 0} Pending Approvals
              </div>
            </div>

            <div className="card" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catalog Items</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={18} color="#22d3ee" />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{stats?.totalProducts || 0}</div>
              <div style={{ fontSize: '0.78rem', color: stats?.outOfStockProducts > 0 ? '#f87171' : 'var(--text-muted)', marginTop: '0.35rem' }}>
                {stats?.outOfStockProducts || 0} Out of Stock
              </div>
            </div>

          </div>

          {/* Quick Hub Navigation & System Status Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Quick Actions Panel */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                Governance & Rapid Control Hub
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Direct shortcuts to configure commission policies, audit live transactions, or export financial statements.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                
                <div
                  onClick={() => setActiveTab('VENDORS')}
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#c084fc', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Store size={18} /> Vendor Approvals
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Review merchant applications and adjust custom commission rates.</p>
                </div>

                <div
                  onClick={() => setActiveTab('ORDERS')}
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fbbf24', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                    <ShoppingBag size={18} /> Order Monitoring
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Track fulfillment milestones and update order lifecycle statuses.</p>
                </div>

                <div
                  onClick={() => setActiveTab('COMMISSIONS')}
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#34d399', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                    <DollarSign size={18} /> Commission Ledger
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculate platform fees and simulate net vendor payouts.</p>
                </div>

                <div
                  onClick={() => setActiveTab('REPORTS')}
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                    <FileText size={18} /> Business Reports
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Export Sales, Vendor Payouts, Inventory, and Orders to CSV/JSON.</p>
                </div>

              </div>
            </div>

            {/* Live Service Health Card */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Platform Health</h3>
                <span className="badge badge-customer" style={{ fontSize: '0.72rem' }}>
                  <Activity size={12} /> ONLINE
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    <span>Spring Boot API Service</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>Port 8081 (UP)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#34d399' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    <span>Database Engine</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>PostgreSQL / H2 Active</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#38bdf8' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    <span>Payment Gateway</span>
                    <span style={{ color: '#c084fc', fontWeight: 600 }}>Razorpay Sandbox (INR)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#c084fc' }}></div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('SYSTEM')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '1.25rem', fontSize: '0.8rem' }}
              >
                <Cpu size={14} /> Open Full JVM & System Diagnostics <ChevronRight size={14} />
              </button>
            </div>

          </div>

          {/* Recent Orders Preview on Overview */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Latest Multi-Vendor Orders</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Real-time orders submitted by marketplace customers across merchant stores.</p>
              </div>
              <button onClick={() => setActiveTab('ORDERS')} className="btn btn-secondary btn-sm">
                View All Orders ({orders.length}) <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Order #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Vendor Store</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Total Amount</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fff' }}>{o.orderNumber}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{o.customer?.fullName || o.customer?.email}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#c084fc', fontWeight: 600 }}>{o.vendorProfile?.storeName || 'General Store'}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#34d399' }}>₹{o.totalAmount?.toFixed(2)}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${o.paymentStatus === 'PAID' ? 'badge-customer' : 'badge-warning'}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${o.status === 'DELIVERED' ? 'badge-customer' : o.status === 'SHIPPED' ? 'badge-admin' : o.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedOrderDetails(o)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          <Eye size={13} /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: VENDOR MANAGEMENT
      ========================================================================= */}
      {activeTab === 'VENDORS' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Vendor Merchants & Store Governance
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Approve new merchant applications, customize vendor commission fee rates, and monitor store ratings.
              </p>
            </div>

            {/* Vendor Search */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search vendor or owner..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Store Details</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Merchant Owner</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Catalog / Sales</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Commission %</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {/* Store info */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {v.logoUrl ? (
                          <img src={v.logoUrl} alt={v.storeName} style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 800 }}>
                            {v.storeName?.slice(0, 1) || 'V'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{v.storeName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Rating: ⭐ {v.rating?.toFixed(1) || '5.0'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner info */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{v.ownerName || 'Merchant'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.ownerEmail}</div>
                      {v.ownerPhone && <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{v.ownerPhone}</div>}
                    </td>

                    {/* Catalog & Sales */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{v.productCount || 0} Products</div>
                      <div style={{ fontSize: '0.78rem', color: '#34d399' }}>
                        Gross: ₹{v.grossSales ? v.grossSales.toLocaleString() : '0.00'}
                      </div>
                    </td>

                    {/* Commission */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.95rem' }}>
                          {v.commissionRate || 10.0}%
                        </span>
                        <button
                          onClick={() => {
                            setSelectedVendorForModal(v);
                            setNewCommissionRate(String(v.commissionRate || 10.0));
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem' }}
                          title="Edit Commission Rate"
                        >
                          <Sliders size={12} /> Edit
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${v.status === 'APPROVED' ? 'badge-customer' : v.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                        {v.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {v.status !== 'APPROVED' ? (
                          <button
                            onClick={() => handleUpdateVendorStatus(v.id, 'APPROVED')}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <Check size={14} /> Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateVendorStatus(v.id, 'REJECTED')}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <X size={14} /> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Commission Modal */}
          {selectedVendorForModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}>
              <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
                  Update Commission Policy
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Adjust the platform commission percentage deducted from <strong style={{ color: '#fff' }}>{selectedVendorForModal.storeName}</strong> on each completed sale.
                </p>

                <form onSubmit={handleSaveCommissionRate}>
                  <div className="input-group">
                    <label className="input-label">Commission Rate (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="input-field"
                      placeholder="e.g. 10.0"
                      value={newCommissionRate}
                      onChange={(e) => setNewCommissionRate(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedVendorForModal(null)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Commission Rate
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          MODULE 3: MARKETPLACE ANALYTICS
      ========================================================================= */}
      {activeTab === 'ANALYTICS' && (
        <div>
          {/* Header & Range Filter */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Marketplace Sales & Growth Analytics
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Real-time multi-dimensional statistics on sales volume, category popularity, and top products.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['7D', '30D', '90D', 'ALL'].map(r => (
                <button
                  key={r}
                  onClick={() => setAnalyticsRange(r)}
                  className={`btn ${analyticsRange === r ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                  {r === '7D' ? 'Last 7 Days' : r === '30D' ? 'Last 30 Days' : r === '90D' ? 'Last Quarter' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spinning" style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <div>Computing marketplace statistics...</div>
            </div>
          ) : analyticsData ? (
            <div>
              {/* Analytics Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Period Revenue</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                    ₹{analyticsData.periodRevenue?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Period Orders</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
                    {analyticsData.periodOrders || 0}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Average Order Value</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8', marginTop: '0.25rem' }}>
                    ₹{analyticsData.periodAverageOrderValue?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>

              {/* Interactive SVG Sales Trend Chart */}
              <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Revenue Velocity & Daily Inflow</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Daily gross order sales volume over selected duration</p>
                  </div>
                  {hoveredTrendIndex !== null && analyticsData.salesTrend?.[hoveredTrendIndex] && (
                    <div style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid #6366f1', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', color: '#fff' }}>
                      <strong>{analyticsData.salesTrend[hoveredTrendIndex].date}:</strong> ₹{analyticsData.salesTrend[hoveredTrendIndex].sales.toFixed(2)} ({analyticsData.salesTrend[hoveredTrendIndex].orders} orders)
                    </div>
                  )}
                </div>

                {/* SVG Visual Chart */}
                <div style={{ width: '100%', height: '240px', position: 'relative' }}>
                  {(() => {
                    const trend = analyticsData.salesTrend || [];
                    if (trend.length === 0) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '80px' }}>No order trends in this window.</div>;
                    
                    const maxVal = Math.max(...trend.map(t => t.sales), 100);
                    const width = 800;
                    const height = 200;
                    const padding = 30;
                    const chartW = width - padding * 2;
                    const chartH = height - padding * 2;

                    const points = trend.map((t, idx) => {
                      const x = padding + (idx / Math.max(trend.length - 1, 1)) * chartW;
                      const y = height - padding - (t.sales / maxVal) * chartH;
                      return { x, y, ...t, idx };
                    });

                    const pathD = points.length > 1
                      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                      : '';
                    const areaD = points.length > 1
                      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
                      : '';

                    return (
                      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

                        {/* Area fill */}
                        {areaD && <path d={areaD} fill="url(#trendGrad)" />}

                        {/* Line */}
                        {pathD && <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                        {/* Points */}
                        {points.map((p) => (
                          <g key={p.idx} onMouseEnter={() => setHoveredTrendIndex(p.idx)} onMouseLeave={() => setHoveredTrendIndex(null)} style={{ cursor: 'pointer' }}>
                            <circle cx={p.x} cy={p.y} r={hoveredTrendIndex === p.idx ? 7 : 4} fill={hoveredTrendIndex === p.idx ? '#34d399' : '#818cf8'} stroke="#0f172a" strokeWidth="2" />
                            <text x={p.x} y={height - 8} textAnchor="middle" fill="var(--text-subtle)" fontSize="11">
                              {p.date}
                            </text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {/* Two Column Section: Category Share & Order Funnel */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                
                {/* Category Breakdown */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                    Revenue by Product Category
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {analyticsData.categoryBreakdown?.map((cat, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{cat.categoryName} ({cat.productCount} items)</span>
                          <span style={{ fontWeight: 700, color: '#34d399' }}>₹{cat.revenue.toFixed(2)} ({cat.percentage}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.max(cat.percentage, 4)}%`,
                            height: '100%',
                            background: idx % 3 === 0 ? '#6366f1' : idx % 3 === 1 ? '#34d399' : '#f59e0b'
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Status Distribution */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                    Fulfillment Status Breakdown
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {Object.entries(analyticsData.orderStatusCounts || {}).map(([st, cnt]) => (
                      <div key={st} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700 }}>{st}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>{cnt}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Top Selling Products Leaderboard */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                  Top Performing Products by Gross Volume
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Product</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Vendor Store</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Units Sold</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Gross Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topProducts?.map(p => (
                        <tr key={p.productId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />}
                              <span style={{ fontWeight: 700, color: '#fff' }}>{p.title}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#c084fc' }}>{p.vendorName}</td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{p.unitsSold} units</td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>₹{p.totalRevenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : null}
        </div>
      )}

      {/* =========================================================================
          MODULE 4: ORDER MONITORING
      ========================================================================= */}
      {activeTab === 'ORDERS' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Global Marketplace Order Monitoring
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Audit all incoming multi-vendor transactions, inspect line items, and override shipping states.
              </p>
            </div>

            {/* Filter Search */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Order #, customer, store..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                  style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
                />
              </div>

              <button onClick={loadOrders} className="btn btn-secondary btn-sm">
                <Search size={14} /> Search
              </button>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            {['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'PENDING', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`btn ${orderStatusFilter === st ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Order Number</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Vendor Store</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Total</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Fulfillment</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{o.orderNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{o.customer?.fullName || 'Customer'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.customer?.email}</div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ color: '#c084fc', fontWeight: 600 }}>{o.vendorProfile?.storeName || 'ShopStack Merchant'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Fee: {o.vendorProfile?.commissionRate || 10}%</div>
                    </td>

                    <td style={{ padding: '1rem', fontWeight: 800, color: '#34d399' }}>
                      ₹{o.totalAmount?.toFixed(2)}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span className={`badge ${o.paymentStatus === 'PAID' ? 'badge-customer' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                          {o.paymentStatus}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{o.paymentMethod}</span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${o.status === 'DELIVERED' ? 'badge-customer' : o.status === 'SHIPPED' ? 'badge-admin' : o.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                        {o.status}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedOrderDetails(o)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        <Eye size={14} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Order Modal */}
          {selectedOrderDetails && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem'
            }}>
              <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div>
                    <span className="badge badge-admin" style={{ marginBottom: '0.35rem' }}>Order Inspector</span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{selectedOrderDetails.orderNumber}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedOrderDetails(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Customer Details</div>
                    <div style={{ fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{selectedOrderDetails.customer?.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedOrderDetails.customer?.email}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedOrderDetails.customer?.phoneNumber}</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Vendor Store</div>
                    <div style={{ fontWeight: 700, color: '#c084fc', marginTop: '0.2rem' }}>{selectedOrderDetails.vendorProfile?.storeName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Commission Fee: {selectedOrderDetails.vendorProfile?.commissionRate || 10}%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment: {selectedOrderDetails.paymentStatus} ({selectedOrderDetails.paymentMethod})</div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Shipping Destination</div>
                  <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '0.25rem' }}>
                    {selectedOrderDetails.shippingAddress || 'Standard Address On File'}
                  </div>
                </div>

                {/* Order Items Table */}
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>Purchased Line Items</h4>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-subtle)' }}>
                      <tr>
                        <th style={{ padding: '0.6rem 0.85rem' }}>Product</th>
                        <th style={{ padding: '0.6rem 0.85rem' }}>Qty</th>
                        <th style={{ padding: '0.6rem 0.85rem' }}>Unit Price</th>
                        <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderDetails.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem 0.85rem' }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{item.product?.title || 'Product Item'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>SKU: {item.product?.sku || 'SKU-00'}</div>
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-muted)' }}>{item.quantity}</td>
                          <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-muted)' }}>₹{(item.unitPrice || item.price)?.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>₹{item.subtotal?.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <td colSpan="3" style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#fff' }}>Total Order Amount</td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#34d399', fontSize: '1rem' }}>
                          ₹{selectedOrderDetails.totalAmount?.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Administrative Status Override */}
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Administrative Lifecycle Override
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, st)}
                        disabled={orderUpdatingId === selectedOrderDetails.id || selectedOrderDetails.status === st}
                        className={`btn ${selectedOrderDetails.status === st ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        style={{ fontSize: '0.78rem' }}
                      >
                        {selectedOrderDetails.status === st && <Check size={13} />} Mark {st}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          MODULE 5: COMMISSION MANAGEMENT
      ========================================================================= */}
      {activeTab === 'COMMISSIONS' && (
        <div>
          {/* Commission Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            <div className="card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Gross Marketplace Sales</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
                ₹{commissionSummary?.totalGrossSales ? commissionSummary.totalGrossSales.toLocaleString() : '0.00'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Total Merchant Sales Volume</div>
            </div>

            <div className="card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Platform Fee Revenue</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8', marginTop: '0.35rem' }}>
                ₹{commissionSummary?.totalCommissionEarned ? commissionSummary.totalCommissionEarned.toLocaleString() : '0.00'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#818cf8', marginTop: '0.2rem' }}>Marketplace Cut Retained</div>
            </div>

            <div className="card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Payable to Merchants</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.35rem' }}>
                ₹{commissionSummary?.totalVendorPayouts ? commissionSummary.totalVendorPayouts.toLocaleString() : '0.00'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '0.2rem' }}>Net Merchant Disbursal</div>
            </div>

            <div className="card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Avg Marketplace Rate</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.35rem' }}>
                {commissionSummary?.averageCommissionRate || 10.0}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Across Registered Stores</div>
            </div>

          </div>

          {/* Vendor Commission Breakdown Table */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
              Merchant Commission & Settlement Ledger
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Audit individual merchant store sales, platform retention percentage, and net payable balances.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Vendor Store</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Merchant Owner</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Commission %</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Gross Volume</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Platform Fee</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Payable to Vendor</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionSummary?.vendorCommissions?.map(line => (
                    <tr key={line.vendorId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>{line.storeName}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ color: 'var(--text-main)' }}>{line.ownerName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{line.ownerEmail}</div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#818cf8' }}>
                        {line.commissionRate}%
                      </td>
                      <td style={{ padding: '1rem', color: '#fff', fontWeight: 600 }}>₹{line.grossSales?.toFixed(2)}</td>
                      <td style={{ padding: '1rem', color: '#818cf8', fontWeight: 700 }}>₹{line.commissionAmount?.toFixed(2)}</td>
                      <td style={{ padding: '1rem', color: '#34d399', fontWeight: 800 }}>₹{line.payableToVendor?.toFixed(2)}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <span className="badge badge-customer" style={{ fontSize: '0.75rem' }}>
                          <CheckCircle size={12} /> {line.payoutStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: SYSTEM MONITORING
      ========================================================================= */}
      {activeTab === 'SYSTEM' && (
        <div>
          {/* Header */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Spring Boot & Runtime System Health Monitor
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Real-time metrics for JVM memory, thread execution pool, database pool, and external integrations.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="badge badge-customer" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                <Activity size={14} /> Ping: {healthPingMs}ms
              </div>
              <button onClick={loadSystemHealth} className="btn btn-secondary btn-sm">
                <RefreshCw size={14} /> Run Diagnostic Check
              </button>
            </div>
          </div>

          {systemHealth ? (
            <div>
              {/* JVM Gauges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                
                {/* Heap Memory */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Cpu size={18} color="#818cf8" /> JVM Heap Memory
                    </h3>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8' }}>
                      {Math.round((systemHealth.heapMemoryUsedMB / (systemHealth.heapMemoryMaxMB || 1024)) * 100)}% Used
                    </span>
                  </div>

                  <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{
                      width: `${Math.min(100, Math.round((systemHealth.heapMemoryUsedMB / (systemHealth.heapMemoryMaxMB || 1024)) * 100))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1 0%, #34d399 100%)'
                    }}></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div>Used: <strong style={{ color: '#fff' }}>{systemHealth.heapMemoryUsedMB} MB</strong></div>
                    <div>Allocated: <strong style={{ color: '#fff' }}>{systemHealth.heapMemoryTotalMB} MB</strong></div>
                    <div>Max: <strong style={{ color: '#fff' }}>{systemHealth.heapMemoryMaxMB} MB</strong></div>
                  </div>
                </div>

                {/* Threads & Uptime */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Server size={18} color="#38bdf8" /> Runtime Environment
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Active JVM Threads</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.1rem' }}>
                        {systemHealth.activeThreadCount}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>CPU Cores Available</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.1rem' }}>
                        {systemHealth.availableProcessors} Cores
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Server Uptime</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>
                        {Math.floor(systemHealth.uptimeSeconds / 60)} mins {systemHealth.uptimeSeconds % 60}s
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Java Runtime</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>
                        Java {systemHealth.javaVersion}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Database Entity Tallies */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Database size={18} color="#34d399" /> PostgreSQL / H2 Database Entity Audit
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Total persistent rows managed across JPA Entity Repositories.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                  {Object.entries(systemHealth.entityCounts || {}).map(([table, count]) => (
                    <div key={table} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>{table}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading system metrics...
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE 7: BUSINESS REPORTS
      ========================================================================= */}
      {activeTab === 'REPORTS' && (
        <div>
          {/* Controls Card */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  Business Intelligence & Financial Reports Engine
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Generate comprehensive statements for sales volume, merchant payouts, catalog valuation, and audit trails.
                </p>
              </div>

              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={handleExportCSV}
                  disabled={reportLoading || !reportData}
                  className="btn btn-primary btn-sm"
                >
                  <Download size={15} /> Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={reportLoading || !reportData}
                  className="btn btn-secondary btn-sm"
                >
                  <Download size={15} /> Export JSON
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm"
                >
                  <Printer size={15} /> Print / PDF
                </button>
              </div>
            </div>

            {/* Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Report Category</label>
                <select
                  className="input-field"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{ background: 'var(--bg-main)', color: '#fff' }}
                >
                  <option value="SALES">Sales & Gross Revenue</option>
                  <option value="VENDORS">Vendor Performance & Commissions</option>
                  <option value="PRODUCTS">Product Inventory & Valuation</option>
                  <option value="ORDERS">Order Transactions & Fulfillment</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Reporting Period</label>
                <select
                  className="input-field"
                  value={reportRange}
                  onChange={(e) => setReportRange(e.target.value)}
                  style={{ background: 'var(--bg-main)', color: '#fff' }}
                >
                  <option value="7D">Last 7 Days</option>
                  <option value="30D">Last 30 Days</option>
                  <option value="90D">Last Quarter (90 Days)</option>
                  <option value="ALL">All Time History</option>
                </select>
              </div>

            </div>
          </div>

          {/* Report Viewer Container */}
          {reportLoading ? (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spinning" style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <div>Generating enterprise report dataset...</div>
            </div>
          ) : reportData ? (
            <div className="card" style={{ padding: '2rem' }}>
              
              {/* Report Header */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="badge badge-admin" style={{ marginBottom: '0.35rem' }}>
                  {reportData.reportType} REPORT
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{reportData.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>{reportData.subtitle}</p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
                  Generated at: {reportData.generatedAt} • Period: {reportData.dateRange}
                </div>
              </div>

              {/* Summary KPIs Banner */}
              {reportData.summaryMetrics && Object.keys(reportData.summaryMetrics).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  {Object.entries(reportData.summaryMetrics).map(([key, val]) => (
                    <div key={key} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>{key}</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                        {typeof val === 'number' ? val.toLocaleString() : val}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      {reportData.columns?.map(col => (
                        <th key={col.key} style={{ padding: '0.85rem 1rem' }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows?.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {reportData.columns?.map(col => {
                          const val = row[col.key];
                          return (
                            <td key={col.key} style={{ padding: '0.85rem 1rem' }}>
                              {col.type === 'currency' ? (
                                <strong style={{ color: '#34d399' }}>₹{typeof val === 'number' ? val.toFixed(2) : val}</strong>
                              ) : col.type === 'badge' ? (
                                <span className={`badge ${val === 'APPROVED' || val === 'DELIVERED' || val === 'PAID' || val === 'ACTIVE' ? 'badge-customer' : val === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                                  {val}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-main)' }}>{val !== null && val !== undefined ? String(val) : '—'}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ) : null}
        </div>
      )}

      {/* =========================================================================
          MODULE 8: USER GOVERNANCE
      ========================================================================= */}
      {activeTab === 'USERS' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            Registered Users & Role Authorization
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Manage platform accounts across Administrators, Vendors, and Customers.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>{u.fullName}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{u.email}</td>
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
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`btn ${u.enabled ? 'btn-danger' : 'btn-primary'} btn-sm`}
                      >
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

      {/* =========================================================================
          MODULE 9: TAXONOMY
      ========================================================================= */}
      {activeTab === 'TAXONOMY' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            Marketplace Category Taxonomy
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Create and organize catalog categories for multi-vendor product listings.
          </p>

          <form onSubmit={handleCreateCategory} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '1rem', marginBottom: '2rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Category Name (e.g. Sports & Outdoors)"
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {categories.map(c => (
              <div key={c.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{c.description || 'No description provided.'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>Slug: /{c.slug}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

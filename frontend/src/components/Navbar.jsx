import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import RoleBadge from './RoleBadge';
import MyOrdersModal from './MyOrdersModal';
import { Store, ShoppingCart, Heart, User as UserIcon, LogOut, ShieldCheck, Search, MapPin, ChevronDown, Sparkles, Layers, SlidersHorizontal, X, PackageCheck } from 'lucide-react';

const Navbar = ({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories = [] }) => {
  const { user, logout, isAdmin, isVendor } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const [selectedCatId, setSelectedCatId] = useState(selectedCategory || '');
  const [showMyOrders, setShowMyOrders] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleCategorySelectChange = (e) => {
    const val = e.target.value ? Number(e.target.value) : null;
    setSelectedCatId(e.target.value);
    if (setSelectedCategory) setSelectedCategory(val);
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      
      {/* Top Utility Ribbon */}
      <div style={{ background: '#070a12', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.35rem 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#818cf8' }}>
              <MapPin size={13} />
              <span>Deliver to <strong>Enterprise Hub (10001)</strong></span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>100% Verified Vendor Guarantee</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ color: 'var(--text-subtle)' }}>24/7 Corporate Support</span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link to="/register" style={{ color: '#f472b6', textDecoration: 'none', fontWeight: 600 }}>Become a Merchant</Link>
          </div>

        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="glass-nav">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px', gap: '1.5rem' }}>
          
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
            }}>
              <Store size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Shop</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.02em' }}>Stack</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>Enterprise</span>
            </div>
          </Link>

          {/* Integrated Search Bar with Category Select */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 500px', maxWidth: '560px', display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2px', overflow: 'hidden' }}>
            
            <select
              value={selectedCatId}
              onChange={handleCategorySelectChange}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-muted)',
                border: 'none',
                borderRight: '1px solid var(--border-color)',
                padding: '0.6rem 0.8rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '135px'
              }}
            >
              <option value="" style={{ background: '#0f172a', color: '#fff' }}>All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} style={{ background: '#0f172a', color: '#fff' }}>
                  {cat.name}
                </option>
              ))}
            </select>

            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={17} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                placeholder="Search products, brands, or catalog SKUs..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '0.65rem 2.2rem 0.65rem 2.4rem',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', marginRight: '2px' }}>
              <Search size={16} />
            </button>
          </form>

          {/* Actions & Role Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            
            {/* My Orders Button */}
            {user && (
              <button
                onClick={() => setShowMyOrders(true)}
                className="btn btn-secondary btn-sm"
                title="View order history"
              >
                <PackageCheck size={16} /> My Orders
              </button>
            )}

            {isVendor && (
              <Link to="/vendor" className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}>
                <Store size={15} /> Vendor Portal
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(236, 72, 153, 0.4)', color: '#f472b6' }}>
                <ShieldCheck size={15} /> Admin Panel
              </Link>
            )}

            {/* Shopping Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ position: 'relative', padding: '0.5rem 0.75rem' }}
              title="Shopping Cart"
            >
              <ShoppingCart size={18} color="#fff" />
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--primary)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px var(--primary-glow)'
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{user.fullName}</div>
                  <RoleBadge role={user.role} />
                </div>
                
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="btn btn-secondary btn-sm"
                  title="Sign out"
                  style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </div>
            )}

          </div>

        </div>

        {/* Category Shortcuts Sub-Ribbon */}
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.4rem 0', fontSize: '0.82rem' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <button
              onClick={() => setSelectedCategory && setSelectedCategory(null)}
              style={{ background: 'none', border: 'none', color: selectedCategory === null ? 'var(--primary)' : '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Layers size={14} /> All Categories
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory && setSelectedCategory(cat.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
              >
                {cat.name}
              </button>
            ))}

            <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>|</span>
            <span style={{ color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={13} /> Trending Enterprise Deals
            </span>
          </div>
        </div>

      </nav>

      {/* Customer Orders Modal */}
      {showMyOrders && (
        <MyOrdersModal onClose={() => setShowMyOrders(false)} />
      )}

    </header>
  );
};

export default Navbar;

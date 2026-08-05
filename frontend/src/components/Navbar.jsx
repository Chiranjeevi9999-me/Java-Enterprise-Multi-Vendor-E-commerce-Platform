import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import { Store, ShoppingBag, User as UserIcon, LogOut, ShieldCheck, PlusCircle, Search } from 'lucide-react';

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const { user, logout, isAdmin, isVendor } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="glass-nav">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '76px' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
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
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Shop</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.02em' }}>Stack</span>
          </div>
        </Link>

        {/* Search Bar */}
        <div style={{ flex: '0 1 420px', position: 'relative' }}>
          <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search products, brands, or categories..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            style={{ paddingLeft: '42px', background: 'rgba(15, 23, 42, 0.6)' }}
          />
        </div>

        {/* Actions & Role Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isVendor && (
            <Link to="/vendor" className="btn btn-secondary btn-sm">
              <Store size={16} />
              Vendor Portal
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(236, 72, 153, 0.4)', color: '#f472b6' }}>
              <ShieldCheck size={16} />
              Admin Panel
            </Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{user.fullName}</div>
                <RoleBadge role={user.role} />
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn btn-secondary btn-sm"
                title="Log out"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;

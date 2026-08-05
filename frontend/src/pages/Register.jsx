import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, User, Mail, Lock, Phone, AlertCircle, CheckCircle } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [error, setError] = useState('');

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await register({
        fullName,
        email,
        password,
        phoneNumber,
        role,
        storeName: role === 'VENDOR' ? storeName : null,
        storeDescription: role === 'VENDOR' ? storeDescription : null,
      });

      if (res.role === 'VENDOR') navigate('/vendor');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Email might already exist.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 76px)', padding: '2rem 1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Create ShopStack Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Join as a Shopper or Enterprise Vendor Partner</p>
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`btn ${role === 'CUSTOMER' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
            onClick={() => setRole('CUSTOMER')}
          >
            <User size={16} />
            Customer Account
          </button>
          <button
            type="button"
            className={`btn ${role === 'VENDOR' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
            onClick={() => setRole('VENDOR')}
          >
            <Store size={16} />
            Vendor Store
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name *</label>
            <input type="text" className="input-field" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Email Address *</label>
              <input type="email" className="input-field" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input type="tel" className="input-field" placeholder="+1 555-0199" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password *</label>
            <input type="password" className="input-field" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {/* Vendor Specific Inputs */}
          {role === 'VENDOR' && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
              <div className="badge badge-vendor" style={{ marginBottom: '1rem' }}>
                <Store size={13} /> Vendor Store Information
              </div>

              <div className="input-group">
                <label className="input-label">Store / Business Name *</label>
                <input type="text" className="input-field" placeholder="e.g. Acme Electronics Inc." value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
              </div>

              <div className="input-group">
                <label className="input-label">Store Description</label>
                <textarea className="input-field" rows="2" placeholder="Brief overview of your products & brand..." value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '1.25rem' }}>
            {loading ? 'Creating Account...' : role === 'VENDOR' ? 'Register Vendor Partner Store' : 'Register Customer Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;

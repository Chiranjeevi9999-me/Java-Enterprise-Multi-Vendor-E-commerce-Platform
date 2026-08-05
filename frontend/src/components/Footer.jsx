import React from 'react';
import { Store, ShieldCheck, Zap, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', background: 'rgba(11, 15, 25, 0.95)', padding: '3rem 0 2rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Store size={22} color="#6366f1" />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>ShopStack</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Enterprise Multi-Vendor E-Commerce Platform engineered for high-scale retail & multi-merchant marketplaces.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>Marketplace Architecture</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <li>Multi-Vendor Onboarding</li>
              <li>JWT Role-Based Security</li>
              <li>Product Catalog System</li>
              <li>Inventory & Order Sync</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>Platform Features</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <li>Vendor Commission Engine</li>
              <li>Warehouse Allocation</li>
              <li>Spring Boot REST API</li>
              <li>React + Vite Client</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>System Status</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }}></span>
              Milestone 1 Active Services
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.82rem' }}>
          © {new Date().getFullYear()} ShopStack Enterprise E-Commerce Platform. Built with React & Spring Boot.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

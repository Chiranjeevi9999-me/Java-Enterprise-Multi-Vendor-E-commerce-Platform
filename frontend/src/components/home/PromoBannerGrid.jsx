import React from 'react';
import { Zap, Tag, PackageCheck, ArrowRight } from 'lucide-react';

const PromoBannerGrid = ({ onPromoClick }) => {
  return (
    <div style={{ margin: '3.5rem 0' }}>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Banner 1 */}
        <div
          className="glass-panel promo-card"
          style={{
            padding: '2rem 1.75rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div className="badge badge-warning" style={{ marginBottom: '0.85rem' }}>
            <Zap size={13} /> 24-Hour Flash Sale
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.25 }}>
            Enterprise Tech Accessories & Gear
          </h3>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Save flat 30% on ergonomic charging hubs, mechanical keyboards, and OLED displays.
          </p>

          <button
            onClick={onPromoClick}
            className="btn btn-primary btn-sm"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            Claim Deals <ArrowRight size={15} />
          </button>
        </div>

        {/* Banner 2 */}
        <div
          className="glass-panel promo-card"
          style={{
            padding: '2rem 1.75rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div className="badge badge-admin" style={{ marginBottom: '0.85rem' }}>
            <Tag size={13} /> Vendor Partner Spotlight
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.25 }}>
            Aura Premium Fashion & Footwear
          </h3>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Direct-from-merchant designer collections with express worldwide shipping.
          </p>

          <button
            onClick={onPromoClick}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-md)', borderColor: 'rgba(236, 72, 153, 0.4)', color: '#f472b6' }}
          >
            Explore Collection <ArrowRight size={15} />
          </button>
        </div>

        {/* Banner 3 */}
        <div
          className="glass-panel promo-card"
          style={{
            padding: '2rem 1.75rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div className="badge badge-customer" style={{ marginBottom: '0.85rem' }}>
            <PackageCheck size={13} /> Bulk Enterprise Orders
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.25 }}>
            Multi-Tier Merchant Wholesale
          </h3>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Register your company to unlock corporate discounts and dedicated account managers.
          </p>

          <button
            onClick={onPromoClick}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-md)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
          >
            Learn More <ArrowRight size={15} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default PromoBannerGrid;

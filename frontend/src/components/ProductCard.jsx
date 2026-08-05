import React from 'react';
import { Star, ShoppingCart, Store, CheckCircle } from 'lucide-react';

const ProductCard = ({ product, onSelect }) => {
  return (
    <div className="product-card" onClick={() => onSelect(product)} style={{ cursor: 'pointer' }}>
      
      {/* Featured Tag */}
      {product.featured && (
        <span className="badge badge-admin" style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2, background: 'rgba(99, 102, 241, 0.85)', color: '#fff' }}>
          Featured
        </span>
      )}

      {/* Product Image */}
      <div className="product-img-wrapper">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
          alt={product.title}
          className="product-img"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
          }}
        />
      </div>

      {/* Body */}
      <div className="product-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span className="product-vendor-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Store size={12} />
            {product.vendorProfile?.storeName || 'Verified Seller'}
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700 }}>
            <Star size={13} fill="#fbbf24" color="#fbbf24" />
            {product.rating || '5.0'}
          </div>
        </div>

        <h3 className="product-title">{product.title}</h3>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.description}
        </p>

        <div className="product-price-row">
          <div>
            <span className="price-current">${product.discountPrice || product.price}</span>
            {product.discountPrice && (
              <span className="price-original" style={{ marginLeft: '0.4rem' }}>${product.price}</span>
            )}
          </div>

          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
            <ShoppingCart size={15} />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

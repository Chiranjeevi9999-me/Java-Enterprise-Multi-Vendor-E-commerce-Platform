import React, { useState, useEffect } from 'react';
import { productApi, categoryApi } from '../api';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import { Sparkles, SlidersHorizontal, Layers, CheckCircle } from 'lucide-react';

const HomeCatalog = ({ searchQuery }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.getAll()
      .then(res => setCategories(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (selectedCategory) params.categoryId = selectedCategory;
    if (searchQuery) params.search = searchQuery;

    productApi.getAll(params)
      .then(res => setProducts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery]);

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      
      {/* Hero Section */}
      <div className="glass-panel" style={{
        marginTop: '1.5rem',
        padding: '3rem 2.5rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(99, 102, 241, 0.25)'
      }}>
        <div style={{ maxWidth: '650px', position: 'relative', zIndex: 2 }}>
          <div className="badge badge-vendor" style={{ marginBottom: '0.8rem', background: 'rgba(99, 102, 241, 0.2)' }}>
            <Sparkles size={13} />
            ShopStack Enterprise Marketplace
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: '1.2', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Discover Top Brands & Multi-Vendor Merchants.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            Explore verified vendor stores, competitive catalog prices, and instant product availability backed by enterprise order fulfillment.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.88rem', fontWeight: 600 }}>
              <CheckCircle size={16} /> Verified Vendors
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontSize: '0.88rem', fontWeight: 600 }}>
              <CheckCircle size={16} /> JWT Encrypted
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f472b6', fontSize: '0.88rem', fontWeight: 600 }}>
              <CheckCircle size={16} /> Real-time Inventory
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button
          className={`category-pill ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          <Layers size={16} />
          All Products
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product List Header */}
      <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
          {selectedCategory ? 'Filtered Products' : searchQuery ? `Search Results for "${searchQuery}"` : 'Curated Marketplace Catalog'}
        </h2>
        <span style={{ fontSize: '0.88rem', color: 'var(--text-subtle)' }}>
          Showing {products.length} active products
        </span>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          Loading marketplace inventory...
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '1.5rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Products Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try clearing filters or search terms to view products.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

    </div>
  );
};

export default HomeCatalog;

import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Tag, Plus, Edit, Trash2, Save, X, Percent, Layout, FolderOpen, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable';
import useFormAutosave from '../../hooks/useFormAutosave';
import FormAutosaveStatus from '../../components/common/FormAutosaveStatus';
import { getSubcategoriesForMain, getTypesForMainSub } from '../../constants/sellerCategoryTaxonomy';

// ─── Homepage Engine Mock Data ────────────────────────────────────────────────
const SAMPLE_PRODUCTS = [
  { id: 1, title: 'Handwoven Banarasi Silk Dupatta', seller: 'Ritu Handicrafts', price: 1299, originalPrice: 1899, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop', sale: true, saleLabel: '32% OFF' },
  { id: 2, title: 'Block Print Cotton Kurta', seller: 'Jaipur Weavers', price: 849, originalPrice: 1200, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b2ec4?w=400&h=400&fit=crop', sale: true, saleLabel: '29% OFF' },
  { id: 3, title: 'Brass Engraved Pooja Thali', seller: 'Bengal Brass Works', price: 1499, originalPrice: 1999, image: 'https://images.unsplash.com/photo-1608613304810-2d4dd52511a2?w=400&h=400&fit=crop', sale: true, saleLabel: '25% OFF' },
  { id: 4, title: 'Terracotta Dinner Set (6 pcs)', seller: 'Nilgiri Pottery', price: 1750, originalPrice: 2200, image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop', sale: false, saleLabel: '' },
  { id: 5, title: 'Organic Cold-Press Coconut Oil', seller: 'Kerala Naturals', price: 380, originalPrice: 499, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop', sale: true, saleLabel: '24% OFF' },
  { id: 6, title: 'Leather Kolhapuri Chappals', seller: 'Kolhapuri Kraft', price: 950, originalPrice: 1400, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop', sale: true, saleLabel: '32% OFF' },
  { id: 7, title: 'Rajasthani Embroidered Cushion', seller: 'Kutch Kala Studio', price: 650, originalPrice: 850, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop', sale: false, saleLabel: '' },
  { id: 8, title: 'Pure Darjeeling First Flush Tea', seller: 'Nilgiris Farm Fresh', price: 420, originalPrice: 560, image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop', sale: true, saleLabel: '25% OFF' },
  { id: 9, title: 'Hand-painted Madhubani Wall Art', seller: 'Bihar Folk Arts', price: 2200, originalPrice: 2800, image: 'https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=400&h=400&fit=crop', sale: true, saleLabel: '21% OFF' },
  { id: 10, title: 'Organic Turmeric Powder 500g', seller: 'Kerala Naturals', price: 180, originalPrice: 240, image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&h=400&fit=crop', sale: true, saleLabel: '25% OFF' },
  { id: 11, title: 'Sandalwood Incense Sticks Set', seller: 'Mysore Fragrances', price: 299, originalPrice: 399, image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&h=400&fit=crop', sale: false, saleLabel: '' },
  { id: 12, title: 'Dokra Metal Tribal Figurine', seller: 'Bengal Brass Works', price: 1150, originalPrice: 1500, image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=400&fit=crop', sale: true, saleLabel: '23% OFF' },
];

const SLIDE_IMAGES = [
  { id: 'sl1', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=300&fit=crop', title: "India's Finest Artisans — All in One Place", subtitle: 'Handcrafted goods from 500+ verified sellers across India', btnLabel: 'Shop Now', gradient: 'linear-gradient(90deg, rgba(15,15,26,0.85) 0%, rgba(15,15,26,0.3) 60%, transparent 100%)' },
  { id: 'sl2', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&h=300&fit=crop', title: 'Festive Season Sale — Up to 40% Off', subtitle: 'On textiles, handicrafts, organic foods & more', btnLabel: 'View Deals', gradient: 'linear-gradient(90deg, rgba(26,20,100,0.9) 0%, rgba(26,20,100,0.4) 60%, transparent 100%)' },
  { id: 'sl3', image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1200&h=300&fit=crop', title: 'Bulk Orders for Schools & Offices', subtitle: 'Request bulk pricing on any product — direct from the seller', btnLabel: 'Request Bulk', gradient: 'linear-gradient(90deg, rgba(14,80,50,0.88) 0%, rgba(14,80,50,0.35) 60%, transparent 100%)' },
];

const BANNER_IMAGES = [
  { id: 'b1', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop', title: 'New Arrivals — Handloom Collection', btnLabel: 'Explore Now' },
  { id: 'b2', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=300&fit=crop', title: 'Organic & Natural Products', btnLabel: 'Shop Organic' },
];

const INITIAL_COLLECTIONS = [
  { id: 'c1', name: 'Festive Picks 2025', description: 'Curated gifts and decor for the season', productIds: [1, 2, 3, 7, 9, 11, 12] },
  { id: 'c2', name: 'Kitchen & Home Essentials', description: 'Everyday Indian home products from verified sellers', productIds: [3, 4, 5, 8, 10, 11] },
  { id: 'c3', name: 'Fashion & Apparel', description: 'Traditional and contemporary Indian clothing', productIds: [1, 2, 6, 7] },
];

const INITIAL_ROWS = [
  { id: 'r1', type: 'slideshow', visible: true, label: 'Hero Slideshow', config: { slides: SLIDE_IMAGES, autoPlay: true } },
  { id: 'r2', type: 'collection', visible: true, label: 'Festive Picks 2025', config: { collectionId: 'c1' } },
  { id: 'r3', type: 'banner', visible: true, label: 'Single Banner — New Arrivals', config: { banners: [BANNER_IMAGES[0]], mode: 'single' } },
  { id: 'r4', type: 'collection', visible: true, label: 'Kitchen & Home Essentials', config: { collectionId: 'c2' } },
  { id: 'r5', type: 'banner', visible: true, label: 'Multi Banner — Promotions', config: { banners: BANNER_IMAGES, mode: 'multi' } },
  { id: 'r6', type: 'collection', visible: true, label: 'Fashion & Apparel', config: { collectionId: 'c3' } },
];

const ALL_SELLERS = [...new Set(SAMPLE_PRODUCTS.map(p => p.seller))];
const fmt = (n) => '₹' + n.toLocaleString('en-IN');

const ROW_TYPE_META = {
  slideshow:  { icon: '🎞️', color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', label: 'Slideshow' },
  banner:     { icon: '🖼️', color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)', label: 'Banner' },
  collection: { icon: '🗂️', color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Collection' },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
      padding: '11px 26px', borderRadius: 999, fontWeight: 700, fontSize: 13,
      zIndex: 9999, boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
      animation: 'fadeIn 0.2s ease', whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}

// ─── Add Row Modal ─────────────────────────────────────────────────────────────
function AddRowModal({ onClose, onAdd, collections }) {
  const [type, setType] = useState(null);
  const [bannerMode, setBannerMode] = useState('single');
  const [collectionId, setCollectionId] = useState(collections[0]?.id || '');
  const [slideCount, setSlideCount] = useState(3);
  const [bannerCount, setBannerCount] = useState(1);

  const handleAdd = () => {
    if (!type) return;
    let config = {}, label = '';
    if (type === 'slideshow') {
      config = { slides: SLIDE_IMAGES.slice(0, slideCount), autoPlay: true };
      label = `Slideshow (${slideCount} slide${slideCount > 1 ? 's' : ''})`;
    } else if (type === 'banner') {
      config = { banners: BANNER_IMAGES.slice(0, bannerCount), mode: bannerMode };
      label = `${bannerMode === 'multi' ? 'Multi' : 'Single'} Banner`;
    } else if (type === 'collection') {
      const c = collections.find(x => x.id === collectionId);
      config = { collectionId };
      label = c?.name || 'Collection';
    }
    onAdd({ id: 'r' + Date.now(), type, visible: true, label, config });
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#1e293b', borderRadius: 18, width: '100%', maxWidth: 480, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', animation: 'fadeIn 0.2s ease' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#f8fafc' }}>Add New Row</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: 30, height: 30, borderRadius: 7, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 22px', maxHeight: '60vh', overflowY: 'auto' }}>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Choose the type of row to add to the homepage</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {Object.entries(ROW_TYPE_META).map(([t, m]) => (
              <button key={t} onClick={() => setType(t)} style={{
                border: `2px solid ${type === t ? m.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 12, padding: '14px 10px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                textAlign: 'center', background: type === t ? m.bg : 'rgba(255,255,255,0.03)',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 28 }}>{m.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#f8fafc' }}>{m.label}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {t === 'slideshow' && 'Auto-playing carousel'}
                  {t === 'banner' && 'Promotional image(s)'}
                  {t === 'collection' && 'Product grid'}
                </span>
              </button>
            ))}
          </div>

          {type === 'slideshow' && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Number of slides</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => setSlideCount(n)} style={{
                    padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${slideCount === n ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                    background: slideCount === n ? '#6366f1' : 'transparent', color: slideCount === n ? '#fff' : '#94a3b8',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}>{n} slide{n > 1 ? 's' : ''}</button>
                ))}
              </div>
            </div>
          )}

          {type === 'banner' && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Banner mode</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['single', 'multi'].map(m => (
                  <button key={m} onClick={() => { setBannerMode(m); if (m === 'single') setBannerCount(1); }} style={{
                    padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${bannerMode === m ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                    background: bannerMode === m ? '#6366f1' : 'transparent', color: bannerMode === m ? '#fff' : '#94a3b8',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}>{m === 'single' ? 'Single image' : 'Multiple images'}</button>
                ))}
              </div>
              {bannerMode === 'multi' && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Number of banners</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2].map(n => (
                      <button key={n} onClick={() => setBannerCount(n)} style={{
                        padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${bannerCount === n ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                        background: bannerCount === n ? '#6366f1' : 'transparent', color: bannerCount === n ? '#fff' : '#94a3b8',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'collection' && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Select collection</div>
              {collections.length === 0
                ? <div style={{ fontSize: 13, color: '#64748b', padding: '10px 0' }}>No collections yet — create one first in the Collections tab.</div>
                : collections.map(c => (
                  <button key={c.id} onClick={() => setCollectionId(c.id)} style={{
                    width: '100%', padding: '10px 14px', border: `1.5px solid ${collectionId === c.id ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, background: collectionId === c.id ? 'rgba(16,185,129,0.1)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', marginBottom: 6, display: 'block',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#f8fafc' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{c.productIds.length} products · {c.description}</div>
                  </button>
                ))
              }
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleAdd} disabled={!type || (type === 'collection' && !collectionId)} style={{
            padding: '9px 22px', background: 'linear-gradient(135deg, #f59e0b, #f97316)', border: 'none', borderRadius: 9,
            fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer', opacity: (!type || (type === 'collection' && !collectionId)) ? 0.4 : 1,
          }}>Add Row →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Collection Form Panel ─────────────────────────────────────────────────────
function CollectionFormPanel({ editingCollection, onSave, onCancel }) {
  const isEdit = !!editingCollection?.id && editingCollection.id !== 'new';
  const [name, setName] = useState(editingCollection?.name || '');
  const [desc, setDesc] = useState(editingCollection?.description || '');
  const [selectedIds, setSelectedIds] = useState(editingCollection?.productIds || []);
  const [sellerFilter, setSellerFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState({});

  const filtered = SAMPLE_PRODUCTS.filter(p => {
    const matchSeller = sellerFilter === 'All' || p.seller === sellerFilter;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchSeller && matchSearch;
  });

  const toggle = (id) => setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const remove = (id) => setSelectedIds(ids => ids.filter(x => x !== id));

  const handleSave = () => {
    const e = {};
    if (!name.trim()) e.name = 'Collection name is required';
    if (selectedIds.length === 0) e.products = 'Add at least one product';
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({ name: name.trim(), description: desc.trim(), productIds: selectedIds });
  };

  const inputStyle = (hasErr) => ({
    width: '100%', border: `1.5px solid ${hasErr ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, padding: '9px 13px', fontFamily: 'inherit', fontSize: 14,
    color: '#f8fafc', outline: 'none', background: 'rgba(255,255,255,0.04)',
    transition: 'border-color 0.15s',
  });

  return (
    <div style={{ background: '#1e293b', borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.08)', overflow: 'hidden', position: 'sticky', top: 20 }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>{isEdit ? 'Edit Collection' : 'New Collection'}</span>
        <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: 30, height: 30, borderRadius: 7, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✕</button>
      </div>
      {/* Body */}
      <div style={{ padding: 20 }}>
        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 5 }}>Collection Name <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle(errors.name)} placeholder="e.g. Festive Picks 2025" value={name} onChange={e => { setName(e.target.value); setErrors(v => ({ ...v, name: undefined })); }} />
          {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors.name}</div>}
        </div>
        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 5 }}>Description <span style={{ fontSize: 11, color: '#475569', fontWeight: 400 }}>(optional)</span></label>
          <input style={inputStyle(false)} placeholder="Short description shown on homepage" value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        {/* Product Picker */}
        <div style={{ marginBottom: 6 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Products <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={{ ...inputStyle(false), marginBottom: 8 }} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          {/* Seller pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {['All', ...ALL_SELLERS].map(s => (
              <button key={s} onClick={() => setSellerFilter(s)} style={{
                padding: '4px 11px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                border: `1.5px solid ${sellerFilter === s ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                background: sellerFilter === s ? '#6366f1' : 'transparent',
                color: sellerFilter === s ? '#fff' : '#64748b', cursor: 'pointer', transition: 'all 0.15s',
              }}>{s}</button>
            ))}
          </div>
          {/* Product list */}
          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, scrollbarWidth: 'thin' }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => toggle(p.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                background: selectedIds.includes(p.id) ? 'rgba(99,102,241,0.1)' : 'transparent',
                transition: 'background 0.12s',
              }}>
                <img src={p.image} alt={p.title} style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} loading="lazy" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc', lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{p.seller}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, border: `2px solid ${selectedIds.includes(p.id) ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                  background: selectedIds.includes(p.id) ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s',
                }}>
                  {selectedIds.includes(p.id) && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                </div>
              </div>
            ))}
          </div>
          {errors.products && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.products}</div>}
        </div>

        {/* Selected chips */}
        {selectedIds.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {selectedIds.map(id => {
                const p = SAMPLE_PRODUCTS.find(x => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                    {p.title.slice(0, 20)}{p.title.length > 20 ? '…' : ''}
                    <button onClick={() => remove(id)} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 10, background: 'transparent', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 2, padding: 10, background: 'linear-gradient(135deg, #f59e0b, #f97316)', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
            {isEdit ? 'Update Collection' : 'Save Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Homepage Layout Engine ────────────────────────────────────────────────────
function HomepageLayoutEngine() {
  const [activeTab, setActiveTab] = useState('layout');
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [collections, setCollections] = useState(INITIAL_COLLECTIONS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // ── Row handlers ──
  const moveRow = (index, dir) => {
    setRows(prev => {
      const arr = [...prev];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
    showToast('Row reordered');
  };

  const toggleRow = (id) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, visible: !r.visible } : r));
    showToast('Visibility updated');
  };

  const deleteRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
    showToast('Row removed');
  };

  const addRow = (row) => {
    setRows(prev => [...prev, row]);
    showToast('Row added');
  };

  // ── Collection handlers ──
  const saveCollection = (data) => {
    if (editingCollection?.id && editingCollection.id !== 'new') {
      setCollections(prev => prev.map(c => c.id === editingCollection.id ? { ...c, ...data } : c));
      showToast('Collection updated ✓');
    } else {
      const newColl = { id: 'c' + Date.now(), ...data };
      setCollections(prev => [...prev, newColl]);
      showToast('Collection created ✓');
    }
    setEditingCollection(null);
  };

  const deleteCollection = (id) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    setRows(prev => prev.filter(r => !(r.type === 'collection' && r.config.collectionId === id)));
    showToast('Collection deleted');
  };

  const visibleCount = rows.filter(r => r.visible).length;

  // ── Row type meta helper ──
  const getRowMeta = (row) => {
    if (row.type === 'slideshow') return `${row.config.slides.length} slides · Auto-play ${row.config.autoPlay ? 'on' : 'off'}`;
    if (row.type === 'banner') return `${row.config.mode === 'multi' ? 'Multi' : 'Single'} banner · ${row.config.banners.length} image${row.config.banners.length > 1 ? 's' : ''}`;
    if (row.type === 'collection') {
      const c = collections.find(x => x.id === row.config.collectionId);
      return c ? `${c.productIds.length} products · "${c.name}"` : 'Collection not found';
    }
    return '';
  };

  return (
    <div style={{ marginTop: 40, animation: 'fadeIn 0.4s ease' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(99,102,241,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layout size={22} color="#6366f1" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', fontFamily: 'inherit' }}>Homepage Layout Engine</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Control what customers see on the homepage — rows, banners, and collections.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => showToast('Layout saved successfully ✓')}
            style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #f59e0b, #f97316)', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
          >
            Save Layout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid rgba(255,255,255,0.06)', marginBottom: 24, background: 'rgba(255,255,255,0.02)', borderRadius: '12px 12px 0 0', padding: '0 4px' }}>
        {[
          { id: 'layout', label: 'Page Layout', icon: <Layout size={14} />, count: rows.length },
          { id: 'collections', label: 'Collections', icon: <FolderOpen size={14} />, count: collections.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 7,
            fontWeight: 600, fontSize: 13, color: activeTab === tab.id ? '#6366f1' : '#64748b',
            border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${activeTab === tab.id ? '#6366f1' : 'transparent'}`,
            marginBottom: -2, transition: 'color 0.15s, border-color 0.15s',
          }}>
            {tab.icon} {tab.label}
            <span style={{ background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)', color: activeTab === tab.id ? '#6366f1' : '#64748b', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── PAGE LAYOUT TAB ── */}
      {activeTab === 'layout' && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Sidebar */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', padding: 20, position: 'sticky', top: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#f8fafc', marginBottom: 6 }}>Layout Stats</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 18 }}>Drag rows up / down to reorder. Toggle visibility per row.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
              {[
                { num: rows.length, label: 'Total' },
                { num: visibleCount, label: 'Visible' },
                { num: rows.length - visibleCount, label: 'Hidden' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#6366f1' }}>{s.num}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(ROW_TYPE_META).map(([t, m]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{m.icon}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{m.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: m.color }}>{rows.filter(r => r.type === t).length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: '#f8fafc' }}>Homepage Rows</span>
              <button onClick={() => setShowAddModal(true)} style={{ padding: '9px 18px', background: '#6366f1', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                + Add Row
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rows.map((row, index) => {
                const meta = ROW_TYPE_META[row.type];
                return (
                  <div key={row.id} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                    border: `1.5px solid ${row.visible ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                    opacity: row.visible ? 1 : 0.45, transition: 'all 0.2s', position: 'relative',
                  }}>
                    {/* Reorder */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button disabled={index === 0} onClick={() => moveRow(index, -1)} style={{
                          width: 22, height: 22, border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 5,
                          background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: 12, cursor: index === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.3 : 1, transition: 'all 0.15s',
                        }}><ChevronUp size={12} /></button>
                        <button disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)} style={{
                          width: 22, height: 22, border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 5,
                          background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: 12, cursor: index === rows.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === rows.length - 1 ? 0.3 : 1, transition: 'all 0.15s',
                        }}><ChevronDown size={12} /></button>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#334155' }}>{String(index + 1).padStart(2, '0')}</span>
                    </div>

                    {/* Type badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: meta.bg, flexShrink: 0, minWidth: 110 }}>
                      <span style={{ fontSize: 16 }}>{meta.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{getRowMeta(row)}</div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <button onClick={() => toggleRow(row.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                        borderRadius: 20, border: `1.5px solid ${row.visible ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                        background: row.visible ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                        color: row.visible ? '#10b981' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        {row.visible ? <><Eye size={12} /> Visible</> : <><EyeOff size={12} /> Hidden</>}
                      </button>
                      <button onClick={() => deleteRow(row.id)} style={{
                        width: 28, height: 28, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)',
                        borderRadius: 7, color: '#ef4444', fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                      }}>×</button>
                    </div>
                  </div>
                );
              })}

              {rows.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <div style={{ fontSize: 48, marginBottom: 14 }}>🗂️</div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#475569', marginBottom: 6 }}>No rows yet</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>Click "Add Row" to start building your homepage layout.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── COLLECTIONS TAB ── */}
      {activeTab === 'collections' && (
        <div style={{ display: 'grid', gridTemplateColumns: editingCollection ? '1fr 360px' : '1fr', gap: 24, alignItems: 'start' }}>
          {/* Collection list */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: '#f8fafc' }}>Product Collections</span>
              <button onClick={() => setEditingCollection({ id: 'new' })} style={{ padding: '9px 18px', background: '#6366f1', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                + New Collection
              </button>
            </div>

            {collections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#475569', marginBottom: 6 }}>No collections yet</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>Create your first collection to display products on the homepage.</div>
              </div>
            ) : (
              collections.map(coll => {
                const usedInRows = rows.filter(r => r.type === 'collection' && r.config.collectionId === coll.id).length;
                return (
                  <div key={coll.id} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 14,
                    border: `1.5px solid ${editingCollection?.id === coll.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    overflow: 'hidden', marginBottom: 12, transition: 'all 0.15s',
                    boxShadow: editingCollection?.id === coll.id ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                  }}>
                    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 4, borderRadius: 2, background: '#f59e0b', flexShrink: 0, alignSelf: 'stretch', minHeight: 36 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>{coll.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{coll.description}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5 }}>{coll.productIds.length} products</span>
                          {usedInRows > 0 && (
                            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5 }}>Used in {usedInRows} row{usedInRows > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setEditingCollection(coll)} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s' }}>Edit</button>
                        <button onClick={() => deleteCollection(coll.id)} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: '1.5px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.15s' }}>Delete</button>
                      </div>
                    </div>
                    {/* Product chips */}
                    <div style={{ padding: '0 18px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {coll.productIds.slice(0, 6).map(id => {
                        const p = SAMPLE_PRODUCTS.find(x => x.id === id);
                        if (!p) return null;
                        return (
                          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#94a3b8' }}>
                            <img src={p.image} alt={p.title} style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }} loading="lazy" />
                            {p.title.slice(0, 18)}{p.title.length > 18 ? '…' : ''}
                          </div>
                        );
                      })}
                      {coll.productIds.length > 6 && (
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#64748b' }}>
                          +{coll.productIds.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Form panel */}
          {editingCollection && (
            <CollectionFormPanel
              editingCollection={editingCollection}
              onSave={saveCollection}
              onCancel={() => setEditingCollection(null)}
            />
          )}
        </div>
      )}

      {/* Add Row Modal */}
      {showAddModal && (
        <AddRowModal
          onClose={() => setShowAddModal(false)}
          onAdd={addRow}
          collections={collections}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </div>
  );
}

// ─── Main AdminCategories Page ────────────────────────────────────────────────
const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', commissionRate: 5, isActive: true, isFeatured: false, parentCategory: '', subCategory: '', productType: '', customParentCategory: '', customSubCategory: '', customProductType: ''
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const categoryDraftKey = editingId
    ? `admin.categories.edit.${editingId}`
    : 'admin.categories.new';

  const { status: categoryAutosaveStatus, message: categoryAutosaveMessage, clearDraft: clearCategoryDraft } =
    useFormAutosave({
      formKey: categoryDraftKey,
      value: formData,
      enabled: showForm,
      restore: !editingId,
      onRestore: (data) => setFormData((prev) => ({ ...prev, ...data })),
    });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'parentCategory') {
        if (value !== 'other') {
          next.customParentCategory = '';
        }
        next.subCategory = '';
        next.customSubCategory = '';
        next.productType = '';
        next.customProductType = '';
      } else if (name === 'subCategory') {
        if (value !== 'other') {
          next.customSubCategory = '';
        }
        next.productType = '';
        next.customProductType = '';
      } else if (name === 'productType') {
        if (value !== 'other') {
          next.customProductType = '';
        }
      }
      return next;
    });
  };

  const resetFormState = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', commissionRate: 5, isActive: true, isFeatured: false, parentCategory: '', subCategory: '', productType: '', customParentCategory: '', customSubCategory: '', customProductType: '' });
    clearCategoryDraft();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      resetFormState();
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat) => {
    setFormData({
      name: cat.name,
      description: cat.description || '',
      commissionRate: cat.commissionRate,
      isActive: cat.isActive,
      isFeatured: cat.isFeatured,
      parentCategory: cat.parentCategory?._id || '',
      subCategory: cat.subCategory || '',
      productType: cat.productType || '',
      customParentCategory: '',
      customSubCategory: '',
      customProductType: '',
    });
    setEditingId(cat._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? Products might be affected.")) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Failed to delete category";
        alert(`Error: ${msg}`);
      }
    }
  };

  const selectedParent = categories.find(c => c._id === formData.parentCategory);
  const parentName = formData.parentCategory === 'other' ? formData.customParentCategory : (selectedParent ? selectedParent.name : '');
  const subCategoryName = formData.subCategory === 'other' ? formData.customSubCategory : formData.subCategory;
 
  const subCategoryOptions = parentName ? getSubcategoriesForMain(parentName) : [];
  const productTypeOptions = (parentName && subCategoryName) ? getTypesForMainSub(parentName, subCategoryName) : [];

  const visibleCategories = expanded ? categories : categories.slice(0, 3);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Tag className="text-primary"/> Category Engine</h1>
          <p className="text-text-muted mt-2">Dynamically control marketplace categories, taxonomy, and commissions.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2 shadow-glow">
            <Plus size={20}/> New Category
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in border border-primary/30">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-6 border-b border-glass-border pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Category' : 'Create New Category'}</h2>
              <FormAutosaveStatus status={categoryAutosaveStatus} message={categoryAutosaveMessage} />
            </div>
            <button
              onClick={resetFormState}
              className="p-2 hover:bg-surface rounded-full transition-colors"
            >
              <X size={20}/>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-1 font-medium">Category Name *</label>
              <input type="text" name="name" required className="input-field w-full" value={formData.name} onChange={handleInputChange} placeholder="e.g. Electronics, Clothing" />
            </div>
            
            <div>
              <label className="block text-sm mb-1 font-medium flex items-center gap-2"><Percent size={14}/> Platform Commission (%) *</label>
              <input type="number" name="commissionRate" required min="0" max="100" className="input-field w-full text-primary font-bold" value={formData.commissionRate} onChange={handleInputChange} />
              <p className="text-xs text-text-muted mt-1">Percentage taken from seller sales in this category.</p>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">Main Category</label>
              <select name="parentCategory" className="input-field w-full bg-surface" value={formData.parentCategory} onChange={handleInputChange}>
                <option value="">None (Root Category)</option>
                <option value="other">Other (Please mention)</option>
                {categories.filter(c => c._id !== editingId).map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {formData.parentCategory === 'other' && (
              <div>
                <label className="block text-sm mb-1 font-medium">Please mention Main Category *</label>
                <input
                  type="text"
                  name="customParentCategory"
                  required
                  className="input-field w-full"
                  value={formData.customParentCategory || ''}
                  onChange={handleInputChange}
                  placeholder="Type your main category"
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-1 font-medium">Sub Category</label>
              <select 
                name="subCategory" 
                className="input-field w-full bg-surface disabled:opacity-50 disabled:cursor-not-allowed" 
                value={formData.subCategory} 
                onChange={handleInputChange}
                disabled={!formData.parentCategory}
              >
                <option value="">None (Select Sub Category)</option>
                <option value="other">Other (Please mention)</option>
                {subCategoryOptions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {formData.subCategory === 'other' && (
              <div>
                <label className="block text-sm mb-1 font-medium">Please mention Sub Category *</label>
                <input
                  type="text"
                  name="customSubCategory"
                  required
                  className="input-field w-full"
                  value={formData.customSubCategory || ''}
                  onChange={handleInputChange}
                  placeholder="Type your sub category"
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-1 font-medium">Product Type</label>
              <select 
                name="productType" 
                className="input-field w-full bg-surface disabled:opacity-50 disabled:cursor-not-allowed" 
                value={formData.productType} 
                onChange={handleInputChange}
                disabled={!formData.subCategory}
              >
                <option value="">None (Select Product Type)</option>
                <option value="other">Other (Please mention)</option>
                {productTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {formData.productType === 'other' && (
              <div>
                <label className="block text-sm mb-1 font-medium">Please mention Product Type *</label>
                <input
                  type="text"
                  name="customProductType"
                  required
                  className="input-field w-full"
                  value={formData.customProductType || ''}
                  onChange={handleInputChange}
                  placeholder="Type your product type"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm mb-1 font-medium">Description</label>
              <textarea name="description" className="input-field w-full h-24 resize-none" value={formData.description} onChange={handleInputChange} placeholder="Short description for SEO and category pages..." />
            </div>

            <div className="flex flex-col gap-3 justify-center md:col-span-2 flex-row md:flex-row">
              <label className="flex-1 flex items-center gap-3 cursor-pointer p-4 border border-glass-border rounded-xl hover:bg-surface-hover transition-colors">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-5 h-5 accent-primary" />
                <div className="flex flex-col">
                  <span className="font-bold text-success">Active Status</span>
                  <span className="text-xs text-text-muted">Visible to customers in the catalog.</span>
                </div>
              </label>
              
              <label className="flex-1 flex items-center gap-3 cursor-pointer p-4 border border-glass-border rounded-xl hover:bg-surface-hover transition-colors">
                <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleInputChange} className="w-5 h-5 accent-warning" />
                <div className="flex flex-col">
                  <span className="font-bold text-warning">Featured Category</span>
                  <span className="text-xs text-text-muted">Pin this category to the Homepage banner.</span>
                </div>
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-glass-border">
              <button
                type="button"
                onClick={resetFormState}
                className="btn bg-surface hover:bg-surface-hover border border-glass-border text-text"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                <Save size={18}/> {saving ? 'Saving...' : (editingId ? 'Update Category' : 'Save Category')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E1E3E5] shadow-sm overflow-hidden text-black">
        {/* Header section */}
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F6F6F7] flex items-center justify-center shrink-0 text-[#6D7175]">
              <Tag size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] text-[#6D7175] font-medium truncate">Total Categories Listed</div>
              <div className="text-[28px] md:text-[32px] font-bold text-[#202223] leading-tight truncate">
                {categories.length}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="px-4 py-2 rounded-full bg-[#ffd401] hover:bg-[#e0bb00] text-black font-semibold text-[13px] md:text-[14px] shadow-sm flex items-center gap-2"
            >
              {expanded ? 'Collapse' : 'Expand'} <span className="text-[16px] leading-none">{expanded ? '−' : '+'}</span>
            </button>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="px-4 py-2 rounded-full bg-[#ffd401] hover:bg-[#e0bb00] text-black font-semibold text-[13px] md:text-[14px] shadow-sm"
            >
              View All
            </button>
          </div>
        </div>

        {/* Divider + table */}
        <div className="border-t border-[#E1E3E5]">
          <div className={`${expanded ? 'max-h-[340px]' : 'max-h-[200px]'} overflow-y-auto`}>
            <ResponsiveTable minWidth="800px">
              <table className="w-full text-left border-collapse bg-white">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-[#6D7175] text-[12px] border-b border-[#E1E3E5] bg-white">
                    <th className="p-4 font-semibold uppercase tracking-wider">Category</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-center">Commission</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-center">Visibility</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-center">Featured</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-[#6D7175]">
                        <div className="flex flex-col items-center gap-4">
                          <Tag size={48} className="opacity-20"/>
                          <p>No categories found. Start building your catalog structure.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleCategories.map(cat => (
                      <tr key={cat._id} className="border-b border-[#F1F2F3] hover:bg-[#F6F6F7]/50 transition-colors group bg-white">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-[#202223]">{cat.name}</span>
                              {cat.parentCategory && (
                                <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
                                  Sub of {cat.parentCategory.name}
                                  {cat.subCategory && ` > ${cat.subCategory}`}
                                  {cat.productType && ` > ${cat.productType}`}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[#6D7175]">/{cat.slug}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="badge bg-primary/10 text-primary font-bold text-sm border border-primary/20">{cat.commissionRate}%</span>
                        </td>
                        <td className="p-4 text-center">
                          {cat.isActive 
                            ? <span className="badge bg-success/10 text-success border border-success/20">Active</span> 
                            : <span className="badge bg-error/10 text-error border border-error/20">Hidden</span>}
                        </td>
                        <td className="p-4 text-center">
                          {cat.isFeatured ? <span className="text-warning text-2xl drop-shadow-md">★</span> : <span className="text-[#E1E3E5] text-2xl group-hover:text-warning/30 transition-colors">☆</span>}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleEdit(cat)} className="p-2 bg-white hover:bg-primary hover:text-white rounded-lg transition-colors border border-[#E1E3E5] hover:border-primary shadow-sm text-black inline-flex items-center">
                            <Edit size={16}/>
                          </button>
                          <button onClick={() => handleDelete(cat._id)} className="p-2 bg-white hover:bg-error hover:text-white rounded-lg transition-colors border border-[#E1E3E5] hover:border-error shadow-sm text-black inline-flex items-center">
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ResponsiveTable>
          </div>
          <div className="px-6 py-2 text-[11px] text-[#6D7175] border-t border-[#E1E3E5] bg-white">
            Scroll for more option
          </div>
        </div>
      </div>

      {/* ── Homepage Layout Engine (below category list) ── */}
      <HomepageLayoutEngine />
    </div>
  );
};

export default AdminCategories;

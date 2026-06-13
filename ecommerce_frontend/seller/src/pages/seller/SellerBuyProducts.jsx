import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

// ─── Mock product data with Unsplash image URLs ───────────────────────────────
const PRODUCTS = [
  {
    id: 1,
    title: "NCERT Mathematics Textbook Grade 10",
    category: "Textbooks",
    minQty: 50,
    price: "₹180 / unit",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Spiral Ruled Notebook 200 Pages",
    category: "Stationery",
    minQty: 100,
    price: "₹65 / unit",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Geometry Box — Student Set",
    category: "Stationery",
    minQty: 50,
    price: "₹95 / unit",
    image: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    title: "Handwoven Cotton Kurta — School Uniform",
    category: "Uniforms",
    minQty: 200,
    price: "₹420 / unit",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    title: "A4 Printer Paper — 500 Sheet Ream",
    category: "Office Supplies",
    minQty: 100,
    price: "₹320 / ream",
    image: "https://images.unsplash.com/photo-1568667256549-094345857637?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Ballpoint Pen — Blue Ink (Pack of 10)",
    category: "Stationery",
    minQty: 500,
    price: "₹55 / pack",
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=400&fit=crop",
  },
  {
    id: 7,
    title: "English Dictionary — Oxford Illustrated",
    category: "Textbooks",
    minQty: 25,
    price: "₹350 / unit",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop",
  },
  {
    id: 8,
    title: "Whiteboard Marker Set — 4 Colours",
    category: "Classroom",
    minQty: 50,
    price: "₹120 / set",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];

const today = new Date().toISOString().split("T")[0];

function validate(form, minQty) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Required";
  if (!form.lastName.trim()) errors.lastName = "Required";
  if (!form.email.trim()) errors.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email";
  if (!form.phone.trim()) errors.phone = "Required";
  else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ""))) errors.phone = "Enter a valid 10-digit Indian mobile number";
  if (!form.quantity || parseInt(form.quantity) < minQty) errors.quantity = `Enter a valid quantity (min. ${minQty})`;
  if (!form.location.trim()) errors.location = "Required";
  if (!form.date) errors.date = "Required";
  return errors;
}

export default function SellerBuyProducts() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", quantity: "", location: "", date: "",
  });

  // Dynamic statistics state
  const [stats, setStats] = useState({
    productsCount: PRODUCTS.length,
    pendingRequests: 0,
    bulkSalesFormatted: "₹0",
  });

  const sellerName = user?.businessName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Seller Hub";
  const sellerInitials = sellerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "S";

  const fetchStats = async () => {
    try {
      const [inquiriesRes, dashboardRes] = await Promise.all([
        api.get("/seller/bulk-inquiries").catch(() => ({ data: { inquiries: [] } })),
        api.get("/seller/dashboard").catch(() => ({ data: { data: { totalProducts: PRODUCTS.length } } })),
      ]);

      const inquiries = inquiriesRes.data?.inquiries || [];
      const dashboardData = dashboardRes.data?.data || {};

      const pending = inquiries.filter((inq) => inq.status === "Negotiation Pending").length;
      const completedValue = inquiries
        .filter((inq) => inq.status === "Completed")
        .reduce((sum, inq) => sum + (inq.estimatedCost || 0), 0);

      let bulkSalesStr = "₹0";
      if (completedValue >= 100000) {
        bulkSalesStr = `₹${(completedValue / 100000).toFixed(1)}L`;
      } else {
        bulkSalesStr = `₹${completedValue.toLocaleString("en-IN")}`;
      }

      setStats({
        productsCount: dashboardData.totalProducts || PRODUCTS.length,
        pendingRequests: pending,
        bulkSalesFormatted: bulkSalesStr,
      });
    } catch (err) {
      console.error("Failed to fetch bulk order dashboard stats", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openModal = (product) => {
    setSelectedProduct(product);
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.mobile || "",
      quantity: String(product.minQty),
      location: "",
      date: "",
    });
    setErrors({});
    setSubmitted(false);
    setSubmitError("");
  };

  const closeModal = () => setSelectedProduct(null);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const errs = validate(form, selectedProduct.minQty);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        name: `${form.firstName} ${form.lastName}`.trim(),
        contactNumber: form.phone,
        email: form.email,
        quantityRequired: String(form.quantity),
        requestedDeliveryDate: form.date,
        buyerCity: form.location,
        sellerId: user?._id || user?.id,
        productTitle: selectedProduct.title,
        productPrice: selectedProduct.price,
        productImage: selectedProduct.image,
        productMinQty: selectedProduct.minQty,
      };

      await api.post(`/products/${selectedProduct.id}/bulk-inquiry`, payload);
      setSubmitted(true);
      fetchStats();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || "Failed to submit bulk order request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F0F2F8", minHeight: "100vh", borderRadius: "20px", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Header ── */
        .bo-header {
          background: linear-gradient(135deg, #0F0F1A 0%, #1A1464 100%);
          padding: 18px 32px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .bo-logo { display: flex; align-items: center; gap: 12px; }
        .bo-logo-mark {
          width: 36px; height: 36px; background: #F59E0B; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 18px; color: #0F0F1A;
        }
        .bo-logo-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 15px; color: #fff; }
        .bo-logo-sub { font-size: 11px; color: rgba(255,255,255,0.45); }
        .bo-seller-chip {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.07); border-radius: 8px; padding: 6px 12px;
        }
        .bo-seller-avatar {
          width: 26px; height: 26px; border-radius: 50%; background: #0EA5E9;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff;
        }
        .bo-seller-name { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.75); }

        /* ── Page body ── */
        .bo-page { max-width: 1080px; margin: 0 auto; padding: 32px 20px 60px; }

        /* ── Hero band ── */
        .bo-hero {
          background: linear-gradient(120deg, #0EA5E9 0%, #1A1464 100%);
          border-radius: 18px; padding: 28px 32px; margin-bottom: 28px;
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
          overflow: hidden; position: relative;
        }
        .bo-hero::after {
          content: ''; position: absolute; right: -40px; top: -40px;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .bo-hero-tag {
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.55);
          letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;
        }
        .bo-hero-title {
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 22px; color: #fff; line-height: 1.3;
        }
        .bo-hero-title span { color: #F59E0B; }
        .bo-hero-desc { font-size: 13px; color: rgba(255,255,255,0.65); margin-top: 8px; line-height: 1.6; max-width: 500px; }
        .bo-hero-stats { display: flex; gap: 28px; flex-shrink: 0; }
        .bo-stat { text-align: center; }
        .bo-stat-num { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 28px; color: #F59E0B; }
        .bo-stat-label { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }
        @media(max-width: 640px) { .bo-hero-stats { display: none; } .bo-hero { padding: 22px 20px; } }

        /* ── Controls ── */
        .bo-controls {
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
        }
        .bo-search {
          flex: 1; min-width: 200px;
          border: 1.5px solid #E2E8F0; border-radius: 10px;
          padding: 10px 16px 10px 40px;
          font-family: 'Inter', sans-serif; font-size: 14px; color: #1E293B;
          background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='M21 21l-4.35-4.35'/%3E%3C/svg%3E") no-repeat 14px center;
          outline: none; transition: border-color 0.15s;
        }
        .bo-search:focus { border-color: #1A1464; }
        .bo-cats { display: flex; gap: 6px; flex-wrap: wrap; }
        .bo-cat {
          padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; border: 1.5px solid #E2E8F0;
          background: #fff; color: #64748B; white-space: nowrap;
        }
        .bo-cat:hover { border-color: #1A1464; color: #1A1464; }
        .bo-cat.active { background: #1A1464; border-color: #1A1464; color: #fff; }

        /* ── Grid ── */
        .bo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }

        /* ── Product card ── */
        .bo-card {
          background: #fff; border-radius: 16px;
          border: 1px solid #E8EBF4;
          overflow: hidden;
          transition: transform 0.18s, box-shadow 0.18s;
          display: flex; flex-direction: column;
        }
        .bo-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(26,20,100,0.12); }

        .bo-card-img-wrap {
          position: relative; width: 100%; aspect-ratio: 1/1; overflow: hidden;
        }
        .bo-card-img {
          width: 100%; height: 100%; object-fit: cover;
          display: block; transition: transform 0.3s;
        }
        .bo-card:hover .bo-card-img { transform: scale(1.04); }
        .bo-card-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 32px 14px 12px;
          background: linear-gradient(to top, rgba(15,15,26,0.82) 0%, transparent 100%);
        }
        .bo-card-category {
          display: inline-block; background: rgba(14,165,233,0.85);
          color: #fff; font-size: 10px; font-weight: 700;
          letter-spacing: 0.8px; text-transform: uppercase;
          padding: 3px 8px; border-radius: 4px; margin-bottom: 4px;
        }
        .bo-card-img-title {
          font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 600;
          color: #fff; line-height: 1.35;
        }
        .bo-card-footer {
          padding: 12px 14px 14px;
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
        }
        .bo-card-meta { flex: 1; }
        .bo-card-price { font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; color: #1A1464; }
        .bo-card-minqty { font-size: 11px; color: #94A3B8; margin-top: 1px; }
        .bo-btn-bulk {
          padding: 8px 14px;
          background: linear-gradient(135deg, #F59E0B, #F97316);
          border: none; border-radius: 9px;
          font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 700;
          color: #fff; cursor: pointer; white-space: nowrap;
          transition: opacity 0.15s, transform 0.1s;
        }
        .bo-btn-bulk:hover { opacity: 0.9; transform: scale(1.03); }

        /* ── Empty state ── */
        .bo-empty { text-align: center; padding: 64px 20px; color: #94A3B8; grid-column: 1/-1; }
        .bo-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .bo-empty-title { font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 16px; color: #64748B; margin-bottom: 4px; }

        /* ── Modal backdrop ── */
        .bo-backdrop {
          position: fixed; inset: 0; background: rgba(15,15,26,0.6);
          z-index: 100; display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadeIn 0.18s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* ── Modal panel ── */
        .bo-modal {
          background: #fff; border-radius: 20px;
          width: 100%; max-width: 560px; max-height: 92vh;
          overflow-y: auto; position: relative;
          animation: slideUp 0.22s ease;
          scrollbar-width: thin;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

        .bo-modal-product-banner {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 20px; border-bottom: 1px solid #F1F5F9;
          position: sticky; top: 0; background: #fff; z-index: 2;
        }
        .bo-modal-product-img {
          width: 54px; height: 54px; border-radius: 10px;
          object-fit: cover; flex-shrink: 0;
          border: 1.5px solid #E2E8F0;
        }
        .bo-modal-product-title { font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 14px; color: #1E293B; line-height: 1.3; }
        .bo-modal-product-sub { font-size: 12px; color: #64748B; margin-top: 3px; }
        .bo-modal-close {
          margin-left: auto; width: 32px; height: 32px; border-radius: 8px;
          background: #F1F5F9; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #64748B; font-size: 16px; flex-shrink: 0;
          transition: background 0.15s;
        }
        .bo-modal-close:hover { background: #E2E8F0; }

        .bo-modal-body { padding: 22px 24px 28px; }
        .bo-modal-heading { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; color: #1A1464; margin-bottom: 4px; }
        .bo-modal-sub { font-size: 12px; color: #94A3B8; margin-bottom: 22px; }

        .bo-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        @media(max-width: 480px) { .bo-form-row { grid-template-columns: 1fr; } }
        .bo-form-field { margin-bottom: 14px; }
        .bo-field-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 5px; }
        .bo-field-label span { color: #EF4444; margin-left: 2px; }
        .bo-field-input {
          width: 100%; border: 1.5px solid #E2E8F0; border-radius: 10px;
          padding: 10px 13px; font-family: 'Inter', sans-serif; font-size: 14px; color: #1E293B;
          background: #fff; outline: none; transition: border-color 0.15s;
        }
        .bo-field-input:focus { border-color: #1A1464; }
        .bo-field-input.err { border-color: #EF4444; }
        .bo-field-error { font-size: 11px; color: #EF4444; margin-top: 4px; }

        .bo-submit {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #F59E0B, #F97316);
          border: none; border-radius: 12px;
          font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 700;
          color: #fff; cursor: pointer; margin-top: 6px;
          transition: opacity 0.15s, transform 0.1s;
        }
        .bo-submit:hover { opacity: 0.92; transform: translateY(-1px); }
        .bo-submit:active { transform: translateY(0); }
        .bo-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Success state ── */
        .bo-success { text-align: center; padding: 40px 24px; }
        .bo-success-icon { font-size: 56px; margin-bottom: 16px; }
        .bo-success-title { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 20px; color: #1A1464; margin-bottom: 8px; }
        .bo-success-desc { font-size: 14px; color: #64748B; line-height: 1.6; max-width: 340px; margin: 0 auto 24px; }
        .bo-success-detail {
          display: inline-flex; flex-direction: column; gap: 6px;
          background: #F0F2F8; border-radius: 12px; padding: 14px 20px;
          text-align: left; margin-bottom: 24px; min-width: 260px;
        }
        .bo-success-detail-row { display: flex; justify-content: space-between; gap: 20px; font-size: 12px; }
        .bo-success-detail-key { color: #94A3B8; }
        .bo-success-detail-val { font-weight: 600; color: #1E293B; }
        .bo-success-close {
          padding: 12px 32px; background: #1A1464; border: none; border-radius: 10px;
          font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 14px;
          color: #fff; cursor: pointer; transition: opacity 0.15s;
        }
        .bo-success-close:hover { opacity: 0.88; }
      `}</style>

      {/* ── Header ── */}
      <header className="bo-header">
        <div className="bo-logo">
          <div className="bo-logo-mark">A</div>
          <div>
            <div className="bo-logo-name">Aashansh</div>
            <div className="bo-logo-sub">Seller Dashboard</div>
          </div>
        </div>
        <div className="bo-seller-chip">
          <div className="bo-seller-avatar">{sellerInitials}</div>
          <div className="bo-seller-name">{sellerName}</div>
        </div>
      </header>

      {/* ── Page ── */}
      <div className="bo-page">

        {/* Hero band */}
        <div className="bo-hero">
          <div>
            <div className="bo-hero-tag">Seller Feature</div>
            <div className="bo-hero-title">Bulk Orders<br /><span>for Institutions & Organisations</span></div>
            <div className="bo-hero-desc">
              Schools, offices, and NGOs can request your products in bulk directly from this page.
              Every request lands in your inbox with full buyer details — you confirm, negotiate, and fulfil.
            </div>
          </div>
          <div className="bo-hero-stats">
            <div className="bo-stat">
              <div className="bo-stat-num">{stats.productsCount}</div>
              <div className="bo-stat-label">Products listed</div>
            </div>
            <div className="bo-stat">
              <div className="bo-stat-num">{stats.pendingRequests}</div>
              <div className="bo-stat-label">Pending requests</div>
            </div>
            <div className="bo-stat">
              <div className="bo-stat-num">{stats.bulkSalesFormatted}</div>
              <div className="bo-stat-label">Bulk sales</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bo-controls">
          <input
            className="bo-search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="bo-cats">
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`bo-cat ${activeCategory === cat ? "active" : ""}`} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="bo-grid">
          {filtered.length === 0 && (
            <div className="bo-empty">
              <div className="bo-empty-icon">🔍</div>
              <div className="bo-empty-title">No products found</div>
              <div>Try a different search or category</div>
            </div>
          )}
          {filtered.map((product) => (
            <div className="bo-card" key={product.id}>
              <div className="bo-card-img-wrap">
                <img className="bo-card-img" src={product.image} alt={product.title} loading="lazy" />
                <div className="bo-card-overlay">
                  <div className="bo-card-category">{product.category}</div>
                  <div className="bo-card-img-title">{product.title}</div>
                </div>
              </div>
              <div className="bo-card-footer">
                <div className="bo-card-meta">
                  <div className="bo-card-price">{product.price}</div>
                  <div className="bo-card-minqty">Min. {product.minQty} units</div>
                </div>
                <button className="bo-btn-bulk" onClick={() => openModal(product)}>
                  Request Bulk
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal ── */}
      {selectedProduct && (
        <div className="bo-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bo-modal">
            {/* Sticky product reminder */}
            <div className="bo-modal-product-banner">
              <img className="bo-modal-product-img" src={selectedProduct.image} alt={selectedProduct.title} />
              <div>
                <div className="bo-modal-product-title">{selectedProduct.title}</div>
                <div className="bo-modal-product-sub">{selectedProduct.price} · Min. {selectedProduct.minQty} units</div>
              </div>
              <button className="bo-modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            {!submitted ? (
              <div className="bo-modal-body">
                <div className="bo-modal-heading">Bulk Order Request</div>
                <div className="bo-modal-sub">Fill in your details and the seller will get back to you within 24 hours.</div>

                {submitError && (
                  <div style={{ padding: "10px 14px", background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "10px", color: "#B91C1C", fontSize: "13px", marginBottom: "14px", fontWeight: 500 }}>
                    {submitError}
                  </div>
                )}

                <div className="bo-form-row">
                  <div>
                    <label className="bo-field-label">First Name<span>*</span></label>
                    <input className={`bo-field-input ${errors.firstName ? "err" : ""}`} placeholder="Priya" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
                    {errors.firstName && <div className="bo-field-error">{errors.firstName}</div>}
                  </div>
                  <div>
                    <label className="bo-field-label">Last Name<span>*</span></label>
                    <input className={`bo-field-input ${errors.lastName ? "err" : ""}`} placeholder="Sharma" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
                    {errors.lastName && <div className="bo-field-error">{errors.lastName}</div>}
                  </div>
                </div>

                <div className="bo-form-row">
                  <div>
                    <label className="bo-field-label">Email Address<span>*</span></label>
                    <input className={`bo-field-input ${errors.email ? "err" : ""}`} type="email" placeholder="priya@school.edu.in" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
                    {errors.email && <div className="bo-field-error">{errors.email}</div>}
                  </div>
                  <div>
                    <label className="bo-field-label">Contact Number<span>*</span></label>
                    <input className={`bo-field-input ${errors.phone ? "err" : ""}`} type="tel" placeholder="98765 43210" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} maxLength={10} />
                    {errors.phone && <div className="bo-field-error">{errors.phone}</div>}
                  </div>
                </div>

                <div className="bo-form-row">
                  <div>
                    <label className="bo-field-label">Quantity Required<span>*</span></label>
                    <input className={`bo-field-input ${errors.quantity ? "err" : ""}`} type="number" placeholder={`Min. ${selectedProduct.minQty}`} min={selectedProduct.minQty} value={form.quantity} onChange={(e) => handleChange("quantity", e.target.value)} />
                    {errors.quantity && <div className="bo-field-error">{errors.quantity}</div>}
                  </div>
                  <div>
                    <label className="bo-field-label">Delivery Needed By<span>*</span></label>
                    <input className={`bo-field-input ${errors.date ? "err" : ""}`} type="date" min={today} value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
                    {errors.date && <div className="bo-field-error">{errors.date}</div>}
                  </div>
                </div>

                <div className="bo-form-field">
                  <label className="bo-field-label">Delivery Location<span>*</span></label>
                  <input className={`bo-field-input ${errors.location ? "err" : ""}`} placeholder="e.g. DPS School, Sector 12, Noida, UP — 201301" value={form.location} onChange={(e) => handleChange("location", e.target.value)} />
                  {errors.location && <div className="bo-field-error">{errors.location}</div>}
                </div>

                <button className="bo-submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Sending..." : "Send Bulk Request →"}
                </button>
              </div>
            ) : (
              <div className="bo-success">
                <div className="bo-success-icon">📦</div>
                <div className="bo-success-title">Request Sent!</div>
                <div className="bo-success-desc">
                  Your bulk order request has been sent to the seller. They'll review it and reach out to you at <strong>{form.email}</strong> within 24 hours.
                </div>
                <div className="bo-success-detail">
                  <div className="bo-success-detail-row">
                    <span className="bo-success-detail-key">Product</span>
                    <span className="bo-success-detail-val" style={{ maxWidth: 180, textAlign: "right", fontSize: 11 }}>{selectedProduct.title}</span>
                  </div>
                  <div className="bo-success-detail-row">
                    <span className="bo-success-detail-key">Quantity</span>
                    <span className="bo-success-detail-val">{parseInt(form.quantity).toLocaleString("en-IN")} units</span>
                  </div>
                  <div className="bo-success-detail-row">
                    <span className="bo-success-detail-key">Needed by</span>
                    <span className="bo-success-detail-val">{new Date(form.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="bo-success-detail-row">
                    <span className="bo-success-detail-key">Location</span>
                    <span className="bo-success-detail-val" style={{ maxWidth: 180, textAlign: "right", fontSize: 11 }}>{form.location}</span>
                  </div>
                </div>
                <button className="bo-success-close" onClick={closeModal}>Back to Products</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

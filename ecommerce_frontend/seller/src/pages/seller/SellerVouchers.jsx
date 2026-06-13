import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { Tag, Trash2, Loader2, AlertCircle, Calendar, Sparkles, Plus, Info } from "lucide-react";

function generateCode(prefix) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = prefix ? prefix.toUpperCase().replace(/\s+/g, "") + "-" : "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const today = new Date().toISOString().split("T")[0];
const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

export default function SellerVouchers() {
  const { user } = useAuth();
  
  // Products and Vouchers Lists
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingVouchers, setLoadingVouchers] = useState(true);

  // Form State
  const [scope, setScope] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [expiry, setExpiry] = useState(defaultExpiry);
  const [minOrder, setMinOrder] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  // Action states
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Find product object from state
  const selectedProductObj = products.find((p) => p._id === selectedProduct);

  // Load products & vouchers on mount
  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/seller/products");
      // filter out drafts if needed, but standard listed products are good
      const activeProducts = data.filter(p => !p.isDraft);
      setProducts(activeProducts);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchVouchers = async () => {
    try {
      const { data } = await api.get("/seller/vouchers");
      setVouchers(data.vouchers || []);
    } catch (err) {
      console.error("Error loading vouchers:", err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchVouchers();
  }, []);

  const previewDiscount = () => {
    const val = parseFloat(discountValue);
    if (!val) return null;
    if (discountType === "percent") return `${val}% OFF`;
    return `₹${val} OFF`;
  };

  const previewSubtitle = () => {
    if (scope === "specific" && selectedProductObj) return `On: ${selectedProductObj.title}`;
    if (scope === "all") return "On all products";
    return "Select a product";
  };

  const previewSavings = () => {
    const val = parseFloat(discountValue);
    if (!val || !selectedProductObj || scope !== "specific") return null;
    if (discountType === "percent") return `Save ₹${Math.round((selectedProductObj.price * val) / 100)}`;
    return `Save ₹${val}`;
  };

  const validate = () => {
    const e = {};
    if (!voucherCode.trim()) e.voucherCode = "Voucher code is required";
    if (!discountValue || parseFloat(discountValue) <= 0) e.discountValue = "Enter a valid discount amount";
    if (discountType === "percent" && parseFloat(discountValue) > 100) e.discountValue = "Percentage cannot exceed 100";
    if (scope === "specific" && !selectedProduct) e.selectedProduct = "Please select a product";
    if (!expiry) e.expiry = "Expiry date is required";
    if (new Date(expiry) < new Date(new Date().setHours(0, 0, 0, 0))) e.expiry = "Expiry date cannot be in the past";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setCreating(true);

    try {
      await api.post("/seller/vouchers", {
        scope,
        productId: scope === "specific" ? selectedProduct : null,
        voucherCode,
        discountType,
        discountValue,
        minOrder,
        usageLimit,
        expiry,
        description
      });

      setSaved(true);
      // Reset form
      setScope("all");
      setSelectedProduct("");
      setDiscountType("percent");
      setDiscountValue("");
      setVoucherCode("");
      setExpiry(defaultExpiry);
      setMinOrder("");
      setUsageLimit("");
      setDescription("");

      // Reload vouchers list
      fetchVouchers();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Create voucher error:", err);
      setErrors({ apiError: err.response?.data?.message || "Failed to create voucher. Please check inputs." });
    } finally {
      setCreating(false);
    }
  };

  const handleAutoGenerate = () => {
    const prefix = scope === "specific" && selectedProductObj 
      ? selectedProductObj.title.split(" ")[0] 
      : "AASH";
    setVoucherCode(generateCode(prefix));
    setErrors((p) => ({ ...p, voucherCode: undefined }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this voucher?")) return;
    setDeleteId(id);
    try {
      await api.delete(`/seller/vouchers/${id}`);
      fetchVouchers();
    } catch (err) {
      console.error("Delete voucher error:", err);
      alert(err.response?.data?.message || "Failed to delete voucher");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F0F2F8", minHeight: "100vh", borderRadius: "16px", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .page-header {
          background: linear-gradient(135deg, #1A1464 0%, #2D2299 100%);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-mark {
          width: 40px; height: 40px;
          background: #F59E0B;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 800; font-size: 20px;
          color: #1A1464;
        }
        .header-text h1 {
          font-family: 'Poppins', sans-serif;
          font-size: 18px; font-weight: 700;
          color: #fff; line-height: 1.2;
        }
        .header-text p { font-size: 13px; color: rgba(255,255,255,0.65); margin-top: 2px; }

        .page-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 24px;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 800px) {
          .page-body { grid-template-columns: 1fr; }
          .preview-col { order: -1; }
        }

        .card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }
        .card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid #F1F5F9;
        }
        .card-header h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 16px; font-weight: 600;
          color: #1A1464;
        }
        .card-header p { font-size: 13px; color: #64748B; margin-top: 3px; }
        .card-body { padding: 24px; }

        .scope-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 24px;
        }
        .scope-btn {
          border: 2px solid #E2E8F0;
          background: #fff;
          border-radius: 12px;
          padding: 14px 16px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }
        .scope-btn.active {
          border-color: #1A1464;
          background: #F0F1FF;
        }
        .scope-btn .scope-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          margin-bottom: 8px;
          background: #F1F5F9;
        }
        .scope-btn.active .scope-icon { background: #1A1464; }
        .scope-btn .scope-label {
          font-family: 'Poppins', sans-serif;
          font-size: 13px; font-weight: 600;
          color: #1E293B;
        }
        .scope-btn .scope-desc { font-size: 12px; color: #64748B; margin-top: 2px; }

        .field-group { margin-bottom: 20px; }
        .field-label {
          display: block;
          font-size: 13px; font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }
        .field-label span { color: #EF4444; margin-left: 2px; }
        .field-hint { font-size: 12px; color: #94A3B8; font-weight: 400; margin-left: 4px; }

        .input-base {
          width: 100%;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #1E293B;
          background: #fff;
          transition: border-color 0.15s;
          outline: none;
        }
        .input-base:focus { border-color: #1A1464; }
        .input-base.error { border-color: #EF4444; }
        .error-msg { font-size: 12px; color: #EF4444; margin-top: 5px; }

        .code-row { display: flex; gap: 8px; }
        .code-row .input-base { font-family: 'Poppins', sans-serif; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; flex: 1; }
        .gen-btn {
          padding: 10px 14px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          background: #F8F9FB;
          color: #475569;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .gen-btn:hover { background: #1A1464; color: #fff; border-color: #1A1464; }

        .discount-row { display: flex; gap: 8px; }
        .type-select {
          width: 140px;
          flex-shrink: 0;
        }
        select.input-base { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 500px) { .two-col { grid-template-columns: 1fr; } }

        .save-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #F59E0B, #F97316);
          border: none;
          border-radius: 12px;
          font-family: 'Poppins', sans-serif;
          font-size: 15px; font-weight: 700;
          color: #fff;
          cursor: pointer;
          margin-top: 8px;
          transition: opacity 0.15s, transform 0.1s;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .save-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .save-btn:active { transform: translateY(0); }
        .save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .success-toast {
          display: flex; align-items: center; gap: 10px;
          background: #ECFDF5;
          border: 1.5px solid #6EE7B7;
          border-radius: 10px;
          padding: 12px 16px;
          margin-top: 12px;
          font-size: 13px; font-weight: 500;
          color: #065F46;
        }

        /* Preview card */
        .preview-sticky { position: sticky; top: 24px; }
        .preview-label {
          font-family: 'Poppins', sans-serif;
          font-size: 13px; font-weight: 600;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .voucher-card {
          background: linear-gradient(135deg, #1A1464 0%, #312E8A 60%, #4338CA 100%);
          border-radius: 20px;
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
          min-height: 180px;
        }
        .voucher-card::before {
          content: '';
          position: absolute;
          right: -30px; top: -30px;
          width: 140px; height: 140px;
          border-radius: 50%;
          background: rgba(245,158,11,0.15);
        }
        .voucher-card::after {
          content: '';
          position: absolute;
          right: 20px; bottom: -40px;
          width: 100px; height: 100px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }
        .vc-brand {
          font-family: 'Poppins', sans-serif;
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.6);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .vc-discount {
          font-family: 'Poppins', sans-serif;
          font-size: 38px; font-weight: 800;
          color: #F59E0B;
          line-height: 1;
          margin-bottom: 4px;
        }
        .vc-discount.placeholder { color: rgba(245,158,11,0.3); font-size: 28px; }
        .vc-subtitle {
          font-size: 13px; color: rgba(255,255,255,0.75);
          margin-bottom: 4px;
          font-weight: 500;
        }
        .vc-savings {
          font-size: 12px; color: #6EE7B7;
          font-weight: 600;
        }

        .vc-divider {
          display: flex; align-items: center; margin: 18px 0;
        }
        .vc-divider::before, .vc-divider::after {
          content: ''; flex: 1;
          border-top: 1px dashed rgba(255,255,255,0.2);
        }
        .vc-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #F0F2F8;
          margin: 0 -5px;
          flex-shrink: 0;
        }
        .vc-dot-left { position: absolute; left: -5px; top: 50%; transform: translateY(-50%) translateY(18px); width: 20px; height: 20px; background: #F0F2F8; border-radius: 50%; }
        .vc-dot-right { position: absolute; right: -5px; top: 50%; transform: translateY(-50%) translateY(18px); width: 20px; height: 20px; background: #F0F2F8; border-radius: 50%; }

        .vc-code-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .vc-code {
          font-family: 'Poppins', sans-serif;
          font-size: 18px; font-weight: 700;
          color: #fff;
          letter-spacing: 3px;
        }
        .vc-code.placeholder { color: rgba(255,255,255,0.25); font-size: 14px; letter-spacing: 1px; }
        .vc-expiry {
          font-size: 11px; color: rgba(255,255,255,0.5);
          text-align: right;
        }
        .vc-expiry span { display: block; color: rgba(255,255,255,0.75); font-weight: 600; }

        .details-list { margin-top: 20px; }
        .detail-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #F1F5F9;
          font-size: 13px;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-key { color: #64748B; }
        .detail-val { font-weight: 600; color: #1E293B; }
        .badge {
          display: inline-flex; align-items: center;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px; font-weight: 600;
        }
        .badge-blue { background: #EFF6FF; color: #1D4ED8; }
        .badge-amber { background: #FFFBEB; color: #B45309; }

        /* Vouchers management section */
        .management-section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px 32px;
        }
        .vouchers-table {
          width: 100%;
          border-collapse: collapse;
        }
        .vouchers-table th, .vouchers-table td {
          padding: 14px 18px;
          text-align: left;
          border-bottom: 1px solid #F1F5F9;
        }
        .vouchers-table th {
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 13px;
          color: #475569;
          background: #F8FAFC;
        }
        .vouchers-table td {
          font-size: 13px;
          color: #334155;
          vertical-align: middle;
        }
        .vouchers-table tr:hover td {
          background: #FAFBFC;
        }
        .v-code {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          color: #1A1464;
          letter-spacing: 0.5px;
        }
        .v-badge {
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }
        .v-badge-active { background: #DCFCE7; color: #15803D; }
        .v-badge-expired { background: #FEE2E2; color: #B91C1C; }
        .btn-delete {
          padding: 6px;
          background: transparent;
          border: none;
          color: #EF4444;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-delete:hover {
          background: #FEF2F2;
          color: #B91C1C;
        }
        .btn-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .empty-vouchers {
          padding: 40px;
          text-align: center;
          color: #64748B;
        }
      `}</style>

      {/* Header */}
      <header className="page-header">
        <div className="logo-mark">A</div>
        <div className="header-text">
          <h1>Aashansh — Seller Dashboard</h1>
          <p>Create & manage discount vouchers for your customers</p>
        </div>
      </header>

      <div className="page-body">
        {/* Form Column */}
        <div className="form-col">
          {/* Scope */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2>Voucher Scope</h2>
              <p>Should this discount apply to one product or everything in your store?</p>
            </div>
            <div className="card-body">
              <div className="scope-toggle">
                <button 
                  type="button" 
                  className={`scope-btn ${scope === "all" ? "active" : ""}`} 
                  onClick={() => { setScope("all"); setSelectedProduct(""); }}
                >
                  <div className="scope-icon">🏪</div>
                  <div className="scope-label">All Products</div>
                  <div className="scope-desc">Works across your entire catalogue</div>
                </button>
                <button 
                  type="button" 
                  className={`scope-btn ${scope === "specific" ? "active" : ""}`} 
                  onClick={() => setScope("specific")}
                >
                  <div className="scope-icon">📦</div>
                  <div className="scope-label">Specific Product</div>
                  <div className="scope-desc">Target a single item only</div>
                </button>
              </div>

              {scope === "specific" && (
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">Select Product <span>*</span></label>
                  {loadingProducts ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748B" }}>
                      <Loader2 size={16} className="animate-spin text-primary" />
                      Loading products...
                    </div>
                  ) : products.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "#EF4444" }}>
                      No active products found. Please list products first.
                    </div>
                  ) : (
                    <select
                      className={`input-base ${errors.selectedProduct ? "error" : ""}`}
                      value={selectedProduct}
                      onChange={(e) => { setSelectedProduct(e.target.value); setErrors((p) => ({ ...p, selectedProduct: undefined })); }}
                    >
                      <option value="">— Choose a product —</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>{p.title} (₹{p.price})</option>
                      ))}
                    </select>
                  )}
                  {errors.selectedProduct && <div className="error-msg">{errors.selectedProduct}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Discount Details */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2>Discount Details</h2>
              <p>Set the voucher code, discount amount, and validity</p>
            </div>
            <div className="card-body">
              <div className="field-group">
                <label className="field-label">Voucher Code <span>*</span></label>
                <div className="code-row">
                  <input
                    className={`input-base ${errors.voucherCode ? "error" : ""}`}
                    placeholder="e.g. DIWALI50"
                    value={voucherCode}
                    onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setErrors((p) => ({ ...p, voucherCode: undefined })); }}
                    maxLength={20}
                  />
                  <button type="button" className="gen-btn" onClick={handleAutoGenerate}>
                    Auto-generate
                  </button>
                </div>
                {errors.voucherCode && <div className="error-msg">{errors.voucherCode}</div>}
              </div>

              <div className="field-group">
                <label className="field-label">Discount Amount <span>*</span></label>
                <div className="discount-row">
                  <select className="input-base type-select" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                  <input
                    className={`input-base ${errors.discountValue ? "error" : ""}`}
                    type="number"
                    placeholder={discountType === "percent" ? "e.g. 20" : "e.g. 100"}
                    value={discountValue}
                    min={0}
                    max={discountType === "percent" ? 100 : undefined}
                    onChange={(e) => { setDiscountValue(e.target.value); setErrors((p) => ({ ...p, discountValue: undefined })); }}
                  />
                </div>
                {errors.discountValue && <div className="error-msg">{errors.discountValue}</div>}
              </div>

              <div className="two-col">
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">
                    Minimum Order <span className="field-hint">(optional)</span>
                  </label>
                  <input
                    className="input-base"
                    type="number"
                    placeholder="e.g. ₹500"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                  />
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">
                    Usage Limit <span className="field-hint">(optional)</span>
                  </label>
                  <input
                    className="input-base"
                    type="number"
                    placeholder="e.g. 100 uses"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Validity & Notes */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2>Validity & Notes</h2>
            </div>
            <div className="card-body">
              <div className="field-group">
                <label className="field-label">Expiry Date <span>*</span></label>
                <input
                  className={`input-base ${errors.expiry ? "error" : ""}`}
                  type="date"
                  value={expiry}
                  min={today}
                  onChange={(e) => { setExpiry(e.target.value); setErrors((p) => ({ ...p, expiry: undefined })); }}
                />
                {errors.expiry && <div className="error-msg">{errors.expiry}</div>}
              </div>

              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label">
                  Internal Note <span className="field-hint">(optional)</span>
                </label>
                <textarea
                  className="input-base"
                  rows={3}
                  placeholder="e.g. Diwali campaign — share with WhatsApp group customers"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          </div>

          {/* API Error Notification */}
          {errors.apiError && (
            <div className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{errors.apiError}</div>
            </div>
          )}

          {/* Save */}
          <button 
            type="button" 
            className="save-btn" 
            onClick={handleSave} 
            disabled={creating}
          >
            {creating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Creating Voucher...
              </>
            ) : (
              <>
                Create Voucher →
              </>
            )}
          </button>

          {saved && (
            <div className="success-toast">
              <span style={{ fontSize: 18 }}>✅</span>
              Voucher created successfully! Your customers can now use it at checkout.
            </div>
          )}
        </div>

        {/* Preview Column */}
        <div className="preview-col">
          <div className="preview-sticky">
            <div className="preview-label">Live Preview</div>

            {/* Voucher Visual */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <div className="vc-dot-left" />
              <div className="vc-dot-right" />
              <div className="voucher-card">
                <div className="vc-brand">Aashansh Voucher</div>
                <div className={`vc-discount ${!discountValue ? "placeholder" : ""}`}>
                  {previewDiscount() || "? OFF"}
                </div>
                <div className="vc-subtitle">{previewSubtitle()}</div>
                {previewSavings() && <div className="vc-savings">{previewSavings()}</div>}

                <div className="vc-divider">
                  <div className="vc-dot" />
                </div>

                <div className="vc-code-row">
                  <div className={`vc-code ${!voucherCode ? "placeholder" : ""}`}>
                    {voucherCode || "YOUR-CODE"}
                  </div>
                  <div className="vc-expiry">
                    Valid until<span>{expiry ? new Date(expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="card">
              <div className="card-body" style={{ padding: "16px 20px" }}>
                <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1464", marginBottom: 4 }}>Summary</div>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-key">Scope</span>
                    <span className="badge badge-blue">{scope === "all" ? "All Products" : "Specific Product"}</span>
                  </div>
                  {scope === "specific" && (
                    <div className="detail-row">
                      <span className="detail-key">Product</span>
                      <span className="detail-val" style={{ maxWidth: 160, textAlign: "right", fontSize: 12 }}>
                        {selectedProductObj?.title || "—"}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-key">Discount</span>
                    <span className="badge badge-amber">
                      {discountValue ? (discountType === "percent" ? `${discountValue}%` : `₹${discountValue}`) : "—"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Min. Order</span>
                    <span className="detail-val">{minOrder ? `₹${minOrder}` : "No minimum"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Usage Limit</span>
                    <span className="detail-val">{usageLimit ? `${usageLimit} uses` : "Unlimited"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Expires</span>
                    <span className="detail-val">
                      {expiry ? new Date(expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vouchers List Section */}
      <div className="management-section">
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>Active Vouchers</h2>
              <p>View and manage your active promotional codes</p>
            </div>
            <span style={{ fontSize: "12px", background: "#EFF6FF", color: "#1D4ED8", padding: "4px 8px", borderRadius: "20px", fontWeight: "600" }}>
              Total: {vouchers.length}
            </span>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
            {loadingVouchers ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px", gap: "10px", color: "#64748B" }}>
                <Loader2 className="animate-spin text-primary" size={24} />
                <span>Loading active vouchers...</span>
              </div>
            ) : vouchers.length === 0 ? (
              <div className="empty-vouchers">
                <Tag style={{ margin: "0 auto 12px", color: "#94A3B8" }} size={36} />
                <p style={{ fontWeight: 600, fontSize: "14px" }}>No vouchers created yet</p>
                <p style={{ fontSize: "12px", marginTop: "4px" }}>Create your first discount coupon above to share with customers.</p>
              </div>
            ) : (
              <table className="vouchers-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Scope</th>
                    <th>Min. Order</th>
                    <th>Limit</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => {
                    const isExpired = new Date(v.expiry) < new Date();
                    return (
                      <tr key={v._id}>
                        <td>
                          <span className="v-code">{v.voucherCode}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#0F172A" }}>
                            {v.discountType === "percent" ? `${v.discountValue}%` : `₹${v.discountValue}`}
                          </span>
                        </td>
                        <td>
                          {v.scope === "all" ? (
                            <span style={{ color: "#64748B" }}>All Catalogue</span>
                          ) : (
                            <span style={{ fontWeight: 500, display: "block", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v.productId?.title || "Specific Item"}>
                              {v.productId?.title || "Specific Item"}
                            </span>
                          )}
                        </td>
                        <td>{v.minOrder > 0 ? `₹${v.minOrder}` : "—"}</td>
                        <td>{v.usageLimit ? `${v.usedCount} / ${v.usageLimit}` : `${v.usedCount} / ∞`}</td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Calendar size={13} className="text-text-muted" />
                            {new Date(v.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </td>
                        <td>
                          {isExpired ? (
                            <span className="v-badge v-badge-expired">Expired</span>
                          ) : (
                            <span className="v-badge v-badge-active">Active</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => handleDelete(v._id)}
                            disabled={deleteId === v._id}
                            title="Delete Voucher"
                          >
                            {deleteId === v._id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

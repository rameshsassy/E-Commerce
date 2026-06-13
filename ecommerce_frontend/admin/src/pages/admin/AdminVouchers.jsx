import React, { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Trash2, Calendar, AlertCircle, CheckCircle, XCircle, ArrowLeft, Search, RefreshCw } from "lucide-react";
import api from "../../utils/api";

// ─── Inline Badge Component ───
function Badge({ children, color = "#1D4ED8", bg = "#EFF6FF" }) {
  return (
    <span
      className="badge font-semibold text-xs whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-full"
      style={{
        color,
        backgroundColor: bg,
      }}
    >
      {children}
    </span>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PLANS = [
  { id: "free", name: "Free", price: 0, label: "₹0 / year", color: "#64748B" },
  { id: "pro", name: "Pro", price: 4999, label: "₹4,999 / year", color: "#2563EB" },
  { id: "premium", name: "Premium", price: 11999, label: "₹11,999 / year", color: "#7C3AED" },
];

const VOUCHER_TYPES = [
  {
    id: "seller_subscription",
    label: "Seller Subscription Discount",
    audience: "Seller",
    audienceColor: "#2563EB",
    icon: "🏷️",
    desc: "Discount on annual subscription plans (Free, Pro, Premium)",
    accent: "rgba(37, 99, 235, 0.1)",
    border: "rgba(37, 99, 235, 0.3)",
  },
  {
    id: "customer_all",
    label: "Customer — All Products",
    audience: "Customer",
    audienceColor: "#059669",
    icon: "🛍️",
    desc: "Universal discount applicable across the entire Aashansh catalogue",
    accent: "rgba(5, 150, 105, 0.1)",
    border: "rgba(5, 150, 105, 0.3)",
  },
  {
    id: "customer_specific",
    label: "Customer — Specific Products",
    audience: "Customer",
    audienceColor: "#059669",
    icon: "📦",
    desc: "Discount on a handpicked set of products from the catalogue",
    accent: "rgba(5, 150, 105, 0.1)",
    border: "rgba(5, 150, 105, 0.3)",
  },
  {
    id: "seller_products",
    label: "Customer — Seller's Products",
    audience: "Customer",
    audienceColor: "#059669",
    icon: "🏪",
    desc: "Discount on single, multiple, or all products of one or more sellers",
    accent: "rgba(249, 115, 22, 0.1)",
    border: "rgba(249, 115, 22, 0.3)",
  },
];

const today = new Date().toISOString().split("T")[0];
const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

function generateCode(prefix = "AASH") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) + "-";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldGroup({ label, required, hint, error, children }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-text mb-2">
        {label}
        {required && <span className="text-error ml-1">*</span>}
        {hint && <span className="text-text-muted font-normal ml-2 text-xs">({hint})</span>}
      </label>
      {children}
      {error && <div className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle size={12}/>{error}</div>}
    </div>
  );
}

function CheckboxChip({ label, checked, onChange, sublabel }) {
  return (
    <div
      onClick={onChange}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all user-select-none ${
        checked
          ? "border-primary bg-primary/10 shadow-glow"
          : "border-glass-border bg-surface hover:bg-surface-hover"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
          checked ? "border-primary bg-primary" : "border-text-muted bg-bg"
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4l3 3 5-6"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-text">{label}</div>
        {sublabel && <div className="text-xs text-text-muted mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}

function StepDot({ n, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`width-8 height-8 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
          done
            ? "bg-primary text-white"
            : active
            ? "bg-primary border-2 border-warning text-white scale-105"
            : "bg-surface text-text-muted border border-glass-border"
        }`}
      >
        {done ? (
          <svg width="12" height="10" viewBox="0 0 14 12" fill="none">
            <path
              d="M1.5 6l4 4 7-8"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          n
        )}
      </div>
      <div
        className={`text-xs ${
          active ? "text-primary font-semibold" : "text-text-muted"
        } whitespace-nowrap`}
      >
        {["Pick Type", "Configure", "Review"][n - 1]}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [voucherType, setVoucherType] = useState(null);

  // Search databases
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Common fields
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [expiry, setExpiry] = useState(defaultExpiry);
  const [usageLimit, setUsageLimit] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  // Seller subscription
  const [selectedPlans, setSelectedPlans] = useState([]);

  // Customer specific products
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  // Seller products voucher
  const [selectedSellers, setSelectedSellers] = useState([]);
  const [sellerProductScope, setSellerProductScope] = useState("all"); // "all"|"specific"
  const [sellerSpecificProducts, setSellerSpecificProducts] = useState({});

  const vt = VOUCHER_TYPES.find((v) => v.id === voucherType);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/vouchers");
      setVouchers(data || []);
    } catch (err) {
      console.error("Failed to load vouchers", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchData = async () => {
    try {
      setSearchLoading(true);
      const { data } = await api.get("/admin/vouchers/search-data");
      setSellers(data.sellers || []);
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to load search data", err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchSearchData();
  }, []);

  const togglePlan = (id) =>
    setSelectedPlans((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleProduct = (id) =>
    setSelectedProducts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const toggleSeller = (id) => {
    setSelectedSellers((p) => {
      if (p.includes(id)) {
        const next = p.filter((x) => x !== id);
        setSellerSpecificProducts((sp) => {
          const c = { ...sp };
          delete c[id];
          return c;
        });
        return next;
      }
      return [...p, id];
    });
  };

  const toggleSellerProduct = (sellerId, productName) => {
    setSellerSpecificProducts((sp) => {
      const current = sp[sellerId] || [];
      const next = current.includes(productName)
        ? current.filter((x) => x !== productName)
        : [...current, productName];
      return { ...sp, [sellerId]: next };
    });
  };

  const filteredProducts = products.filter((p) => {
    const sName =
      p.sellerId?.businessName ||
      `${p.sellerId?.firstName || ""} ${p.sellerId?.lastName || ""}`.trim();
    return (
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      sName.toLowerCase().includes(productSearch.toLowerCase())
    );
  });

  const validate = () => {
    const e = {};
    if (!code.trim()) e.code = "Voucher code is required";
    if (!discountValue || parseFloat(discountValue) <= 0) e.discountValue = "Enter a valid discount";
    if (discountType === "percent" && parseFloat(discountValue) > 100)
      e.discountValue = "Cannot exceed 100%";
    if (!expiry) e.expiry = "Expiry date is required";
    if (voucherType === "seller_subscription" && selectedPlans.length === 0)
      e.plans = "Select at least one plan";
    if (voucherType === "customer_specific" && selectedProducts.length === 0)
      e.products = "Select at least one product";
    if (voucherType === "seller_products" && selectedSellers.length === 0)
      e.sellers = "Select at least one seller";
    if (voucherType === "seller_products" && sellerProductScope === "specific") {
      const missing = selectedSellers.filter(
        (sid) => !sellerSpecificProducts[sid] || sellerSpecificProducts[sid].length === 0
      );
      if (missing.length > 0) e.sellerProducts = "Select products for each chosen seller";
    }
    return e;
  };

  const handleCreate = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    try {
      const payload = {
        voucherType,
        voucherCode: code,
        discountType,
        discountValue,
        expiry,
        usageLimit: usageLimit || null,
        note,
        selectedPlans,
        selectedProducts,
        selectedSellers,
        sellerProductScope,
        sellerSpecificProducts,
      };

      await api.post("/admin/vouchers", payload);
      setSaved(true);
      await fetchVouchers();
      setTimeout(() => {
        setSaved(false);
        reset();
        setShowCreate(false);
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create voucher");
    }
  };

  const handleDelete = async (id, codeStr) => {
    const confirmed = window.confirm(`Are you sure you want to delete voucher code ${codeStr}?`);
    if (!confirmed) return;
    try {
      await api.delete(`/admin/vouchers/${id}`);
      fetchVouchers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete voucher");
    }
  };

  const reset = () => {
    setStep(1);
    setVoucherType(null);
    setCode("");
    setDiscountType("percent");
    setDiscountValue("");
    setExpiry(defaultExpiry);
    setUsageLimit("");
    setNote("");
    setErrors({});
    setSaved(false);
    setSelectedPlans([]);
    setSelectedProducts([]);
    setSelectedSellers([]);
    setSellerProductScope("all");
    setSellerSpecificProducts({});
  };

  // ── Render ──
  return (
    <div className="animate-fade-in w-full min-w-0">
      {/* ── Header ── */}
      <div className="responsive-page-header">
        <h1 className="font-bold flex items-center gap-3">
          <Tag className="text-primary" /> Admin Vouchers
        </h1>
        <div>
          {showCreate ? (
            <button
              onClick={() => {
                setShowCreate(false);
                reset();
              }}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back to List
            </button>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Create Voucher
            </button>
          )}
        </div>
      </div>

      {/* ── Listing View ── */}
      {!showCreate && (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="responsive-table-wrap">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-glass-border">
                  <th className="p-4 font-medium text-sm text-text-muted">Voucher Code</th>
                  <th className="p-4 font-medium text-sm text-text-muted">Type</th>
                  <th className="p-4 font-medium text-sm text-text-muted">Audience</th>
                  <th className="p-4 font-medium text-sm text-text-muted">Discount</th>
                  <th className="p-4 font-medium text-sm text-text-muted">Usage Status</th>
                  <th className="p-4 font-medium text-sm text-text-muted">Expiry</th>
                  <th className="p-4 font-medium text-sm text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-text-muted">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary" />
                      Loading vouchers...
                    </td>
                  </tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-text-muted">
                      No super admin vouchers generated yet. Click "Create Voucher" to begin.
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => {
                    const isExpired = new Date() > new Date(voucher.expiry);
                    const typeObj = VOUCHER_TYPES.find((v) => v.id === voucher.voucherType);
                    const limitText =
                      voucher.usageLimit !== null && voucher.usageLimit !== undefined
                        ? `${voucher.usedCount}/${voucher.usageLimit}`
                        : `${voucher.usedCount} used (unlimited)`;

                    return (
                      <tr
                        key={voucher._id}
                        className="border-b border-glass-border hover:bg-surface/30 transition-colors"
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm font-semibold tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg uppercase">
                            {voucher.voucherCode}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-sm">
                          {typeObj ? typeObj.label : voucher.voucherType}
                        </td>
                        <td className="p-4">
                          {typeObj ? (
                            <span
                              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{
                                color: typeObj.audienceColor,
                                backgroundColor: typeObj.audienceColor + "15",
                              }}
                            >
                              {typeObj.audience}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-4 font-bold text-sm">
                          {voucher.discountType === "percent"
                            ? `${voucher.discountValue}% OFF`
                            : `₹${voucher.discountValue.toLocaleString()} OFF`}
                        </td>
                        <td className="p-4 text-sm text-text-muted">{limitText}</td>
                        <td className="p-4 text-sm">
                          <span className={isExpired ? "text-error font-semibold" : "text-text-muted"}>
                            {new Date(voucher.expiry).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="p-4 flex justify-end">
                          <button
                            onClick={() => handleDelete(voucher._id, voucher.voucherCode)}
                            className="btn bg-error/15 text-error hover:bg-error hover:text-white p-2 rounded-lg"
                            title="Delete Voucher"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Wizard View ── */}
      {showCreate && (
        <div className="max-w-4xl mx-auto mt-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-0 mb-8 max-w-md mx-auto">
            <StepDot n={1} active={step === 1} done={step > 1} />
            <div
              className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                step > 1 ? "bg-primary" : "bg-glass-border"
              }`}
            />
            <StepDot n={2} active={step === 2} done={step > 2} />
            <div
              className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                step > 2 ? "bg-primary" : "bg-glass-border"
              }`}
            />
            <StepDot n={3} active={step === 3} done={false} />
          </div>

          {/* ══════════ STEP 1: PICK TYPE ══════════ */}
          {step === 1 && (
            <div className="animate-fade-in text-center">
              <h2 className="text-xl font-bold mb-1">Create a New Voucher</h2>
              <p className="text-sm text-text-muted mb-8">
                Choose who receives this voucher and what discount to apply.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto mb-8">
                {VOUCHER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    className={`glass-panel p-5 rounded-2xl cursor-pointer text-left transition-all border-2 flex flex-col justify-between hover:scale-[1.01] hover:shadow-lg ${
                      voucherType === type.id ? "border-primary bg-primary/5" : "border-glass-border"
                    }`}
                    onClick={() => setVoucherType(type.id)}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{type.icon}</span>
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                          style={{
                            color: type.audienceColor,
                            backgroundColor: type.audienceColor + "15",
                          }}
                        >
                          {type.audience}
                        </span>
                      </div>
                      <h3 className="font-bold text-base mb-1.5 text-text">{type.label}</h3>
                      <p className="text-xs text-text-muted leading-relaxed">{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end max-w-3xl mx-auto">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (voucherType) setStep(2);
                  }}
                  disabled={!voucherType}
                  style={{ opacity: voucherType ? 1 : 0.45 }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ══════════ STEP 2: CONFIGURE ══════════ */}
          {step === 2 && vt && (
            <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Configure Fields */}
              <div className="lg:col-span-2 space-y-4">
                {/* Type Selection indicator */}
                <div className="glass-panel p-4 flex items-center gap-3 border border-primary/20 bg-primary/5">
                  <span className="text-2xl">{vt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate text-text">{vt.label}</h3>
                    <p className="text-xs text-text-muted truncate">{vt.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      setStep(1);
                      setSelectedPlans([]);
                      setSelectedProducts([]);
                      setSelectedSellers([]);
                    }}
                    className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                  >
                    Change Type
                  </button>
                </div>

                {/* Subscription Plans Selection */}
                {voucherType === "seller_subscription" && (
                  <div className="glass-panel p-5">
                    <h3 className="font-bold text-sm mb-1">Subscription Plans</h3>
                    <p className="text-xs text-text-muted mb-4">
                      Choose which vendor subscription tiers this voucher is valid for.
                    </p>
                    <div className="flex flex-col gap-3">
                      {PLANS.map((plan) => (
                        <div
                          key={plan.id}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedPlans.includes(plan.id)
                              ? "border-primary bg-primary/10 shadow-glow"
                              : "border-glass-border bg-surface hover:bg-surface-hover"
                          }`}
                          onClick={() => togglePlan(plan.id)}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                              selectedPlans.includes(plan.id)
                                ? "border-primary bg-primary"
                                : "border-text-muted bg-bg"
                            }`}
                          >
                            {selectedPlans.includes(plan.id) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path
                                  d="M1 4l3 3 5-6"
                                  stroke="#fff"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-text">{plan.name}</div>
                            <div className="text-xs text-text-muted mt-0.5">{plan.label}</div>
                          </div>
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: plan.color }}
                          />
                        </div>
                      ))}
                    </div>
                    {errors.plans && <div className="text-xs text-error mt-2">{errors.plans}</div>}
                  </div>
                )}

                {/* Specific Products Selection */}
                {voucherType === "customer_specific" && (
                  <div className="glass-panel p-5">
                    <h3 className="font-bold text-sm mb-1">Select Products</h3>
                    <p className="text-xs text-text-muted mb-4">
                      Choose which products from the catalogue are discounted.
                    </p>
                    <div className="relative mb-3.5">
                      <Search className="absolute left-3.5 top-3 text-text-muted" size={16} />
                      <input
                        type="text"
                        placeholder="Search products or sellers..."
                        className="input-field pl-10"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
                      {filteredProducts.map((p) => {
                        const sellerName =
                          p.sellerId?.businessName ||
                          `${p.sellerId?.firstName || ""} ${p.sellerId?.lastName || ""}`.trim();
                        return (
                          <CheckboxChip
                            key={p._id}
                            label={p.title}
                            sublabel={`${sellerName} · ₹${p.price.toLocaleString()}`}
                            checked={selectedProducts.includes(p._id)}
                            onChange={() => toggleProduct(p._id)}
                          />
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <div className="text-center text-xs text-text-muted py-6">
                          No matching products found.
                        </div>
                      )}
                    </div>
                    {selectedProducts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-glass-border">
                        <div className="text-xs text-text-muted mb-2 font-semibold">
                          Selected Products ({selectedProducts.length}):
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {selectedProducts.map((id) => {
                            const p = products.find((x) => x._id === id);
                            return p ? (
                              <span
                                key={id}
                                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/20"
                              >
                                {p.title}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {errors.products && <div className="text-xs text-error mt-2">{errors.products}</div>}
                  </div>
                )}

                {/* Seller's Products Selection */}
                {voucherType === "seller_products" && (
                  <>
                    <div className="glass-panel p-5">
                      <h3 className="font-bold text-sm mb-1">Select Sellers</h3>
                      <p className="text-xs text-text-muted mb-4">
                        Choose one or more sellers whose products this voucher will apply to.
                      </p>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
                        {sellers.map((s) => {
                          const sellerName = s.businessName || `${s.firstName} ${s.lastName}`.trim();
                          const sellerProds = products.filter(
                            (p) => p.sellerId === s._id || (p.sellerId && p.sellerId._id === s._id)
                          );
                          return (
                            <CheckboxChip
                              key={s._id}
                              label={sellerName}
                              sublabel={`${s.email} · ${sellerProds.length} products`}
                              checked={selectedSellers.includes(s._id)}
                              onChange={() => toggleSeller(s._id)}
                            />
                          );
                        })}
                      </div>
                      {errors.sellers && <div className="text-xs text-error mt-2">{errors.sellers}</div>}
                    </div>

                    {selectedSellers.length > 0 && (
                      <div className="glass-panel p-5">
                        <h3 className="font-bold text-sm mb-1">Product Scope</h3>
                        <p className="text-xs text-text-muted mb-4">
                          Apply to all products of selected sellers, or choose specific ones.
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          {["all", "specific"].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSellerProductScope(opt)}
                              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                                sellerProductScope === opt
                                  ? "border-primary bg-primary/10"
                                  : "border-glass-border bg-surface hover:bg-surface-hover"
                              }`}
                            >
                              <div className="text-sm font-semibold text-text">
                                {opt === "all" ? "All Products" : "Specific Products"}
                              </div>
                              <div className="text-[10px] text-text-muted mt-1">
                                {opt === "all"
                                  ? "Entire catalogue of selected sellers"
                                  : "Pick individual products per seller"}
                              </div>
                            </button>
                          ))}
                        </div>

                        {sellerProductScope === "specific" &&
                          selectedSellers.map((sid) => {
                            const seller = sellers.find((s) => s._id === sid);
                            const sellerName =
                              seller?.businessName ||
                              `${seller?.firstName || ""} ${seller?.lastName || ""}`.trim();
                            const sellerProds = products.filter(
                              (p) => p.sellerId === sid || (p.sellerId && p.sellerId._id === sid)
                            );
                            return seller ? (
                              <div
                                key={sid}
                                className="mb-4 pb-4 border-b border-glass-border last:border-0 last:pb-0"
                              >
                                <div className="font-semibold text-xs text-text mb-2 tracking-wide uppercase">
                                  {sellerName}
                                </div>
                                <div className="space-y-1.5">
                                  {sellerProds.map((prod) => (
                                    <CheckboxChip
                                      key={prod._id}
                                      label={prod.title}
                                      checked={(sellerSpecificProducts[sid] || []).includes(
                                        prod.title
                                      )}
                                      onChange={() => toggleSellerProduct(sid, prod.title)}
                                    />
                                  ))}
                                  {sellerProds.length === 0 && (
                                    <div className="text-xs text-text-muted italic py-1">
                                      No products listed for this seller.
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null;
                          })}
                        {errors.sellerProducts && (
                          <div className="text-xs text-error mt-2">{errors.sellerProducts}</div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Common Fields */}
                <div className="glass-panel p-5 space-y-4">
                  <h3 className="font-bold text-sm mb-1">Voucher Details</h3>
                  <p className="text-xs text-text-muted">
                    Configure the discount values, voucher code, and usage terms.
                  </p>

                  <FieldGroup label="Voucher Code" required error={errors.code}>
                    <div className="flex gap-2">
                      <input
                        required
                        type="text"
                        placeholder="e.g. EXTRA500"
                        className="input-field font-mono uppercase tracking-wider font-bold"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.toUpperCase());
                          setErrors((p) => ({ ...p, code: undefined }));
                        }}
                        maxLength={22}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCode(
                            generateCode(
                              voucherType === "seller_subscription" ? "SELLER" : "AASH"
                            )
                          )
                        }
                        className="btn btn-secondary whitespace-nowrap py-2 text-xs font-semibold"
                      >
                        Auto Code
                      </button>
                    </div>
                  </FieldGroup>

                  <FieldGroup label="Discount" required error={errors.discountValue}>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        className="input-field col-span-1"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <option value="percent">Percent (%)</option>
                        <option value="flat">Flat (₹)</option>
                      </select>
                      <input
                        type="number"
                        placeholder={discountType === "percent" ? "25" : "500"}
                        className="input-field col-span-2"
                        value={discountValue}
                        onChange={(e) => {
                          setDiscountValue(e.target.value);
                          setErrors((p) => ({ ...p, discountValue: undefined }));
                        }}
                        min={0}
                        max={discountType === "percent" ? 100 : undefined}
                      />
                    </div>
                  </FieldGroup>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldGroup label="Expiry Date" required error={errors.expiry}>
                      <input
                        type="date"
                        className="input-field"
                        value={expiry}
                        min={today}
                        onChange={(e) => {
                          setExpiry(e.target.value);
                          setErrors((p) => ({ ...p, expiry: undefined }));
                        }}
                      />
                    </FieldGroup>
                    <FieldGroup label="Usage Limit" hint="optional">
                      <input
                        type="number"
                        placeholder="Unlimited"
                        className="input-field"
                        value={usageLimit}
                        onChange={(e) => setUsageLimit(e.target.value)}
                        min={1}
                      />
                    </FieldGroup>
                  </div>

                  <FieldGroup label="Internal Notes" hint="optional">
                    <textarea
                      placeholder="Why this voucher is being created, campaign name, etc."
                      className="input-field min-h-16"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </FieldGroup>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const e = validate();
                      if (Object.keys(e).length > 0) {
                        setErrors(e);
                      } else {
                        setErrors({});
                        setStep(3);
                      }
                    }}
                  >
                    Review & Continue
                  </button>
                </div>
              </div>

              {/* Sticky Mini Preview */}
              <div className="sticky top-4 space-y-4">
                <div className="text-xs font-bold text-text-muted tracking-wider uppercase">
                  Voucher Preview
                </div>
                <div className="relative overflow-hidden rounded-2xl p-5 border border-primary/30 bg-gradient-to-br from-slate-900 to-indigo-950 shadow-glow">
                  <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-primary/20 blur-xl" />
                  <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1.5">
                    Aashansh · Admin Voucher
                  </div>
                  <div className="text-3xl font-black text-warning leading-none mb-1.5">
                    {discountValue
                      ? discountType === "percent"
                        ? `${discountValue}% OFF`
                        : `₹${parseFloat(discountValue).toLocaleString()} OFF`
                      : "? OFF"}
                  </div>
                  <div className="text-xs text-text-muted font-medium mb-4">{vt.label}</div>
                  <div className="border-t border-dashed border-white/10 my-4" />
                  <div className="flex justify-between items-end">
                    <div className="font-mono text-sm text-white font-bold tracking-widest uppercase">
                      {code || "CODE-HERE"}
                    </div>
                    <div className="text-[10px] text-text-muted text-right leading-tight">
                      Expires <br />
                      <span className="text-white font-semibold text-xs">
                        {expiry
                          ? new Date(expiry).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Summary list */}
                <div className="glass-panel p-4 space-y-3">
                  <h4 className="text-xs font-bold text-text-muted uppercase">Configuration Summary</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Audience:</span>
                      <span className="font-semibold text-text">{vt.audience}</span>
                    </div>
                    {voucherType === "seller_subscription" && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Selected Tiers:</span>
                        <span className="font-semibold text-text text-right max-w-32 truncate">
                          {selectedPlans.length ? selectedPlans.join(", ") : "None"}
                        </span>
                      </div>
                    )}
                    {voucherType === "customer_specific" && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Selected Products:</span>
                        <span className="font-semibold text-text">
                          {selectedProducts.length} chosen
                        </span>
                      </div>
                    )}
                    {voucherType === "seller_products" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Sellers:</span>
                          <span className="font-semibold text-text">
                            {selectedSellers.length} chosen
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Scope:</span>
                          <span className="font-semibold text-text capitalize">
                            {sellerProductScope}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-text-muted">Usage Limit:</span>
                      <span className="font-semibold text-text">
                        {usageLimit ? `${usageLimit} uses` : "Unlimited"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP 3: REVIEW & CREATE ══════════ */}
          {step === 3 && vt && (
            <div className="animate-fade-in max-w-xl mx-auto space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-1">Review & Create</h2>
                <p className="text-sm text-text-muted">
                  Confirm all parameters before issuing this official voucher.
                </p>
              </div>

              {/* Big Coupon Card */}
              <div className="relative overflow-hidden rounded-3xl p-7 border border-primary/40 bg-gradient-to-br from-slate-900 to-indigo-950 shadow-glow">
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary/25 blur-2xl" />
                <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-warning/5 blur-xl" />
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest">
                    Aashansh Admin Voucher
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full"
                    style={{
                      color: vt.audienceColor,
                      backgroundColor: vt.audienceColor + "20",
                    }}
                  >
                    {vt.audience}
                  </span>
                </div>
                <div className="text-5xl font-black text-warning leading-none mb-2">
                  {discountType === "percent" ? `${discountValue}% OFF` : `₹${parseFloat(discountValue).toLocaleString()} OFF`}
                </div>
                <div className="text-sm font-semibold text-text mb-4">{vt.label}</div>
                <div className="border-t border-dashed border-white/10 my-5" />
                <div className="flex justify-between items-end">
                  <div className="font-mono text-xl text-white font-black tracking-widest uppercase">
                    {code}
                  </div>
                  <div className="text-xs text-text-muted text-right leading-tight">
                    Valid Until <br />
                    <span className="text-white font-bold text-sm">
                      {new Date(expiry).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Voucher Detail List */}
              <div className="glass-panel p-5 space-y-3">
                <h3 className="font-bold text-sm mb-2 pb-2 border-b border-glass-border">Voucher Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Voucher Type</span>
                    <span className="font-semibold text-text text-right">{vt.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Promo Code</span>
                    <span className="font-mono font-bold text-primary tracking-wider uppercase">
                      {code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Discount Value</span>
                    <span className="font-semibold text-text">
                      {discountType === "percent" ? `${discountValue}%` : `₹${discountValue}`} off
                    </span>
                  </div>

                  {voucherType === "seller_subscription" && (
                    <div className="flex justify-between items-start">
                      <span className="text-text-muted">Applicable Tiers</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {selectedPlans.map((p) => (
                          <span
                            key={p}
                            className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-glass-border capitalize"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {voucherType === "customer_all" && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Product Scope</span>
                      <span className="font-semibold text-text">All products on Aashansh</span>
                    </div>
                  )}

                  {voucherType === "customer_specific" && (
                    <div className="flex justify-between items-start">
                      <span className="text-text-muted">Products ({selectedProducts.length})</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {selectedProducts.slice(0, 4).map((id) => {
                          const p = products.find((x) => x._id === id);
                          return p ? (
                            <span
                              key={id}
                              className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary"
                            >
                              {p.title}
                            </span>
                          ) : null;
                        })}
                        {selectedProducts.length > 4 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-glass-border">
                            +{selectedProducts.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {voucherType === "seller_products" && (
                    <>
                      <div className="flex justify-between items-start">
                        <span className="text-text-muted">Selected Sellers</span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                          {selectedSellers.map((sid) => {
                            const s = sellers.find((x) => x._id === sid);
                            return s ? (
                              <span
                                key={sid}
                                className="text-xs font-semibold px-2 py-0.5 rounded bg-warning/10 border border-warning/20 text-warning"
                              >
                                {s.businessName || `${s.firstName} ${s.lastName}`}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Product Scope</span>
                        <span className="font-semibold text-text capitalize">
                          {sellerProductScope === "all" ? "All products" : "Specific products only"}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <span className="text-text-muted">Usage Limit</span>
                    <span className="font-semibold text-text">
                      {usageLimit ? `${usageLimit} uses` : "Unlimited"}
                    </span>
                  </div>
                  {note && (
                    <div className="flex justify-between items-start">
                      <span className="text-text-muted">Internal Note</span>
                      <span className="text-text-muted text-xs text-right max-w-xs italic leading-tight">
                        {note}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Success Notification message */}
              {saved && (
                <div className="bg-success/15 border border-success/30 text-success rounded-xl p-4 flex items-center gap-3">
                  <div className="text-2xl">✅</div>
                  <div className="text-xs">
                    <div className="font-bold text-sm">Voucher created successfully!</div>
                    <div>Code {code} is now active and stored in the database.</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => setStep(2)}
                  disabled={saved}
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-[2]"
                  onClick={handleCreate}
                  disabled={saved}
                >
                  Create Voucher
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

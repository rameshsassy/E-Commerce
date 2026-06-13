import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { downloadVoucherImage } from "../../utils/downloadVoucher";
import { Tag, Trash2, Loader2, AlertCircle, Calendar, Download, X, Image, FileImage } from "lucide-react";

function generateCode(prefix) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = prefix ? prefix.toUpperCase().replace(/\s+/g, "") + "-" : "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const today = new Date().toISOString().split("T")[0];
const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

// ─── Voucher Card for Download ────────────────────────────────────────────────
function VoucherCardImage({ voucher, productTitle }) {
  const discount =
    voucher.discountType === "percent"
      ? `${voucher.discountValue}% OFF`
      : `₹${voucher.discountValue} OFF`;

  const subtitle =
    voucher.scope === "specific" && productTitle
      ? `On: ${productTitle}`
      : "On all products";

  const expiryStr = new Date(voucher.expiry).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      style={{
        width: 520,
        background: "linear-gradient(135deg, #1A1464 0%, #312E8A 60%, #4338CA 100%)",
        borderRadius: 24,
        padding: "36px 40px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Poppins', 'Inter', sans-serif",
        boxShadow: "0 20px 60px rgba(26,20,100,0.5)",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          right: -40,
          top: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "rgba(245,158,11,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 30,
          bottom: -50,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -20,
          bottom: 20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(245,158,11,0.07)",
        }}
      />

      {/* Brand */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        🏷️ Aashansh — Seller Voucher
      </div>

      {/* Discount */}
      <div
        style={{
          fontSize: 52,
          fontWeight: 900,
          color: "#F59E0B",
          lineHeight: 1,
          marginBottom: 8,
          textShadow: "0 2px 20px rgba(245,158,11,0.4)",
        }}
      >
        {discount}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.78)",
          fontWeight: 500,
          marginBottom: 4,
        }}
      >
        {subtitle}
      </div>

      {/* Min Order */}
      {voucher.minOrder > 0 && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
          Min. order: ₹{voucher.minOrder}
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          borderTop: "1.5px dashed rgba(255,255,255,0.18)",
          margin: "22px 0",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -48,
            top: -12,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#F0F2F8",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -48,
            top: -12,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#F0F2F8",
          }}
        />
      </div>

      {/* Code & Expiry */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>
            USE CODE
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: 4,
              textShadow: "0 0 20px rgba(255,255,255,0.3)",
            }}
          >
            {voucher.voucherCode}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>
            VALID UNTIL
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>{expiryStr}</div>
        </div>
      </div>

      {/* Usage limit if any */}
      {voucher.usageLimit && (
        <div
          style={{
            marginTop: 16,
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
          }}
        >
          Limited to {voucher.usageLimit} uses
        </div>
      )}
    </div>
  );
}

// ─── Download Modal ────────────────────────────────────────────────────────────
function DownloadModal({ voucher, productTitle, onClose }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (format) => {
    setDownloading(true);
    await downloadVoucherImage(
      cardRef,
      `voucher-${voucher.voucherCode}`,
      format
    );
    setDownloading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "32px",
          width: "100%",
          maxWidth: 620,
          boxShadow: "0 40px 80px rgba(0,0,0,0.25)",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "#F1F5F9",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#475569",
          }}
        >
          <X size={18} />
        </button>

        {/* Success Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
            border: "1.5px solid #6EE7B7",
            borderRadius: 14,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 24 }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#065F46" }}>
              Voucher Created Successfully!
            </div>
            <div style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>
              Code <strong>{voucher.voucherCode}</strong> is now saved & active. Download your voucher below.
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#1A1464",
            marginBottom: 4,
          }}
        >
          Download Voucher
        </div>
        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>
          Save your voucher as a high-resolution image to share with customers.
        </p>

        {/* Voucher Card Preview */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
            overflow: "hidden",
            borderRadius: 16,
          }}
        >
          <div ref={cardRef}>
            <VoucherCardImage voucher={voucher} productTitle={productTitle} />
          </div>
        </div>

        {/* Download Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button
            onClick={() => handleDownload("jpeg")}
            disabled={downloading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 20px",
              background: "linear-gradient(135deg, #F59E0B, #F97316)",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: downloading ? "not-allowed" : "pointer",
              opacity: downloading ? 0.7 : 1,
              transition: "all 0.15s",
            }}
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileImage size={16} />
            )}
            Download JPG
          </button>

          <button
            onClick={() => handleDownload("png")}
            disabled={downloading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 20px",
              background: "linear-gradient(135deg, #1A1464, #4338CA)",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: downloading ? "not-allowed" : "pointer",
              opacity: downloading ? 0.7 : 1,
              transition: "all 0.15s",
            }}
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Image size={16} />
            )}
            Download PNG
          </button>
        </div>

        {/* Dismiss */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "12px",
            background: "#F1F5F9",
            border: "1.5px solid #E2E8F0",
            borderRadius: 12,
            color: "#475569",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Close & Create Another
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
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
  const [deleteId, setDeleteId] = useState(null);

  // Download modal state
  const [downloadVoucher, setDownloadVoucher] = useState(null); // holds the created voucher object

  // Find product object from state
  const selectedProductObj = products.find((p) => p._id === selectedProduct);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/seller/products");
      const activeProducts = data.filter((p) => !p.isDraft);
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
    if (discountType === "percent")
      return `Save ₹${Math.round((selectedProductObj.price * val) / 100)}`;
    return `Save ₹${val}`;
  };

  const validate = () => {
    const e = {};
    if (!voucherCode.trim()) e.voucherCode = "Voucher code is required";
    if (!discountValue || parseFloat(discountValue) <= 0)
      e.discountValue = "Enter a valid discount amount";
    if (discountType === "percent" && parseFloat(discountValue) > 100)
      e.discountValue = "Percentage cannot exceed 100";
    if (scope === "specific" && !selectedProduct) e.selectedProduct = "Please select a product";
    if (!expiry) e.expiry = "Expiry date is required";
    if (new Date(expiry) < new Date(new Date().setHours(0, 0, 0, 0)))
      e.expiry = "Expiry date cannot be in the past";
    return e;
  };

  const resetForm = () => {
    setScope("all");
    setSelectedProduct("");
    setDiscountType("percent");
    setDiscountValue("");
    setVoucherCode("");
    setExpiry(defaultExpiry);
    setMinOrder("");
    setUsageLimit("");
    setDescription("");
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setCreating(true);

    try {
      const { data } = await api.post("/seller/vouchers", {
        scope,
        productId: scope === "specific" ? selectedProduct : null,
        voucherCode,
        discountType,
        discountValue,
        minOrder,
        usageLimit,
        expiry,
        description,
      });

      // Store created voucher and show download modal
      setDownloadVoucher(data.voucher);

      // Reset form
      resetForm();

      // Reload vouchers list
      fetchVouchers();
    } catch (err) {
      console.error("Create voucher error:", err);
      setErrors({
        apiError: err.response?.data?.message || "Failed to create voucher. Please check inputs.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAutoGenerate = () => {
    const prefix =
      scope === "specific" && selectedProductObj
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
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "#F0F2F8",
        minHeight: "100vh",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
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
          box-sizing: border-box;
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
        .btn-action {
          padding: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-delete { color: #EF4444; }
        .btn-delete:hover { background: #FEF2F2; color: #B91C1C; }
        .btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-download-row { color: #1A1464; }
        .btn-download-row:hover { background: #EEF2FF; color: #1A1464; }
        .empty-vouchers {
          padding: 40px;
          text-align: center;
          color: #64748B;
        }
        .actions-cell { display: flex; align-items: center; justify-content: center; gap: 4px; }
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
                  onClick={() => {
                    setScope("all");
                    setSelectedProduct("");
                  }}
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
                  <label className="field-label">
                    Select Product <span>*</span>
                  </label>
                  {loadingProducts ? (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748B" }}
                    >
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
                      onChange={(e) => {
                        setSelectedProduct(e.target.value);
                        setErrors((p) => ({ ...p, selectedProduct: undefined }));
                      }}
                    >
                      <option value="">— Choose a product —</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} (₹{p.price})
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.selectedProduct && (
                    <div className="error-msg">{errors.selectedProduct}</div>
                  )}
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
                <label className="field-label">
                  Voucher Code <span>*</span>
                </label>
                <div className="code-row">
                  <input
                    className={`input-base ${errors.voucherCode ? "error" : ""}`}
                    placeholder="e.g. DIWALI50"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value.toUpperCase());
                      setErrors((p) => ({ ...p, voucherCode: undefined }));
                    }}
                    maxLength={20}
                  />
                  <button type="button" className="gen-btn" onClick={handleAutoGenerate}>
                    Auto-generate
                  </button>
                </div>
                {errors.voucherCode && <div className="error-msg">{errors.voucherCode}</div>}
              </div>

              <div className="field-group">
                <label className="field-label">
                  Discount Amount <span>*</span>
                </label>
                <div className="discount-row">
                  <select
                    className="input-base type-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
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
                    onChange={(e) => {
                      setDiscountValue(e.target.value);
                      setErrors((p) => ({ ...p, discountValue: undefined }));
                    }}
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
                <label className="field-label">
                  Expiry Date <span>*</span>
                </label>
                <input
                  className={`input-base ${errors.expiry ? "error" : ""}`}
                  type="date"
                  value={expiry}
                  min={today}
                  onChange={(e) => {
                    setExpiry(e.target.value);
                    setErrors((p) => ({ ...p, expiry: undefined }));
                  }}
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
            <div
              style={{
                marginBottom: 16,
                padding: "14px 16px",
                borderRadius: 12,
                border: "1.5px solid #FCA5A5",
                background: "#FEF2F2",
                color: "#B91C1C",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                fontSize: 13,
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontWeight: 500 }}>{errors.apiError}</div>
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
                <Download size={18} />
                Create & Download Voucher
              </>
            )}
          </button>
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
                    Valid until
                    <span>
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
            </div>

            {/* Summary */}
            <div className="card">
              <div className="card-body" style={{ padding: "16px 20px" }}>
                <div
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1A1464",
                    marginBottom: 4,
                  }}
                >
                  Summary
                </div>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-key">Scope</span>
                    <span className="badge badge-blue">
                      {scope === "all" ? "All Products" : "Specific Product"}
                    </span>
                  </div>
                  {scope === "specific" && (
                    <div className="detail-row">
                      <span className="detail-key">Product</span>
                      <span
                        className="detail-val"
                        style={{ maxWidth: 160, textAlign: "right", fontSize: 12 }}
                      >
                        {selectedProductObj?.title || "—"}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-key">Discount</span>
                    <span className="badge badge-amber">
                      {discountValue
                        ? discountType === "percent"
                          ? `${discountValue}%`
                          : `₹${discountValue}`
                        : "—"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Min. Order</span>
                    <span className="detail-val">{minOrder ? `₹${minOrder}` : "No minimum"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Usage Limit</span>
                    <span className="detail-val">
                      {usageLimit ? `${usageLimit} uses` : "Unlimited"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Expires</span>
                    <span className="detail-val">
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
            </div>
          </div>
        </div>
      </div>

      {/* Vouchers List Section */}
      <div className="management-section">
        <div className="card">
          <div
            className="card-header"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <h2>Active Vouchers</h2>
              <p>View and manage your active promotional codes</p>
            </div>
            <span
              style={{
                fontSize: "12px",
                background: "#EFF6FF",
                color: "#1D4ED8",
                padding: "4px 8px",
                borderRadius: "20px",
                fontWeight: "600",
              }}
            >
              Total: {vouchers.length}
            </span>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
            {loadingVouchers ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "40px",
                  gap: "10px",
                  color: "#64748B",
                }}
              >
                <Loader2 className="animate-spin text-primary" size={24} />
                <span>Loading active vouchers...</span>
              </div>
            ) : vouchers.length === 0 ? (
              <div className="empty-vouchers">
                <Tag style={{ margin: "0 auto 12px", color: "#94A3B8" }} size={36} />
                <p style={{ fontWeight: 600, fontSize: "14px" }}>No vouchers created yet</p>
                <p style={{ fontSize: "12px", marginTop: "4px" }}>
                  Create your first discount coupon above to share with customers.
                </p>
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
                    <th style={{ width: "100px", textAlign: "center" }}>Actions</th>
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
                            {v.discountType === "percent"
                              ? `${v.discountValue}%`
                              : `₹${v.discountValue}`}
                          </span>
                        </td>
                        <td>
                          {v.scope === "all" ? (
                            <span style={{ color: "#64748B" }}>All Catalogue</span>
                          ) : (
                            <span
                              style={{
                                fontWeight: 500,
                                display: "block",
                                maxWidth: "160px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={v.productId?.title || "Specific Item"}
                            >
                              {v.productId?.title || "Specific Item"}
                            </span>
                          )}
                        </td>
                        <td>{v.minOrder > 0 ? `₹${v.minOrder}` : "—"}</td>
                        <td>
                          {v.usageLimit
                            ? `${v.usedCount} / ${v.usageLimit}`
                            : `${v.usedCount} / ∞`}
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Calendar size={13} />
                            {new Date(v.expiry).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td>
                          {isExpired ? (
                            <span className="v-badge v-badge-expired">Expired</span>
                          ) : (
                            <span className="v-badge v-badge-active">Active</span>
                          )}
                        </td>
                        <td>
                          <div className="actions-cell">
                            {/* Download button */}
                            <button
                              type="button"
                              className="btn-action btn-download-row"
                              onClick={() => setDownloadVoucher(v)}
                              title="Download Voucher Image"
                            >
                              <Download size={15} />
                            </button>
                            {/* Delete button */}
                            <button
                              type="button"
                              className="btn-action btn-delete"
                              onClick={() => handleDelete(v._id)}
                              disabled={deleteId === v._id}
                              title="Delete Voucher"
                            >
                              {deleteId === v._id ? (
                                <Loader2 className="animate-spin" size={15} />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
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

      {/* Download Modal */}
      {downloadVoucher && (
        <DownloadModal
          voucher={downloadVoucher}
          productTitle={
            downloadVoucher.productId?.title ||
            products.find((p) => p._id === downloadVoucher.productId)?.title ||
            null
          }
          onClose={() => setDownloadVoucher(null)}
        />
      )}
    </div>
  );
}

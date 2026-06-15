import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getImageUrl } from "../../utils/api";
import { Store, Zap, Settings, Eye, Trash, ArrowUp, ArrowDown, Layout, Palette, Megaphone, Plus, Save } from "lucide-react";

// Themes definition
const THEMES = [
  { id: "light",   label: "Light",   bg: "#FFFFFF", text: "#1E293B", subtext: "#64748B", cardBg: "#F8F9FB", border: "#E2E8F0" },
  { id: "warm",    label: "Warm",    bg: "#FFFBF5", text: "#2D1B00", subtext: "#92603A", cardBg: "#FEF3E2", border: "#FCD9A0" },
  { id: "dark",    label: "Dark",    bg: "#0F0F1A", text: "#F1F5F9", subtext: "#94A3B8", cardBg: "#1E1E2E", border: "#334155" },
  { id: "minimal", label: "Minimal", bg: "#F8F9FB", text: "#0F172A", subtext: "#475569", cardBg: "#FFFFFF", border: "#E2E8F0" },
];

const PRESET_COLORS = ["#F59E0B","#4F46E5","#E11D48","#059669","#7C3AED","#EA580C","#0EA5E9","#DB2777","#16A34A","#1A1464"];

const BLOCK_TYPES = [
  { id: "section_products", icon: "📦", label: "Products Section",   desc: "Featured, New Arrivals, Best Sellers, On Sale, or Collections" },
  { id: "category_nav",     icon: "🗃️", label: "Category Navigator", desc: "Filterable categories → sub-categories → product types" },
  { id: "spotlight",        icon: "✨", label: "Spotlight Div",      desc: "Image + text with cart or bulk-order button" },
  { id: "bulk_row",         icon: "📦", label: "Bulk Order Row",     desc: "Orderable product row for bulk purchases" },
  { id: "reviews",          icon: "⭐", label: "Reviews Section",    desc: "Customer reviews with avatar, rating, and text" },
];

const SECTION_OPTIONS = [
  { id: "featured",     label: "Featured Products", icon: "⭐", limit: 8  },
  { id: "new_arrivals", label: "New Arrivals",       icon: "🆕", limit: 12 },
  { id: "best_sellers", label: "Best Sellers",       icon: "🔥", limit: 12 },
  { id: "on_sale",      label: "On Sale",            icon: "🏷️", limit: 12 },
  { id: "collections",  label: "Collections",        icon: "🗂️", limit: null },
];

const fmt = (n) => "₹" + n.toLocaleString("en-IN");
const uid  = ()  => "id" + Date.now() + Math.random().toString(36).slice(2,6);

// Shared UI Primitives
const S = {
  input: { width:"100%", border:"1.5px solid #CBD5E1", borderRadius:9, padding:"9px 12px", fontSize:13, color:"#1E293B", outline:"none", boxSizing:"border-box", background: "#fff" },
  label: { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:5 },
};

function Inp({ value, onChange, placeholder, maxLength, style, type="text", disabled = false }) {
  const [focus, setFocus] = useState(false);
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} disabled={disabled}
    style={{ ...S.input, borderColor: focus ? "#1A1464" : "#E2E8F0", ...style, opacity: disabled ? 0.6 : 1 }}
    onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />;
}

function Txt({ value, onChange, placeholder, rows=3, disabled = false }) {
  const [focus, setFocus] = useState(false);
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} disabled={disabled}
    style={{ ...S.input, resize:"vertical", borderColor: focus ? "#1A1464" : "#E2E8F0", opacity: disabled ? 0.6 : 1 }}
    onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />;
}

function Field({ label, hint, children, mb=14 }) {
  return <div style={{ marginBottom:mb }}>
    <label style={S.label}>{label}{hint && <span style={{ color:"#94A3B8", fontWeight:400, marginLeft:5, fontSize:11 }}>{hint}</span>}</label>
    {children}
  </div>;
}

function Toggle({ on, onChange, disabled = false }) {
  return <button onClick={() => !disabled && onChange(!on)} disabled={disabled} style={{ width:40, height:22, borderRadius:11, background: on?"#1A1464":"#CBD5E1", border:"none", cursor:disabled?"not-allowed":"pointer", position:"relative", flexShrink:0, transition:"background 0.2s", opacity: disabled ? 0.5 : 1 }}>
    <div style={{ position:"absolute", top:3, left: on?21:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
  </button>;
}

function ImgUpload({ value, onUpload, aspect="1/1", hint="", disabled = false }) {
  const ref = useRef();
  if (disabled) {
    return <div style={{ border:"2px dashed #CBD5E1", borderRadius:10, overflow:"hidden", opacity: 0.5, cursor: "not-allowed", padding:"20px 16px", textAlign:"center" }}>
      <div style={{ fontSize:24, marginBottom:6 }}>🔒</div>
      <div style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Upload disabled</div>
      <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>Available for paid subscribers</div>
    </div>;
  }
  return <div style={{ border:"2px dashed #CBD5E1", borderRadius:10, overflow:"hidden", cursor:"pointer" }}
    onClick={() => ref.current?.click()}
    onMouseEnter={e => e.currentTarget.style.borderColor="#1A1464"}
    onMouseLeave={e => e.currentTarget.style.borderColor="#CBD5E1"}>
    {value
      ? <img src={getImageUrl(value)} alt="" style={{ width:"100%", aspectRatio:aspect, objectFit:"cover", display:"block" }} />
      : <div style={{ padding:"20px 16px", textAlign:"center" }}>
          <div style={{ fontSize:24, marginBottom:6 }}>🖼️</div>
          <div style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Click to upload</div>
          {hint && <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{hint}</div>}
        </div>}
    <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={async (e) => {
      const f = e.target.files?.[0];
      if (f) {
        // Upload image to backend
        const fd = new FormData();
        fd.append("file", f);
        try {
          const { data } = await api.post("/form-drafts/seller.store.create/upload-test-image-or-doc", fd);
          if (data?.fileUrl) {
            onUpload(data.fileUrl);
          } else {
            onUpload(URL.createObjectURL(f));
          }
        } catch {
          onUpload(URL.createObjectURL(f));
        }
      }
    }} />
  </div>;
}

// Product Picker
function ProductPicker({ products = [], selectedIds = [], onChange, limit, ordered = false }) {
  const [search, setSearch] = useState("");
  const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id) => {
    const stringId = String(id);
    const selectedStringIds = selectedIds.map(String);
    if (selectedStringIds.includes(stringId)) {
      onChange(selectedIds.filter(x => String(x) !== stringId));
      return;
    }
    if (limit && selectedIds.length >= limit) return;
    onChange([...selectedIds, id]);
  };

  const moveOrder = (id, dir) => {
    const arr = [...selectedIds];
    const stringIds = arr.map(String);
    const i = stringIds.indexOf(String(id));
    const t = i + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[i], arr[t]] = [arr[t], arr[i]];
    onChange(arr);
  };

  return <div>
    {ordered && selectedIds.length > 0 && (
      <div style={{ marginBottom:10, display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#64748B", marginBottom:4 }}>Display Order</div>
        {selectedIds.map((id, i) => {
          const p = products.find(x => String(x._id || x.id) === String(id));
          if (!p) return null;
          return <div key={String(id)} style={{ display:"flex", alignItems:"center", gap:8, background:"#F0F1FF", border:"1.5px solid #C7D2FE", borderRadius:8, padding:"6px 10px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
              <button onClick={() => moveOrder(id, -1)} disabled={i===0} style={{ width:16, height:16, border:"1px solid #C7D2FE", borderRadius:3, background:"#fff", fontSize:9, cursor:i===0?"not-allowed":"pointer" }}>↑</button>
              <button onClick={() => moveOrder(id, 1)}  disabled={i===selectedIds.length-1} style={{ width:16, height:16, border:"1px solid #C7D2FE", borderRadius:3, background:"#fff", fontSize:9, cursor:i===selectedIds.length-1?"not-allowed":"pointer" }}>↓</button>
            </div>
            <span style={{ width:18, height:18, background:"#1A1464", borderRadius:"50%", color:"#fff", fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</span>
            <img src={getImageUrl(p.images?.[0] || p.image)} alt="" style={{ width:28, height:28, borderRadius:6, objectFit:"cover" }} />
            <span style={{ fontSize:12, fontWeight:600, color:"#1A1464", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</span>
            <button onClick={() => toggle(id)} style={{ background:"none", border:"none", color:"#94A3B8", cursor:"pointer", fontSize:14 }}>✕</button>
          </div>;
        })}
      </div>
    )}

    {!ordered && selectedIds.length > 0 && (
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
        {selectedIds.map(id => {
          const p = products.find(x => String(x._id || x.id) === String(id));
          return p ? (
            <div key={String(id)} style={{ display:"flex", alignItems:"center", gap:5, background:"#F0F1FF", border:"1px solid #C7D2FE", borderRadius:20, padding:"3px 8px", fontSize:11 }}>
              <img src={getImageUrl(p.images?.[0] || p.image)} alt="" style={{ width:20, height:20, borderRadius:"50%", objectFit:"cover" }} />
              <span style={{ color:"#1A1464", fontWeight:600 }}>{p.title.split(" ").slice(0,2).join(" ")}</span>
              <button onClick={() => toggle(id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#6366F1", fontSize:12 }}>✕</button>
            </div>
          ) : null;
        })}
      </div>
    )}

    <div style={{ position:"relative", marginBottom:8 }}>
      <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#94A3B8" }}>🔍</span>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…"
        style={{ width:"100%", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"8px 12px 8px 30px", fontSize:12, color:"#1E293B", outline:"none", boxSizing:"border-box" }} />
    </div>
    <div style={{ border:"1.5px solid #E2E8F0", borderRadius:10, overflow:"hidden", maxHeight:180, overflowY:"auto", background: "#fff" }}>
      {filtered.map((p, i) => {
        const sel = selectedIds.map(String).includes(String(p._id || p.id));
        const atLim = limit && !sel && selectedIds.length >= limit;
        return <div key={p._id || p.id} onClick={() => !atLim && toggle(p._id || p.id)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderBottom:i<filtered.length-1?"1px solid #F1F5F9":"none", cursor:atLim?"not-allowed":"pointer", background:sel?"#F0F1FF":"#fff", opacity:atLim?0.4:1 }}>
          <img src={getImageUrl(p.images?.[0] || p.image)} alt="" style={{ width:32, height:32, borderRadius:7, objectFit:"cover" }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#1E293B", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</div>
            <div style={{ fontSize:10, color:"#94A3B8", marginTop:1 }}>{fmt(p.price)}</div>
          </div>
          <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${sel?"#1A1464":"#CBD5E1"}`, background:sel?"#1A1464":"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

export default function MyStoreTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Real seller details
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasStoreProfile, setHasStoreProfile] = useState(false);
  const [realProducts, setRealProducts] = useState([]);
  
  // Builder configuration
  const [config, setConfig] = useState(null);
  const [activeTabPanel, setActiveTabPanel] = useState("general"); // general | colors | banner | ticker | blocks
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  
  // Preview mode (device frame)
  const [previewDevice, setPreviewDevice] = useState("desktop"); // mobile | tablet | desktop

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // 1. Get seller store profile
        const storeRes = await api.get("/seller/store");
        setIsSubscribed(storeRes.data.isSubscribedSeller);
        setHasStoreProfile(storeRes.data.hasStore);
        
        // 2. Get seller products
        const prodRes = await api.get("/seller/products");
        setRealProducts(prodRes.data || []);
        
        // 3. Get layout configuration
        const configRes = await api.get("/seller/store-config");
        setConfig(configRes.data);
      } catch (err) {
        console.error("Init store builder error:", err);
        setErrorMsg("Failed to load store builder data.");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { data } = await api.put("/seller/store-config", config);
      setConfig(data);
      setSuccessMsg("Store configuration saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Save config error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const moveBlock = (index, direction) => {
    if (!isSubscribed) return;
    const newBlocks = [...config.blocks];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setConfig({ ...config, blocks: newBlocks });
  };

  const toggleBlockVisibility = (id) => {
    if (!isSubscribed) return;
    setConfig({
      ...config,
      blocks: config.blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b)
    });
  };

  const deleteBlock = (id) => {
    if (!isSubscribed) return;
    setConfig({
      ...config,
      blocks: config.blocks.filter(b => b.id !== id)
    });
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const addBlock = (type) => {
    if (!isSubscribed) return;
    const bType = BLOCK_TYPES.find(x => x.id === type);
    if (!bType) return;
    
    let defaultBlockConfig = {};
    if (type === "section_products") {
      defaultBlockConfig = { sectionType: "featured", productIds: [], collections: [] };
    } else if (type === "category_nav") {
      defaultBlockConfig = { categories: [] };
    } else if (type === "spotlight") {
      defaultBlockConfig = { imageUrl: "", imagePosition: "right", title: "Spotlight Title", subtitle: "Spotlight description text...", buttonType: "cart", productId: null };
    } else if (type === "bulk_row") {
      defaultBlockConfig = { productOrder: [] };
    } else if (type === "reviews") {
      defaultBlockConfig = { reviews: [] };
    }

    const newBlock = {
      id: uid(),
      type,
      visible: true,
      label: bType.label,
      config: defaultBlockConfig
    };

    setConfig({
      ...config,
      blocks: [...config.blocks, newBlock]
    });
    setSelectedBlockId(newBlock.id);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Store Builder...</div>;
  }

  if (!hasStoreProfile) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
        <Store size={48} className="mx-auto text-amber-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white mb-2">Create your store profile first</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
          Before customizing your store builder layout, you must define your store name, logo, address, and subdomain url on the "My Store" tab.
        </p>
      </div>
    );
  }

  // Active theme definitions
  const activeThemeObj = THEMES.find(t => t.id === config.themeId) || THEMES[0];
  const accentColor = config.accentColor || "#F59E0B";

  const selectedBlock = config.blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="text-slate-200">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Store className="text-amber-400" /> MyStore Builder
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Customize layout, color theme, and content blocks of your public store link.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {errorMsg && <div className="text-xs font-semibold text-rose-500 bg-rose-950/40 border border-rose-800 px-3 py-1.5 rounded-lg">{errorMsg}</div>}
          {successMsg && <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-3 py-1.5 rounded-lg animate-fade-in">{successMsg}</div>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save Store Configuration"}
          </button>
        </div>
      </div>

      {/* Plan limits warnings */}
      {!isSubscribed && (
        <div className="mb-6 p-4 rounded-xl border border-amber-900/50 bg-amber-950/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap className="text-amber-400 fill-amber-400/20 shrink-0" size={24} />
            <div>
              <p className="text-sm font-bold text-amber-300">Free Subscription Plan active</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                Advanced customizations (color schemes, banner, announcement ticker, customizable blocks) are premium features.
              </p>
            </div>
          </div>
          <Link to="/seller/premium" className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg shadow-md transition-all shrink-0">
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Workspace container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: CONFIG EDITOR */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            {/* Sidebar navigation tabs */}
            <div className="flex border-b border-slate-700 text-xs font-bold bg-slate-900/60 overflow-x-auto">
              {[
                { id: "general", label: "General", icon: Settings },
                { id: "colors", label: "Themes", icon: Palette },
                { id: "banner", label: "Banner", icon: Layout },
                { id: "ticker", label: "Ticker", icon: Megaphone },
                { id: "blocks", label: "Blocks", icon: Layout },
              ].map(t => {
                const Icon = t.icon;
                const active = activeTabPanel === t.id;
                return <button
                  key={t.id}
                  onClick={() => { setActiveTabPanel(t.id); }}
                  className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold whitespace-nowrap transition-colors ${active ? "border-amber-400 text-amber-400 bg-slate-800/50" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  <Icon size={14} /> {t.label}
                </button>;
              })}
            </div>

            {/* Sidebar tab panel content */}
            <div className="p-5">
              
              {/* Tab 1: General Info */}
              {activeTabPanel === "general" && (
                <div className="space-y-4">
                  <Field label="Store Name"><Inp value={config.storeName || ""} onChange={e => setConfig({...config, storeName: e.target.value})} placeholder="Ritu Handicrafts" /></Field>
                  <Field label="Store Tagline"><Inp value={config.tagline || ""} onChange={e => setConfig({...config, tagline: e.target.value})} placeholder="Handcrafted with love from Jaipur" /></Field>
                  <Field label="Description"><Txt value={config.description || ""} onChange={e => setConfig({...config, description: e.target.value})} placeholder="Authentic Rajasthani handicrafts..." /></Field>
                  <Field label="Store Handle (Slug)"><Inp value={config.handle || ""} onChange={e => setConfig({...config, handle: e.target.value})} placeholder="ritu-handicrafts" disabled={true} /></Field>
                  <Field label="Grid Columns Selector"><Inp type="number" min={2} max={4} value={config.gridColumns || 4} onChange={e => setConfig({...config, gridColumns: Math.max(2, Math.min(4, parseInt(e.target.value) || 4))})} /></Field>
                  <div className="flex items-center justify-between py-2 border-t border-slate-700/50 mt-4">
                    <div>
                      <span className="text-sm font-semibold text-slate-200">Hide Out-Of-Stock Products</span>
                      <p className="text-[11px] text-slate-400">Do not display products with 0 stock in listing</p>
                    </div>
                    <Toggle on={config.hideOutOfStock} onChange={on => setConfig({...config, hideOutOfStock: on})} />
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-slate-700/50">
                    <div>
                      <span className="text-sm font-semibold text-slate-200">Show Product Ratings</span>
                      <p className="text-[11px] text-slate-400">Render star rating indicator on product card</p>
                    </div>
                    <Toggle on={config.showRatings} onChange={on => setConfig({...config, showRatings: on})} />
                  </div>
                </div>
              )}

              {/* Tab 2: Theme Settings (Subscribed sellers only) */}
              {activeTabPanel === "colors" && (
                <div className="space-y-5">
                  <Field label="Color Theme Preset">
                    <div className="grid grid-cols-2 gap-3">
                      {THEMES.map(t => {
                        const isSel = config.themeId === t.id;
                        const disabled = !isSubscribed && t.id !== "light";
                        return <button
                          key={t.id}
                          disabled={disabled}
                          onClick={() => setConfig({ ...config, themeId: t.id })}
                          style={{
                            padding: "10px",
                            border: `2px solid ${isSel ? "#1A1464" : "#e2e8f0"}`,
                            borderRadius: "10px",
                            backgroundColor: t.bg,
                            color: t.text,
                            textAlign: "left",
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.4 : 1,
                            position: "relative"
                          }}
                        >
                          <div style={{ fontSize: "12px", fontWeight: "bold" }}>{t.label}</div>
                          <div style={{ fontSize: "10px", color: t.subtext, marginTop: "2px" }}>Sample Text</div>
                          {disabled && <span style={{ position: "absolute", right: 6, top: 6, fontSize: 10 }}>🔒</span>}
                        </button>;
                      })}
                    </div>
                  </Field>

                  <Field label="Accent Brand Color">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {PRESET_COLORS.map(c => {
                        const isSel = (config.accentColor || "").toLowerCase() === c.toLowerCase();
                        const disabled = !isSubscribed;
                        return <button
                          key={c}
                          disabled={disabled}
                          onClick={() => setConfig({ ...config, accentColor: c })}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: c,
                            border: isSel ? "3px solid #1A1464" : "1px solid #fff",
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.3 : 1
                          }}
                        />;
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Inp value={config.accentColor || ""} onChange={e => isSubscribed && setConfig({ ...config, accentColor: e.target.value })} placeholder="#F59E0B" disabled={!isSubscribed} style={{ flex: 1 }} />
                      <input type="color" value={config.accentColor || "#F59E0B"} onChange={e => isSubscribed && setConfig({ ...config, accentColor: e.target.value })} disabled={!isSubscribed} style={{ width: 40, height: 36, border: "1px solid #CBD5E1", borderRadius: 8, cursor: isSubscribed ? "pointer" : "not-allowed" }} />
                    </div>
                  </Field>
                </div>
              )}

              {/* Tab 3: Banners Settings */}
              {activeTabPanel === "banner" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                    <div>
                      <span className="text-sm font-semibold text-slate-200">Promotional Top Banner</span>
                      <p className="text-[11px] text-slate-400">Displays a thin banner above the header</p>
                    </div>
                    <Toggle on={config.promoBannerEnabled} onChange={on => isSubscribed && setConfig({...config, promoBannerEnabled: on})} disabled={!isSubscribed} />
                  </div>
                  {config.promoBannerEnabled && isSubscribed && (
                    <div className="p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl space-y-3 animate-fade-in">
                      <Field label="Promo Text"><Inp value={config.promoBannerText || ""} onChange={e => setConfig({...config, promoBannerText: e.target.value})} placeholder="Festive Sale — Up to 30% Off" /></Field>
                      <Field label="Promo Button Label"><Inp value={config.promoBannerBtnLabel || ""} onChange={e => setConfig({...config, promoBannerBtnLabel: e.target.value})} placeholder="View Deals" /></Field>
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-white mt-6 mb-2">Main Store Banner</h3>
                  <Field label="Banner Background Image">
                    <ImgUpload value={config.bannerUrl} onUpload={url => setConfig({...config, bannerUrl: url})} aspect="4/1" disabled={!isSubscribed} hint="Recommended size: 1200×300px" />
                  </Field>
                  <Field label="Banner Title"><Inp value={config.bannerTitle || ""} onChange={e => isSubscribed && setConfig({...config, bannerTitle: e.target.value})} placeholder="Authentic Rajasthani Crafts" disabled={!isSubscribed} /></Field>
                  <Field label="Banner Subtitle"><Inp value={config.bannerSubtitle || ""} onChange={e => isSubscribed && setConfig({...config, bannerSubtitle: e.target.value})} placeholder="Handcrafted by artisans since 1998" disabled={!isSubscribed} /></Field>
                  <Field label="Banner Button Label"><Inp value={config.bannerBtnLabel || ""} onChange={e => isSubscribed && setConfig({...config, bannerBtnLabel: e.target.value})} placeholder="Shop Now" disabled={!isSubscribed} /></Field>
                </div>
              )}

              {/* Tab 4: Announcement Ticker */}
              {activeTabPanel === "ticker" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                    <div>
                      <span className="text-sm font-semibold text-slate-200">Announcement Ticker Text</span>
                      <p className="text-[11px] text-slate-400">Sliding marquee ticker beneath banner</p>
                    </div>
                    <Toggle on={config.tickerEnabled} onChange={on => isSubscribed && setConfig({...config, tickerEnabled: on})} disabled={!isSubscribed} />
                  </div>
                  {config.tickerEnabled && isSubscribed && (
                    <div className="p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl animate-fade-in">
                      <Field label="Ticker Text"><Txt value={config.tickerText || ""} onChange={e => setConfig({...config, tickerText: e.target.value})} placeholder="Free shipping on orders above ₹499..." rows={2} /></Field>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Customizable Blocks */}
              {activeTabPanel === "blocks" && (
                <div className="space-y-4">
                  
                  {/* Dynamic list of current layout blocks */}
                  <div className="flex flex-col gap-2">
                    <span className={S.label}>Active Blocks (Top to Bottom)</span>
                    {(!config.blocks || config.blocks.length === 0) ? (
                      <div className="p-6 text-center border border-dashed border-slate-700 text-slate-500 rounded-xl text-xs">
                        No active custom blocks. Free template uses standard list view.
                      </div>
                    ) : (
                      config.blocks.map((b, index) => {
                        const isSel = selectedBlockId === b.id;
                        const isLast = index === config.blocks.length - 1;
                        return <div key={b.id} className={`flex flex-col border rounded-xl overflow-hidden ${isSel ? "border-amber-400 bg-slate-800/40" : "border-slate-700 bg-slate-900/20"}`}>
                          <div className="flex items-center gap-2.5 px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => { setSelectedBlockId(isSel ? null : b.id); }}
                              className="flex-1 text-left text-xs font-bold text-slate-200 truncate flex items-center gap-1.5"
                            >
                              <Layout size={12} className="text-slate-400" /> {b.label} {!b.visible && <span className="text-[9px] text-rose-500 font-semibold">(hidden)</span>}
                            </button>
                            <div className="flex items-center gap-1">
                              <button onClick={() => moveBlock(index, -1)} disabled={index === 0 || !isSubscribed} className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"><ArrowUp size={12} /></button>
                              <button onClick={() => moveBlock(index, 1)} disabled={isLast || !isSubscribed} className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"><ArrowDown size={12} /></button>
                              <button onClick={() => toggleBlockVisibility(b.id)} disabled={!isSubscribed} className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"><Eye size={12} /></button>
                              <button onClick={() => deleteBlock(b.id)} disabled={!isSubscribed} className="p-1 hover:bg-slate-700/50 hover:text-rose-400 rounded text-slate-400 disabled:opacity-30"><Trash size={12} /></button>
                            </div>
                          </div>
                          
                          {/* Expanded settings inside block items */}
                          {isSel && isSubscribed && (
                            <div className="p-4 border-t border-slate-700/80 bg-slate-900/40 space-y-3">
                              <Field label="Block Label"><Inp value={b.label} onChange={e => {
                                setConfig({
                                  ...config,
                                  blocks: config.blocks.map(x => x.id === b.id ? { ...x, label: e.target.value } : x)
                                });
                              }} /></Field>
                              
                              {/* Spotlight specific layout editing */}
                              {b.type === "spotlight" && (
                                <SpotlightConfig config={b.config} products={realProducts} onChange={newBc => {
                                  setConfig({
                                    ...config,
                                    blocks: config.blocks.map(x => x.id === b.id ? { ...x, config: newBc } : x)
                                  });
                                }} />
                              )}

                              {/* Products section editing */}
                              {b.type === "section_products" && (
                                <SectionProductsConfig config={b.config} products={realProducts} onChange={newBc => {
                                  setConfig({
                                    ...config,
                                    blocks: config.blocks.map(x => x.id === b.id ? { ...x, config: newBc } : x)
                                  });
                                }} />
                              )}

                              {/* Bulk row editing */}
                              {b.type === "bulk_row" && (
                                <BulkRowConfig config={b.config} products={realProducts} onChange={newBc => {
                                  setConfig({
                                    ...config,
                                    blocks: config.blocks.map(x => x.id === b.id ? { ...x, config: newBc } : x)
                                  });
                                }} />
                              )}

                              {/* Reviews editing */}
                              {b.type === "reviews" && (
                                <ReviewsConfig config={b.config} onChange={newBc => {
                                  setConfig({
                                    ...config,
                                    blocks: config.blocks.map(x => x.id === b.id ? { ...x, config: newBc } : x)
                                  });
                                }} />
                              )}

                              {/* Category navigator tree editing */}
                              {b.type === "category_nav" && (
                                <CategoryNavConfig config={b.config} products={realProducts} onChange={newBc => {
                                  setConfig({
                                    ...config,
                                    blocks: config.blocks.map(x => x.id === b.id ? { ...x, config: newBc } : x)
                                  });
                                }} />
                              )}
                            </div>
                          )}
                        </div>;
                      })
                    )}
                  </div>

                  {/* Add Block button triggers */}
                  {isSubscribed ? (
                    <div className="border-t border-slate-700/50 mt-6 pt-4">
                      <span className={S.label}>Add Content Block</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {BLOCK_TYPES.map(bt => (
                          <button
                            key={bt.id}
                            onClick={() => addBlock(bt.id)}
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-left rounded-xl border border-slate-700 flex items-start gap-2.5 transition-colors group"
                          >
                            <span className="text-lg group-hover:scale-110 transition-transform shrink-0">{bt.icon}</span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-200">{bt.label}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 leading-snug">{bt.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center mt-4 text-xs text-slate-400">
                      🔒 Advanced custom block customization is locked.
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE STOREFRONT PREVIEW */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Storefront Preview</span>
            <div className="flex bg-[#1e293b] p-1 rounded-xl border border-slate-700 text-xs font-semibold">
              {["mobile", "tablet", "desktop"].map(dev => (
                <button
                  key={dev}
                  onClick={() => setPreviewDevice(dev)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${previewDevice === dev ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {dev}
                </button>
              ))}
            </div>
          </div>

          {/* Device Mockup Wrapper */}
          <div className="flex justify-center bg-slate-900 border border-slate-800 rounded-2xl p-4 min-h-[500px] overflow-hidden shadow-2xl relative">
            <div
              className="transition-all duration-300 w-full"
              style={{
                maxWidth: previewDevice === "mobile" ? "375px" : previewDevice === "tablet" ? "768px" : "100%",
                border: previewDevice !== "desktop" ? "10px solid #1e293b" : "none",
                borderRadius: previewDevice !== "desktop" ? "24px" : "0px",
                height: "100%",
                background: activeThemeObj.bg
              }}
            >
              <StorePreview config={config} products={realProducts} isSubscribedSeller={isSubscribed} theme={activeThemeObj} accent={accentColor} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── EDITOR CONFIG SUB-COMPONENTS ───

// Spotlight block editor panel
function SpotlightConfig({ config, products, onChange }) {
  return <div className="space-y-3">
    <Field label="Banner Title">
      <Inp value={config.title || ""} onChange={e => onChange({ ...config, title: e.target.value })} placeholder="Spotlight title..." />
    </Field>
    <Field label="Banner Description">
      <Txt value={config.subtitle || ""} onChange={e => onChange({ ...config, subtitle: e.target.value })} placeholder="Description of the spotlight item..." rows={2} />
    </Field>
    <Field label="Image Position">
      <div className="flex gap-2">
        {["left", "right"].map(pos => (
          <button key={pos} type="button" onClick={() => onChange({ ...config, imagePosition: pos })}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border capitalize transition-colors ${config.imagePosition === pos ? "bg-amber-400 text-slate-950 border-amber-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
            {pos}
          </button>
        ))}
      </div>
    </Field>
    <Field label="Spotlight Image (1:1 Ratio)">
      <ImgUpload value={config.imageUrl} onUpload={url => onChange({ ...config, imageUrl: url })} aspect="1/1" />
    </Field>
    <Field label="Action Button Action">
      <div className="flex gap-2">
        {[{id:"cart",label:"Add to Cart"},{id:"bulk",label:"Bulk Order"}].map(b => (
          <button key={b.id} type="button" onClick={() => onChange({ ...config, buttonType: b.id })}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${config.buttonType === b.id ? "bg-amber-400 text-slate-950 border-amber-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
            {b.label}
          </button>
        ))}
      </div>
    </Field>
    <Field label="Linked Product Link">
      <ProductPicker products={products} selectedIds={config.productId ? [config.productId] : []} onChange={ids => onChange({ ...config, productId: ids[ids.length - 1] || null })} limit={1} />
    </Field>
  </div>;
}

// Section Products block editor panel
function SectionProductsConfig({ config, products, onChange }) {
  const opt = SECTION_OPTIONS.find(o => o.id === config.sectionType) || SECTION_OPTIONS[0];
  return <div className="space-y-3">
    <Field label="Section Listing Type">
      <div className="grid grid-cols-2 gap-2">
        {SECTION_OPTIONS.map(o => (
          <button key={o.id} type="button" onClick={() => onChange({ ...config, sectionType: o.id })}
            className={`p-2 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${config.sectionType === o.id ? "bg-amber-400 text-slate-950 border-amber-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
            <span>{o.icon}</span> <span>{o.label}</span>
          </button>
        ))}
      </div>
    </Field>
    {config.sectionType !== "collections" ? (
      <Field label={`Select Products (${opt.label})`} hint={opt.limit ? `Up to ${opt.limit}` : ""}>
        <ProductPicker products={products} selectedIds={config.productIds || []} onChange={ids => onChange({ ...config, productIds: ids })} limit={opt.limit} ordered={true} />
      </Field>
    ) : (
      <CollectionsEditor collections={config.collections || []} products={products} onChange={cols => onChange({ ...config, collections: cols })} />
    )}
  </div>;
}

// Bulk Order row block editor panel
function BulkRowConfig({ config, products, onChange }) {
  return <div className="space-y-3">
    <Field label="Select Bulk Order Products">
      <ProductPicker products={products} selectedIds={config.productOrder || []} onChange={ids => onChange({ ...config, productOrder: ids })} ordered={true} />
    </Field>
  </div>;
}

// Reviews block editor panel
function ReviewsConfig({ config, onChange }) {
  const reviews = config.reviews || [];
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:"", avatar:"", rating:5, title:"", text:"" });

  const openNew = () => { setForm({ name:"", avatar:"", rating:5, title:"", text:"" }); setEditing("new"); };
  const openEdit = (r) => { setForm({...r}); setEditing(r.id); };
  const saveReview = () => {
    if (!form.name.trim()||!form.text.trim()) return;
    if (editing==="new") onChange({...config, reviews:[...reviews,{...form,id:uid()}]});
    else onChange({...config, reviews:reviews.map(r=>r.id===editing?{...form,id:editing}:r)});
    setEditing(null);
  };

  return <div className="space-y-3">
    {reviews.map(r => (
      <div key={r.id} className="flex items-start gap-2.5 p-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
        <img src={r.avatar || "https://i.pravatar.cc/60?img=47"} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-200">{r.name}</div>
          <div className="text-amber-400 mt-0.5">{"★".repeat(r.rating)}</div>
          <div className="font-semibold text-slate-300 mt-1">{r.title}</div>
          <div className="text-slate-400 mt-0.5 truncate">{r.text}</div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => openEdit(r)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded">Edit</button>
          <button onClick={() => onChange({...config, reviews: reviews.filter(x => x.id !== r.id)})} className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded">✕</button>
        </div>
      </div>
    ))}

    {editing ? (
      <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-3">
        <div className="text-xs font-bold text-slate-200">{editing === "new" ? "New Review" : "Edit Review"}</div>
        <Field label="Customer Name"><Inp value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Priya Iyer" /></Field>
        <Field label="Avatar Image Link"><Inp value={form.avatar} onChange={e => setForm({...form, avatar: e.target.value})} placeholder="https://..." /></Field>
        <Field label="Rating Stars">
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setForm({...form, rating: n})} className={`w-8 h-8 rounded-lg font-bold border text-sm flex items-center justify-center ${form.rating >= n ? "bg-amber-400 border-amber-400 text-slate-950" : "bg-slate-800 border-slate-700 text-slate-400"}`}>★</button>
            ))}
          </div>
        </Field>
        <Field label="Review Title"><Inp value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Absolutely stunning quality!" /></Field>
        <Field label="Review Description"><Txt value={form.text} onChange={e => setForm({...form, text: e.target.value})} placeholder="Write the description details..." rows={2} /></Field>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(null)} className="flex-1 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">Cancel</button>
          <button type="button" onClick={saveReview} className="flex-1 py-1.5 text-xs font-bold bg-amber-400 text-slate-950 rounded-lg">Save</button>
        </div>
      </div>
    ) : (
      <button type="button" onClick={openNew} className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold rounded-lg border border-dashed border-slate-700 text-slate-300">+ Add Customer Review</button>
    )}
  </div>;
}

// Category tree config panel builder
function CategoryNavConfig({ config, products, onChange }) {
  const [openCat, setOpenCat] = useState(null);
  const [openSub, setOpenSub] = useState(null);
  const cats = config.categories || [];

  const updateCats = (newCats) => onChange({ ...config, categories: newCats });

  const addCat = () => updateCats([...cats, { id:uid(), name:"New Category", subCategories:[] }]);
  const delCat = (cid) => updateCats(cats.filter(c=>c.id!==cid));
  const renCat = (cid, name) => updateCats(cats.map(c=>c.id===cid?{...c,name}:c));

  const addSub = (cid) => updateCats(cats.map(c=>c.id===cid?{...c,subCategories:[...c.subCategories,{id:uid(),name:"New Sub-category",productTypes:[]}]}:c));
  const delSub = (cid,sid) => updateCats(cats.map(c=>c.id===cid?{...c,subCategories:c.subCategories.filter(s=>s.id!==sid)}:c));
  const renSub = (cid,sid,name) => updateCats(cats.map(c=>c.id===cid?{...c,subCategories:c.subCategories.map(s=>s.id===sid?{...s,name}:s)}:c));

  const addPT = (cid,sid) => updateCats(cats.map(c=>c.id===cid?{...c,subCategories:c.subCategories.map(s=>s.id===sid?{...s,productTypes:[...s.productTypes,{id:uid(),name:"New Product Type",productIds:[]}]}:s)}:c));
  const delPT = (cid,sid,pid) => updateCats(cats.map(c=>c.id===cid?{...c,subCategories:c.subCategories.map(s=>s.id===sid?{...s,productTypes:s.productTypes.filter(pt=>pt.id!==pid)}:s)}:c));
  const renPT = (cid,sid,pid,name) => updateCats(cats.map(c=>c.id===cid?{...c,subCategories:c.subCategories.map(s=>s.id===sid?{...s,productTypes:s.productTypes.map(pt=>pt.id===pid?{...pt,name}:pt)}:s)}:c));
  const setPTProds = (cid,sid,ptid,pids) => updateCats(cats.map(c=>c.id===cid?{...c,subCategories:c.subCategories.map(s=>s.id===sid?{...s,productTypes:s.productTypes.map(pt=>pt.id===ptid?{...pt,productIds:pids}:pt)}:s)}:c));

  return <div className="space-y-2.5">
    {cats.map(cat => (
      <div key={cat.id} className="border border-slate-700 bg-slate-900/30 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-2.5 bg-slate-800/40 cursor-pointer" onClick={() => setOpenCat(openCat===cat.id?null:cat.id)}>
          <span className="text-slate-400">▶</span>
          <Inp value={cat.name} onChange={e => {e.stopPropagation(); renCat(cat.id, e.target.value);}} style={{ flex:1, padding:"4px 8px", fontSize:"12px" }} />
          <button type="button" onClick={e => {e.stopPropagation(); delCat(cat.id);}} className="text-rose-400 p-1 hover:bg-slate-700/50 rounded">✕</button>
        </div>
        
        {openCat === cat.id && (
          <div className="p-3 bg-slate-900/50 border-t border-slate-700/50 space-y-2">
            {cat.subCategories.map(sub => (
              <div key={sub.id} className="border border-slate-700/80 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-slate-850 cursor-pointer" onClick={() => setOpenSub(openSub===sub.id?null:openSub)}>
                  <span className="text-slate-400 ml-2">└</span>
                  <Inp value={sub.name} onChange={e => {e.stopPropagation(); renSub(cat.id, sub.id, e.target.value);}} style={{ flex:1, padding:"3px 6px", fontSize:"11px" }} />
                  <button type="button" onClick={e => {e.stopPropagation(); delSub(cat.id, sub.id);}} className="text-rose-450 p-1 hover:bg-slate-750 rounded">✕</button>
                </div>

                {openSub === sub.id && (
                  <div className="p-2.5 bg-slate-900/80 border-t border-slate-750 space-y-2">
                    {sub.productTypes.map(pt => (
                      <div key={pt.id} className="p-2.5 bg-slate-850 rounded-lg border border-slate-700 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 ml-3">└</span>
                          <Inp value={pt.name} onChange={e => renPT(cat.id, sub.id, pt.id, e.target.value)} style={{ flex:1, padding:"2px 5px", fontSize:"11px" }} />
                          <button type="button" onClick={() => delPT(cat.id, sub.id, pt.id)} className="text-rose-450 p-1 hover:bg-slate-700 rounded">✕</button>
                        </div>
                        <div className="pl-6">
                          <ProductPicker products={products} selectedIds={pt.productIds || []} onChange={pids => setPTProds(cat.id, sub.id, pt.id, pids)} />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => addPT(cat.id, sub.id)} className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold text-indigo-300 rounded border border-dashed border-indigo-900/50">+ Add Product Type</button>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addSub(cat.id)} className="w-full py-1.5 bg-slate-850 hover:bg-slate-800 text-[10px] font-bold text-slate-300 rounded border border-dashed border-slate-700">+ Add Sub-category</button>
          </div>
        )}
      </div>
    ))}
    <button type="button" onClick={addCat} className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold rounded-lg border border-dashed border-slate-700 text-amber-300">+ Add Main Category</button>
  </div>;
}

// Collections inline editor
function CollectionsEditor({ collections, products, onChange }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:"", description:"", productIds:[] });

  const openNew  = () => { setForm({name:"",description:"",productIds:[]}); setEditing("new"); };
  const openEdit = (c) => { setForm({...c}); setEditing(c.id); };
  const save = () => {
    if (!form.name.trim()||!form.productIds.length) return;
    if (editing==="new") onChange([...collections,{...form,id:uid()}]);
    else onChange(collections.map(c=>c.id===editing?{...form,id:editing}:c));
    setEditing(null);
  };

  return <div className="space-y-2">
    {collections.map(c => (
      <div key={c.id} className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-200">{c.name}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{c.productIds.length} items</div>
        </div>
        <button type="button" onClick={() => openEdit(c)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded">Edit</button>
        <button type="button" onClick={() => onChange(collections.filter(x => x.id !== c.id))} className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded">✕</button>
      </div>
    ))}

    {editing ? (
      <div className="p-3 bg-slate-900 border border-slate-750 rounded-xl space-y-3">
        <div className="text-xs font-bold text-slate-200">{editing === "new" ? "New Collection" : "Edit Collection"}</div>
        <Field label="Collection Name"><Inp value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Festive Collection" /></Field>
        <Field label="Description"><Inp value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional description..." /></Field>
        <Field label="Pick Products"><ProductPicker products={products} selectedIds={form.productIds || []} onChange={pids => setForm({...form, productIds: pids})} ordered={true} /></Field>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(null)} className="flex-1 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">Cancel</button>
          <button type="button" onClick={save} disabled={!form.name.trim() || !form.productIds.length} className="flex-1 py-1.5 text-xs font-bold bg-amber-400 text-slate-950 rounded-lg disabled:opacity-40">Save Collection</button>
        </div>
      </div>
    ) : (
      <button type="button" onClick={openNew} className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold rounded-lg border border-dashed border-slate-700 text-indigo-300">+ New Collection</button>
    )}
  </div>;
}


// ─── LIVE PREVIEW RENDERER ───
function StorePreview({ config, products = [], isSubscribedSeller, theme, accent }) {
  const [activeCat, setActiveCat] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [activePT,  setActivePT]  = useState(null);

  const MiniCard = ({ product }) => {
    const [quantity, setQuantity] = useState(1);
    const hasSale = product.compareAtPrice && product.compareAtPrice > product.price;
    const saleLabel = hasSale ? `${Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF` : "";

    return (
      <div style={{ background: theme.cardBg, borderRadius: 10, border: `1px solid ${theme.border}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden" }}>
          <img src={getImageUrl(product.images?.[0] || product.image)} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {hasSale && (
            <div style={{ position: "absolute", top: 0, right: 0, background: "#E8173C", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px", borderBottomLeftRadius: 7 }}>
              {saleLabel}
            </div>
          )}
        </div>
        <div style={{ padding: "7px 8px 9px" }}>
          <div style={{ fontWeight: 600, color: theme.text, fontSize: 10, lineHeight: 1.3, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.title}
          </div>
          {config.showRatings && (product.averageRating || product.rating) && (
            <div style={{ color: accent, fontSize: 9, marginBottom: 3 }}>
              {"★".repeat(Math.round(product.averageRating || product.rating))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, color: theme.text, fontSize: 11 }}>
              {fmt(product.price)}
            </span>
            {hasSale && (
              <span style={{ color: theme.subtext, textDecoration: "line-through", fontSize: 9 }}>
                {fmt(product.compareAtPrice)}
              </span>
            )}
          </div>
          
          {/* Quantity + / - Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, gap: 4 }}>
            <div style={{ display: "flex", border: `1px solid ${theme.border}`, borderRadius: 5, overflow: "hidden", background: theme.bg }}>
              <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 16, height: 16, border: "none", background: "none", color: theme.text, fontSize: 10, cursor: "pointer" }}>-</button>
              <span style={{ width: 14, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: theme.text }}>{quantity}</span>
              <button type="button" onClick={() => setQuantity(q => q + 1)} style={{ width: 16, height: 16, border: "none", background: "none", color: theme.text, fontSize: 10, cursor: "pointer" }}>+</button>
            </div>
            <button type="button" style={{ flex: 1, padding: "3px 0", background: accent, border: "none", borderRadius: 5, fontSize: 9, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              Add
            </button>
          </div>
          
          {/* Bulk buy option only for paid sellers */}
          {isSubscribedSeller && (
            <button type="button" style={{ marginTop: 4, width: "100%", padding: "3px 0", background: "#1A1464", border: "none", borderRadius: 5, fontSize: 8, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              📦 Bulk Buy
            </button>
          )}
        </div>
      </div>
    );
  };

  const SectionHdr = ({ title }) => (
    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
      <div style={{ width:4, height:16, background:accent, borderRadius:2 }} />
      <div style={{ fontFamily:"sans-serif", fontWeight:700, fontSize:13, color:theme.text }}>{title}</div>
    </div>
  );

  const renderBlock = (block) => {
    if (!block.visible) return null;
    const bc = block.config;
    const cols = config.gridColumns || 4;

    if (block.type === "section_products") {
      if (bc.sectionType === "collections") {
        const cols2 = bc.collections || [];
        if (!cols2.length) return null;
        return <div key={block.id} style={{ padding:"12px 10px", borderBottom: `1px solid ${theme.border}` }}>
          <SectionHdr title="Collections" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {cols2.map(c => (
              <div key={c.id} style={{ background:accent+"15", border:`1.5px solid ${accent}30`, borderRadius:9, padding:"10px" }}>
                <div style={{ fontWeight:700, fontSize:12, color:theme.text }}>{c.name}</div>
                <div style={{ fontSize:9, color:theme.subtext }}>{c.productIds.length} products</div>
                <div style={{ display:"flex", gap:4, marginTop:6 }}>
                  {c.productIds.slice(0,3).map(pid => {
                    const p = products.find(x => String(x._id || x.id) === String(pid));
                    return p ? <img key={pid} src={getImageUrl(p.images?.[0] || p.image)} alt="" style={{ width:24, height:24, borderRadius:5, objectFit:"cover" }} /> : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>;
      }
      
      const opt = SECTION_OPTIONS.find(o=>o.id===bc.sectionType);
      const filteredProds = (bc.productIds||[])
        .map(id => products.find(p => String(p._id || p.id) === String(id)))
        .filter(Boolean)
        .filter(p => config.hideOutOfStock ? (p.stock && p.stock > 0) : true);

      if (!filteredProds.length) return <div key={block.id} style={{ padding:"12px 10px", fontSize:11, color:theme.subtext, fontStyle:"italic" }}>No products in {opt?.label}</div>;

      return <div key={block.id} style={{ padding:"12px 10px", borderBottom: `1px solid ${theme.border}` }}>
        <SectionHdr title={opt?.label||""} />
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:10 }}>
          {filteredProds.slice(0, cols * 2).map(p=><MiniCard key={p._id || p.id} product={p} />)}
        </div>
      </div>;
    }

    if (block.type === "category_nav") {
      const cats = bc.categories || [];
      if (!cats.length) return null;
      const curCat = cats.find(c => c.id === activeCat);
      const curSub = curCat?.subCategories?.find(s => s.id === activeSub);
      const curPT  = curSub?.productTypes?.find(pt => pt.id === activePT);
      const filteredProds = curPT ? (curPT.productIds || [])
        .map(id => products.find(p => String(p._id || p.id) === String(id)))
        .filter(Boolean) : [];

      return <div key={block.id} style={{ padding:"10px", borderBottom: `1px solid ${theme.border}` }}>
        {/* Category tabs */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => { setActiveCat(activeCat===c.id?null:c.id); setActiveSub(null); setActivePT(null); }}
              style={{ padding:"4px 10px", border:`1.5px solid ${activeCat===c.id?accent:theme.border}`, borderRadius:20, background:activeCat===c.id?accent:theme.cardBg, color:activeCat===c.id?"#fff":theme.text, fontSize:10, fontWeight:600, cursor:"pointer" }}>
              {c.name}
            </button>
          ))}
        </div>
        {/* Sub-category */}
        {curCat && (
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
            {curCat.subCategories.map(s => (
              <button key={s.id} onClick={() => { setActiveSub(activeSub===s.id?null:s.id); setActivePT(null); }}
                style={{ padding:"3px 8px", border:`1.5px solid ${activeSub===s.id?accent:theme.border}`, borderRadius:15, background:activeSub===s.id?accent+"18":theme.bg, color:activeSub===s.id?accent:theme.subtext, fontSize:9, fontWeight:600, cursor:"pointer" }}>
                {s.name}
              </button>
            ))}
          </div>
        )}
        {/* Product types */}
        {curSub && (
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
            {curSub.productTypes.map(pt => (
              <button key={pt.id} onClick={() => setActivePT(activePT===pt.id?null:pt.id)}
                style={{ padding:"3px 8px", border:`1.5px solid ${activePT===pt.id?accent:theme.border}`, borderRadius:15, background:activePT===pt.id?accent+"15":theme.bg, color:activePT===pt.id?accent:theme.subtext, fontSize:9, fontWeight:600, cursor:"pointer" }}>
                {pt.name}
              </button>
            ))}
          </div>
        )}
        {/* Filtered products */}
        {filteredProds.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:10 }}>
            {filteredProds.map(p => <MiniCard key={p._id || p.id} product={p} />)}
          </div>
        )}
      </div>;
    }

    if (block.type === "spotlight") {
      const p = bc.productId ? products.find(x => String(x._id || x.id) === String(bc.productId)) : null;
      const imgLeft = bc.imagePosition === "left";
      return <div key={block.id} style={{ margin:"12px 10px", borderRadius:12, overflow:"hidden", border:`1px solid ${theme.border}`, display:"flex", flexDirection: imgLeft?"row":"row-reverse", background:theme.cardBg }}>
        {bc.imageUrl && <div style={{ width:"38%", flexShrink:0 }}><img src={getImageUrl(bc.imageUrl)} alt="" style={{ width:"100%", aspectRatio:"1/1", objectFit:"cover", display:"block" }} /></div>}
        <div style={{ flex:1, padding:"12px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
          {bc.title    && <div style={{ fontWeight:800, fontSize:13, color:theme.text, lineHeight:1.3, marginBottom:4 }}>{bc.title}</div>}
          {bc.subtitle && <div style={{ fontSize:10, color:theme.subtext, marginBottom:8, lineHeight:1.4 }}>{bc.subtitle}</div>}
          {bc.buttonType === "cart"
            ? <button style={{ padding:"6px 12px", background:accent, border:"none", borderRadius:6, fontSize:9, fontWeight:700, color:"#fff", cursor:"pointer", alignSelf:"flex-start" }}>🛒 Add to Cart</button>
            : <button style={{ padding:"6px 12px", background:"#1A1464", border:"none", borderRadius:6, fontSize:9, fontWeight:700, color:"#fff", cursor:"pointer", alignSelf:"flex-start" }}>📦 Bulk Order</button>
          }
        </div>
      </div>;
    }

    if (block.type === "bulk_row") {
      const rowProds = (bc.productOrder || [])
        .map(id => products.find(p => String(p._id || p.id) === String(id)))
        .filter(Boolean);
      if (!rowProds.length) return <div key={block.id} style={{ padding:"12px 10px", fontSize:11, color:theme.subtext, fontStyle:"italic" }}>No bulk products selected</div>;
      
      return <div key={block.id} style={{ padding:"12px 10px", borderBottom: `1px solid ${theme.border}` }}>
        <SectionHdr title="Bulk Order Row" />
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:10 }}>
          {rowProds.slice(0, cols).map(p => <MiniCard key={p._id || p.id} product={p} />)}
        </div>
      </div>;
    }

    if (block.type === "reviews") {
      const reviewsList = bc.reviews || [];
      if (!reviewsList.length) return null;
      return <div key={block.id} style={{ padding:"12px 10px", borderBottom: `1px solid ${theme.border}` }}>
        <SectionHdr title="Customer Feedback" />
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {reviewsList.map(r => (
            <div key={r.id} style={{ padding:"10px", background:theme.cardBg, border:`1px solid ${theme.border}`, borderRadius:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <img src={r.avatar || "https://i.pravatar.cc/60?img=47"} alt="" style={{ width:24, height:24, borderRadius:"50%", objectFit:"cover" }} />
                <div>
                  <div style={{ fontWeight:700, fontSize:10, color:theme.text }}>{r.name}</div>
                  <div style={{ color:accent, fontSize:8 }}>{"★".repeat(r.rating)}</div>
                </div>
              </div>
              <div style={{ fontWeight:600, fontSize:10, color:theme.text, marginTop:6 }}>{r.title}</div>
              <div style={{ fontSize:9, color:theme.subtext, marginTop:2, lineHeight:1.3 }}>{r.text}</div>
            </div>
          ))}
        </div>
      </div>;
    }
  };

  return (
    <div style={{ minHeight: "100%", width: "100%", background: theme.bg, color: theme.text, fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      {/* 1. Promotional top banner */}
      {config.promoBannerEnabled && isSubscribedSeller && (
        <div style={{ background: accent, color: "#fff", padding: "6px 10px", textTransform: "uppercase", fontSize: 9, fontWeight: 800, letterSpacing: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{config.promoBannerText || "Special Discount Active"}</span>
          {config.promoBannerBtnLabel && (
            <button style={{ border: "1px solid #fff", background: "none", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 8, fontWeight: 700 }}>
              {config.promoBannerBtnLabel}
            </button>
          )}
        </div>
      )}

      {/* 2. Announcement ticker */}
      {config.tickerEnabled && isSubscribedSeller && config.tickerText && (
        <div style={{ background: theme.cardBg, color: theme.subtext, borderBottom: `1px solid ${theme.border}`, padding: "5px 10px", fontSize: 9, overflow: "hidden", whiteSpace: "nowrap" }}>
          <div style={{ display: "inline-block", animation: "marquee 15s linear infinite" }}>
            {config.tickerText}
          </div>
        </div>
      )}

      {/* 3. Main header */}
      <div style={{ padding: "14px 12px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyBetween: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>{config.storeName || "Ritu Handicrafts"}</h1>
          <p style={{ fontSize: 9, color: theme.subtext, marginTop: 2 }}>{config.tagline || " Jaipur crafts"}</p>
        </div>
      </div>

      {/* 4. Main banner */}
      {isSubscribedSeller && config.bannerTitle && (
        <div style={{
          position: "relative",
          backgroundImage: config.bannerUrl ? `url(${getImageUrl(config.bannerUrl)})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: accent + "20",
          padding: "30px 16px",
          textAlign: "center"
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{config.bannerTitle}</h2>
          {config.bannerSubtitle && <p style={{ fontSize: 10, color: theme.subtext, marginTop: 4 }}>{config.bannerSubtitle}</p>}
          {config.bannerBtnLabel && (
            <button style={{ background: accent, border: "none", color: "#fff", borderRadius: 6, padding: "6px 16px", fontSize: 9, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>
              {config.bannerBtnLabel}
            </button>
          )}
        </div>
      )}

      {/* 5. Render Blocks (or Default layout if Free / Empty blocks) */}
      <div style={{ flex: 1 }}>
        {(!isSubscribedSeller || !config.blocks || config.blocks.filter(b => b.visible).length === 0) ? (
          /* Free seller standard layout: standard basic filters & full products grid */
          <div style={{ padding: "12px 10px" }}>
            
            {/* Basic Filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px", background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: theme.subtext }}>Sort:</span>
                <select style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: "3px 6px", fontSize: 9, outline: "none" }}>
                  <option>Newest to Oldest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <input type="text" placeholder="Search products..." style={{ flex: 1, minWidth: 100, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: "4px 8px", fontSize: 9, outline: "none" }} />
                <select style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: "4px 6px", fontSize: 9 }}>
                  <option>All Categories</option>
                </select>
                <select style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: "4px 6px", fontSize: 9 }}>
                  <option>All Prices</option>
                </select>
              </div>
            </div>

            <SectionHdr title="All Products" />
            
            {/* Full Product list */}
            {products.length === 0 ? (
              <div style={{ padding: "24px 0", textCenter: "center", color: theme.subtext, fontSize: 10 }}>No products available yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${config.gridColumns || 4}, 1fr)`, gap: 10 }}>
                {products.map(p => <MiniCard key={p._id || p.id} product={p} />)}
              </div>
            )}

            {/* Locked Bulk Order Premium Row for Free Sellers */}
            <div style={{ marginTop: 24, padding: "14px", border: `2px dashed ${theme.border}`, borderRadius: 12, background: theme.cardBg, textAlign: "center", position: "relative" }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>🔒</div>
              <div style={{ fontSize: 11, fontWeight: "bold", color: theme.text }}>Bulk Order Section</div>
              <p style={{ fontSize: 9, color: theme.subtext, marginTop: 4 }}>Bulk Order is available only for paid subscribers.</p>
              <Link to="/seller/premium" style={{ display: "inline-block", marginTop: 8, background: "#1A1464", color: "#fff", padding: "4px 10px", fontSize: 9, fontWeight: 700, borderRadius: 5, textDecoration: "none" }}>
                Upgrade
              </Link>
            </div>

          </div>
        ) : (
          /* Premium customizable layout blocks */
          config.blocks.map(b => renderBlock(b))
        )}
      </div>

      {/* 6. Footer */}
      <div style={{ padding: "16px 12px", borderTop: `1px solid ${theme.border}`, background: theme.cardBg, textAlign: "center" }}>
        <p style={{ fontSize: 9, color: theme.subtext }}>&copy; {config.storeName || "Ritu Handicrafts"}. All rights reserved.</p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { BASE_URL } from '../../utils/api';
import StorePageMeta from '../../components/store/StorePageMeta';
import LoadErrorMessage from '../../components/common/LoadErrorMessage';
import { Store, Loader2 } from 'lucide-react';

function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}/${String(path).replace(/\\/g, '/')}`;
}

export default function PublicStorePage({ subdomain: propSubdomain }) {
  const { subdomain: paramSubdomain } = useParams();
  const subdomain = propSubdomain || paramSubdomain;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [store, setStore] = useState(null);
  const [seo, setSeo] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const url = propSubdomain
          ? `/public/store/current`
          : `/public/stores/${subdomain}`;
        const { data } = await api.get(url);
        if (cancelled) return;
        setStore(data.store);
        setSeo(data.seo || data.store?.seo);
        setProducts(data.products || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load this store.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (subdomain) load();
    return () => {
      cancelled = true;
    };
  }, [subdomain, propSubdomain]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <LoadErrorMessage error={error || 'Store not found.'} />
        <Link to="/products" className="btn btn-primary mt-6 inline-block">
          Browse all products
        </Link>
      </div>
    );
  }

  const logoSrc = assetUrl(store.favicon || store.logo);
  const headerLogo = assetUrl(store.logo);

  return (
    <>
      <StorePageMeta
        seo={seo}
        faviconPath={store.favicon}
        logoPath={store.logo}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
        <header className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-glass-border">
          {headerLogo ? (
            <img
              src={headerLogo}
              alt={store.storeName}
              className="w-16 h-16 rounded-xl object-cover border border-glass-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center">
              <Store size={28} className="text-text-muted" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold">{store.storeName}</h1>
            {seo?.sellerLegalName && (
              <p className="text-text-muted text-sm mt-1">{seo.sellerLegalName}</p>
            )}
            {store.detailedAddress && (
              <p className="text-text-muted text-sm mt-2">{store.detailedAddress}</p>
            )}
          </div>
          {logoSrc && logoSrc !== headerLogo && (
            <img src={logoSrc} alt="" className="w-8 h-8 rounded object-cover" title="Favicon" />
          )}
        </header>

        {seo?.metaDescription && (
          <p className="text-text-muted mb-8 max-w-3xl leading-relaxed">{seo.metaDescription}</p>
        )}

        <h2 className="text-xl font-bold mb-4">Products</h2>
        {products.length === 0 ? (
          <p className="text-text-muted py-8">No products listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => {
              const img = p.images?.[0];
              const imgSrc = img ? assetUrl(img) : null;
              return (
                <Link
                  key={p._id}
                  to={`/product/${p._id}`}
                  className="glass-panel rounded-xl overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all"
                >
                  <div className="aspect-square bg-surface">
                    {imgSrc ? (
                      <img src={imgSrc} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-2">{p.title}</p>
                    <p className="text-primary font-bold mt-1">₹{p.price}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

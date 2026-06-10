import { useEffect } from 'react';
import { AASHANSH_FAVICON_HREF } from '../../utils/categoryPageSeo';

function upsertMeta(attrName, attrValue, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  const prev = document.getElementById(id);
  if (prev) prev.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * SEO for category listing pages — title Main | Sub | Type, Aashansh favicon, Open Graph.
 */
export default function CategoryPageMeta({ seo, canonicalUrl }) {
  useEffect(() => {
    if (!seo?.metaTitle) return;

    const prevTitle = document.title;
    const faviconEl = document.querySelector('link[rel="icon"]');
    const prevFavicon = faviconEl?.getAttribute('href');

    document.title = seo.metaTitle;
    upsertMeta('name', 'description', seo.metaDescription);
    upsertMeta('name', 'keywords', seo.metaKeywords);
    upsertMeta('property', 'og:title', seo.metaTitle);
    upsertMeta('property', 'og:description', seo.metaDescription);
    upsertMeta('property', 'og:type', 'website');
    if (canonicalUrl) {
      upsertMeta('property', 'og:url', canonicalUrl);
      upsertLink('canonical', canonicalUrl);
    }

    upsertLink('icon', AASHANSH_FAVICON_HREF);

    if (seo.breadcrumb?.length) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      upsertJsonLd('category-breadcrumb-ld', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: origin ? `${origin}/` : '/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Products',
            item: origin ? `${origin}/products` : '/products',
          },
          ...seo.breadcrumb.map((name, i) => ({
            '@type': 'ListItem',
            position: i + 3,
            name,
            item: canonicalUrl || undefined,
          })),
        ],
      });
    }

    return () => {
      document.title = prevTitle;
      if (prevFavicon && faviconEl) {
        faviconEl.setAttribute('href', prevFavicon);
      }
      const ld = document.getElementById('category-breadcrumb-ld');
      if (ld) ld.remove();
    };
  }, [seo, canonicalUrl]);

  return null;
}

import { useEffect } from 'react';
import { BASE_URL } from '../../utils/api';

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

function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}/${String(path).replace(/\\/g, '/')}`;
}

/**
 * Sets document title, meta description, keywords, and favicon for a page.
 */
export default function PageMeta({ title, description, keywords, faviconPath }) {
  useEffect(() => {
    const prevTitle = document.title;
    const faviconEl = document.querySelector('link[rel="icon"]');
    const prevFavicon = faviconEl?.getAttribute('href');

    if (title) document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords);

    if (faviconPath) {
      upsertLink('icon', assetUrl(faviconPath));
    }

    return () => {
      document.title = prevTitle;
      if (prevFavicon && faviconEl) {
        faviconEl.setAttribute('href', prevFavicon);
      }
    };
  }, [title, description, keywords, faviconPath]);

  return null;
}


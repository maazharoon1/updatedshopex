import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  enabled?: boolean;
  noIndex?: boolean;
}

function setMeta(selector: string, attr: string, value: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Existing production origin from public/robots.txt and public/sitemap.xml.
const productionOrigin = "https://shopex-six.vercel.app";

export function useSeo({ title, description = "ShopEx Studio — Design & Illustration", canonicalPath, enabled = true, noIndex = false }: SeoOptions) {
  useEffect(() => {
    if (!enabled) return;

    document.title = title;

    if (description) {
      setMeta('meta[name="description"]', "name", "description", description);
      setMeta('meta[property="og:description"]', "property", "og:description", description);
      setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    }

    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="robots"]', "name", "robots", noIndex ? "noindex,follow" : "index,follow");

    const path = canonicalPath ?? window.location.pathname;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    if (noIndex) { link.remove(); document.head.querySelector('meta[property="og:url"]')?.remove(); return; }
    link.href = `${productionOrigin}${path}`;
    setMeta('meta[property="og:url"]', "property", "og:url", link.href);
  }, [title, description, canonicalPath, enabled, noIndex]);
}

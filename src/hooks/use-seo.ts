import { useEffect } from "react";
import { canonicalUrl, homeSeo, serializeJsonLd, site, structuredData } from "@/lib/seo";

interface SeoOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
  imageAlt?: string;
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

export function useSeo({ title, description = homeSeo.description, canonicalPath, image = homeSeo.image, imageAlt = homeSeo.imageAlt, enabled = true, noIndex = false }: SeoOptions) {
  useEffect(() => {
    if (!enabled) return;
    const preview = document.querySelector('meta[name="shopex-build"]')?.getAttribute("content") === "preview";
    const page = { title, description, canonicalPath: canonicalPath ?? window.location.pathname, image, imageAlt, noIndex };
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", site.name);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:locale"]', "property", "og:locale", "en_US");
    setMeta('meta[property="og:image"]', "property", "og:image", image);
    setMeta('meta[property="og:image:alt"]', "property", "og:image:alt", imageAlt);
    setMeta('meta[property="og:image:width"]', "property", "og:image:width", "1200");
    setMeta('meta[property="og:image:height"]', "property", "og:image:height", "630");
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    setMeta('meta[name="twitter:image:alt"]', "name", "twitter:image:alt", imageAlt);
    setMeta('meta[name="robots"]', "name", "robots", noIndex || preview ? "noindex,follow" : "index,follow,max-image-preview:large");

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link && !noIndex) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    if (noIndex) {
      link?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    } else if (link) {
      link.href = canonicalUrl(page.canonicalPath);
      setMeta('meta[property="og:url"]', "property", "og:url", link.href);
    }

    const data = structuredData(page);
    let script = document.head.querySelector<HTMLScriptElement>("#shopex-schema");
    if (data) {
      if (!script) {
        script = document.createElement("script");
        script.id = "shopex-schema";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = serializeJsonLd(data);
    } else {
      script?.remove();
    }
  }, [title, description, canonicalPath, image, imageAlt, enabled, noIndex]);
}

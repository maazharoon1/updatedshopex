import type { Plugin } from "vite";
import { projects } from "../src/data/projects";
import { canonicalUrl, homeSeo, serializeJsonLd, site, structuredData, videoSeo, type PageSeo } from "../src/lib/seo";

const start = "<!-- shopex:seo:start -->";
const end = "<!-- shopex:seo:end -->";
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function head(page: PageSeo, preview: boolean) {
  const meta = (name: string, value: string, property = false) => `<meta ${property ? "property" : "name"}="${name}" content="${escape(value)}" />`;
  const data = structuredData(page);
  return [
    start,
    `<title>${escape(page.title)}</title>`,
    meta("description", page.description),
    meta("robots", page.noIndex || preview ? "noindex,follow" : "index,follow,max-image-preview:large"),
    ...(preview ? [meta("shopex-build", "preview")] : []),
    ...(!page.noIndex ? [`<link rel="canonical" href="${escape(canonicalUrl(page.canonicalPath))}" />`, meta("og:url", canonicalUrl(page.canonicalPath), true)] : []),
    meta("og:site_name", site.name, true),
    meta("og:type", "website", true),
    meta("og:locale", "en_US", true),
    meta("og:title", page.title, true),
    meta("og:description", page.description, true),
    meta("og:image", page.image, true),
    meta("og:image:alt", page.imageAlt, true),
    meta("og:image:width", "1200", true),
    meta("og:image:height", "630", true),
    meta("twitter:card", "summary_large_image"),
    meta("twitter:title", page.title),
    meta("twitter:description", page.description),
    meta("twitter:image", page.image),
    meta("twitter:image:alt", page.imageAlt),
    ...(data ? [`<script id="shopex-schema" type="application/ld+json">${serializeJsonLd(data)}</script>`] : []),
    end,
  ].join("\n    ");
}

export function seoPlugin(): Plugin {
  const preview = Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");
  const pages = [homeSeo, ...projects.filter(p => p.type === "video" && p.videoUrl).map(p => videoSeo(p, projects))];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${(preview ? [] : pages).map(page => `  <url><loc>${escape(canonicalUrl(page.canonicalPath))}</loc></url>`).join("\n")}\n</urlset>\n`;
  // Allow resources to be crawled so robots metadata can be read; this is not access control.
  const robots = `User-agent: *\nAllow: /\n${preview ? "" : `\nSitemap: ${site.origin}/sitemap.xml\n`}`;
  const replaceHead = (html: string, page: PageSeo) => html.replace(/<!-- shopex:seo:start -->[\s\S]*?<!-- shopex:seo:end -->/, () => head(page, preview));
  return {
    name: "shopex-seo",
    transformIndexHtml: {
      order: "pre",
      handler: html => replaceHead(html, homeSeo),
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const entry = bundle["index.html"];
        if (!entry || entry.type !== "asset") throw new Error("SEO build requires index.html");
        const html = String(entry.source);
        for (const page of pages.slice(1)) {
          this.emitFile({ type: "asset", fileName: `${page.canonicalPath.slice(1)}/index.html`, source: replaceHead(html, page) });
        }
        this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
        this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });
      },
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/sitemap.xml" && path !== "/robots.txt") return next();
        res.setHeader("Content-Type", path === "/sitemap.xml" ? "application/xml; charset=utf-8" : "text/plain; charset=utf-8");
        res.end(path === "/sitemap.xml" ? sitemap : robots);
      });
    },
  };
}

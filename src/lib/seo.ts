import type { Project } from "../data/projects";

// Owner-confirmed domain; apex currently redirects to this HTTPS www origin.
export const site = {
  origin: "https://www.shopex-portfolio.com",
  name: "ShopEx Studio",
  alternateName: "Shopex",
  logo: "/Blackandgreenlogo.png",
};

export interface PageSeo {
  title: string;
  description: string;
  canonicalPath: string;
  image: string;
  imageAlt: string;
  noIndex?: boolean;
}

export function canonicalUrl(path: string) {
  const pathname = new URL(path, `${site.origin}/`).pathname;
  return `${site.origin}${pathname === "/" ? "/" : pathname.replace(/\/+$/, "")}`;
}

export function socialImage(publicId: string) {
  return `https://res.cloudinary.com/fd9kyggd/image/upload/c_fill,w_1200,h_630/f_jpg/q_auto:good/${encodeURIComponent(publicId)}`;
}

export const homeSeo: PageSeo = {
  title: "ShopEx Studio | Branding, Web Design & Animation",
  description: "Explore ShopEx Studio's portfolio of brand identity, web and mobile app design, animation, illustration, packaging, and visual content for brands.",
  canonicalPath: "/",
  image: socialImage("pa01"),
  imageAlt: "Packaging design from the ShopEx Studio portfolio",
};

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
function excerpt(text: string, limit = 170) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).replace(/\s+\S*$/, "").replace(/[,.!?:;]+$/, "")}…`;
}

export function videoSeo(project: Project, collection: Project[]): PageSeo {
  const name = normalize(project.title) || `Animation ${project.id}`;
  const duplicated = collection.some(other => other.id !== project.id && other.type === "video" && normalize(other.title) === name);
  const label = duplicated ? `${name} (${project.id})` : name;
  return {
    title: `${label} | ${site.name}`,
    description: excerpt(`Watch ${label} in the ${site.name} animation portfolio. ${normalize(project.description)}`.trim()),
    canonicalPath: `/video/${encodeURIComponent(project.id)}`,
    image: socialImage(project.mainImage),
    imageAlt: `${name} - ${site.name} animation preview`,
  };
}

export const notFoundSeo: PageSeo = {
  ...homeSeo,
  title: "404 - Page not found | ShopEx Studio",
  description: "The requested page could not be found on ShopEx Studio. Return to the homepage to explore the portfolio.",
  noIndex: true,
};

export function structuredData(page: PageSeo) {
  if (page.noIndex) return null;
  const organizationId = `${site.origin}/#organization`;
  const websiteId = `${site.origin}/#website`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: site.name,
        alternateName: site.alternateName,
        url: `${site.origin}/`,
        logo: `${site.origin}${site.logo}`,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: site.name,
        alternateName: site.alternateName,
        url: `${site.origin}/`,
        publisher: { "@id": organizationId },
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl(page.canonicalPath)}#webpage`,
        url: canonicalUrl(page.canonicalPath),
        name: page.title,
        description: page.description,
        isPartOf: { "@id": websiteId },
      },
    ],
  };
}

// Escape '<' so content cannot terminate a JSON-LD script element.
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

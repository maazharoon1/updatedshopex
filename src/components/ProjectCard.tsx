import { AdvancedImage } from "@cloudinary/react";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getCloudinaryImage } from "@/lib/cloudinary";
import "./ProjectCard.css";

const previewSizes = "(min-width: 1600px) 427px, (min-width: 1280px) calc((100vw - 320px) / 3), (min-width: 1024px) calc((100vw - 224px) / 3), (min-width: 768px) calc((100vw - 120px) / 2), calc((100vw - 64px) / 2)";

interface ProjectCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  isVideo: boolean;
  onClick: () => void;
}

export function ProjectCard({ id, title, category, image, isVideo, onClick }: ProjectCardProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isTall, setIsTall] = useState(false);
  const [overflow, setOverflow] = useState(0);
  const previewRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isTall || failed) return;
    const preview = previewRef.current;
    const cover = preview?.querySelector("img");
    if (!preview || !cover) return;

    const measure = () => setOverflow(Math.max(0, cover.offsetHeight - preview.clientHeight));
    const observer = new ResizeObserver(measure);
    observer.observe(preview);
    observer.observe(cover);
    measure();
    return () => observer.disconnect();
  }, [isTall, failed]);

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-label={`${isVideo ? "Watch" : "View"} ${title}`}
      aria-haspopup={isVideo ? undefined : "dialog"}
      className="project-card group block min-w-0 w-full text-left"
    >
      <span
        ref={previewRef}
        className={`project-card-preview block overflow-hidden rounded-sm bg-muted/30 ${isTall && !failed ? "is-tall" : ""} ${loaded ? "is-loaded" : ""} ${!loaded && !failed ? "is-loading" : ""}`}
        style={{
          "--project-preview-offset": `${-overflow}px`,
          "--project-scroll-duration": `${Math.min(14, Math.max(7, overflow / 80))}s`,
        } as CSSProperties}
      >
        {!failed && <span className="project-card-placeholder" aria-hidden="true" />}
        {!failed && <span className="project-card-art"><AdvancedImage
          cldImg={getCloudinaryImage(image, { width: 640, crop: "limit" })}
          srcSet={[240, 320, 480, 640, 960, 1280].map((width) =>
            `${getCloudinaryImage(image, { width, crop: "limit" }).toURL()} ${width}w`,
          ).join(", ")}
          sizes={previewSizes}
          alt={`${title} — ${category}`}
          loading="lazy"
          decoding="async"
          onLoad={(event) => {
            const cover = event.currentTarget;
            // Only unusually long artwork gets a compact scrolling viewport.
            setIsTall(!isVideo && cover.naturalWidth > 0 && cover.naturalHeight / cover.naturalWidth > 2);
            setLoaded(true);
          }}
          onError={() => setFailed(true)}
          className="project-card-cover block h-auto w-full"
        /></span>}
        {failed && <span className="block px-3 py-8 text-center text-xs text-muted-foreground">Preview unavailable — {isVideo ? "watch video" : "open gallery"}</span>}
      </span>
      <span className="project-card-caption mt-3 flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="project-card-title block w-fit max-w-full break-words font-sans text-sm leading-snug transition-colors group-hover:text-accent group-focus-visible:text-accent sm:text-base lg:text-lg">{title}</span>
                </span>
        <span aria-hidden="true" className="project-card-arrow">
          <ArrowUpRight className="project-card-arrow-icon" />
          <ArrowUpRight className="project-card-arrow-icon is-copy" />
        </span>
      </span>
    </button>
  );
}

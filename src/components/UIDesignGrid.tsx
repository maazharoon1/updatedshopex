import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AdvancedImage } from "@cloudinary/react";
import type { Project } from "@/data/projects";
import { getCloudinaryImage } from "@/lib/cloudinary";
import "./UIDesignGrid.css";
import { UIDesignLightbox } from "./UIDesignLightbox";

const cardSizes = "(min-width: 1600px) 318px, (min-width: 1280px) calc((100vw - 328px) / 4), (min-width: 1024px) calc((100vw - 184px) / 2), (min-width: 768px) calc((100vw - 120px) / 2), (min-width: 640px) calc((100vw - 72px) / 2), calc(100vw - 48px)";
const sourceSet = (source: string, widths: number[]) => widths.map((width) =>
  `${getCloudinaryImage(source, { width, crop: "limit" }).toURL()} ${width}w`,
).join(", ");

function UIDesignCard({ project, onPreview }: { project: Project; onPreview: () => void }) {
  const [failed, setFailed] = useState(false);
  const [overflow, setOverflow] = useState(0);
  const windowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const preview = windowRef.current;
    const image = preview?.querySelector("img");
    if (!preview || !image) return;
    // Layout height stays independent of the card's hover scale.
    const measure = () => setOverflow(Math.max(0, parseFloat(getComputedStyle(image).height) - preview.clientHeight));
    const observer = new ResizeObserver(measure);
    observer.observe(preview);
    observer.observe(image);
    image.addEventListener("load", measure);
    measure();
    return () => { observer.disconnect(); image.removeEventListener("load", measure); };
  }, [project.mainImage]);

  const preview = (
      <span ref={windowRef} className="ui-design-window" style={{ "--preview-offset": `${-overflow}px` } as CSSProperties}>
        <AdvancedImage
          cldImg={getCloudinaryImage(project.mainImage, { width: 640, crop: "limit" })}
          srcSet={sourceSet(project.mainImage, [320, 480, 640, 960, 1280])}
          sizes={cardSizes}
          alt={`${project.title} website preview`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="ui-design-cover"
        />
        {failed && <span className="absolute inset-0 grid place-items-center p-4 text-sm text-white">Preview unavailable</span>}
      </span>
  );

  return project.liveUrl?.trim() ? (
    <a href={project.liveUrl.trim()} target="_blank" rel="noopener noreferrer" className="ui-design-card group block min-w-0 text-left" aria-label={`Visit ${project.title} website (opens in a new tab)`}>{preview}</a>
  ) : (
    <button type="button" onClick={onPreview} className="ui-design-card group block min-w-0 text-left" aria-label={`Preview ${project.title}`} aria-haspopup="dialog">{preview}</button>
  );
}

export function UIDesignGrid({ projects }: { projects: Project[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const previewProjects = projects.filter((project) => !project.liveUrl?.trim());
  return <>
    <div className="container-wide grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
      {projects.map((project) => <UIDesignCard key={project.id} project={project} onPreview={() => setSelectedId(project.id)} />)}
    </div>
    {selectedId && <UIDesignLightbox projects={previewProjects} selectedId={selectedId} onClose={() => setSelectedId(null)} />}
  </>;
}

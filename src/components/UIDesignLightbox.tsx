import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, X, ZoomIn, ZoomOut } from "lucide-react";
import type { Project } from "@/data/projects";
import { getCloudinaryImage } from "@/lib/cloudinary";

interface UIDesignLightboxProps {
  projects: Project[];
  selectedId: string;
  onClose: () => void;
}

export function UIDesignLightbox({ projects, selectedId, onClose }: UIDesignLightboxProps) {
  const [index, setIndex] = useState(() => Math.max(0, projects.findIndex((project) => project.id === selectedId)));
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const project = projects[index];
  if (!project) return null;

  const resetScroll = () => viewportRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const navigate = (direction: number) => {
    setIndex((current) => (current + direction + projects.length) % projects.length);
    setZoomed(false);
    resetScroll();
  };
  const toggleZoom = () => { setZoomed((current) => !current); resetScroll(); };
  const imageFailed = failed === project.mainImage;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/80" />
        <Dialog.Content
          className="ui-lightbox fixed inset-0 z-[71] outline-none"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => { event.preventDefault(); returnFocusRef.current?.focus(); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
            if (event.key === "ArrowRight") { event.preventDefault(); navigate(1); }
          }}
        >
          <Dialog.Title className="sr-only">{project.title} — UI design preview</Dialog.Title>
          <div className="absolute right-0 top-0 z-20 flex bg-black/70 text-white">
            <button type="button" className="ui-lightbox-control" onClick={toggleZoom} disabled={imageFailed} aria-label={zoomed ? "Fit full image" : "Zoom image"}>
              {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
            </button>
            <Dialog.Close className="ui-lightbox-control" aria-label="Close preview"><X size={22} /></Dialog.Close>
          </div>
          <div ref={viewportRef} className={`ui-lightbox-viewport ${zoomed ? "is-zoomed" : ""}`} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            {!imageFailed && <button type="button" className="ui-lightbox-image-button" onClick={toggleZoom} aria-label={zoomed ? "Fit full image" : "Zoom image to read design"}>
              <img
                key={project.mainImage}
                src={getCloudinaryImage(project.mainImage, { width: 1920, crop: "limit" }).toURL()}
                alt={`${project.title} full website design`}
                className="ui-lightbox-image"
                onLoad={() => setLoaded(project.mainImage)}
                onError={() => setFailed(project.mainImage)}
              />
            </button>}
            {imageFailed && <p role="alert" className="m-auto text-white">Preview unavailable</p>}
            {!imageFailed && loaded !== project.mainImage && <span role="status" className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 text-sm text-white">Loading preview…</span>}
          </div>
          {projects.length > 1 && <>
            <button type="button" onClick={() => navigate(-1)} className="ui-lightbox-control absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white" aria-label="Previous design"><ArrowLeft size={22} /></button>
            <button type="button" onClick={() => navigate(1)} className="ui-lightbox-control absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white" aria-label="Next design"><ArrowRight size={22} /></button>
          </>}
          <span aria-live="polite" className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-1 text-xs text-white">{index + 1} / {projects.length}</span>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

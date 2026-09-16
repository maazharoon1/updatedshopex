import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AdvancedImage } from "@cloudinary/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Project } from "@/data/projects";
import { getCloudinaryImage } from "@/lib/cloudinary";
import "./UIDesignGrid.css";

const cardSizes = "(min-width: 1600px) 318px, (min-width: 1280px) calc((100vw - 328px) / 4), (min-width: 1024px) calc((100vw - 184px) / 2), (min-width: 768px) calc((100vw - 120px) / 2), (min-width: 640px) calc((100vw - 72px) / 2), calc(100vw - 48px)";
const sourceSet = (source: string, widths: number[]) => widths.map((width) =>
  `${getCloudinaryImage(source, { width, crop: "limit" }).toURL()} ${width}w`,
).join(", ");

function ScreenshotPreview({ project }: { project: Project }) {
  const images = [project.mainImage, ...project.coverImages.filter((image) => image !== project.mainImage)];
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const scroller = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const navigate = (step: number) => {
    setIndex((current) => (current + step + images.length) % images.length);
    setStatus("loading");
    setZoomed(false);
    scroller.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="ui-design-overlay" />
      <Dialog.Content className="ui-design-dialog" onOpenAutoFocus={(event) => { event.preventDefault(); close.current?.focus(); }}
        onKeyDown={(event) => {
          if (images.length < 2) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            navigate(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}>
        <Dialog.Title className="sr-only">{project.title}</Dialog.Title>
            {images.length > 1 && <>
              <button className="ui-design-control ui-design-previous" onClick={() => navigate(-1)} aria-label="Previous image"><ChevronLeft size={28} /></button>
              <span className="sr-only" aria-live="polite">{index + 1} / {images.length}</span>
              <button className="ui-design-control ui-design-next" onClick={() => navigate(1)} aria-label="Next image"><ChevronRight size={28} /></button>
            </>}
            <Dialog.Close ref={close} className="ui-design-control ui-design-close" aria-label="Close project preview"><X size={26} /></Dialog.Close>
        <Dialog.Description className="sr-only">Click the screenshot to enlarge it and scroll, or click again to fit the whole image. Use the previous and next buttons or left and right arrow keys to browse this collection.</Dialog.Description>
        <div ref={scroller} tabIndex={0} role="region" aria-label="Full screenshot" className="ui-design-screenshot" aria-busy={status === "loading"}>
          {status === "loading" && <p role="status" className="p-4 text-sm text-muted-foreground">Loading screenshot…</p>}
          {status === "error" && <p role="alert" className="p-4 text-sm">Screenshot unavailable. Please try another image or reopen this preview.</p>}
          <button type="button" className={`ui-design-image-button ${zoomed ? "is-zoomed" : ""} ${status !== "loaded" ? "invisible absolute" : ""}`}
            aria-label={zoomed ? "Fit full screenshot" : "Enlarge screenshot"} aria-pressed={zoomed}
            onClick={() => { setZoomed((value) => !value); scroller.current?.scrollTo({ top: 0, behavior: "instant" }); }}>
          <AdvancedImage key={images[index]} cldImg={getCloudinaryImage(images[index], { width: 1440, crop: "limit" })}
            srcSet={sourceSet(images[index], [640, 960, 1440, 1920])} sizes="(min-width: 1576px) 1440px, (min-width: 640px) calc(100vw - 136px), calc(100vw - 24px)"
            alt={`${project.title}, screenshot ${index + 1} of ${images.length}`} decoding="async"
            onLoad={() => setStatus("loaded")} onError={() => setStatus("error")}
            className="ui-design-full-image" />
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function UIDesignCard({ project, index }: { project: Project; index: number }) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
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

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="ui-design-card group min-w-0 text-left" aria-label={`View ${project.title}, UI Design`}>
          <span ref={windowRef} className="ui-design-window" style={{ "--preview-offset": `${-overflow}px` } as CSSProperties}>
            <AdvancedImage cldImg={getCloudinaryImage(project.mainImage, { width: 640, crop: "limit" })}
              srcSet={sourceSet(project.mainImage, [320, 480, 640, 960, 1280])} sizes={cardSizes}
              alt={`${project.title} website preview`} loading="lazy" decoding="async" onError={() => setFailed(true)}
              className="ui-design-cover" />
            {failed && <span className="absolute inset-0 grid place-items-center p-4 text-sm text-white">Preview unavailable. Open gallery.</span>}
          </span>
        </button>
      </Dialog.Trigger>
      {open && <ScreenshotPreview project={project} />}
    </Dialog.Root>
  );
}

export function UIDesignGrid({ projects }: { projects: Project[] }) {
  return <div className="container-wide grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
    {projects.map((project, index) => <UIDesignCard key={project.id} project={project} index={index} />)}
  </div>;
}

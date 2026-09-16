import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Project } from "@/data/projects";
import { ZoomInView } from "@/components/ZoomInView";
import { AdvancedImage } from "@cloudinary/react";
import { getCloudinaryImage } from "@/lib/cloudinary";
import * as Dialog from "@radix-ui/react-dialog";

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const galleryImages = useMemo(
    () => project.coverImages.length
      ? [project.mainImage, ...project.coverImages.filter((image) => image !== project.mainImage)]
      : [project.mainImage],
    [project.coverImages, project.mainImage],
  );
  const imageCount = galleryImages.length;

  const showPrevious = useCallback(() =>
    setActiveImageIndex((current) => (current - 1 + imageCount) % imageCount), [imageCount]);
  const showNext = useCallback(() =>
    setActiveImageIndex((current) => (current + 1) % imageCount), [imageCount]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (imageCount > 1 && event.key === "ArrowLeft") { event.preventDefault(); showPrevious(); }
      if (imageCount > 1 && event.key === "ArrowRight") { event.preventDefault(); showNext(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageCount, showNext, showPrevious]);

  const activeImage = galleryImages[activeImageIndex] ?? project.mainImage;
  const imageError = failedImage === activeImage;
  const isImageLoading = loadedImage !== activeImage && !imageError;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[60] bg-foreground/35 backdrop-blur-sm" />
    <Dialog.Content
      className="fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-foreground/35 p-0 backdrop-blur-sm animate-fade-in md:p-4 lg:p-6"
      aria-describedby={undefined}
      onOpenAutoFocus={(event) => { event.preventDefault(); closeButtonRef.current?.focus(); }}
      onCloseAutoFocus={(event) => { event.preventDefault(); returnFocusRef.current?.focus(); }}
      onClick={onClose}
    >
      <Dialog.Title className="sr-only">{project.title}</Dialog.Title>
      <div
        className="relative mx-auto grid h-full w-full max-w-[1440px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background shadow-2xl md:grid-rows-1"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-separator px-4 py-3 md:pointer-events-none md:absolute md:inset-x-0 md:top-0 md:z-30 md:border-0 md:p-0">
          <div className="min-w-0 md:hidden">
            <p className="text-label mb-0.5">{project.filter}</p>
            <h2 id="project-modal-title" className="truncate font-display text-2xl font-bold leading-none sm:text-3xl lg:text-4xl">
              {project.title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="ml-4 grid size-11 shrink-0 place-items-center rounded-full border border-separator bg-background/90 transition-colors hover:border-foreground hover:bg-foreground hover:text-background md:pointer-events-auto md:absolute md:right-4 md:top-4"
            aria-label="Close project preview"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_clamp(250px,28vw,360px)] md:grid-rows-1">
          <section className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] bg-muted/50 md:grid-cols-[88px_minmax(0,1fr)] md:grid-rows-1 lg:grid-cols-[104px_minmax(0,1fr)]" aria-label="Project gallery">
            <div className="group relative min-h-0 overflow-hidden p-3 sm:p-4 md:col-start-2 md:row-start-1 md:p-5 lg:p-6">
              {!imageError && <ZoomInView
                key={activeImage}
                src={activeImage}
                onLoad={() => setLoadedImage(activeImage)}
                onError={() => setFailedImage(activeImage)}
                cldWidth={1800}
                cldHeight={1400}
                crop="fit"
                alt={`${project.title}, image ${activeImageIndex + 1} of ${imageCount}`}
                className="animate-[fade-in_200ms_ease-out]"
              />}
              {isImageLoading && (
                <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center" role="status" aria-live="polite" aria-label="Loading image">
                  <span className="size-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/70" />
                </div>
              )}
              {imageError && (
                <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 bg-background/80 px-2 py-1 text-[9px] uppercase tracking-widest text-muted-foreground">
                  Image unavailable
                </p>
              )}
              {imageCount > 1 && (
                <>
                  <button type="button" onClick={showPrevious} className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-md transition-transform hover:scale-105 sm:left-6" aria-label="Previous image">
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" onClick={showNext} className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-md transition-transform hover:scale-105 sm:right-6" aria-label="Next image">
                    <ChevronRight size={20} />
                  </button>
                  <span className="absolute bottom-4 right-4 bg-background/90 px-2.5 py-1 text-[10px] tracking-widest sm:bottom-6 sm:right-6">
                    {String(activeImageIndex + 1).padStart(2, "0")} / {String(imageCount).padStart(2, "0")}
                  </span>
                </>
              )}
            </div>
            {imageCount > 1 && (
              <div className="flex h-16 gap-2 overflow-x-auto border-t border-separator bg-background px-3 py-2 sm:h-20 sm:px-4 md:col-start-1 md:row-start-1 md:h-full md:min-h-0 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-t-0 md:px-2 md:py-3 lg:px-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${project.id}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`aspect-[4/3] h-full shrink-0 overflow-hidden border-2 transition-all md:h-auto md:w-full ${
                      activeImageIndex === index
                        ? "border-foreground opacity-100"
                        : "border-transparent opacity-45 hover:opacity-100"
                    }`}
                    aria-label={`Show image ${index + 1}`}
                    aria-current={activeImageIndex === index ? "true" : undefined}
                  >
                    <AdvancedImage
                      cldImg={getCloudinaryImage(image, { width: 240, height: 180, crop: "fill", quality: "auto:eco" })}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={180}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
          <aside className="grid max-h-[32dvh] overflow-y-auto content-start gap-3 border-t border-separator px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8 md:max-h-none md:block md:overflow-y-auto md:border-l md:border-t-0 md:px-6 md:py-7 lg:px-8 lg:py-9">
            <div className="mb-6 hidden pr-10 md:block">
              <p className="text-label mb-2">{project.filter}</p>
              <h2 className="font-display text-3xl font-bold leading-none lg:text-4xl">{project.title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground sm:max-w-2xl md:text-base">{project.description}</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:min-w-52 md:mt-8 md:grid-cols-1 md:gap-y-5">
              <div><dt className="text-label mb-0.5">Client</dt><dd className="text-sm">{project.client ?? "Independent"}</dd></div>
              {/* <div><dt className="text-label mb-0.5">Year</dt><dd className="text-sm">{project.year ?? "—"}</dd></div> */}
            </dl>
            <div className="col-span-full flex flex-wrap gap-1.5 md:mt-8">
              {(project.tags ?? []).map((tag) => (
                <span key={tag} className="border border-separator px-2.5 py-1 text-[10px] uppercase tracking-widest">
                  {tag}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  );
}

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { RotateCcw, ZoomIn } from "lucide-react";
import { AdvancedImage } from "@cloudinary/react";
import { getCloudinaryImage } from "@/lib/cloudinary";

interface ZoomInViewProps {
  src: string;
  alt: string;
  className?: string;
  cldWidth?: number;
  cldHeight?: number;
  crop?: "fill" | "fit" | "limit";
  onLoad?: () => void;
  onError?: () => void;
}

const HOVER_ZOOM = 1.2;
const MAX_ZOOM = 4;

export function ZoomInView({ src, alt, className = "", cldWidth, cldHeight, crop, onLoad, onError }: ZoomInViewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  useEffect(reset, [src]);

  useEffect(() => {
    const frame = frameRef.current;
    const wheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      setZoom((current) => Math.min(MAX_ZOOM, Math.max(1, current - event.deltaY * 0.002)));
    };
    frame?.addEventListener("wheel", wheel, { passive: false });
    return () => frame?.removeEventListener("wheel", wheel);
  }, []);

  useEffect(() => { if (zoom === 1) setOffset({ x: 0, y: 0 }); }, [zoom]);

  const pointInFrame = (clientX: number, clientY: number) => {
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: clientX - (bounds.left + bounds.width / 2),
      y: clientY - (bounds.top + bounds.height / 2),
    };
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || zoom > 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const point = pointInFrame(event.clientX, event.clientY);
    setZoom(HOVER_ZOOM);
    setOffset({ x: -point.x * 0.35, y: -point.y * 0.35 });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffset({
      x: dragStart.current.offsetX + event.clientX - dragStart.current.x,
      y: dragStart.current.offsetY + event.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  };

  const toggleZoom = (event: MouseEvent<HTMLDivElement>) => {
    if (zoom > 1) return reset();
    const point = pointInFrame(event.clientX, event.clientY);
    setZoom(2.5);
    setOffset({ x: -point.x * 0.55, y: -point.y * 0.55 });
  };

  return (
    <div
      ref={frameRef}
      className={`relative h-full w-full overflow-hidden select-none ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"} ${className}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={(event) => { if (event.pointerType === "mouse" && !isDragging && zoom <= HOVER_ZOOM) reset(); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={toggleZoom}
      style={{ touchAction: zoom > 1 ? "none" : "pan-y" }}
    >
      <AdvancedImage
        cldImg={getCloudinaryImage(src, { width: cldWidth, height: cldHeight, crop })}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        srcSet={cldWidth && cldHeight ? [640, 960, 1440, 1800].map((width) => `${getCloudinaryImage(src, { width, height: Math.round(width * cldHeight / cldWidth), crop }).toURL()} ${width}w`).join(", ") : undefined}
        sizes="(min-width: 1440px) 900px, (min-width: 768px) 65vw, 100vw"
        loading="eager"
        decoding="async"
        draggable={false}
        className="pointer-events-none h-full w-full object-contain will-change-transform"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
          transition: isDragging ? "none" : "transform 220ms ease-out",
        }}
      />

      <button type="button" aria-label="Zoom in image" disabled={zoom >= MAX_ZOOM}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); setZoom((value) => Math.min(MAX_ZOOM, value + 0.5)); }}
        className="absolute left-2 top-2 grid size-11 place-items-center bg-background/90 disabled:opacity-50 sm:left-3 sm:top-3">
        <ZoomIn size={18} />
      </button>

      {zoom > 1 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            reset();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute bottom-2 left-2 flex min-h-11 items-center gap-1.5 bg-background/90 px-2.5 py-1.5 text-[10px] uppercase tracking-widest shadow-sm sm:bottom-3 sm:left-3"
          aria-label="Reset image zoom"
        >
          <RotateCcw size={12} /> Reset {Math.round(zoom * 100)}%
        </button>
      )}
    </div>
  );
}

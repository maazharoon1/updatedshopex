import { AdvancedImage } from "@cloudinary/react";
import { useState } from "react";
import { getCloudinaryImage } from "@/lib/cloudinary";

interface ProjectListItemProps {
  id: string;
  title: string;
  tags: string[];
  // year: string;
  image: string;
  index: number;
  onClick: () => void;
}

export function ProjectListItem({ 
  id, 
  title, 
  tags, 
  // year, 
  image,
  index,
  onClick,
}: ProjectListItemProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setShowPreview(true); }}
      onFocus={() => setShowPreview(true)}
      aria-label={`View ${title}`}
      id={id}
      className="project-list-button group block w-full border-b border-separator text-left transition-colors duration-300 active:bg-accent focus-visible:bg-accent"
    >
      <div className="touch-project-row container-wide min-h-[104px] items-center justify-between gap-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-sans text-base uppercase tracking-wide transition-colors duration-300 group-active:text-accent-foreground min-[375px]:text-lg">
            {title}
          </h3>
          <div className="mt-2 flex min-w-0 flex-col items-start gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="max-w-full truncate text-[9px] uppercase leading-tight tracking-widest text-muted-foreground transition-colors group-active:text-accent-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="aspect-[4/3] w-[clamp(82px,27vw,108px)] shrink-0 overflow-hidden bg-muted">
          <AdvancedImage
            cldImg={getCloudinaryImage(image, { width: 240, height: 180, crop: "fill", quality: "auto:eco" })}
            alt={`${title} project preview`}
            loading="lazy"
            onError={() => setThumbnailFailed(true)}
            decoding="async"
            width={240}
            height={180}
            className={`h-full w-full object-cover ${thumbnailFailed ? "hidden" : ""}`}
          />
          {thumbnailFailed && <span className="grid h-full place-items-center p-2 text-center text-[10px] text-muted-foreground">Preview unavailable</span>}
        </div>
      </div>

      <div className="fine-pointer-project-row container-wide py-5 md:py-6">
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <h3 className="min-w-0 flex-1 break-words font-sans text-lg uppercase tracking-wide transition-colors duration-300 group-hover:text-accent-foreground group-focus-visible:text-accent-foreground md:text-xl lg:text-2xl">
            {title}
          </h3>

          {/* Tags */}
          <div className="hidden max-w-[50%] flex-wrap justify-end sm:flex items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="border border-separator px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors duration-300 group-hover:border-accent-foreground group-hover:text-accent-foreground group-focus-visible:border-accent-foreground group-focus-visible:text-accent-foreground md:text-xs"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Year */}
          {/* <span className={`text-xs md:text-sm uppercase tracking-widest transition-colors duration-300 ${
            isHovered ? 'text-accent-foreground' : 'text-muted-foreground'
          }`}>
            {year}
          </span> */}

          {/* Hover Image */}
          <div 
            className="pointer-events-none fixed right-8 top-1/2 z-40 aspect-[3/4] w-64 translate-x-4 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 lg:right-32 lg:w-80"
          >
            {showPreview && <AdvancedImage
              cldImg={getCloudinaryImage(image, { width: 640, height: 800, crop: "fill", quality: "auto:eco" })}
              alt={title}
              loading="lazy"
              decoding="async"
              width={640}
              height={800}
              className="w-full h-full object-contain"
            />}
          </div>
        </div>
      </div>
    </button>
  );
}

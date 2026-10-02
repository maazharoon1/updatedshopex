import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown } from "lucide-react";
import type { Project } from "@/data/projects";
import { ProjectCard } from "./ProjectCard";

const MOBILE_QUERY = "(max-width: 767px)";
const PAGE_SIZE = 8;
const getMobileSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const getServerSnapshot = () => false;
const subscribeToMobile = (onChange: () => void) => {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

interface ProjectGridProps {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export function ProjectGrid({ projects, onSelect }: ProjectGridProps) {
  const isMobile = useSyncExternalStore(subscribeToMobile, getMobileSnapshot, getServerSnapshot);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const gridRef = useRef<HTMLDivElement>(null);
  const nextFocusIndex = useRef<number | null>(null);
  const gridId = useId();
  const visibleProjects = useMemo(
    () => isMobile ? projects.slice(0, visibleCount) : projects,
    [isMobile, projects, visibleCount],
  );
  const hasMore = isMobile && visibleProjects.length < projects.length;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Focus the first appended project without moving the reader's scroll position.
    if (nextFocusIndex.current !== null) {
      grid.querySelectorAll<HTMLButtonElement>(".project-card")[nextFocusIndex.current]?.focus({ preventScroll: true });
      nextFocusIndex.current = null;
    }

    const entries = grid.querySelectorAll<HTMLElement>('.project-card-entry:not([data-revealed="true"])');
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      entries.forEach((entry) => { entry.dataset.revealed = "true"; });
      return;
    }

    // One observer for the whole grid; each card animates only on its first appearance.
    const observer = new IntersectionObserver((changes) => {
      changes.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        (target as HTMLElement).dataset.revealed = "true";
        observer.unobserve(target);
      });
    }, { threshold: 0.08 });
    entries.forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }, [visibleProjects]);

  return (
    <div className="container-wide">
      <div ref={gridRef} id={gridId} className="grid grid-cols-2 items-start gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-8 lg:grid-cols-3 lg:gap-x-8">
        {visibleProjects.map((project) => (
          <div
            key={project.id}
            className="project-card-entry"
            data-revealed="false"
            onFocusCapture={(event) => { event.currentTarget.dataset.revealed = "true"; }}
          >
            <ProjectCard
              id={project.id}
              title={project.title}
              category={project.filter}
              image={project.mainImage}
              isVideo={project.type === "video"}
              onClick={() => onSelect(project)}
            />
          </div>
        ))}
      </div>
      {isMobile && projects.length > PAGE_SIZE && (
        <div className="mt-9 flex flex-col items-center gap-4">
          <p role="status" aria-live="polite" aria-atomic="true" className="text-xs tracking-wide text-muted-foreground">
            Showing {visibleProjects.length} of {projects.length} projects
          </p>
          {hasMore && (
            <button
              type="button"
              aria-controls={gridId}
              onClick={() => {
                nextFocusIndex.current = visibleProjects.length;
                setVisibleCount((count) => Math.min(count + PAGE_SIZE, projects.length));
              }}
              className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-accent/60 px-7 py-3 text-sm text-accent transition-all duration-300 hover:border-accent hover:bg-accent hover:text-accent-foreground active:scale-95"
            >
              Load more
              <ArrowDown aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

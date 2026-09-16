import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProjectListItem } from "@/components/ProjectListItem";
import { projects } from "@/data/projects";
import { useSeo } from "@/hooks/use-seo";

const ProjectModal = lazy(() => import("@/components/ProjectModal").then((module) => ({ default: module.ProjectModal })));
const UIDesignGrid = lazy(() => import("@/components/UIDesignGrid").then((module) => ({ default: module.UIDesignGrid })));

interface WorkProps {
  embedded?: boolean;
}

const Work = ({ embedded = false }: WorkProps) => {
  const navigate = useNavigate();
  const categories = useMemo(
    () => [...Array.from(new Set(projects.map((p) => p.filter)))],
    []
  );

  const categoryFromHash = useCallback((hash: string) =>
    hash
      .slice(1)
      .replace(/-/g, " ")
      .trim()
      .toLowerCase(), []);

  const categoryForHash = useCallback((hash: string) =>
    categories.find(
      (category) => category.toLowerCase() === categoryFromHash(hash)
    ), [categories, categoryFromHash]);

  const [activeCategory, setActiveCategory] = useState(
    () => categoryForHash(window.location.hash) ?? categories[0] ?? ""
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useSeo({
    title: "Projects — ShopEx Studio",
    description:
      "Selected photography, digital art, and fine art projects by ShopEx Studio.",
    enabled: !embedded,
  });

  useEffect(() => {
    const handleHashChange = () => {
      const category = categoryForHash(window.location.hash);
      if (category) {
        setActiveCategory(category);
        requestAnimationFrame(() => {
          document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
        });
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [categoryForHash]);

  const handleCategory = (category: string) => {
    setActiveCategory(category);
    window.location.hash = category.trim().replace(/\s+/g, "-");
  };

  const filtered = useMemo(
    () =>
      projects.filter((p) => p.filter === activeCategory),
    [activeCategory]
  );

  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const Heading = embedded ? "h2" : "h1";


  const content = (
    <div className={embedded ? "pt-16 md:pt-20" : undefined}>
      {/* Header */}
      <section className="container-wide pb-7  md:pb-14 ">
        <Heading className="font-display text-3xl md:text-7xl  font-bold tracking-tight text-accent">
          Projects
        </Heading>
      </section>

      {/* Filters */}
      <section className={`container-wide ${activeCategory === "UI Design" ? "pb-6" : "pb-7 md:pb-14"}`}>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                onClick={() => handleCategory(category)}
                aria-pressed={isActive}
                className={`min-h-11 border px-3 py-2 text-[10px] uppercase tracking-widest transition-colors duration-300 md:px-4 md:text-xs ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-separator text-muted-foreground hover:text-accent hover:border-accent/50"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {/* Project List */}
      <section className="pb-24">
        {activeCategory === "UI Design" ? <Suspense fallback={<div className="container-wide min-h-[400px]" role="status">Loading previews…</div>}><UIDesignGrid projects={filtered} /></Suspense> : filtered.map((project, index) => (
          <ProjectListItem
            key={project.id}
            id={project.id}
            title={project.title}
            tags={project.tags ?? []}
            // year={project.year ?? ""}
            image={project.mainImage}
            index={index}
            onClick={() => {
              if (project.type === "video") {
                navigate(`/video/${project.id}`);
              } else {
                setSelectedProjectId(project.id);
              }
            }}
          />
        ))}
      </section>
      {selectedProject && (
        <Suspense fallback={null}>
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProjectId(null)}
          />
        </Suspense>
      )}
    </div>
  );

  return embedded ? content : <Layout showEchelonFooter>{content}</Layout>;
};

export default Work;

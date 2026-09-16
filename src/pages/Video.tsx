import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { VideoPlayer } from "@/components/VideoPlayer";
import { projects } from "@/data/projects";
import { useSeo } from "@/hooks/use-seo";
import { getCloudinaryImage } from "@/lib/cloudinary";

const Video = () => {
  const { id } = useParams();
  const project = projects.find((item) => item.id === id && item.type === "video");

  useSeo({
    title: project ? `${project.title} — ShopEx Studio` : "Video — ShopEx Studio",
    description: project?.description,
  });

  if (!project) return <Navigate to="/#projects" replace />;

  return (
    <Layout showEchelonFooter>
      <section className="container-wide pb-16 pt-8 md:pb-24 md:pt-12">
        <Link
          to="/#2d-Animations"
          className="group mb-7 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent md:mb-10 md:text-xs"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Back to projects
        </Link>

        <div className="border-y border-separator bg-card/40 py-3 backdrop-blur-sm md:border md:p-5 lg:p-7">
          <div className="grid grid-cols-1 items-stretch gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:gap-10">
            <div className="min-w-0 -mx-6 sm:mx-0">
              <VideoPlayer
                className="min-h-[58vw] sm:min-h-0"
                src={project.videoUrl}
                poster={getCloudinaryImage(project.mainImage, { width: 1600, height: 900, crop: "fill" }).toURL()}
                title={project.title}
              />
            </div>

            <div className="flex flex-col justify-between gap-10 px-1 pb-3 lg:px-0 lg:py-3">
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <span className="size-2 bg-accent" aria-hidden="true" />
                  <p className="text-label">{project.filter}</p>
                </div>
                <h1 className="break-words font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl sm:leading-[0.95]">
                  {project.title}
                </h1>
                <span className="mt-7 block h-px w-14 bg-accent" aria-hidden="true" />
                <p className="mt-7 text-base leading-relaxed text-muted-foreground ">
                  {project.description}
                </p>
              </div>

              {project.videoUrl && (
                <a
                  href={project.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex w-fit items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground transition-colors hover:text-accent md:text-xs"
                >
                  Open video directly
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Video;

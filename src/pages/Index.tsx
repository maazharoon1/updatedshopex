import { useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useSeo } from "@/hooks/use-seo";
import { AdvancedImage } from "@cloudinary/react";
import { getCloudinaryImage } from "@/lib/cloudinary";
import { PremiumSeparator } from "@/components/PremiumSeparator";
import Work from "./Work";

const Index = () => {
  useSeo({
    title: "ShopEx Studio — Design & Illustration",
    description:
      "Independent artist and designer specializing in brand identity, illustration, and visual design.",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();

  // Get 8 unique cover images from projects for the grid (4x2)
  const gridImages = [
    "pa01",
    "s01",
    "fl01",
    "ui01",
 
  ];

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    const scrollToSection = () => {
      const sectionHashes = ["#home", "#projects"];
      if (!sectionHashes.includes(window.location.hash)) return;

      const target = document.querySelector(window.location.hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollToSection();
    window.addEventListener("hashchange", scrollToSection);
    return () => window.removeEventListener("hashchange", scrollToSection);
  }, []);

  const handleMouseMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !gridRef.current || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate offset from center (normalized to -1 to 1)
    const x = (e.clientX - rect.left - centerX) / centerX;
    const y = (e.clientY - rect.top - centerY) / centerY;
    
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(${-x * 40}px, ${-y * 40}px, 0)`;
      }
    });
  };

  return (
    <Layout showEchelonFooter noPadding>
      <section 
        id="home"
        ref={containerRef}
        onPointerMove={handleMouseMove}
        className="relative min-h-[480px] h-[70svh] max-h-[680px] overflow-hidden md:h-[90vh] md:max-h-none"
      >
        {/* Image Grid Background with Parallax - 4 columns x 2 rows */}
        <div 
          ref={gridRef}
          className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 p-12 md:p-16 w-full max-h-full max-w-7xl">
            {gridImages.map((image, index) => (
              <div 
                key={index}
                className="aspect-[3/4] overflow-hidden"
              >
                <AdvancedImage
                  cldImg={getCloudinaryImage(image, { width: 640, height: 850, crop: "fill", quality: "auto:eco" })}
                  srcSet={[240, 400, 640].map((width) => `${getCloudinaryImage(image, { width, height: Math.round(width * 850 / 640), crop: "fill", quality: "auto:eco" }).toURL()} ${width}w`).join(", ")}
                  sizes="(min-width: 1280px) 258px, (min-width: 768px) calc((100vw - 248px) / 4), calc((100vw - 120px) / 2)"
                  alt=""
                  loading={index < 4 ? "eager" : "lazy"}
                  decoding="async"
                  width={640}
                  height={850}
                  className="w-full h-full object-cover opacity-60"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 h-[96%] md:h-full  bg-background/30" />

        {/* Centered Title - Overlaid */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <h1 className="px-6 text-center text-[clamp(2rem,7vw,6rem)] font-display font-bold tracking-tight text-foreground">
            ShopEx Studio
          </h1>
        </div>

        {/* Bio - Bottom Left */}
        <div className="absolute bottom-8 md:bottom-12 left-6 right-6 md:left-12 z-10 max-w-xs md:max-w-sm">
          <p className="text-sm md:text-base font-sans text-foreground/80 leading-relaxed">
            We help brands grow through smart design, seamless digital experiences, and standout visual content that connects with the right audience.
          </p>
        </div>
      </section>
      <PremiumSeparator label="Selected work" detail="Explore the collection" />
      <section id="projects" className="-mt-10 scroll-mt-20 md:scroll-mt-24">
        <Work embedded />
      </section>
    </Layout>
  );
};

export default Index;

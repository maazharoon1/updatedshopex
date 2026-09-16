import type { MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface FooterProps {
  variant?: "default" | "echelon";
}

export function Footer({ variant = "default" }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSectionNavigation = (event: MouseEvent<HTMLAnchorElement>, hash: "#home" | "#projects") => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    // On other pages, the home page scrolls to the hash after it mounts.
    if (location.pathname !== "/") return;

    event.preventDefault();
    navigate({ pathname: "/", hash });
    // Scroll even when this hash is already selected.
    requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      });
    });
  };

  
  if (variant === "echelon") {
    return (
      <footer className="border-t border-separator mt-auto">
        {/* Main Footer Content */}
        <div className="container-wide py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Location */}
            <div className="space-y-3">
              <p className="text-label">Location</p>
              <div className="text-sm text-foreground space-y-1">
                <p>São Paulo, SP</p>
                <p>Brazil</p>
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-3">
              <p className="text-label">Gallery</p>
              <div className="text-sm space-y-1">
                <Link to="/#projects" onClick={(event) => handleSectionNavigation(event, "#projects")} className="block text-foreground hover:text-accent transition-colors">Projects</Link>
        
                <Link to="/#home"
                  onClick={(event) => handleSectionNavigation(event, "#home")}
                   className="block text-foreground hover:text-accent transition-colors">Home</Link>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <p className="text-label">Contact</p>
              <div className="text-sm text-foreground space-y-1">
                <a href="mailto:hello@ShopExstudio.com" className="block break-words hover:text-accent transition-colors">
                  hello@ShopExstudio.com
                </a>
                <p>+55 11 9999-9999</p>
              </div>
            </div>

            {/* Copyright */}
            <div className="space-y-3">
              <p className="text-label">Legal</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>© {currentYear} All Rights Reserved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Large Scrolling Text */}
        <div className="border-t border-separator overflow-hidden py-6 md:py-8">
          <div aria-hidden="true" className="flex whitespace-nowrap animate-marquee">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="font-display text-6xl md:text-8xl lg:text-[10rem] font-bold text-foreground mx-12"
              >
                @ShopExSTUDIO
              </span>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  // Default footer
  return (
    <footer className="border-t border-separator">
      <div className="container-wide py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Left */}
          <div className="space-y-4">
            <p className="font-display text-xl font-semibold">ShopEx Studio</p>
            <p className="text-muted-foreground text-sm">
              Design & Illustration
            </p>
          </div>

          {/* Center */}
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link to="/#projects" onClick={(event) => handleSectionNavigation(event, "#projects")} className="hover-highlight">Work</Link>
            <a href="mailto:hello@ShopExstudio.com" className="hover-highlight">Contact</a>
          </div>

          {/* Right */}
          <div className="text-sm text-muted-foreground">
            <p>© {currentYear} ShopEx Studio</p>
            <p className="mt-1">São Paulo, Brazil</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState, useEffect, type MouseEvent as ReactMouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import * as Dialog from "@radix-ui/react-dialog";

const navItems = [
  { label: "Home", path: "/#home", hash: "#home" },
  { label: "Projects", path: "/#projects", hash: "#projects" },
  { label: "About", path: "/about", hash: "#about" },
  // { label: "Contact", path: "/contact" },
];

interface HeaderProps {
  revealMode?: boolean;
}

export function Header({ revealMode = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(!revealMode);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setIsMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!revealMode) {
      setIsVisible(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(e.clientY < 100);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [revealMode]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isNavActive = (hash: string) => {
    if (hash === "#about") return location.pathname === "/about";
    if (location.pathname !== "/") return false;
    if (hash === "#home") return location.hash === "" || location.hash === "#home";
    if (hash === "#projects") return Boolean(location.hash) && location.hash !== "#home" && location.hash !== "#about";
    return location.hash === hash;
  };

  const handleSectionNavigation = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    hash: string,
  ) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    setIsMenuOpen(false);
    if (hash === "#about") return;
    if (location.pathname !== "/") return;

    event.preventDefault();
    navigate({ pathname: "/", hash });
    setIsMenuOpen(false);

    requestAnimationFrame(() => {
      document.querySelector(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <Dialog.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
    <header 
      onFocusCapture={() => setIsVisible(true)}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="container-wide relative">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link 
            to="/#home" 
            onClick={(event) => handleSectionNavigation(event, "#home")}
            className="font-display text-lg  font-semibold tracking-tight  hover:opacity-70 transition-opacity"
          >
            ShopEx Studio
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6 lg:gap-10 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={(event) => handleSectionNavigation(event, item.hash)}
                className={`text-xs font-sans tracking-widest uppercase transition-all duration-300 hover:tracking-[0.2em] ${
                  isNavActive(item.hash)
                    ? "text-accent"
                    : "text-foreground/80 hover:text-accent"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right - Theme Toggle */}
          <div className="hidden md:flex items-center">
            <button
              onClick={toggleTheme}
              className="min-h-11 min-w-11 grid place-items-center text-accent hover:text-accent transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />)}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="min-h-11 min-w-11 grid place-items-center text-accent hover:text-accent transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />)}
            </button>
            <Dialog.Trigger asChild><button
              className="min-h-11 min-w-11 grid place-items-center -mr-2 text-foreground"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button></Dialog.Trigger>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-background" />
        <Dialog.Content id="mobile-navigation" aria-describedby={undefined} className="fixed inset-0 z-[61] h-[100dvh] overflow-y-auto bg-background pt-20 animate-fade-in">
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <nav aria-label="Mobile navigation" className="container-wide py-12 flex flex-col gap-8">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={(event) => handleSectionNavigation(event, item.hash)}
                className={`text-4xl font-display animate-fade-in-up ${
                  isNavActive(item.hash) ? "text-accent" : "text-foreground"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Dialog.Close aria-label="Close menu" className="absolute top-5 right-6 grid size-11 place-items-center"><X size={24} /></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </header>
    </Dialog.Root>
  );
}

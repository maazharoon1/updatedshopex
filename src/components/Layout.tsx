import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  noPadding?: boolean;
  showEchelonFooter?: boolean;
  headerRevealMode?: boolean;
}

export function Layout({ 
  children, 
  hideFooter = false, 
  noPadding = false,
  showEchelonFooter = false,
  headerRevealMode = false,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-background focus:p-3">Skip to content</a>
      <Header revealMode={headerRevealMode} />
      <main id="main-content" tabIndex={-1} className={`min-w-0 flex-1 ${noPadding ? '' : 'pt-20 md:pt-24'}`}>
        {children}
      </main>
      {!hideFooter && (
        <Footer variant={showEchelonFooter ? "echelon" : "default"} />
      )}
    </div>
  );
}

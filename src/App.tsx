import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";

const Video = lazy(() => import("./pages/Video"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-background" aria-label="Loading page" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/work" element={<Navigate to="/#projects" replace />} />
            <Route path="/video/:id" element={<Video />} />
            <Route path="/about" element={<About />} />
            {/* <Route path="/contact" element={<Contact />} /> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </Suspense>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;

import { Link } from "react-router-dom";
import { useSeo } from "@/hooks/use-seo";

const NotFound = () => {
  useSeo({ title: "404 — Page not found | ShopEx Studio", description: "The requested page could not be found.", noIndex: true });
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;

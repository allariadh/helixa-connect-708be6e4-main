import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { BrandingProvider } from "./contexts/BrandingContext";
import { SessionProvider } from "./contexts/SessionContext";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

const queryClient = new QueryClient();

const STALE_VITE_RELOAD_KEY = "helixa-stale-vite-reload";

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const message = `${event.message || ""} ${event.error?.stack || ""}`;
    const isStaleReactChunk =
      message.includes("Cannot read properties of null") &&
      message.includes("useState") &&
      message.includes("node_modules/.vite/deps");

    if (!isStaleReactChunk || sessionStorage.getItem(STALE_VITE_RELOAD_KEY) === "1") return;

    sessionStorage.setItem(STALE_VITE_RELOAD_KEY, "1");
    const url = new URL(window.location.href);
    url.searchParams.set("helixa_refresh", Date.now().toString());
    window.location.replace(url.toString());
  });
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppErrorBoundary>
      <SessionProvider>
        <BrandingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </BrandingProvider>
      </SessionProvider>
    </AppErrorBoundary>
  </QueryClientProvider>
);

export default App;

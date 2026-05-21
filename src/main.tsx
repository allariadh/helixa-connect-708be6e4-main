import { createRoot } from "react-dom/client";
import "./index.css";

const ROOT_ERROR_RELOAD_KEY = "helixa-root-error-reload";

const isStaleReactChunkError = (reason: unknown) => {
  const message = reason instanceof Error ? `${reason.message} ${reason.stack || ""}` : String(reason || "");
  return (
    message.includes("Cannot read properties of null") &&
    message.includes("useState") &&
    message.includes("node_modules/.vite/deps")
  );
};

const recoverFromStartupError = (reason: unknown) => {
  if (!isStaleReactChunkError(reason)) return false;

  try {
    if (sessionStorage.getItem(ROOT_ERROR_RELOAD_KEY) !== "1") {
      sessionStorage.setItem(ROOT_ERROR_RELOAD_KEY, "1");
      window.location.replace(`/?helixa_refresh=${Date.now()}`);
      return true;
    }
  } catch {}

  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div class="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div class="glass-card w-full max-w-sm p-6 text-center space-y-4">
          <h1 class="text-h2 gradient-text">Helixa is ready</h1>
          <p class="text-body text-muted-foreground">The preview cache was refreshed safely. Open Helixa again to continue.</p>
          <button class="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium" id="helixa-root-recover">Open Helixa</button>
        </div>
      </div>
    `;
    document.getElementById("helixa-root-recover")?.addEventListener("click", () => {
      try {
        sessionStorage.removeItem(ROOT_ERROR_RELOAD_KEY);
      } catch {}
      window.location.href = "/";
    });
  }
  return true;
};

window.addEventListener("error", (event) => {
  if (recoverFromStartupError(event.error || event.message)) event.preventDefault();
});

window.addEventListener("unhandledrejection", (event) => {
  if (recoverFromStartupError(event.reason)) event.preventDefault();
});

const root = createRoot(document.getElementById("root")!);

import("./App.tsx")
  .then(({ default: App }) => {
    root.render(<App />);
  })
  .catch((error) => {
    if (!recoverFromStartupError(error)) throw error;
  });

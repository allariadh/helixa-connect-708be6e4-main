import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import helixaLogo from "@/assets/helixa-logo.png";

interface Branding {
  companyName: string;
  companyLogoUrl: string | null;
  primaryColor: string | null; // hex like #0058bc
}

interface BrandingContextValue extends Branding {
  setBranding: (b: Partial<Branding>) => void;
  resetBranding: () => void;
  resetIdentityCache: () => void;
  loadIdentityForSession: (accountId: string | null) => void;
  effectiveLogo: string;
  hasCustomBranding: boolean;
}

const STORAGE_KEY = "helixa-branding";
const DEFAULT: Branding = {
  companyName: "Helixa",
  companyLogoUrl: null,
  primaryColor: null,
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

function hexToHsl(hex: string): string | null {
  const m = hex.replace("#", "").match(/^([a-f\d]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  // Identity isolation: NEVER pre-load company identity from localStorage on
  // app start. Default to "Helixa" until the current session sets it.
  const [branding, setBrandingState] = useState<Branding>(() => {
    try {
      // Strip any stale company identity from previous sessions on boot.
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("companyName");
      sessionStorage.removeItem("companyId");
    } catch {}
    return DEFAULT;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    } catch {}
    if (branding.primaryColor) {
      const hsl = hexToHsl(branding.primaryColor);
      if (hsl) {
        document.documentElement.style.setProperty("--primary", hsl);
        document.documentElement.style.setProperty("--ring", hsl);
        document.documentElement.style.setProperty("--accent", hsl);
      }
    } else {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--ring");
      document.documentElement.style.removeProperty("--accent");
    }
  }, [branding]);

  const setBranding = (b: Partial<Branding>) =>
    setBrandingState((prev) => ({ ...prev, ...b }));
  const resetBranding = () => setBrandingState(DEFAULT);

  // Identity isolation: clear all cached company identity. Called on every
  // login/registration so previous-session names (e.g. "nasda") never persist.
  const resetIdentityCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("companyName");
      localStorage.removeItem("companyId");
      sessionStorage.removeItem("companyName");
      sessionStorage.removeItem("companyId");
    } catch {}
    setBrandingState(DEFAULT);
  };

  // Load identity for a given authenticated account. Today this is a placeholder
  // that only honors the current-session DB record; no cross-session cache is
  // consulted. Default to "Helixa" when nothing is set this session.
  const loadIdentityForSession = (_accountId: string | null) => {
    setBrandingState(DEFAULT);
  };

  const hasCustomBranding = !!branding.companyLogoUrl;
  const effectiveLogo = branding.companyLogoUrl || helixaLogo;

  return (
    <BrandingContext.Provider
      value={{ ...branding, setBranding, resetBranding, resetIdentityCache, loadIdentityForSession, effectiveLogo, hasCustomBranding }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within BrandingProvider");
  return ctx;
};

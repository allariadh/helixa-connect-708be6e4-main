import { useEffect, useState } from "react";
import { FloatingParticles } from "./FloatingParticles";
import { cn } from "@/lib/utils";
import helixaLogo from "@/assets/helixa-logo.png";
import { useBranding } from "@/contexts/BrandingContext";

interface SplashScreenProps {
  onComplete: () => void;
  variant?: "helixa" | "branded";
}

export const SplashScreen = ({ onComplete, variant = "helixa" }: SplashScreenProps) => {
  const [showTagline, setShowTagline] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const { companyName, effectiveLogo, hasCustomBranding } = useBranding();

  const useBranded = variant === "branded" && hasCustomBranding;
  const logo = useBranded ? effectiveLogo : helixaLogo;
  const name = useBranded ? companyName : "HELIXA";
  const tagline = useBranded
    ? "Connect your team. Command your decisions."
    : "Connect your team. Command your decisions.";

  useEffect(() => {
    const taglineTimer = setTimeout(() => setShowTagline(true), 600);
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const completeTimer = setTimeout(() => onComplete(), 2500);
    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500",
        fadeOut && "opacity-0"
      )}
    >
      <FloatingParticles count={30} />
      <div className="animate-scale-in">
        <img
          src={logo}
          alt={name}
          className="w-32 h-32 object-contain animate-glow-pulse rounded-2xl"
        />
      </div>
      <h1 className="mt-6 text-4xl font-bold gradient-text animate-fade-in tracking-wide">
        {name}
      </h1>
      <p
        className={cn(
          "mt-4 text-lg text-muted-foreground transition-all duration-700 px-6 text-center max-w-md",
          showTagline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {tagline}
      </p>
      <div className="mt-12 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

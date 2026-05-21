import { cn } from "@/lib/utils";

interface HelixaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

export const HelixaLogo = ({ size = "md", animate = false, className }: HelixaLogoProps) => {
  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Outer glow */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full bg-primary/20 blur-xl",
          animate && "animate-glow-pulse"
        )} 
      />
      
      {/* Main hexagon container */}
      <div className={cn(
        "relative w-full h-full flex items-center justify-center",
        animate && "animate-spin-slow"
      )}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="helixaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(187 100% 50%)" />
              <stop offset="100%" stopColor="hsl(307 100% 50%)" />
            </linearGradient>
            <linearGradient id="helixaInner" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(187 100% 50% / 0.3)" />
              <stop offset="50%" stopColor="hsl(187 100% 50% / 0.6)" />
              <stop offset="100%" stopColor="hsl(307 100% 50% / 0.3)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Outer hexagon */}
          <polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill="none"
            stroke="url(#helixaGradient)"
            strokeWidth="2"
            filter="url(#glow)"
          />
          
          {/* Inner hexagon */}
          <polygon
            points="50,20 75,35 75,65 50,80 25,65 25,35"
            fill="url(#helixaInner)"
            stroke="url(#helixaGradient)"
            strokeWidth="1.5"
          />
          
          {/* Center crystal */}
          <polygon
            points="50,35 62,42.5 62,57.5 50,65 38,57.5 38,42.5"
            fill="hsl(187 100% 50% / 0.5)"
            stroke="hsl(187 100% 50%)"
            strokeWidth="1"
          />
          
          {/* Connecting lines */}
          <line x1="50" y1="5" x2="50" y2="20" stroke="url(#helixaGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="90" y1="27.5" x2="75" y2="35" stroke="url(#helixaGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="90" y1="72.5" x2="75" y2="65" stroke="url(#helixaGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="50" y1="95" x2="50" y2="80" stroke="url(#helixaGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="10" y1="72.5" x2="25" y2="65" stroke="url(#helixaGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="10" y1="27.5" x2="25" y2="35" stroke="url(#helixaGradient)" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
};

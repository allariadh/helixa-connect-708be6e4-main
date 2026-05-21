import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "./FloatingParticles";
import { CompanyProfileView } from "./CompanyProfileView";
import { 
  Shield, 
  BarChart3, 
  MessageSquare, 
  Users, 
  Sparkles, 
  Building2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import helixaLogo from "@/assets/helixa-logo.png";
import { algerianCompanies, Company } from "@/data/companies";

interface OnboardingCarouselProps {
  onComplete: () => void;
  onSkip: () => void;
}

const slides = [
  {
    id: 1,
    title: "Connect your team. Command your decisions.",
    description: "Helixa is an internal enterprise communication platform powered by AI-driven decision and reputation intelligence, combined with expert human PR services, helping organizations align teams.",
    visual: "network",
  },
  {
    id: 2,
    title: "Our Services",
    description: "Comprehensive solutions for modern public relations",
    visual: "services",
    services: [
      { icon: Shield, label: "Crisis Management" },
      { icon: BarChart3, label: "Sentiment Analysis" },
      { icon: MessageSquare, label: "Strategic Communications" },
      { icon: Users, label: "Stakeholder Engagement" },
      { icon: Sparkles, label: "AI Narrative Simulation" },
      { icon: Building2, label: "Brand Reputation" },
    ],
  },
  {
    id: 3,
    title: "Trusted by Industry Leaders",
    description: "Working with Algeria's leading companies and organizations",
    visual: "clients",
  },
];

export const OnboardingCarousel = ({ onComplete, onSkip }: OnboardingCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  // Show company profile if selected
  if (selectedCompany) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <CompanyProfileView
          company={selectedCompany}
          onBack={() => setSelectedCompany(null)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <FloatingParticles count={15} />
      
      {/* Skip button */}
      <div className="absolute top-6 right-6 z-50">
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-lg animate-fade-in" key={currentSlide}>
          {/* Slide 1: About */}
          {currentSlide === 0 && (
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <img 
                    src={helixaLogo} 
                    alt="Helixa" 
                    className="w-24 h-24 object-contain animate-glow-pulse"
                  />
                  {/* Network lines */}
                  <div className="absolute -inset-8">
                    <svg className="w-full h-full opacity-30">
                      <circle cx="20%" cy="30%" r="4" fill="hsl(187 100% 50%)" />
                      <circle cx="80%" cy="25%" r="3" fill="hsl(307 100% 50%)" />
                      <circle cx="15%" cy="70%" r="3" fill="hsl(187 100% 50%)" />
                      <circle cx="85%" cy="75%" r="4" fill="hsl(307 100% 50%)" />
                      <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="hsl(187 100% 50% / 0.3)" strokeWidth="1" />
                      <line x1="80%" y1="25%" x2="50%" y2="50%" stroke="hsl(307 100% 50% / 0.3)" strokeWidth="1" />
                      <line x1="15%" y1="70%" x2="50%" y2="50%" stroke="hsl(187 100% 50% / 0.3)" strokeWidth="1" />
                      <line x1="85%" y1="75%" x2="50%" y2="50%" stroke="hsl(307 100% 50% / 0.3)" strokeWidth="1" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-body text-muted-foreground leading-relaxed">
                {slides[0].description}
              </p>
            </div>
          )}

          {/* Slide 2: Services */}
          {currentSlide === 1 && (
            <div className="text-center">
              <h2 className="text-h1 gradient-text mb-4">{slides[1].title}</h2>
              <p className="text-body text-muted-foreground mb-8">
                {slides[1].description}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {slides[1].services?.map((service, index) => (
                  <div
                    key={service.label}
                    className="glass-card p-4 flex flex-col items-center gap-3 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <service.icon className="w-8 h-8 text-primary" />
                    <span className="text-caption text-foreground">{service.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slide 3: Algerian Partner Companies */}
          {currentSlide === 2 && (
            <div className="text-center">
              <h2 className="text-h1 gradient-text mb-4">{slides[2].title}</h2>
              <p className="text-body text-muted-foreground mb-8">
                {slides[2].description}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {algerianCompanies.map((company, index) => (
                  <div
                    key={company.name}
                    onClick={() => setSelectedCompany(company)}
                    className="glass-card p-4 flex flex-col items-center gap-2 animate-scale-in cursor-pointer hover:border-primary/50 transition-colors"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-14 h-14 rounded-xl bg-card border border-border/50 flex items-center justify-center overflow-hidden">
                      <img 
                        src={company.logo} 
                        alt={company.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </div>
                    <span className="text-body font-medium text-foreground">{company.name}</span>
                    <span className="text-caption text-muted-foreground">{company.industry}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                currentSlide === index
                  ? "w-8 bg-primary"
                  : "bg-muted-foreground/40"
              )}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          {currentSlide > 0 && (
            <Button variant="outline" onClick={prevSlide} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button 
            variant="hero" 
            onClick={nextSlide} 
            className={cn("flex-1", currentSlide === 0 && "w-full")}
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

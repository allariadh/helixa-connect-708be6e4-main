import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { OnboardingCarousel } from "@/components/OnboardingCarousel";
import { AuthScreen } from "@/components/AuthScreen";
import { TopHeader } from "@/components/TopHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HomeFeed } from "@/components/HomeFeed";
import { MessagesScreen } from "@/components/MessagesScreen";
import { AIHub } from "@/components/AIHub";
import { SearchScreen } from "@/components/SearchScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { ContactScreen } from "@/components/ContactScreen";
import { OperationsScreen } from "@/components/OperationsScreen";
import { EmployeeManagement } from "@/components/EmployeeManagement";
import { JobOffersManagement } from "@/components/JobOffersManagement";

type AppState = "splash" | "onboarding" | "auth" | "branded-splash" | "app";
type NavTab = "home" | "messages" | "ai" | "search" | "profile" | "contact" | "operations" | "team" | "jobs";


const Index = () => {
  const [appState, setAppState] = useState<AppState>("splash");
  const [activeTab, setActiveTab] = useState<NavTab>("home");

  useEffect(() => {
    const openTab = (event: Event) => {
      const tab = (event as CustomEvent<NavTab>).detail;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener("helixa-open-tab", openTab);
    return () => window.removeEventListener("helixa-open-tab", openTab);
  }, []);

  const handleSplashComplete = () => {
    setAppState("onboarding");
  };

  const handleOnboardingComplete = () => {
    setAppState("auth");
  };

  const handleAuthComplete = () => {
    setAppState("branded-splash");
  };

  const handleGuestAccess = () => {
    setAppState("app");
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeFeed />;
      case "messages":
        return <MessagesScreen />;
      case "ai":
        return <AIHub />;
      case "search":
        return <SearchScreen />;
      case "profile":
        return <ProfileScreen onOpenTeam={() => setActiveTab("team")} onOpenJobs={() => setActiveTab("jobs")} onLogout={() => { setActiveTab("home"); setAppState("auth"); }} />;
      case "jobs":
        return <JobOffersManagement onBack={() => setActiveTab("profile")} />;
      case "contact":
        return <ContactScreen onBack={() => setActiveTab("home")} />;
      case "operations":
        return <OperationsScreen />;
      case "team":
        return <EmployeeManagement onBack={() => setActiveTab("profile")} onEmployeeOnboarded={() => setActiveTab("messages")} />;
      default:
        return <HomeFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Splash Screen */}
      {appState === "splash" && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* Onboarding Carousel */}
      {appState === "onboarding" && (
        <OnboardingCarousel
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}

      {/* Auth Screen */}
      {appState === "auth" && (
        <AuthScreen
          onComplete={handleAuthComplete}
          onGuestAccess={handleGuestAccess}
        />
      )}

      {appState === "branded-splash" && (
        <SplashScreen variant="branded" onComplete={() => setAppState("app")} />
      )}

      {/* Main App */}
      {appState === "app" && (
        <div className="flex flex-col min-h-screen pb-20">
          <TopHeader />
          <main className="flex-1 flex flex-col">
            {renderActiveScreen()}
          </main>
          <BottomNavigation
            activeTab={(activeTab === "team" || activeTab === "jobs" ? "profile" : activeTab) as never}
            onTabChange={(t) => setActiveTab(t as NavTab)}
            unreadMessages={7}
          />
        </div>
      )}
    </div>
  );
};

export default Index;

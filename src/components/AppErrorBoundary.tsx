import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import helixaLogo from "@/assets/helixa-logo.png";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

const RECOVERY_KEYS = [
  "helixa-profile",
  "helixa-competitors",
  "helixa-branding",
  "helixa-current-tenant",
  "companyName",
  "companyId",
];

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Helixa recovered from a render error", error, errorInfo);
  }

  private recover = () => {
    try {
      RECOVERY_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch {}
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="glass-card w-full max-w-sm p-6 text-center space-y-4">
          <img src={helixaLogo} alt="Helixa" className="w-20 h-20 mx-auto rounded-2xl object-contain" />
          <div>
            <h1 className="text-h2 gradient-text">Helixa is ready</h1>
            <p className="text-body text-muted-foreground mt-2">
              A saved screen state was refreshed safely. Continue to reload the app cleanly.
            </p>
          </div>
          <Button variant="hero" className="w-full" onClick={this.recover}>
            Open Helixa
          </Button>
        </div>
      </div>
    );
  }
}
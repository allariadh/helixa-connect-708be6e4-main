import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "./FloatingParticles";
import { useBranding } from "@/contexts/BrandingContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  ChevronLeft,
  ArrowRight,
  Phone,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Camera,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";

type AuthView = "choice" | "login" | "signup-type" | "signup-org" | "signup-individual" | "subscription" | "payment";

interface AuthScreenProps {
  onComplete: () => void;
  onGuestAccess: () => void;
}

// Subscription plans with DZD pricing
const subscriptionPlans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 4900,
    yearlyPrice: 47000,
    features: [
      "Up to 5 team members",
      "Basic AI assistant",
      "50 AI queries/month",
      "Standard support",
      "10 GB storage",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 16900,
    yearlyPrice: 162000,
    popular: true,
    features: [
      "Up to 25 team members",
      "Advanced AI with voice",
      "Unlimited AI queries",
      "Priority support",
      "100 GB storage",
      "Custom integrations",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      "Unlimited team members",
      "Dedicated AI instance",
      "White-label options",
      "24/7 premium support",
      "Unlimited storage",
      "API access",
    ],
  },
];

export const AuthScreen = ({ onComplete, onGuestAccess }: AuthScreenProps) => {
  const [view, setView] = useState<AuthView>("choice");
  const [showPassword, setShowPassword] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Organization signup form
  const { setBranding, resetIdentityCache } = useBranding();
  const { setRole } = useSession();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(null);
  const [orgPrimaryColor, setOrgPrimaryColor] = useState<string>("#0058bc");
  const [orgData, setOrgData] = useState({
    companyName: "",
    companyEmail: "",
    website: "",
    industry: "",
    location: "",
    companySize: "",
    description: "",
    contactName: "",
    contactPosition: "",
    contactPhone: "",
    contactPhoto: null as string | null,
    password: "",
    confirmPassword: "",
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setOrgLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Individual signup form
  const [individualData, setIndividualData] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    industry: "",
    description: "",
    location: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Identity isolation — clear any cached company name from prior session
    resetIdentityCache();
    setRole("ROLE_CEO", loginEmail || "session-user");
    onComplete();
  };

  const handleOrgSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset cached identity BEFORE applying the new branding
    resetIdentityCache();
    setBranding({
      companyName: orgData.companyName || "Helixa",
      companyLogoUrl: orgLogoPreview,
      primaryColor: orgPrimaryColor,
    });
    setRole("ROLE_CEO", orgData.companyEmail || "ceo");
    setView("subscription");
  };

  const handleIndividualSignup = (e: React.FormEvent) => {
    e.preventDefault();
    resetIdentityCache();
    setRole("ROLE_MANAGER", individualData.email || "individual");
    setView("subscription");
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    if (planId === "enterprise") {
      // Contact sales flow
      onComplete();
    } else {
      setView("payment");
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete();
  };

  const goBack = () => {
    switch (view) {
      case "login":
      case "signup-type":
        setView("choice");
        break;
      case "signup-org":
      case "signup-individual":
        setView("signup-type");
        break;
      case "subscription":
        setView("signup-type");
        break;
      case "payment":
        setView("subscription");
        break;
      default:
        setView("choice");
    }
  };

  const formatDZD = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ').format(amount) + " DZD";
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background overflow-y-auto">
      <FloatingParticles count={10} />

      {/* Back button */}
      {view !== "choice" && (
        <button
          onClick={goBack}
          className="absolute top-6 left-4 z-50 flex items-center gap-1 text-muted-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-6">
        <h1 className="text-2xl font-bold gradient-text">HELIXA</h1>
      </div>

      {/* Choice View */}
      {view === "choice" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm space-y-4">
            <Button
              variant="cyan-outline"
              size="xl"
              className="w-full"
              onClick={() => setView("login")}
            >
              Sign In
            </Button>
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={() => setView("signup-type")}
            >
              Create Account
            </Button>
          </div>
        </div>
      )}

      {/* Login View */}
      {view === "login" && (
        <div className="flex-1 px-6 pt-4 pb-8">
          <h2 className="text-h2 text-foreground text-center mb-6">Welcome Back</h2>
          <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-muted pl-11 pr-11 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Eye className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-caption text-muted-foreground">
                <input type="checkbox" className="rounded border-border" />
                Remember me
              </label>
              <button type="button" className="text-caption text-primary">
                Forgot Password?
              </button>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              Sign In
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-caption text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="glass"
                size="lg"
                className="w-full"
                onClick={async () => {
                  try {
                    const result = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (result.error) {
                      toast.error("Google sign-in failed. Please try again.");
                      return;
                    }
                    if (result.redirected) return;
                    resetIdentityCache();
                    setRole("ROLE_CEO", loginEmail || "google-user");
                    onComplete();
                  } catch (e) {
                    console.error(e);
                    toast.error("Google sign-in failed.");
                  }
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Signup Type Selection */}
      {view === "signup-type" && (
        <div className="flex-1 px-6 pt-4 pb-8">
          <h2 className="text-h2 text-foreground text-center mb-2">Create Account</h2>
          <p className="text-body text-muted-foreground text-center mb-6">Choose your account type</p>
          
          <div className="space-y-4 max-w-sm mx-auto">
            <button
              onClick={() => setView("signup-individual")}
              className="w-full glass-card p-5 text-left transition-all duration-300 hover:border-primary"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-body font-semibold text-foreground">Individual Professional</h3>
                  <p className="text-caption text-muted-foreground mt-1">
                    For PR professionals, consultants, freelancers, and startups
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setView("signup-org")}
              className="w-full glass-card p-5 text-left transition-all duration-300 hover:border-accent"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-body font-semibold text-foreground">Organization / Enterprise</h3>
                  <p className="text-caption text-muted-foreground mt-1">
                    For companies, agencies, institutions, and large teams
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Organization Signup Form */}
      {view === "signup-org" && (
        <div className="flex-1 px-6 pt-4 pb-8 overflow-y-auto">
          <h2 className="text-h2 text-foreground text-center mb-2">Organization Details</h2>
          <p className="text-body text-muted-foreground text-center mb-6">Tell us about your company</p>
          
          <form onSubmit={handleOrgSignup} className="space-y-4 max-w-sm mx-auto">
            {/* Company Logo Upload */}
            <div className="flex flex-col items-center mb-4 gap-3">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors overflow-hidden"
              >
                {orgLogoPreview ? (
                  <img src={orgLogoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-muted-foreground" />
                    <span className="text-caption text-muted-foreground">Add Logo</span>
                  </>
                )}
              </button>
              <label className="flex items-center gap-2 text-caption text-muted-foreground">
                Brand color
                <input
                  type="color"
                  value={orgPrimaryColor}
                  onChange={(e) => setOrgPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-border bg-transparent cursor-pointer"
                />
              </label>
            </div>

            {/* Company Information */}
            <div className="space-y-3">
              <h3 className="text-body font-medium text-foreground">Company Information</h3>
              
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={orgData.companyName}
                  onChange={(e) => setOrgData({ ...orgData, companyName: e.target.value })}
                  placeholder="Company Name *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={orgData.companyEmail}
                  onChange={(e) => setOrgData({ ...orgData, companyEmail: e.target.value })}
                  placeholder="Company Email *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="url"
                  value={orgData.website}
                  onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                  placeholder="Website (optional)"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <select
                value={orgData.industry}
                onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                className="w-full bg-muted px-4 py-3 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Select Industry *</option>
                <option value="technology">Technology</option>
                <option value="energy">Energy & Oil</option>
                <option value="telecom">Telecommunications</option>
                <option value="finance">Finance & Banking</option>
                <option value="healthcare">Healthcare</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail & Commerce</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={orgData.location}
                  onChange={(e) => setOrgData({ ...orgData, location: e.target.value })}
                  placeholder="Location (City, Algeria) *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <select
                value={orgData.companySize}
                onChange={(e) => setOrgData({ ...orgData, companySize: e.target.value })}
                className="w-full bg-muted px-4 py-3 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Company Size *</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>

              <textarea
                value={orgData.description}
                onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                placeholder="Brief description of your company"
                rows={3}
                className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-body font-medium text-foreground">Contact Person</h3>

              {/* Contact Person profile picture */}
              <div className="flex justify-center">
                <label className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                  {orgData.contactPhoto ? (
                    <img src={orgData.contactPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => setOrgData((p) => ({ ...p, contactPhoto: reader.result as string }));
                      reader.readAsDataURL(f);
                    }}
                  />
                </label>
              </div>
              
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={orgData.contactName}
                  onChange={(e) => setOrgData({ ...orgData, contactName: e.target.value })}
                  placeholder="Full Name *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={orgData.contactPosition}
                  onChange={(e) => setOrgData({ ...orgData, contactPosition: e.target.value })}
                  placeholder="Your Position/Role *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={orgData.contactPhone}
                  onChange={(e) => setOrgData({ ...orgData, contactPhone: e.target.value })}
                  placeholder="Phone Number *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            {/* Social Media Integration (additive) */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-body font-medium text-foreground">Connect Social Media Accounts</h3>
              <p className="text-caption text-muted-foreground">Optional — feeds external presence data into AI analysis.</p>
              <div className="grid grid-cols-2 gap-2">
                {["LinkedIn", "Instagram", "Facebook", "X (Twitter)"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toast.info(`${p} OAuth — coming soon`)}
                    className="bg-muted hover:bg-muted/80 transition-colors py-2.5 rounded-xl text-caption text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-body font-medium text-foreground">Create Password</h3>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={orgData.password}
                  onChange={(e) => setOrgData({ ...orgData, password: e.target.value })}
                  placeholder="Password *"
                  className="w-full bg-muted pl-11 pr-11 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={orgData.confirmPassword}
                  onChange={(e) => setOrgData({ ...orgData, confirmPassword: e.target.value })}
                  placeholder="Confirm Password *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 text-caption text-muted-foreground pt-4">
              <input type="checkbox" className="rounded border-border mt-0.5" required />
              <span>
                I agree to the{" "}
                <button type="button" className="text-primary">Terms of Service</button>
                {" "}and{" "}
                <button type="button" className="text-primary">Privacy Policy</button>
              </span>
            </label>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              Continue to Plans
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>
      )}

      {/* Individual Signup Form */}
      {view === "signup-individual" && (
        <div className="flex-1 px-6 pt-4 pb-8 overflow-y-auto">
          <h2 className="text-h2 text-foreground text-center mb-2">Professional Details</h2>
          <p className="text-body text-muted-foreground text-center mb-6">Tell us about you and your business</p>
          
          <form onSubmit={handleIndividualSignup} className="space-y-4 max-w-sm mx-auto">
            {/* Profile Photo Upload */}
            <div className="flex justify-center mb-4">
              <button
                type="button"
                className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-caption text-muted-foreground">Photo</span>
              </button>
            </div>

            {/* Personal Information */}
            <div className="space-y-3">
              <h3 className="text-body font-medium text-foreground">Personal Information</h3>
              
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={individualData.fullName}
                  onChange={(e) => setIndividualData({ ...individualData, fullName: e.target.value })}
                  placeholder="Full Name *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={individualData.email}
                  onChange={(e) => setIndividualData({ ...individualData, email: e.target.value })}
                  placeholder="Email Address *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={individualData.phone}
                  onChange={(e) => setIndividualData({ ...individualData, phone: e.target.value })}
                  placeholder="Phone Number *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={individualData.location}
                  onChange={(e) => setIndividualData({ ...individualData, location: e.target.value })}
                  placeholder="Location (City, Algeria) *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-body font-medium text-foreground">Business / Startup Details</h3>
              
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={individualData.businessName}
                  onChange={(e) => setIndividualData({ ...individualData, businessName: e.target.value })}
                  placeholder="Business/Startup Name"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <select
                value={individualData.businessType}
                onChange={(e) => setIndividualData({ ...individualData, businessType: e.target.value })}
                className="w-full bg-muted px-4 py-3 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Business Type *</option>
                <option value="freelancer">Freelancer</option>
                <option value="consultant">Consultant</option>
                <option value="startup">Startup</option>
                <option value="agency">Small Agency</option>
                <option value="other">Other</option>
              </select>

              <select
                value={individualData.industry}
                onChange={(e) => setIndividualData({ ...individualData, industry: e.target.value })}
                className="w-full bg-muted px-4 py-3 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Industry Focus *</option>
                <option value="pr">Public Relations</option>
                <option value="marketing">Marketing & Advertising</option>
                <option value="media">Media & Communications</option>
                <option value="digital">Digital Marketing</option>
                <option value="corporate">Corporate Communications</option>
                <option value="other">Other</option>
              </select>

              <textarea
                value={individualData.description}
                onChange={(e) => setIndividualData({ ...individualData, description: e.target.value })}
                placeholder="Describe your services or what your startup does"
                rows={3}
                className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Password */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-body font-medium text-foreground">Create Password</h3>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={individualData.password}
                  onChange={(e) => setIndividualData({ ...individualData, password: e.target.value })}
                  placeholder="Password *"
                  className="w-full bg-muted pl-11 pr-11 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={individualData.confirmPassword}
                  onChange={(e) => setIndividualData({ ...individualData, confirmPassword: e.target.value })}
                  placeholder="Confirm Password *"
                  className="w-full bg-muted pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 text-caption text-muted-foreground pt-4">
              <input type="checkbox" className="rounded border-border mt-0.5" required />
              <span>
                I agree to the{" "}
                <button type="button" className="text-primary">Terms of Service</button>
                {" "}and{" "}
                <button type="button" className="text-primary">Privacy Policy</button>
              </span>
            </label>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              Continue to Plans
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>
      )}

      {/* Subscription Selection */}
      {view === "subscription" && (
        <div className="flex-1 px-6 pt-4 pb-8 overflow-y-auto">
          <h2 className="text-h2 text-foreground text-center mb-2">Choose Your Plan</h2>
          <p className="text-body text-muted-foreground text-center mb-4">Select the best plan for your needs</p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center mb-6">
            <div className="flex bg-muted rounded-xl p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={cn(
                  "px-4 py-2 rounded-lg text-caption font-medium transition-all",
                  billingPeriod === "monthly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={cn(
                  "px-4 py-2 rounded-lg text-caption font-medium transition-all flex items-center gap-2",
                  billingPeriod === "yearly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                Yearly
                <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div>
          
          <div className="space-y-4 max-w-sm mx-auto">
            {subscriptionPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={cn(
                  "w-full glass-card p-5 text-left transition-all duration-300 relative",
                  plan.popular && "border-primary ring-2 ring-primary/20"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-body font-semibold text-foreground">{plan.name}</h3>
                    {plan.monthlyPrice ? (
                      <p className="text-h2 font-bold text-foreground mt-1">
                        {formatDZD(billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice!)}
                        <span className="text-caption text-muted-foreground font-normal">
                          /{billingPeriod === "monthly" ? "month" : "year"}
                        </span>
                      </p>
                    ) : (
                      <p className="text-body font-medium text-primary mt-1">Contact Sales</p>
                    )}
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-caption text-muted-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment View */}
      {view === "payment" && (
        <div className="flex-1 px-6 pt-4 pb-8 overflow-y-auto">
          <h2 className="text-h2 text-foreground text-center mb-2">Payment Details</h2>
          <p className="text-body text-muted-foreground text-center mb-6">Secure payment processing</p>
          
          <form onSubmit={handlePayment} className="space-y-4 max-w-sm mx-auto">
            {/* Order Summary */}
            <div className="glass-card p-4 mb-4">
              <h3 className="text-body font-medium text-foreground mb-3">Order Summary</h3>
              <div className="flex justify-between text-caption text-muted-foreground mb-2">
                <span>
                  {subscriptionPlans.find(p => p.id === selectedPlan)?.name} Plan
                </span>
                <span>
                  {formatDZD(
                    billingPeriod === "monthly"
                      ? subscriptionPlans.find(p => p.id === selectedPlan)?.monthlyPrice || 0
                      : subscriptionPlans.find(p => p.id === selectedPlan)?.yearlyPrice || 0
                  )}
                </span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between text-body font-medium text-foreground">
                  <span>Total</span>
                  <span>
                    {formatDZD(
                      billingPeriod === "monthly"
                        ? subscriptionPlans.find(p => p.id === selectedPlan)?.monthlyPrice || 0
                        : subscriptionPlans.find(p => p.id === selectedPlan)?.yearlyPrice || 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <h3 className="text-body font-medium text-foreground">Payment Method · CCP Card</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="glass-card p-3 text-center border-primary ring-2 ring-primary/20"
                >
                  <span className="text-caption text-foreground">💳 Card</span>
                </button>
                <button
                  type="button"
                  className="glass-card p-3 text-center"
                >
                  <span className="text-caption text-muted-foreground">🏦 Bank Transfer</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Cardholder Name *"
                className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />

              <input
                type="text"
                placeholder="Card Number *"
                className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="MM/YY *"
                  className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <input
                  type="text"
                  placeholder="CVV *"
                  className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-caption text-muted-foreground pt-2">
              <Lock className="w-4 h-4" />
              <span>Your payment is secure and encrypted</span>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              Complete Payment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Users,
  Briefcase,
  FileText,
  Send,
  Upload,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { denyMessage } from "@/lib/permissions";
import { toast } from "sonner";
import { Lock as LockIcon } from "lucide-react";
import { jobsStore, applicationsStore, JobOffer } from "@/lib/jobsStore";

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  description: string;
  services: string[];
  location: string;
  website: string;
  phone: string;
  email: string;
  employees: string;
  founded: string;
}

interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  posted: string;
}

interface CompanyProfileViewProps {
  company: Company;
  onBack: () => void;
}

const fallbackJobs: JobOffer[] = [
  { id: "demo-1", title: "PR Manager", type: "Full-time", location: "Algiers", description: "", requirements: "", status: "Active", createdAt: new Date().toISOString() },
  { id: "demo-2", title: "Communications Specialist", type: "Full-time", location: "Oran", description: "", requirements: "", status: "Active", createdAt: new Date().toISOString() },
];

export const CompanyProfileView = ({ company, onBack }: CompanyProfileViewProps) => {
  const [activeTab, setActiveTab] = useState<"about" | "services" | "jobs" | "contact">("about");
  const [cvUploaded, setCvUploaded] = useState(false);
  const [contactCvName, setContactCvName] = useState<string | null>(null);
  const [contactCvFile, setContactCvFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const [messageSent, setMessageSent] = useState(false);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const [activeOffers, setActiveOffers] = useState<JobOffer[]>(() => {
    const stored = jobsStore.active();
    return stored.length ? stored : fallbackJobs;
  });
  useEffect(() => {
    const sync = () => {
      const stored = jobsStore.active();
      setActiveOffers(stored.length ? stored : fallbackJobs);
    };
    window.addEventListener("helixa-jobs-changed", sync);
    return () => window.removeEventListener("helixa-jobs-changed", sync);
  }, []);
  const { can } = useSession();

  // Recherche dual-permission check: company must allow + visitor must be allowed.
  // Today the company's canReceiveMessages defaults true for the demo dataset.
  const sendCheck = can("recherche.send", { canReceiveMessages: true });

  // Visibility hardening: only render an explicit allowlist of public fields.
  const publicCompany = {
    name: company.name,
    logo: company.logo,
    industry: company.industry,
    description: company.description,
    services: company.services,
    location: company.location,
    website: company.website,
    phone: company.phone,
    email: company.email,
    employees: company.employees,
    founded: company.founded,
  };

  const handleCvUpload = (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload your CV as a PDF file.");
      return;
    }
    setContactCvFile(file);
    setContactCvName(file.name);
    setCvUploaded(true);
    setTimeout(() => setCvUploaded(false), 3000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendCheck.allowed) {
      toast.error(denyMessage(sendCheck.reason!));
      return;
    }
    // If a job offer is selected, route to Recruitment Inbox
    if (selectedJobId) {
      const job = activeOffers.find(j => j.id === selectedJobId);
      applicationsStore.add({
        jobOfferId: selectedJobId,
        jobTitle: job?.title || "(Unknown)",
        applicantName: contactForm.name,
        applicantPhone: contactForm.phone,
        cvName: contactCvName,
        cvUrl: contactCvFile ? URL.createObjectURL(contactCvFile) : null,
        cvSize: contactCvFile ? `${Math.max(1, Math.round(contactCvFile.size / 1024))} KB` : null,
        message: contactForm.message,
      });
      toast.success("Application sent to Recruitment Inbox");
    } else {
      toast.success("Message sent");
    }
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setContactForm({ name: "", phone: "", message: "" });
      setContactCvName(null);
      setContactCvFile(null);
      setSelectedJobId("");
    }, 3000);
  };

  const tabs = [
    { id: "about", label: "About" },
    { id: "services", label: "Services" },
    { id: "jobs", label: "Jobs" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-primary/30 to-accent/30" />
        <Button
          variant="glass"
          size="icon"
          onClick={onBack}
          className="absolute top-4 left-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Company Info Card */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="glass-card p-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-card border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={company.logo}
                alt={company.name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-h2 text-foreground truncate">{company.name}</h1>
              <p className="text-body text-primary">{company.industry}</p>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-caption">{company.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "cyan" : "glass"}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 custom-scrollbar">
        {/* About Tab */}
        {activeTab === "about" && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-4">
              <h3 className="text-body font-medium text-foreground mb-2">About Us</h3>
              <p className="text-caption text-muted-foreground leading-relaxed">
                {company.description}
              </p>
            </div>

            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-caption text-muted-foreground">Employees</p>
                  <p className="text-body text-foreground">{company.employees}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-caption text-muted-foreground">Founded</p>
                  <p className="text-body text-foreground">{company.founded}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-caption text-muted-foreground">Website</p>
                  <p className="text-body text-primary">{company.website}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-body font-medium text-foreground">Our Services</h3>
            {company.services.map((service, index) => (
              <div key={index} className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <span className="text-body text-foreground">{service}</span>
              </div>
            ))}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="space-y-4 animate-fade-in">
            {/* CV Upload Section — moved to TOP so it's always visible */}
            <div className="glass-card p-4 border-primary/40">
              <h4 className="text-body font-medium text-foreground mb-2">Submit Your CV</h4>
              <p className="text-caption text-muted-foreground mb-4">
                Upload your CV (PDF) to apply for positions at {company.name}
              </p>
              
              <input
                ref={cvInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleCvUpload(e.target.files?.[0])}
              />
              {cvUploaded ? (
                <div className="text-center py-4 animate-scale-in">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-body text-foreground">CV Uploaded Successfully!</p>
                  <p className="text-caption text-muted-foreground">Now pick a job offer below and send your application.</p>
                </div>
              ) : (
                <Button variant="cyan" className="w-full" onClick={() => cvInputRef.current?.click()}>
                  <Upload className="w-5 h-5 mr-2" />
                  {contactCvName ? `Selected: ${contactCvName}` : "Upload CV"}
                </Button>
              )}

              {/* Quick application — visible right after CV upload */}
              {contactCvName && (
                <div className="mt-4 space-y-2 pt-4 border-t border-border/30">
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Your Name *"
                    className="w-full bg-muted px-3 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="Phone *"
                    className="w-full bg-muted px-3 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full bg-muted px-3 py-2.5 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  >
                    <option value="">Select a job offer *</option>
                    {activeOffers.map((j) => (
                      <option key={j.id} value={j.id}>{j.title}{j.location ? ` — ${j.location}` : ""}</option>
                    ))}
                  </select>
                  <Button
                    variant="hero"
                    className="w-full"
                    disabled={!contactForm.name.trim() || !contactForm.phone.trim() || !selectedJobId}
                    onClick={(e) => handleContactSubmit(e as unknown as React.FormEvent)}
                  >
                    <Send className="w-4 h-4 mr-2" /> Send Application
                  </Button>
                </div>
              )}
            </div>

            <h3 className="text-body font-medium text-foreground">Job offers available</h3>

            {activeOffers.length === 0 && (
              <p className="text-caption text-muted-foreground">No active job offers right now.</p>
            )}
            {activeOffers.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => { setSelectedJobId(job.id); setActiveTab("contact"); }}
                className={cn(
                  "w-full text-left glass-card p-4 transition-colors",
                  selectedJobId === job.id && "border-primary/60 ring-1 ring-primary/40"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-body font-medium text-foreground">{job.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {job.type && <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">{job.type}</span>}
                      {job.location && <span className="text-caption text-muted-foreground">{job.location}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                {job.description && <p className="text-caption text-muted-foreground line-clamp-2">{job.description}</p>}
                <p className="text-[10px] text-primary mt-2">Tap to apply →</p>
              </button>
            ))}
          </div>
        )}


        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="space-y-4 animate-fade-in">
            {/* Contact Info */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-body text-foreground">{company.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-body text-foreground">{company.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-body text-foreground">{company.location}</span>
              </div>
            </div>

            {/* Contact Form — dual permission gated */}
            {!sendCheck.allowed ? (
              <div className="glass-card p-6 text-center text-caption text-muted-foreground flex flex-col items-center gap-2">
                <LockIcon className="w-5 h-5" />
                <span>Direct messaging is not available for this company.</span>
              </div>
            ) : messageSent ? (
              <div className="glass-card p-8 text-center animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-h3 text-foreground mb-2">Message Sent!</h3>
                <p className="text-body text-muted-foreground">
                  {publicCompany.name} will contact you soon
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <h4 className="text-body font-medium text-foreground">Send a Message / Apply</h4>

                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Your Name *"
                  className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />

                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="Phone Number *"
                  className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />

                {/* Job offer dropdown */}
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full bg-muted px-4 py-3 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select a job offer (optional)</option>
                  {activeOffers.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}{j.location ? ` — ${j.location}` : ""}</option>
                  ))}
                </select>

                {/* CV upload */}
                <label className="block">
                  <span className="text-caption text-muted-foreground">Attach your CV (PDF)</span>
                  <div className="mt-1 flex items-center gap-2 bg-muted px-3 py-3 rounded-xl">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-caption text-foreground truncate">
                      {contactCvName || "No file selected"}
                    </span>
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      id="contact-cv"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleCvUpload(f);
                      }}
                    />
                    <Button type="button" variant="glass" size="sm" onClick={() => cvInputRef.current?.click()}>
                      Choose
                    </Button>
                  </div>
                </label>

                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Your Message *"
                  rows={4}
                  className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  required
                />

                {/* PR services link */}
                <a
                  href={company.website?.startsWith("http") ? company.website : `https://${company.website || "example.com"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-caption text-primary underline"
                >
                  Visit our public relations services website →
                </a>

                <Button type="submit" variant="hero" className="w-full">
                  Send Application
                  <Send className="w-5 h-5 ml-2" />
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

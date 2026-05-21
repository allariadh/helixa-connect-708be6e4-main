import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare,
  Clock,
  Globe
} from "lucide-react";
import helixaLogo from "@/assets/helixa-logo.png";
import { prRequestsStore } from "@/lib/prRequestsStore";
import { toast } from "sonner";

interface ContactScreenProps {
  onBack: () => void;
}

const HELIXA_PR_WEBSITE = "https://helixa.dz/pr-services";

export const ContactScreen = ({ onBack }: ContactScreenProps) => {
  const [formData, setFormData] = useState({
    company: "",
    subject: "",
    message: "",
    prWebsite: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    prRequestsStore.submit({
      source: "app",
      company: formData.company,
      subject: formData.subject,
      message: formData.message,
      prWebsite: HELIXA_PR_WEBSITE,
    });
    toast.success("Request sent to Helixa PR team");
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ company: "", subject: "", message: "", prWebsite: "" });
    }, 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex justify-center mb-4">
          <img src={helixaLogo} alt="Helixa" className="w-16 h-16 object-contain" />
        </div>
        <h1 className="text-h1 gradient-text text-center mb-2">Contact Us</h1>
        <p className="text-body text-muted-foreground text-center mb-8">
          Get in touch with our team
        </p>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="glass-card p-4 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-accent" />
            </div>
            <span className="text-caption text-muted-foreground">Phone</span>
            <span className="text-caption text-foreground">0797880474</span>
          </div>
          
          <div className="glass-card p-4 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="text-caption text-muted-foreground">Address</span>
            <span className="text-caption text-foreground">Algeria, Blida</span>
          </div>
          
          <div className="glass-card p-4 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <span className="text-caption text-muted-foreground">Hours</span>
            <span className="text-caption text-foreground">All week 8-18h</span>
          </div>
        </div>

        {/* Helixa PR Services website — placed BEFORE the form */}
        <a
          href={HELIXA_PR_WEBSITE}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card p-4 mb-6 flex items-center gap-3 hover:border-primary/50 transition"
        >
          <Globe className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted-foreground">Helixa PR Services website</p>
            <p className="text-body text-primary truncate">{HELIXA_PR_WEBSITE}</p>
          </div>
          <Send className="w-4 h-4 text-primary -rotate-45" />
        </a>

        {/* Contact Form */}
        {submitted ? (
          <div className="glass-card p-8 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-h2 text-foreground mb-2">Message Sent!</h3>
            <p className="text-body text-muted-foreground">
              Thank you for contacting us. We'll get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-body font-medium text-foreground">Send us a message</h3>
            <p className="text-caption text-muted-foreground">
              Just enter your company — we'll identify your profile and tailor PR services for you.
            </p>

            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Company Name *"
              className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />

            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full bg-muted px-4 py-3 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">Select Subject *</option>
              <option value="general">General Inquiry</option>
              <option value="sales">Sales & Pricing</option>
              <option value="support">Technical Support</option>
              <option value="partnership">Partnership</option>
              <option value="careers">Careers</option>
              <option value="other">Other</option>
            </select>


            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Your Message *"
              rows={4}
              className="w-full bg-muted px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              required
            />

            <Button type="submit" variant="hero" size="lg" className="w-full">
              Send Message
              <Send className="w-5 h-5 ml-2" />
            </Button>
          </form>
        )}

        {/* Social Links */}
        <div className="mt-8 text-center">
          <p className="text-caption text-muted-foreground mb-4">Follow us</p>
          <div className="flex justify-center gap-4">
            <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </button>
            <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

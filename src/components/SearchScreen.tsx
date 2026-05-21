import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Building2, User, X, TrendingUp, Mail, MessageCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { algerianCompanies, Company } from "@/data/companies";
import { CompanyProfileView } from "./CompanyProfileView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface EmployeeProfile {
  id: string;
  name: string;
  title: string;
  department: string;
  avatar: string;
  companyName?: string;
}

const sampleEmployees: EmployeeProfile[] = [
  { id: "e1", name: "Yasmine Benali", title: "Directrice de la Communication", department: "Marketing", avatar: "YB" },
  { id: "e2", name: "Karim Belkacem", title: "Responsable Stratégie", department: "Direction", avatar: "KB" },
  { id: "e3", name: "Amina Hadj-Ali", title: "Coordinatrice Événementiel", department: "Opérations", avatar: "AH" },
  { id: "e4", name: "Mehdi Saidani", title: "Analyste de Données", department: "Analytics", avatar: "MS" },
  { id: "e5", name: "Nadia Kheloufi", title: "Directrice Générale", department: "Direction", avatar: "NK" },
  { id: "e6", name: "Sofiane Ait-Mokhtar", title: "Chargé Relations Presse", department: "PR", avatar: "SA" },
];

const trendingTopics = [
  { tag: "#GestionDeCrise", mentions: 234, trend: "+45%" },
  { tag: "#StratégieDeMarque", mentions: 189, trend: "+23%" },
  { tag: "#RelationsPresse", mentions: 156, trend: "+18%" },
  { tag: "#IntelligenceArtificielle", mentions: 142, trend: "+67%" },
];

export const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "orgs" | "people">("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<EmployeeProfile | null>(null);

  const q = searchQuery.trim().toLowerCase();

  const filteredCompanies = useMemo(() => {
    if (!q) return [] as Company[];
    return algerianCompanies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q),
    );
  }, [q]);

  const filteredEmployees = useMemo(() => {
    if (!q) return [] as EmployeeProfile[];
    return sampleEmployees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q),
    );
  }, [q]);

  if (selectedCompany) {
    return <CompanyProfileView company={selectedCompany} onBack={() => setSelectedCompany(null)} />;
  }

  const showOrgs = activeTab === "all" || activeTab === "orgs";
  const showPeople = activeTab === "all" || activeTab === "people";

  return (
    <div className="flex-1 flex flex-col pb-24">
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizations or people..."
            className="w-full bg-muted pl-10 pr-10 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
          {[
            { id: "all", label: "All", icon: Search },
            { id: "orgs", label: "Organizations", icon: Building2 },
            { id: "people", label: "People", icon: User },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "cyan" : "glass"}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {!q && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-h3 text-foreground">Trending</h3>
            </div>
            <div className="space-y-2">
              {trendingTopics.map((topic, i) => (
                <div key={topic.tag} className="glass-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-caption text-muted-foreground w-5">{i + 1}</span>
                    <div>
                      <p className="text-body font-medium text-primary">{topic.tag}</p>
                      <p className="text-caption text-muted-foreground">{topic.mentions} mentions</p>
                    </div>
                  </div>
                  <span className="text-caption text-green-600 font-medium">{topic.trend}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {q && showOrgs && (
          <section>
            <h3 className="text-h3 text-foreground mb-3">Organizations ({filteredCompanies.length})</h3>
            {filteredCompanies.length === 0 ? (
              <p className="text-caption text-muted-foreground">No organizations match "{q}".</p>
            ) : (
              <div className="space-y-2">
                {filteredCompanies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompany(c)}
                    className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-muted/40 transition"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img src={c.logo} alt={c.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-body font-medium text-foreground truncate">{c.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary whitespace-nowrap">Uses Helixa</span>
                      </div>
                      <p className="text-caption text-muted-foreground truncate">{c.industry} · {c.location}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {q && showPeople && (
          <section>
            <h3 className="text-h3 text-foreground mb-3">People ({filteredEmployees.length})</h3>
            {filteredEmployees.length === 0 ? (
              <p className="text-caption text-muted-foreground">No people match "{q}".</p>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPerson(p)}
                    className={cn("w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-muted/40 transition")}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                      {p.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-caption text-muted-foreground truncate">{p.title} · <span className="text-primary">{p.department}</span></p>
                    </div>
                    <Button variant="cyan-outline" size="sm">View</Button>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Person Profile Dialog */}
      <Dialog open={!!selectedPerson} onOpenChange={(o) => !o && setSelectedPerson(null)}>
        <DialogContent className="max-w-sm">
          {selectedPerson && (
            <>
              <DialogHeader>
                <DialogTitle>Profile</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl">
                  {selectedPerson.avatar}
                </div>
                <h3 className="text-h3 text-foreground">{selectedPerson.name}</h3>
                <p className="text-caption text-muted-foreground text-center">
                  {selectedPerson.title}
                  <br />
                  <span className="text-primary">{selectedPerson.department}</span>
                </p>
                <div className="flex gap-2 w-full mt-4">
                  <Button variant="cyan" className="flex-1" onClick={() => { toast.success(`Message thread opened with ${selectedPerson.name}`); setSelectedPerson(null); }}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="glass" className="flex-1" onClick={() => { toast.success("Contact details copied"); }}>
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

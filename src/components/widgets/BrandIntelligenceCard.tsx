import { ShieldAlert, TrendingUp, ExternalLink } from "lucide-react";
import { regulatoryFeed, competitorFeed } from "@/data/algerianFeed";
import { Badge } from "@/components/ui/badge";

export const BrandIntelligenceCard = () => {
  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h3 className="text-h3 text-foreground">Brand Intelligence — Algérie</h3>
        </div>
        <Badge variant="secondary" className="text-[10px]">Live</Badge>
      </div>

      <div>
        <p className="text-caption text-muted-foreground mb-2">Décisions réglementaires · قرارات تنظيمية</p>
        <ul className="space-y-2">
          {regulatoryFeed.map((r) => (
            <li key={r.id} className="flex items-start gap-2 text-sm">
              <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-foreground">{r.title}</p>
                <p className="text-caption text-muted-foreground" dir="rtl">{r.titleAr}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.source} · {r.date}</p>
              </div>
              <span
                className={
                  "text-[10px] px-2 py-0.5 rounded-full " +
                  (r.impact === "High"
                    ? "bg-red-500/15 text-red-500"
                    : "bg-yellow-500/15 text-yellow-500")
                }
              >
                {r.impact}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-3 border-t border-border/30">
        <p className="text-caption text-muted-foreground mb-2 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> Veille concurrentielle — Marché DZ
        </p>
        <ul className="space-y-1.5">
          {competitorFeed.map((c) => (
            <li key={c.id} className="text-sm flex items-start gap-2">
              <span className="font-medium text-primary">{c.company}</span>
              <span className="text-muted-foreground flex-1">{c.action}</span>
              <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">{c.signal}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

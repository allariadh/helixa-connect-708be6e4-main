import { Rocket, CheckCircle2, Clock, Circle } from "lucide-react";
import { launchTimeline } from "@/data/algerianFeed";

const statusIcon = (s: string) => {
  if (s === "done") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (s === "in_progress") return <Clock className="w-4 h-4 text-yellow-500" />;
  return <Circle className="w-4 h-4 text-muted-foreground" />;
};

export const ProductLaunchCard = () => {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Rocket className="w-5 h-5 text-primary" />
        <h3 className="text-h3 text-foreground">Lancement Produit — Condor C-Smart Pro</h3>
      </div>
      <p className="text-caption text-muted-foreground">
        Press release FR/AR prête · Visuels validés · Rollout interne en cours
      </p>

      <div className="space-y-2">
        {launchTimeline.map((t) => (
          <div key={t.id} className="flex items-center gap-3">
            {statusIcon(t.status)}
            <div className="flex-1">
              <p className="text-sm text-foreground">{t.step}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">{t.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

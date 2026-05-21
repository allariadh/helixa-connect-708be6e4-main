import { Mail, Users, Activity } from "lucide-react";
import { internalMemos } from "@/data/algerianFeed";

export const InternalCommsCard = () => {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-h3 text-foreground">Communication Interne</h3>
        </div>
        <div className="flex items-center gap-1 text-caption text-muted-foreground">
          <Activity className="w-3.5 h-3.5" />
          <span>Engagement : 87%</span>
        </div>
      </div>

      <ul className="space-y-2">
        {internalMemos.map((m) => (
          <li key={m.id} className="flex items-start gap-2">
            <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <span className="text-primary font-medium">{m.from}</span> — {m.subject}
              </p>
              <p className="text-caption text-muted-foreground" dir="rtl">{m.subjectAr}</p>
            </div>
            <span className="text-[10px] text-muted-foreground">{m.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

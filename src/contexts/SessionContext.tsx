import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";
import {
  Actor,
  Action,
  Resource,
  Role,
  can,
  makeActor,
  makePublicActor,
} from "@/lib/permissions";

interface SessionContextValue {
  actor: Actor;
  setRole: (role: Role, userId?: string) => void;
  signOut: () => void;
  can: (action: Action, target?: Resource) => ReturnType<typeof can>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [actor, setActor] = useState<Actor>(() => makePublicActor());

  const setRole = useCallback((role: Role, userId = "session-user") => {
    setActor(makeActor(role, userId));
  }, []);

  const signOut = useCallback(() => setActor(makePublicActor()), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      actor,
      setRole,
      signOut,
      can: (action, target) => can(actor, action, target),
    }),
    [actor, setRole, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
};

export const useCan = (action: Action, target?: Resource) => {
  const { can } = useSession();
  return can(action, target);
};

import { createContext, useCallback, useContext, useState } from "react";
import { activityEntries } from "../data/demoData";
import type { ActivityEntry } from "../types";

type NewActivity = Omit<ActivityEntry, "id" | "timestamp">;
type ActivityContextValue = { activities: ActivityEntry[]; recordActivity: (activity: NewActivity) => void };

const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState(activityEntries);
  const recordActivity = useCallback((activity: NewActivity) => {
    setActivities((current) => [{ ...activity, id: `ACT-${current.length + 1}`, timestamp: "Just now" }, ...current]);
  }, []);
  return <ActivityContext.Provider value={{ activities, recordActivity }}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error("useActivity must be used inside ActivityProvider.");
  return context;
}

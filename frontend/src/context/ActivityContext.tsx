// Kept as a small compatibility layer for pages that only need activity history.
import { useDemo } from "./DemoContext";

export function useActivity() {
  const { activities, recordActivity } = useDemo();
  return { activities, recordActivity };
}

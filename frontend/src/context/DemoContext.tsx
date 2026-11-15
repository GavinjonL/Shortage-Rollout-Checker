import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ActivityEntry, CandidateRule, Finding, RolloutFinding } from "../types";

type NewActivity = Omit<ActivityEntry, "id" | "timestamp">;
type WorkspaceContextValue = {
  policyText: string; rules: CandidateRule[]; findings: Finding[]; rolloutFindings: RolloutFinding[]; activities: ActivityEntry[];
  confirmedRuleCount: number; isPolicyConfirmed: boolean;
  setPolicyText: (text: string) => void; addRule: () => void; setCandidateRules: (rules: CandidateRule[]) => void;
  updateRule: (id: string, updates: Partial<CandidateRule>) => void; removeRule: (id: string) => void;
  updateFindingStatus: (id: string, status: string) => void; recordActivity: (activity: NewActivity) => void; clearWorkspace: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [policyText, setPolicyText] = useState("");
  const [rules, setRules] = useState<CandidateRule[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [rolloutFindings, setRolloutFindings] = useState<RolloutFinding[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const confirmedRuleCount = rules.filter((rule) => rule.status === "Confirmed").length;
  const isPolicyConfirmed = rules.length > 0 && confirmedRuleCount === rules.length;
  const recordActivity = useCallback((activity: NewActivity) => setActivities((current) => [{ ...activity, id: `ACT-${crypto.randomUUID()}`, timestamp: "Just now" }, ...current]), []);
  const addRule = useCallback(() => setRules((current) => [...current, {
    id: `POL-${String(current.length + 1).padStart(3, "0")}`,
    title: "", condition: "", expectedBehavior: "", sourceExcerpt: "", status: "Draft",
    medicationId: "", departmentId: "", restriction: "", approvedAlternativeId: "", effectiveDate: "",
  }]), []);
  const updateFindingStatus = useCallback((id: string, status: string) => {
    setFindings((current) => current.map((finding) => finding.id === id ? { ...finding, review_status: status } : finding));
    setRolloutFindings((current) => current.map((finding) => finding.id === id ? { ...finding, review_status: status } : finding));
  }, []);
  const clearWorkspace = useCallback(() => { setPolicyText(""); setRules([]); setFindings([]); setRolloutFindings([]); setActivities([]); }, []);
  const value = useMemo(() => ({
    policyText, rules, findings, rolloutFindings, activities, confirmedRuleCount, isPolicyConfirmed, setPolicyText, addRule, setCandidateRules: setRules,
    updateRule: (id: string, updates: Partial<CandidateRule>) => setRules((current) => current.map((rule) => rule.id === id ? { ...rule, ...updates } : rule)),
    removeRule: (id: string) => setRules((current) => current.filter((rule) => rule.id !== id)),
    updateFindingStatus, recordActivity, clearWorkspace,
  }), [policyText, rules, findings, rolloutFindings, activities, confirmedRuleCount, isPolicyConfirmed, addRule, updateFindingStatus, recordActivity, clearWorkspace]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useDemo() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider.");
  return context;
}

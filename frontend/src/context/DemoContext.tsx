import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { activityEntries, demoFindings, rolloutFindings } from "../data/demoData";
import type { ActivityEntry, CandidateRule, Finding, RolloutFinding } from "../types";

const demoPolicyText = `Fictional shortage policy — MED-A IV

Effective 2026-11-15, MED-A is restricted at DEPT-GENERAL-WARD while inventory is below the pharmacy-defined shortage threshold. For eligible adult orders, MED-B is the approved alternative. MED-B must not be used when oral administration is contraindicated. Departmental order sets and dispensing-system instructions must display the current shortage guidance.`;

const candidateRuleDraft: CandidateRule[] = [
  { id: "POL-001", title: "Use the approved oral alternative when eligible", condition: "IV acetaminophen stock is below the shortage threshold and oral administration is appropriate.", expectedBehavior: "Present the approved oral acetaminophen alternative for new adult orders.", sourceExcerpt: "New adult orders should use the approved oral acetaminophen alternative when the patient can take oral medication.", status: "Draft" },
  { id: "POL-002", title: "Do not substitute when oral use is contraindicated", condition: "Oral administration is contraindicated.", expectedBehavior: "Do not present the oral alternative as a shortage substitution.", sourceExcerpt: "The alternative must not be used when oral administration is contraindicated.", status: "Draft" },
  { id: "POL-003", title: "Keep rollout instructions current", condition: "The shortage policy is active.", expectedBehavior: "Order sets and dispensing-system instructions display current shortage guidance.", sourceExcerpt: "Departmental order sets and dispensing-system instructions must display current shortage guidance.", status: "Draft" },
];

type NewActivity = Omit<ActivityEntry, "id" | "timestamp">;
type DemoContextValue = {
  policyText: string; rules: CandidateRule[]; findings: Finding[]; rolloutFindings: RolloutFinding[]; activities: ActivityEntry[];
  confirmedRuleCount: number; isPolicyConfirmed: boolean;
  loadDemoPolicy: () => void; createCandidateRules: () => void; setCandidateRules: (rules: CandidateRule[]) => void; updateRule: (id: string, updates: Partial<CandidateRule>) => void;
  updateFindingStatus: (id: string, status: string) => void; recordActivity: (activity: NewActivity) => void; resetDemo: () => void;
};

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [policyText, setPolicyText] = useState("");
  const [rules, setRules] = useState<CandidateRule[]>([]);
  const [findings, setFindings] = useState<Finding[]>(demoFindings);
  const [sharedRolloutFindings, setSharedRolloutFindings] = useState<RolloutFinding[]>(rolloutFindings);
  const [activities, setActivities] = useState<ActivityEntry[]>(activityEntries);
  const confirmedRuleCount = rules.filter((rule) => rule.status === "Confirmed").length;
  const isPolicyConfirmed = rules.length > 0 && confirmedRuleCount === rules.length;
  const recordActivity = useCallback((activity: NewActivity) => setActivities((current) => [{ ...activity, id: `ACT-${current.length + 1}`, timestamp: "Just now" }, ...current]), []);
  const updateFindingStatus = useCallback((id: string, status: string) => {
    setFindings((current) => current.map((finding) => finding.id === id ? { ...finding, review_status: status } : finding));
    setSharedRolloutFindings((current) => current.map((finding) => finding.id === id ? { ...finding, review_status: status } : finding));
  }, []);
  const resetDemo = useCallback(() => { setPolicyText(""); setRules([]); setFindings(demoFindings); setSharedRolloutFindings(rolloutFindings); setActivities(activityEntries); }, []);
  const value = useMemo(() => ({
    policyText, rules, findings, rolloutFindings: sharedRolloutFindings, activities, confirmedRuleCount, isPolicyConfirmed,
    loadDemoPolicy: () => { setPolicyText(demoPolicyText); setRules([]); }, createCandidateRules: () => setRules(candidateRuleDraft), setCandidateRules: setRules,
    updateRule: (id: string, updates: Partial<CandidateRule>) => setRules((current) => current.map((rule) => rule.id === id ? { ...rule, ...updates } : rule)),
    updateFindingStatus, recordActivity, resetDemo,
  }), [policyText, rules, findings, sharedRolloutFindings, activities, confirmedRuleCount, isPolicyConfirmed, updateFindingStatus, recordActivity, resetDemo]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider.");
  return context;
}

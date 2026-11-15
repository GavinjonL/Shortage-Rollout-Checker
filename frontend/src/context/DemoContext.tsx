import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { confirmPolicyRules, fetchDemoData, fetchRolloutFindings, resetDemoData } from "../api/client";
import type { ActivityEntry, CandidateRule, Finding } from "../types";

const demoPolicyText = `Fictional test policy ZX-731.
Effective 2026-11-15, restrict med-a-iv in dept-emergency while the shortage flag is active. For med-a-iv in dept-emergency, med-b-oral is the approved alternative when oral administration is eligible. Order sets must display the current restriction and shortage guidance.`;
type NewActivity = Omit<ActivityEntry, "id" | "timestamp">;
type DemoContextValue = {
  policyText: string; rules: CandidateRule[]; findings: Finding[]; activities: ActivityEntry[];
  findingsError: string; configurationCount: number | null; confirmedRuleCount: number; isPolicyConfirmed: boolean;
  loadDemoPolicy: () => void; setPolicyText: (text: string) => void; loadDemoData: () => Promise<void>;
  setCandidateRules: (rules: CandidateRule[]) => void; updateRule: (id: string, updates: Partial<CandidateRule>) => void;
  recordActivity: (activity: NewActivity) => void; resetDemo: () => Promise<void>;
};
const DemoContext = createContext<DemoContextValue | undefined>(undefined);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [configurationCount, setConfigurationCount] = useState<number | null>(null);
  useEffect(() => { fetchDemoData().then(data => setConfigurationCount(data.configurations.length)).catch(() => setConfigurationCount(null)); }, []);
  const [policyText, setPolicyText] = useState("");
  const [rules, setRules] = useState<CandidateRule[]>([]);
  const [findingsError, setFindingsError] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const confirmedRuleCount = rules.filter(rule => rule.status === "Confirmed").length;
  const isPolicyConfirmed = confirmedRuleCount > 0 && rules.every(rule => rule.status !== "Draft");
  useEffect(() => {
    let active = true;
    setFindings([]); setFindingsError("");
    if (isPolicyConfirmed) fetchRolloutFindings().then(data => { if (active) setFindings(data.findings); }).catch(error => { if (active) setFindingsError(error instanceof Error ? error.message : "Unable to load findings."); });
    return () => { active = false; };
  }, [rules, isPolicyConfirmed]);
  const recordActivity = useCallback((activity: NewActivity) => setActivities(current => [{ ...activity, id: crypto.randomUUID(), timestamp: new Date().toLocaleString() }, ...current]), []);
  const loadDemoData = useCallback(async () => {
    const dataset = await fetchDemoData();
    await confirmPolicyRules([]);
    setPolicyText(demoPolicyText); setConfigurationCount(dataset.configurations.length);
    setRules([]); setFindings([]);
    recordActivity({ actor: "Demo user", feature: "Foundation", action: "Loaded demo source data", target: dataset.policy.id, detail: `${dataset.medications.length} fictional medications and ${dataset.departments.length} departments. Extract and confirm a policy to generate findings.` });
  }, [recordActivity]);
  const resetDemo = useCallback(async () => {
    const dataset = await resetDemoData();
    setConfigurationCount(dataset.configurations.length);
    setPolicyText(""); setRules([]); setFindings([]); setActivities([]);
  }, []);
  const value = useMemo(() => ({
    policyText, rules, findings, findingsError, activities, configurationCount, confirmedRuleCount, isPolicyConfirmed,
    loadDemoPolicy: () => { setPolicyText(demoPolicyText); setRules([]); },
    setPolicyText: (text: string) => { setPolicyText(text); setRules([]); }, loadDemoData,
    setCandidateRules: setRules,
    updateRule: (id: string, updates: Partial<CandidateRule>) => setRules(current => current.map(rule => rule.id === id ? { ...rule, ...updates } : rule)),
    recordActivity, resetDemo,
  }), [policyText, rules, findings, findingsError, activities, configurationCount, confirmedRuleCount, isPolicyConfirmed, recordActivity, loadDemoData, resetDemo]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider.");
  return context;
}

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { activityEntries, demoFindings, rolloutFindings } from "../data/demoData";
import { confirmPolicyRules, fetchDemoData, fetchRolloutFindings, resetDemoData } from "../api/client";
import type { ActivityEntry, CandidateRule, DemoDataset, Finding, RolloutFinding } from "../types";

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
  loadDemoPolicy: () => void; loadDemoData: () => Promise<void>; createCandidateRules: () => void; setCandidateRules: (rules: CandidateRule[]) => void; updateRule: (id: string, updates: Partial<CandidateRule>) => void;
  updateFindingStatus: (id: string, status: string) => void; recordActivity: (activity: NewActivity) => void; resetDemo: () => Promise<void>; activateConfirmedPolicy: () => Promise<void>; refreshRolloutFindings: () => Promise<void>; dataset: DemoDataset | null;
};

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [policyText, setPolicyText] = useState("");
  const [dataset, setDataset] = useState<DemoDataset | null>(null);
  const [backendPolicyActive, setBackendPolicyActive] = useState(false);
  const [rules, setRules] = useState<CandidateRule[]>([]);
  const [findings, setFindings] = useState<Finding[]>(demoFindings);
  const [sharedRolloutFindings, setSharedRolloutFindings] = useState<RolloutFinding[]>(rolloutFindings);
  const [activities, setActivities] = useState<ActivityEntry[]>(activityEntries);
  const confirmedRuleCount = rules.filter((rule) => rule.status === "Confirmed").length;
  const isPolicyConfirmed = rules.length > 0 && confirmedRuleCount === rules.length && backendPolicyActive;
  const recordActivity = useCallback((activity: NewActivity) => setActivities((current) => [{ ...activity, id: `ACT-${current.length + 1}`, timestamp: "Just now" }, ...current]), []);
  const updateFindingStatus = useCallback((id: string, status: string) => {
    setFindings((current) => current.map((finding) => finding.id === id ? { ...finding, review_status: status } : finding));
    setSharedRolloutFindings((current) => current.map((finding) => finding.id === id ? { ...finding, review_status: status } : finding));
  }, []);
  const loadDemoData = useCallback(async () => {
    const dataset = await fetchDemoData();
    const sourceText = dataset.policy.rules.map((rule) => rule.source_excerpt).join("\n\n");
    setPolicyText(sourceText);
    setDataset(dataset);
    setBackendPolicyActive(false);
    setRules(dataset.policy.rules.map((rule) => ({ id: rule.id, title: rule.restriction, condition: rule.condition, expectedBehavior: `Approved alternative: ${rule.approved_alternative_id ?? "None specified"}. Effective ${rule.effective_date}.`, sourceExcerpt: rule.source_excerpt, status: "Draft" })));
    setFindings(demoFindings);
    setSharedRolloutFindings(rolloutFindings);
    setActivities([{ id: "ACT-DEMO-LOAD", timestamp: "Just now", actor: "Demo user", feature: "Foundation", action: "Loaded demo data", target: dataset.policy.id, detail: `${dataset.medications.length} fictional medications and ${dataset.departments.length} departments loaded.` }, ...activityEntries]);
  }, []);
  const resetDemo = useCallback(async () => {
    const dataset = await resetDemoData();
    setDataset(dataset); setBackendPolicyActive(false);
    setPolicyText(""); setRules([]); setFindings(demoFindings); setSharedRolloutFindings(rolloutFindings); setActivities(activityEntries);
  }, []);
  const refreshRolloutFindings = useCallback(async () => {
    const apiFindings = await fetchRolloutFindings();
    const departments = new Map(dataset?.departments.map((item) => [item.id, item.name]));
    const nextFindings = apiFindings.map((finding) => ({ id: finding.id, feature: "Rollout Review", severity: finding.severity, summary: finding.summary, evidence_ids: finding.evidence_ids, assumptions: finding.assumptions, review_status: finding.review_status, created_at: finding.created_at, department: departments.get(finding.department_id) ?? finding.department_id, systemType: finding.system_type, policyRuleId: finding.policy_rule_id, sourceRecordId: finding.source_record_id, evidenceSummary: finding.instruction_text }));
    setSharedRolloutFindings(nextFindings);
    setFindings(nextFindings);
  }, [dataset]);
  const activateConfirmedPolicy = useCallback(async () => {
    if (!dataset) throw new Error("Load the fictional demo data before confirming the policy.");
    await confirmPolicyRules(dataset.policy.rules);
    setBackendPolicyActive(true);
    await refreshRolloutFindings();
    recordActivity({ actor: "Pharmacist reviewer", feature: "Policy Setup", action: "Activated confirmed policy", target: dataset.policy.id, detail: "Confirmed fictional policy shared with all demo features." });
  }, [dataset, refreshRolloutFindings, recordActivity]);
  const value = useMemo(() => ({
    policyText, rules, findings, rolloutFindings: sharedRolloutFindings, activities, confirmedRuleCount, isPolicyConfirmed, dataset,
    loadDemoPolicy: () => { setPolicyText(demoPolicyText); setRules(candidateRuleDraft); setBackendPolicyActive(false); }, loadDemoData, createCandidateRules: () => setRules(candidateRuleDraft), setCandidateRules: (nextRules: CandidateRule[]) => { setRules(nextRules); setBackendPolicyActive(false); },
    updateRule: (id: string, updates: Partial<CandidateRule>) => { setRules((current) => current.map((rule) => rule.id === id ? { ...rule, ...updates } : rule)); setBackendPolicyActive(false); },
    updateFindingStatus, recordActivity, resetDemo, activateConfirmedPolicy, refreshRolloutFindings,
  }), [policyText, rules, findings, sharedRolloutFindings, activities, confirmedRuleCount, isPolicyConfirmed, dataset, updateFindingStatus, recordActivity, loadDemoData, resetDemo, activateConfirmedPolicy, refreshRolloutFindings]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider.");
  return context;
}

import type { DemoDataset, PolicyRule } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type { DemoDataset } from "../types";

export async function fetchDemoData(): Promise<DemoDataset> {
  const response = await fetch(`${API_URL}/api/demo`);
  if (!response.ok) throw new Error("Unable to load fictional demo data from the backend.");
  return response.json() as Promise<DemoDataset>;
}

export type SimulatorConfiguration = { id: string; enabled: boolean; instruction_text: string; source_record_id: string };
export type SimulatorTestCase = { id: string; title: string; department_id: string; scenario_text: string; expected_outcome: string; source_rule_id: string; configuration_id: string | null };
export type SimulatorCase = { test_case: SimulatorTestCase; configuration: SimulatorConfiguration | null };
export type SimulationResult = { case_id: string; status: "Pass" | "Possible mismatch" | "Needs clarification"; expected_outcome: string; observed_behavior: string; rule_id: string; configuration_id: string | null; evidence_ids: string[]; assumptions: string[]; reason: string };

export async function fetchSimulationCases(): Promise<SimulatorCase[]> {
  const response = await fetch(`${API_URL}/api/simulator/cases`);
  if (!response.ok) throw new Error("Unable to load fictional simulation cases.");
  return response.json() as Promise<SimulatorCase[]>;
}

export async function runSimulationCase(caseId: string, instructionText: string | null): Promise<SimulationResult> {
  const response = await fetch(`${API_URL}/api/simulator/cases/${caseId}/run`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ configuration_override: instructionText ? { instruction_text: instructionText } : null }),
  });
  const body = await response.json().catch(() => null) as SimulationResult | { detail?: string } | null;
  if (!response.ok) throw new Error(body && "detail" in body ? body.detail ?? "Unable to run simulation." : "Unable to run simulation.");
  return body as SimulationResult;
}

export async function resetDemoData(): Promise<DemoDataset> {
  const response = await fetch(`${API_URL}/api/demo/reset`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to reset the fictional demo data.");
  return response.json() as Promise<DemoDataset>;
}

export type ImportValidationError = { row: number; field: string; message: string };
export type DemoImportResponse = { imported_rows: number; errors: ImportValidationError[]; dataset: DemoDataset | null };

export async function importDemoTable(table: string, file: File): Promise<DemoImportResponse> {
  const format = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
  const response = await fetch(`${API_URL}/api/demo/import/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, content: await file.text() }),
  });
  const body = await response.json().catch(() => null) as DemoImportResponse | { detail?: string } | null;
  if (!response.ok) throw new Error(body && "detail" in body ? body.detail ?? "Unable to import demo data." : "Unable to import demo data.");
  return body as DemoImportResponse;
}

export type ExtractedPolicyRule = {
  medication_id: string | null;
  department_id: string | null;
  condition: string | null;
  restriction: string | null;
  approved_alternative_id: string | null;
  effective_date: string | null;
  source_excerpt: string;
  confirmed_by_user: false;
};

export type PolicyDraftResponse = {
  policy_id: string;
  rules: ExtractedPolicyRule[];
  ambiguities: string[];
  is_draft: true;
};

export async function extractPolicyDraft(policyText: string, policyId = "policy-ui-draft"): Promise<PolicyDraftResponse> {
  const response = await fetch(`${API_URL}/api/policies/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ policy_id: policyId, policy_text: policyText }),
  });
  const body = await response.json().catch(() => null) as PolicyDraftResponse | { detail?: string } | null;
  if (!response.ok) {
    const detail = body && "detail" in body ? body.detail : "Unable to create a policy draft.";
    throw new Error(detail ?? "Unable to create a policy draft.");
  }
  return body as PolicyDraftResponse;
}

export async function confirmPolicyRules(rules: PolicyRule[]): Promise<PolicyRule[]> {
  const response = await fetch(`${API_URL}/api/policies/confirmed`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules }),
  });
  if (!response.ok) throw new Error("Unable to save the confirmed fictional policy.");
  return response.json() as Promise<PolicyRule[]>;
}

export type AiModeStatus = { ok: boolean; provider: string; mode?: string; model?: string };
export async function fetchAiMode(): Promise<AiModeStatus> {
  const response = await fetch(`${API_URL}/api/ai/check`, { method: "POST" });
  const body = await response.json().catch(() => null) as AiModeStatus | { detail?: string } | null;
  if (!response.ok) throw new Error(body && "detail" in body ? body.detail ?? "AI mode unavailable." : "AI mode unavailable.");
  return body as AiModeStatus;
}

export type RolloutApiFinding = { id: string; severity: string; summary: string; evidence_ids: string[]; assumptions: string[]; review_status: string; created_at: string; policy_rule_id: string; source_record_id: string; department_id: string; system_type: string; instruction_text: string };
export async function fetchRolloutFindings(): Promise<RolloutApiFinding[]> {
  const response = await fetch(`${API_URL}/api/rollout/findings`);
  if (!response.ok) throw new Error("Unable to compare the fictional rollout records.");
  const body = await response.json() as { findings: RolloutApiFinding[] };
  return body.findings;
}

export type RippleProjection = { policy_rule_id: string; source_medication_id: string; alternative_medication_id: string; location_id: string; shift_percent: number; baseline_daily_use: number; projected_daily_use: number; quantity_on_hand: number; minimum_reserve: number; usable_supply: number; days_above_reserve: number; formula: string; assumptions: string[] };
export async function fetchRippleProjection(shiftPercent: number): Promise<RippleProjection> {
  const response = await fetch(`${API_URL}/api/ripple/projection?shift_percent=${shiftPercent}`);
  if (!response.ok) throw new Error("Unable to calculate the fictional ripple projection.");
  const body = await response.json() as { primary: { projection: RippleProjection | null; reason: string | null } };
  if (!body.primary.projection) throw new Error(body.primary.reason ?? "No approved alternative projection is available.");
  return body.primary.projection;
}

export type ShadowApiFinding = { id: string; review_status: string; summary: string; policy_rule_id: string; department_id: string; event_type: string; event_count: number; evidence_ids: string[]; source_excerpt: string; time_window: { start: string; end: string; hours: number }; reason: string; assumptions: string[] };
export type ShadowApiEvent = { id: string; timestamp: string; department_id: string; medication_id: string; event_type: string; result: string; source_record_id: string };
export async function fetchShadowAnalysis(): Promise<{ events: ShadowApiEvent[]; findings: ShadowApiFinding[] }> {
  const response = await fetch(`${API_URL}/api/shadow/findings?window_hours=24`);
  if (!response.ok) throw new Error("Unable to analyze the fictional shadow events.");
  return response.json() as Promise<{ events: ShadowApiEvent[]; findings: ShadowApiFinding[] }>;
}

export async function reviewShadowFinding(id: string, status: string, note: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/shadow/findings/${id}/review`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note }) });
  if (!response.ok) throw new Error("Unable to save the fictional Shadow Mode review.");
}

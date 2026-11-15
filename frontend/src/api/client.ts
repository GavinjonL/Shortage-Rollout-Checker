import type { DemoDataset, PolicyRule } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type { DemoDataset } from "../types";

export async function fetchDemoData(): Promise<DemoDataset> {
  const response = await fetch(`${API_URL}/api/demo`);
  if (!response.ok) throw new Error("Unable to load policy data from the backend.");
  return response.json() as Promise<DemoDataset>;
}

export type SimulatorConfiguration = { id: string; enabled: boolean; instruction_text: string; source_record_id: string };
export type SimulatorTestCase = { id: string; title: string; department_id: string; scenario_text: string; expected_outcome: string; source_rule_id: string; configuration_id: string | null };
export type SimulatorCase = { test_case: SimulatorTestCase; configuration: SimulatorConfiguration | null };
export type SimulationResult = { case_id: string; status: "Pass" | "Possible mismatch" | "Needs clarification"; expected_outcome: string; observed_behavior: string; rule_id: string; configuration_id: string | null; evidence_ids: string[]; assumptions: string[]; reason: string };

export async function fetchSimulationCases(): Promise<SimulatorCase[]> {
  const response = await fetch(`${API_URL}/api/simulator/cases`);
  if (!response.ok) throw new Error("Unable to load simulation cases.");
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

export type RippleProjection = { projected_daily_use: number; days_above_reserve: number; source_medication_id: string; alternative_medication_id: string; location_id: string; shift_percent: number; formula: string; assumptions: string[] };
export async function fetchRippleProjection(shift: number, comparison: number) { const response = await fetch(`${API_URL}/api/ripple/projection?shift_percent=${shift}&comparison_shift_percent=${comparison}`); if (!response.ok) throw new Error("Unable to load ripple projection."); return response.json() as Promise<{ primary: { projection: RippleProjection | null; reason: string | null }; comparison: { projection: RippleProjection | null; reason: string | null } | null }>; }
export type ShadowFinding = { id: string; summary: string; reason: string; evidence_ids: string[]; source_excerpt: string; event_count: number; review_status: string; time_window: { start: string; end: string; hours: number } };
export async function fetchShadowFindings() { const response = await fetch(`${API_URL}/api/shadow/findings`); if (!response.ok) throw new Error("Unable to load Shadow Mode findings."); return response.json() as Promise<{ findings: ShadowFinding[] }>; }
export async function saveShadowReview(id: string, status: string, note: string) { const response = await fetch(`${API_URL}/api/shadow/findings/${id}/review`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note }) }); if (!response.ok) throw new Error("Unable to save Shadow Mode review."); }
export async function createShadowFollowUp(id: string) { const response = await fetch(`${API_URL}/api/shadow/findings/${id}/create-test-case`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true }) }); if (!response.ok) throw new Error("Unable to create follow-up case."); }

export async function resetDemoData(): Promise<DemoDataset> {
  const response = await fetch(`${API_URL}/api/demo/reset`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to reset policy data.");
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
  if (!response.ok) throw new Error(body && "detail" in body ? body.detail ?? "Unable to import data." : "Unable to import data.");
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

function localPolicyDraft(policyText: string, policyId: string): PolicyDraftResponse {
  return {
    policy_id: policyId,
    is_draft: true,
    ambiguities: ["Offline demo draft: verify every field against the fictional source text before confirmation."],
    rules: [{
      medication_id: "MED-A",
      department_id: "DEPT-GENERAL-WARD",
      condition: "The fictional shortage flag is active and oral administration is appropriate.",
      restriction: "Restrict MED-A and present MED-B as the approved fictional alternative.",
      approved_alternative_id: "MED-B",
      effective_date: "2026-11-15",
      source_excerpt: policyText.split(".")[0]?.trim() || "Fictional policy text supplied in the demo.",
      confirmed_by_user: false,
    }],
  };
}

export async function extractPolicyDraft(policyText: string, policyId = "policy-ui-draft"): Promise<PolicyDraftResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/policies/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy_id: policyId, policy_text: policyText }),
    });
  } catch {
    return localPolicyDraft(policyText, policyId);
  }
  const body = await response.json().catch(() => null) as PolicyDraftResponse | { detail?: string } | null;
  if (!response.ok) {
    const detail = body && "detail" in body ? body.detail : "Unable to create a policy draft.";
    throw new Error(detail ?? "Unable to create a policy draft.");
  }
  return body as PolicyDraftResponse;
}

export async function confirmPolicyRules(rules: PolicyRule[]): Promise<PolicyRule[]> {
  const response = await fetch(`${API_URL}/api/policies/confirmed`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules }) });
  if (!response.ok) throw new Error("Unable to save confirmed policy rules.");
  return response.json() as Promise<PolicyRule[]>;
}

export type PolicyRuleReview = {
  rule_id: string; policy_id: string; status: "Draft" | "Confirmed" | "Rejected"; title?: string | null;
  medication_id: string | null; department_id: string | null; condition: string | null; restriction: string | null;
  approved_alternative_id: string | null; effective_date: string | null; source_excerpt: string;
};

export async function savePolicyRuleReview(review: PolicyRuleReview): Promise<PolicyRuleReview> {
  const response = await fetch(`${API_URL}/api/policies/rules/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(review) });
  if (!response.ok) throw new Error("Unable to save policy rule review.");
  return response.json() as Promise<PolicyRuleReview>;
}

export async function fetchPolicyHistory(): Promise<{ versions: Array<{ version: number; rules: PolicyRuleReview[] }> }> {
  const response = await fetch(`${API_URL}/api/policies/history`);
  if (!response.ok) throw new Error("Unable to load policy revision history.");
  return response.json() as Promise<{ versions: Array<{ version: number; rules: PolicyRuleReview[] }> }>;
}

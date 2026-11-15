const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type DemoDataset = {
  policy: { id: string; name: string; rules: Array<{ source_excerpt: string }> };
  medications: Array<{ id: string; name: string; form: string }>;
  departments: Array<{ id: string; name: string }>;
  configurations: Array<{ id: string }>;
  test_cases: Array<{ id: string }>;
  inventory: Array<{ medication_id: string }>;
  alternatives: Array<{ source_medication_id: string; alternative_medication_id: string }>;
  events: Array<{ id: string }>;
  findings: Array<{ id: string }>;
};

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

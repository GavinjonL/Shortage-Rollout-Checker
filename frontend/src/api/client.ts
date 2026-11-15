const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
export async function getDemoPolicy() { const response = await fetch(`${API_URL}/policies/demo`); return response.json(); }

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

export interface Finding { id: string; feature: string; severity: string; summary: string; evidence_ids: string[]; assumptions: string[]; review_status: string; created_at: string; }

// Mirrors the backend Pydantic contracts in backend/app/schemas.
export interface ShortagePolicy { id: string; name: string; rules: PolicyRule[]; }
export interface PolicyRule { id: string; policy_id: string; medication_id: string; department_id: string; condition: string; restriction: string; approved_alternative_id: string | null; effective_date: string; source_excerpt: string; confirmed_by_user: boolean; }
export interface Medication { id: string; name: string; form: string; }
export interface Department { id: string; name: string; }
export interface SystemConfig { id: string; system_type: string; department_id: string; medication_id: string; enabled: boolean; instruction_text: string; source_record_id: string; }
export interface Inventory { medication_id: string; location_id: string; quantity_on_hand: number; average_daily_use: number; minimum_reserve: number; }
export interface AlternativeLink { source_medication_id: string; alternative_medication_id: string; approved_condition: string; approved_by_role: string; }
export interface TestCase { id: string; policy_id: string; department_id: string; medication_id: string; scenario_text: string; expected_outcome: string; source_rule_id: string; }
export interface ShadowEvent { id: string; timestamp: string; department_id: string; medication_id: string; event_type: string; result: string; source_record_id: string; }
export interface DemoDataset { policy: ShortagePolicy; medications: Medication[]; departments: Department[]; configurations: SystemConfig[]; test_cases: TestCase[]; inventory: Inventory[]; alternatives: AlternativeLink[]; events: ShadowEvent[]; findings: Finding[]; }

export interface DemoPolicy {
  name: string;
  status: string;
  effectiveDate: string;
  confirmedRules: number;
}

export interface RolloutFinding extends Finding {
  department: string;
  systemType: string;
  policyRuleId: string;
  sourceRecordId: string;
  evidenceSummary: string;
}

export interface SystemConfigRecord {
  id: string;
  department: string;
  systemType: string;
  medication: string;
  instructionText: string;
  state: "Aligned" | "Possible mismatch";
}

export interface RippleInventoryRecord {
  medication: string;
  location: string;
  quantityOnHand: number;
  averageDailyUse: number;
  minimumReserve: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  feature: string;
  action: string;
  target: string;
  detail: string;
}

export type RuleStatus = "Draft" | "Confirmed" | "Rejected";

export interface CandidateRule {
  id: string;
  title: string;
  condition: string;
  expectedBehavior: string;
  sourceExcerpt: string;
  status: RuleStatus;
  medicationId?: string | null;
  departmentId?: string | null;
  restriction?: string | null;
  approvedAlternativeId?: string | null;
  effectiveDate?: string | null;
}

export interface Finding { id: string; feature: string; severity: string; summary: string; evidence_ids: string[]; assumptions: string[]; review_status: string; created_at: string; }

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
}

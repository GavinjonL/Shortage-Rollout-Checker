export interface Finding { id: string; feature: string; severity: string; summary: string; evidence_ids: string[]; assumptions: string[]; review_status: string; created_at: string; }

export interface DemoPolicy {
  name: string;
  status: string;
  effectiveDate: string;
  confirmedRules: number;
}

import type { ActivityEntry, DemoPolicy, Finding, RippleInventoryRecord, RolloutFinding, SystemConfigRecord } from "../types";

export const activeDemoPolicy: DemoPolicy = { name: "MED-A shortage response", status: "Confirmed", effectiveDate: "November 15, 2026", confirmedRules: 3 };

export const demoFindings: Finding[] = [
  { id: "F-104", feature: "Rollout Review", severity: "High", summary: "Infusion Center instruction may still permit unrestricted Orion use.", evidence_ids: ["POL-01", "EHR-204"], assumptions: ["EHR configuration", "Confirmed policy rule POL-01"], review_status: "Needs review", created_at: "2026-11-14T09:30:00Z" },
  { id: "F-105", feature: "Flight Simulator", severity: "Medium", summary: "One order does not specify the policy condition.", evidence_ids: ["TC-03", "POL-03"], assumptions: ["Simulation only", "Supplied order"], review_status: "Needs clarification", created_at: "2026-11-14T09:35:00Z" },
  { id: "F-106", feature: "Shadow Mode", severity: "Medium", summary: "Repeated workaround pattern observed in the Emergency Department.", evidence_ids: ["EV-19", "EV-21", "POL-01"], assumptions: ["Read-only fictional event stream", "24-hour review window"], review_status: "Needs review", created_at: "2026-11-14T10:00:00Z" },
];

export const rolloutFindings: RolloutFinding[] = [
  {
    id: "F-104", feature: "Rollout Review", severity: "High", summary: "Infusion Center instruction may still permit unrestricted Orion use.", evidence_ids: ["POL-01", "EHR-204"], assumptions: ["EHR configuration", "Confirmed policy rule POL-01"], review_status: "Needs review", created_at: "2026-11-14T09:30:00Z", department: "Infusion Center", systemType: "EHR order set", policyRuleId: "POL-01", sourceRecordId: "EHR-204", evidenceSummary: "The confirmed rule restricts Orion in the Infusion Center, while the order-set instruction still reads “available for standard use.”"
  },
  {
    id: "F-107", feature: "Rollout Review", severity: "Medium", summary: "Smart-pump library effective date does not match the confirmed policy.", evidence_ids: ["POL-02", "PUMP-184"], assumptions: ["Fictional smart-pump record", "Confirmed policy rule POL-02"], review_status: "Needs review", created_at: "2026-11-14T09:42:00Z", department: "Emergency Department", systemType: "Smart-pump library", policyRuleId: "POL-02", sourceRecordId: "PUMP-184", evidenceSummary: "The policy takes effect November 18, but the mock smart-pump record is scheduled for November 25."
  },
  {
    id: "F-108", feature: "Rollout Review", severity: "Low", summary: "Dispensing cabinet guidance has already been updated.", evidence_ids: ["POL-01", "ADC-082"], assumptions: ["dispensing-cabinet record"], review_status: "Expected", created_at: "2026-11-14T09:47:00Z", department: "Infusion Center", systemType: "Dispensing cabinet", policyRuleId: "POL-01", sourceRecordId: "ADC-082", evidenceSummary: "The mock cabinet guidance matches the confirmed restriction and is retained as an evidence record."
  },
];

export const systemConfigRecords: SystemConfigRecord[] = [
  { id: "EHR-204", department: "General Ward", systemType: "EHR order set", medication: "MED-A", instructionText: "Available for routine use.", state: "Possible mismatch" },
  { id: "PUMP-184", department: "General Ward", systemType: "Smart-pump library", medication: "MED-A", instructionText: "New limit effective November 25.", state: "Possible mismatch" },
  { id: "ADC-082", department: "General Ward", systemType: "Dispensing cabinet", medication: "MED-A", instructionText: "Restricted per shortage policy.", state: "Aligned" },
  { id: "BUY-031", department: "Central Pharmacy", systemType: "Purchasing record", medication: "MED-B", instructionText: "Approved alternative link recorded.", state: "Aligned" },
];

export const rippleInventory: RippleInventoryRecord[] = [
  { medication: "Orion", location: "Infusion Center", quantityOnHand: 42, averageDailyUse: 14, minimumReserve: 14 },
  { medication: "Aurora", location: "Central Pharmacy", quantityOnHand: 84, averageDailyUse: 12, minimumReserve: 28 },
  { medication: "Aurora", location: "Emergency Department", quantityOnHand: 36, averageDailyUse: 4, minimumReserve: 12 },
];

export const activityEntries: ActivityEntry[] = [
  { id: "ACT-01", timestamp: "Nov 14, 08:45", actor: "Pharmacist reviewer", feature: "Policy Setup", action: "Confirmed policy rule", target: "POL-01", detail: "Restricted Orion use in the Infusion Center." },
  { id: "ACT-02", timestamp: "Nov 14, 09:12", actor: "Pharmacy informatics", feature: "Rollout Review", action: "Opened finding", target: "F-104", detail: "Reviewed the EHR order-set configuration record." },
  { id: "ACT-03", timestamp: "Nov 14, 09:25", actor: "Pharmacist reviewer", feature: "Flight Simulator", action: "Ran case", target: "TC-02", detail: "Simulation returned a possible mismatch using supplied data." },
  { id: "ACT-04", timestamp: "Nov 14, 09:38", actor: "Pharmacy operations", feature: "Ripple Map", action: "Viewed projection", target: "POL-02", detail: "Reviewed the approved alternative-use shift scenario." },
  { id: "ACT-05", timestamp: "Nov 14, 10:00", actor: "Pharmacist reviewer", feature: "Shadow Mode", action: "Opened pattern", target: "F-106", detail: "Reviewed a repeated workaround pattern." },
];

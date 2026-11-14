import type { DemoPolicy, Finding, RippleInventoryRecord, RolloutFinding, SystemConfigRecord } from "../types";

export const activeDemoPolicy: DemoPolicy = { name: "Orion shortage response", status: "Confirmed", effectiveDate: "November 18, 2026", confirmedRules: 3 };

export const demoFindings: Finding[] = [
  { id: "F-104", feature: "Rollout Review", severity: "High", summary: "Infusion Center instruction may still permit unrestricted Orion use.", evidence_ids: ["POL-01", "EHR-204"], assumptions: ["Fictional EHR configuration", "Confirmed policy rule POL-01"], review_status: "Needs review", created_at: "2026-11-14T09:30:00Z" },
  { id: "F-105", feature: "Flight Simulator", severity: "Medium", summary: "One sample order does not specify the policy condition.", evidence_ids: ["TC-03", "POL-03"], assumptions: ["Simulation only", "Supplied sample order"], review_status: "Needs clarification", created_at: "2026-11-14T09:35:00Z" },
  { id: "F-106", feature: "Shadow Mode", severity: "Medium", summary: "Repeated workaround pattern observed in the Emergency Department.", evidence_ids: ["EV-19", "EV-21", "POL-01"], assumptions: ["Read-only fictional event stream", "24-hour review window"], review_status: "Needs review", created_at: "2026-11-14T10:00:00Z" },
];

export const rolloutFindings: RolloutFinding[] = [
  {
    id: "F-104", feature: "Rollout Review", severity: "High", summary: "Infusion Center instruction may still permit unrestricted Orion use.", evidence_ids: ["POL-01", "EHR-204"], assumptions: ["Fictional EHR configuration", "Confirmed policy rule POL-01"], review_status: "Needs review", created_at: "2026-11-14T09:30:00Z", department: "Infusion Center", systemType: "EHR order set", policyRuleId: "POL-01", sourceRecordId: "EHR-204", evidenceSummary: "The confirmed rule restricts Orion in the Infusion Center, while the mock order-set instruction still reads “available for standard use.”"
  },
  {
    id: "F-107", feature: "Rollout Review", severity: "Medium", summary: "Smart-pump library effective date does not match the confirmed policy.", evidence_ids: ["POL-02", "PUMP-184"], assumptions: ["Fictional smart-pump record", "Confirmed policy rule POL-02"], review_status: "Needs review", created_at: "2026-11-14T09:42:00Z", department: "Emergency Department", systemType: "Smart-pump library", policyRuleId: "POL-02", sourceRecordId: "PUMP-184", evidenceSummary: "The policy takes effect November 18, but the mock smart-pump record is scheduled for November 25."
  },
  {
    id: "F-108", feature: "Rollout Review", severity: "Low", summary: "Dispensing cabinet guidance has already been updated.", evidence_ids: ["POL-01", "ADC-082"], assumptions: ["Fictional dispensing-cabinet record"], review_status: "Expected", created_at: "2026-11-14T09:47:00Z", department: "Infusion Center", systemType: "Dispensing cabinet", policyRuleId: "POL-01", sourceRecordId: "ADC-082", evidenceSummary: "The mock cabinet guidance matches the confirmed restriction and is retained as an evidence record."
  },
];

export const systemConfigRecords: SystemConfigRecord[] = [
  { id: "EHR-204", department: "Infusion Center", systemType: "EHR order set", medication: "Orion", instructionText: "Available for standard use.", state: "Possible mismatch" },
  { id: "PUMP-184", department: "Emergency Department", systemType: "Smart-pump library", medication: "Orion", instructionText: "New limit effective November 25.", state: "Possible mismatch" },
  { id: "ADC-082", department: "Infusion Center", systemType: "Dispensing cabinet", medication: "Orion", instructionText: "Restricted per shortage policy.", state: "Aligned" },
  { id: "BUY-031", department: "Central Pharmacy", systemType: "Purchasing record", medication: "Aurora", instructionText: "Approved alternative link recorded.", state: "Aligned" },
];

export const rippleInventory: RippleInventoryRecord[] = [
  { medication: "Orion", location: "Infusion Center", quantityOnHand: 42, averageDailyUse: 14, minimumReserve: 14 },
  { medication: "Aurora", location: "Central Pharmacy", quantityOnHand: 84, averageDailyUse: 12, minimumReserve: 28 },
  { medication: "Aurora", location: "Emergency Department", quantityOnHand: 36, averageDailyUse: 4, minimumReserve: 12 },
];

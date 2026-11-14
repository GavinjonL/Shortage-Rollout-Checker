import type { DemoPolicy, Finding } from "../types";

export const activeDemoPolicy: DemoPolicy = { name: "Orion shortage response", status: "Confirmed", effectiveDate: "November 18, 2026", confirmedRules: 3 };

export const demoFindings: Finding[] = [
  { id: "F-104", feature: "Rollout Review", severity: "High", summary: "Infusion Center instruction may still permit unrestricted Orion use.", evidence_ids: ["POL-01", "EHR-204"], assumptions: ["Fictional EHR configuration", "Confirmed policy rule POL-01"], review_status: "Needs review", created_at: "2026-11-14T09:30:00Z" },
  { id: "F-105", feature: "Flight Simulator", severity: "Medium", summary: "One sample order does not specify the policy condition.", evidence_ids: ["TC-03", "POL-03"], assumptions: ["Simulation only", "Supplied sample order"], review_status: "Needs clarification", created_at: "2026-11-14T09:35:00Z" },
  { id: "F-106", feature: "Shadow Mode", severity: "Medium", summary: "Repeated workaround pattern observed in the Emergency Department.", evidence_ids: ["EV-19", "EV-21", "POL-01"], assumptions: ["Read-only fictional event stream", "24-hour review window"], review_status: "Needs review", created_at: "2026-11-14T10:00:00Z" },
];

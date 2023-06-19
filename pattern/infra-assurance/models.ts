#!/usr/bin/env -S deno run --allow-all

import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/mod.ts";
import * as govn from "./governance.ts";
import * as udm from "../udm/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const { ctx, gm, gts, tcf } = udm;

export const contractStatus = gm.textEnumTable(
  "contract_status",
  govn.ContractStatus,
  { isIdempotent: true },
);

export const paymentType = gm.textEnumTable(
  "payment_type",
  govn.PaymentType,
  { isIdempotent: true },
);

export const periodicity = gm.textEnumTable(
  "periodicity",
  govn.Periodicity,
  { isIdempotent: true },
);

export const boundaryNature = gm.textEnumTable(
  "boundary_nature",
  govn.BoundaryNature,
  { isIdempotent: true },
);

export const timeEntryCategory = gm.textEnumTable(
  "time_entry_category",
  govn.TimeEntryCategory,
  { isIdempotent: true },
);

export const raciMatrixSubject = gm.textEnumTable(
  "raci_matrix_subject",
  govn.RaciMatrixSubject,
  { isIdempotent: true },
);

export const raciMatrixAssignmentNature = gm.textEnumTable(
  "raci_matrix_assignment_nature",
  govn.RaciMatrixAssignmentNature,
  { isIdempotent: true },
);

export const skillNature = gm.textEnumTable(
  "skill_nature",
  govn.SkillNature,
  { isIdempotent: true },
);

export const skill = gm.textEnumTable(
  "skill",
  govn.Skill,
  { isIdempotent: true },
);

export const proficiencyScale = gm.textEnumTable(
  "proficiency_scale",
  govn.ProficiencyScale,
  { isIdempotent: true },
);

export const vulnerabilityStatus = gm.textEnumTable(
  "vulnerability_status",
  govn.VulnerabilityStatus,
  { isIdempotent: true },
);

export const assetStatus = gm.textEnumTable(
  "asset_status",
  govn.AssetStatus,
  { isIdempotent: true },
);

export const assetType = gm.textEnumTable(
  "asset_type",
  govn.AssetType,
  { isIdempotent: true },
);

export const assignment = gm.textEnumTable(
  "assignment",
  govn.Assignment,
  { isIdempotent: true },
);

export const probability = gm.textEnumTable(
  "probability",
  govn.Probability,
  { isIdempotent: true },
);

export const threatSourceType = gm.textEnumTable(
  "threat_source_type",
  govn.ThreatSourceType,
  { isIdempotent: true },
);

export const threatEventType = gm.textEnumTable(
  "threat_event_type",
  govn.ThreatEventType,
  { isIdempotent: true },
);

export const calendarPeriod = gm.textEnumTable(
  "calendar_period",
  govn.CalendarPeriod,
  { isIdempotent: true },
);

export const comparisonOperator = gm.textEnumTable(
  "comparison_operator",
  govn.ComparisonOperator,
  { isIdempotent: true },
);

export const kpiMeasurementType = gm.textEnumTable(
  "kpi_measurement_type",
  govn.KpiMeasurementType,
  { isIdempotent: true },
);

export const kpiStatus = gm.textEnumTable(
  "kpi_status",
  govn.KpiStatus,
  { isIdempotent: true },
);

export const trackingPeriod = gm.textEnumTable(
  "tracking_period",
  govn.TrackingPeriod,
  { isIdempotent: true },
);

export const trend = gm.textEnumTable(
  "trend",
  govn.Trend,
  { isIdempotent: true },
);

export const auditorType = gm.textEnumTable(
  "auditor_type",
  govn.AuditorType,
  { isIdempotent: true },
);

export const auditPurpose = gm.textEnumTable(
  "audit_purpose",
  govn.AuditPurpose,
  { isIdempotent: true },
);

export const auditorStatusType = gm.textEnumTable(
  "audit_status",
  govn.AuditorStatusType,
  { isIdempotent: true },
);

export const trainingSubject = gm.textEnumTable(
  "training_subject",
  govn.TrainingSubject,
  { isIdempotent: true },
);

export const statusValues = gm.textEnumTable(
  "status_value",
  govn.StatusValues,
  { isIdempotent: true },
);

export const ratingValue = gm.textEnumTable(
  "rating_value",
  govn.RatingValue,
  { isIdempotent: true },
);

export const contractType = gm.textEnumTable(
  "contract_type",
  govn.ContractType,
  { isIdempotent: true },
);

export const graphNature = gm.textEnumTable(
  "graph_nature",
  govn.GraphNature,
  { isIdempotent: true },
);

export const severity = gm.textEnumTable(
  "severity",
  govn.Severity,
  { isIdempotent: true },
);

export const assetRiskType = gm.textEnumTable(
  "asset_risk_type",
  govn.AssetRiskType,
  { isIdempotent: true },
);

export const priority = gm.textEnumTable(
  "priority",
  govn.Priority,
  { isIdempotent: true },
);

export const riskSubject = gm.textEnumTable(
  "risk_subject",
  govn.RiskSubject,
  { isIdempotent: true },
);

export const riskType = gm.textEnumTable(
  "risk_type",
  govn.RiskType,
  { isIdempotent: true },
);

export const incidentCategory = gm.textEnumTable(
  "incident_category",
  govn.IncidentCategory,
  { isIdempotent: true },
);

export const incidentSubCategory = gm.textEnumTable(
  "incident_sub_category",
  govn.IncidentSubCategory,
  { isIdempotent: true },
);

export const incidentType = gm.textEnumTable(
  "incident_type",
  govn.IncidentType,
  { isIdempotent: true },
);

export const incidentStatus = gm.textEnumTable(
  "incident_status",
  govn.IncidentStatus,
  { isIdempotent: true },
);

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allReferenceTables: (
  & SQLa.TableDefinition<Any, udm.EmitContext>
  & typ.EnumTableDefn<udm.EmitContext>
)[] = [
  udm.execCtx,
  udm.partyType,
  udm.partyRole,
  contractStatus,
  paymentType,
  periodicity,
  boundaryNature,
  timeEntryCategory,
  raciMatrixSubject,
  raciMatrixAssignmentNature,
  skillNature,
  skill,
  proficiencyScale,
  vulnerabilityStatus,
  assetStatus,
  assetType,
  assignment,
  probability,
  threatSourceType,
  threatEventType,
  calendarPeriod,
  comparisonOperator,
  kpiMeasurementType,
  kpiStatus,
  trackingPeriod,
  trend,
  auditorType,
  auditPurpose,
  auditorStatusType,
  udm.partyRelationType,
  udm.partyIdentifierType,
  udm.personType,
  udm.contactType,
  trainingSubject,
  statusValues,
  ratingValue,
  contractType,
  graphNature,
  riskSubject,
  riskType,
  incidentCategory,
  incidentSubCategory,
  severity,
  priority,
  incidentType,
  incidentStatus,
  assetRiskType,
];

export const graph = gm.autoIncPkTable("graph", {
  graph_id: udm.autoIncPK(),
  graph_nature_id: graphNature.references.code(),
  name: udm.text(),
  description: udm.textNullable(),
  ...gm.housekeeping.columns,
});

export const boundary_id = udm.autoIncPK();
export const boundary = gm.autoIncPkTable("boundary", {
  boundary_id,
  parent_boundary_id: udm.selfRef(boundary_id).optional(),
  graph_id: graph.references.graph_id(),
  boundary_nature_id: boundaryNature.references.code(),
  name: udm.text(),
  description: udm.textNullable(),
  ...gm.housekeeping.columns,
});

export const host = gm.autoIncPkTable("host", {
  host_id: udm.autoIncPK(),
  host_name: tcf.unique(udm.text()),
  description: udm.textNullable(),
  ...gm.housekeeping.columns,
});

export const hostBoundary = gm.autoIncPkTable("host_boundary", {
  host_boundary_id: udm.autoIncPK(),
  host_id: host.references.host_id(),
  ...gm.housekeeping.columns,
});

export const raciMatrix = gm.autoIncPkTable("raci_matrix", {
  raci_matrix_id: udm.autoIncPK(),
  asset: udm.text(),
  responsible: udm.text(),
  accountable: udm.text(),
  consulted: udm.text(),
  informed: udm.text(),
  ...gm.housekeeping.columns,
});

export const raciMatrixSubjectBoundary = gm.autoIncPkTable(
  "raci_matrix_subject_boundary",
  {
    raci_matrix_subject_boundary_id: udm.autoIncPK(),
    boundary_id: boundary.references.boundary_id(),
    raci_matrix_subject_id: raciMatrixSubject.references.code(),
    ...gm.housekeeping.columns,
  },
);

export const raciMatrixActivity = gm.autoIncPkTable("raci_matrix_activity", {
  raci_matrix_activity_id: udm.autoIncPK(),
  activity: udm.text(),
  ...gm.housekeeping.columns,
});

export const party = gm.autoIncPkTable("party", {
  party_id: udm.autoIncPK(),
  party_type_id: udm.partyType.references.code(),
  party_name: udm.text(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://help.salesforce.com/s/articleView?id=sf.c360_a_partyidentification_object.htm&type=5
 */

export const partyIdentifier = gm.autoIncPkTable("party_identifier", {
  party_identifier_id: udm.autoIncPK(),
  identifier_number: udm.text(),
  party_identifier_type_id: udm.partyIdentifierType.references.code(),
  party_id: party.references.party_id(),
  ...gm.housekeeping.columns,
});

export const person = gm.autoIncPkTable("person", {
  person_id: udm.autoIncPK(),
  party_id: party.references.party_id(),
  person_type_id: udm.personType.references.code(),
  person_first_name: udm.text(),
  person_last_name: udm.text(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://docs.oracle.com/cd/E29633_01/CDMRF/GUID-F52E49F4-AE6F-4FF5-8EEB-8366A66AF7E9.htm
 */

export const partyRelation = gm.autoIncPkTable("party_relation", {
  party_relation_id: udm.autoIncPK(),
  party_id: party.references.party_id(),
  related_party_id: party.references.party_id(),
  relation_type_id: udm.partyRelationType.references.code(),
  party_role_id: udm.partyRole.references.code().optional(),
  ...gm.housekeeping.columns,
});

export const organization = gm.autoIncPkTable("organization", {
  organization_id: udm.autoIncPK(),
  party_id: party.references.party_id(),
  name: udm.text(),
  license: udm.text(),
  registration_date: udm.date(),
  ...gm.housekeeping.columns,
});

export const organizationRole = gm.autoIncPkTable("organization_role", {
  organization_role_id: udm.autoIncPK(),
  person_id: person.references.person_id(),
  organization_id: organization.references.organization_id(),
  organization_role_type_id: udm.organizationRoleType.references.code(),
  ...gm.housekeeping.columns,
});

export const contactElectronic = gm.autoIncPkTable("contact_electronic", {
  contact_electronic_id: udm.autoIncPK(),
  contact_type_id: udm.contactType.references.code(),
  party_id: party.references.party_id(),
  electronics_details: udm.text(),
  ...gm.housekeeping.columns,
});

export const contactLand = gm.autoIncPkTable("contact_land", {
  contact_land_id: udm.autoIncPK(),
  contact_type_id: udm.contactType.references.code(),
  party_id: party.references.party_id(),
  address_line1: udm.text(),
  address_line2: udm.text(),
  address_zip: udm.text(),
  address_city: udm.text(),
  address_state: udm.text(),
  address_country: udm.text(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export const asset = gm.autoIncPkTable("asset", {
  asset_id: udm.autoIncPK(),
  organization_id: udm.organization.references.organization_id(),
  asset_retired_date: udm.dateNullable(),
  asset_status_id: assetStatus.references.code(),
  asset_tag: udm.text(),
  name: udm.text(),
  description: udm.text(),
  asset_type_id: assetType.references.code(),
  asset_workload_category: udm.text(),
  assignment_id: assignment.references.code(),
  barcode_or_rfid_tag: udm.text(),
  installed_date: udm.dateNullable(),
  planned_retirement_date: udm.dateNullable(),
  purchase_delivery_date: udm.dateNullable(),
  purchase_order_date: udm.dateNullable(),
  purchase_request_date: udm.dateNullable(),
  serial_number: udm.text(),
  tco_amount: udm.text(),
  tco_currency: udm.text(),
  ...gm.housekeeping.columns,
});

export const vulnerabilitySource = gm.autoIncPkTable("vulnerability_source", {
  vulnerability_source_id: udm.autoIncPK(),
  short_code: udm.text(), // For example cve code like CVE-2019-0708 (corresponds to a flaw in Microsoft’s Remote Desktop Protocol (RDP))
  source_url: udm.text(),
  description: udm.text(),
  ...gm.housekeeping.columns,
});

// TODO:
// - [ ] Need add field tag if needed in future

export const vulnerability = gm.autoIncPkTable("vulnerability", {
  vulnerability_id: udm.autoIncPK(),
  short_name: udm.text(),
  source_id: vulnerabilitySource.references.vulnerability_source_id(),
  affected_software: udm.text(),
  reference: udm.text(),
  status_id: vulnerabilityStatus.references.code(),
  patch_availability: udm.text(),
  severity_id: severity.references.code(),
  solutions: udm.text(),
  description: udm.text(),
  ...gm.housekeeping.columns,
});

export const threatSource = gm.autoIncPkTable("threat_source", {
  threat_source_id: udm.autoIncPK(),
  title: udm.text(),
  identifier: udm.text(),
  threat_source_type_id: threatSourceType.references.code(),
  source_of_information: udm.text(),
  capability: udm.text(),
  intent: udm.text(),
  targeting: udm.text(),
  description: udm.text(),
  ...gm.housekeeping.columns,
});

export const threatEvent = gm.autoIncPkTable("threat_event", {
  threat_event_id: udm.autoIncPK(),
  title: udm.text(),
  threat_source_id: threatSource.references.threat_source_id(),
  asset_id: asset.references.asset_id(),
  identifier: udm.text(),
  threat_event_type_id: threatEventType.references.code(),
  event_classification: udm.text(),
  source_of_information: udm.text(),
  description: udm.text(),
  ...gm.housekeeping.columns,
});

export const assetRisk = gm.autoIncPkTable("asset_risk", {
  asset_risk_id: udm.autoIncPK(),
  asset_risk_type_id: assetRiskType.references.code(),
  asset_id: asset.references.asset_id(),
  threat_event_id: threatEvent.references.threat_event_id(),
  relevance_id: severity.references.code().optional(),
  likelihood_id: probability.references.code().optional(),
  impact: udm.text(),
  ...gm.housekeeping.columns,
});

export const securityImpactAnalysis = gm.autoIncPkTable(
  "security_impact_analysis",
  {
    security_impact_analysis_id: udm.autoIncPK(),
    vulnerability_id: vulnerability.references.vulnerability_id(),
    asset_risk_id: assetRisk.references.asset_risk_id(),
    risk_level_id: probability.references.code(),
    impact_level_id: probability.references.code(),
    existing_controls: udm.text(),
    priority_id: priority.references.code(),
    reported_date: udm.date(),
    reported_by_id: udm.person.references.person_id(),
    responsible_by_id: udm.person.references.person_id(),
    ...gm.housekeeping.columns,
  },
);

export const impactOfRisk = gm.autoIncPkTable("impact_of_risk", {
  impact_of_risk_id: udm.autoIncPK(),
  security_impact_analysis_id: securityImpactAnalysis.references
    .security_impact_analysis_id(),
  impact: udm.text(),
  ...gm.housekeeping.columns,
});

export const proposedControls = gm.autoIncPkTable("proposed_controls", {
  proposed_controls_id: udm.autoIncPK(),
  security_impact_analysis_id: securityImpactAnalysis.references
    .security_impact_analysis_id(),
  controls: udm.text(),
  ...gm.housekeeping.columns,
});

export const billing = gm.autoIncPkTable("billing", {
  billing_id: udm.autoIncPK(),
  purpose: udm.text(),
  bill_rate: udm.text(),
  period: udm.text(),
  effective_from_date: udm.dateTime(),
  effective_to_date: udm.text(),
  prorate: udm.integer(),
  ...gm.housekeeping.columns,
});

export const scheduledTask = gm.autoIncPkTable("scheduled_task", {
  scheduled_task_id: udm.autoIncPK(),
  description: udm.text(),
  task_date: udm.dateTime(),
  reminder_date: udm.dateTime(),
  assigned_to: udm.text(),
  reminder_to: udm.text(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export const timesheet = gm.autoIncPkTable("timesheet", {
  timesheet_id: udm.autoIncPK(),
  date_of_work: udm.dateTime(),
  is_billable_id: statusValues.references.code(),
  number_of_hours: udm.integer(),
  time_entry_category_id: timeEntryCategory.references.code(),
  timesheet_summary: udm.text(),
  ...gm.housekeeping.columns,
});

export const certificate = gm.autoIncPkTable("certificate", {
  certificate_id: udm.autoIncPK(),
  certificate_name: udm.text(),
  short_name: udm.text(),
  certificate_category: udm.text(),
  certificate_type: udm.text(),
  certificate_authority: udm.text(),
  validity: udm.text(),
  expiration_date: udm.dateTimeNullable(),
  domain_name: udm.text(),
  key_size: udm.integer(),
  path: udm.text(),
  ...gm.housekeeping.columns,
});

export const device = gm.autoIncPkTable("device", {
  device_id: udm.autoIncPK(),
  device_name: udm.text(),
  short_name: udm.text(),
  barcode: udm.text(),
  model: udm.text(),
  serial_number: udm.text(),
  firmware: udm.text(),
  data_center: udm.text(),
  location: udm.text(),
  purpose: udm.text(),
  description: udm.text(),
  ...gm.housekeeping.columns,
});

export const securityIncidentResponseTeam = gm.autoIncPkTable(
  "security_incident_response_team",
  {
    security_incident_response_team_id: udm.autoIncPK(),
    training_subject_id: trainingSubject.references.code().optional(),
    person_id: udm.person.references.person_id(),
    organization_id: udm.organization.references.organization_id(),
    training_status_id: statusValues.references.code().optional(),
    attended_date: udm.date().optional(),
    ...gm.housekeeping.columns,
  },
);

export const awarenessTraining = gm.autoIncPkTable(
  "awareness_training",
  {
    awareness_training_id: udm.autoIncPK(),
    training_subject_id: trainingSubject.references.code(),
    person_id: udm.person.references.person_id(),
    organization_id: udm.organization.references.organization_id(),
    training_status_id: statusValues.references.code(),
    attended_date: udm.date(),
    ...gm.housekeeping.columns,
  },
);

/**
 * Reference URL: https://schema.org/Rating
 */

export const rating = gm.autoIncPkTable(
  "rating",
  {
    rating_id: udm.autoIncPK(),
    author_id: udm.person.references.person_id(),
    rating_given_to_id: udm.organization.references.organization_id(),
    rating_value_id: ratingValue.references.code(),
    best_rating_id: ratingValue.references.code().optional(),
    rating_explanation: udm.text(),
    review_aspect: udm.text(),
    worst_rating_id: ratingValue.references.code().optional(),
    ...gm.housekeeping.columns,
  },
);

export const notes = gm.autoIncPkTable(
  "note",
  {
    note_id: udm.autoIncPK(),
    party_id: udm.party.references.party_id(),
    note: udm.text(),
    ...gm.housekeeping.columns,
  },
);

export const auditAssertion = gm.autoIncPkTable(
  "audit_assertion",
  {
    audit_assertion_id: udm.autoIncPK(),
    auditor_type_id: auditorType.references.code(),
    audit_purpose_id: auditPurpose.references.code(),
    auditor_org_id: udm.organization.references.organization_id(),
    auditor_person_id: udm.person.references.person_id(),
    auditor_status_type_id: auditorStatusType.references.code(),
    scf_identifier: udm.text(),
    auditor_notes: udm.text(),
    auditor_artifacts: udm.text(),
    assertion_name: udm.text(),
    assertion_description: udm.text(),
    ...gm.housekeeping.columns,
  },
);

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export const contract = gm.autoIncPkTable(
  "contract",
  {
    contract_id: udm.autoIncPK(),
    contract_from_id: udm.party.references.party_id(),
    contract_to_id: udm.party.references.party_id(),
    contract_status_id: contractStatus.references.code().optional(),
    document_reference: udm.text(),
    payment_type_id: paymentType.references.code().optional(),
    periodicity_id: periodicity.references.code().optional(),
    start_date: udm.dateTime(),
    end_date: udm.dateTimeNullable(),
    contract_type_id: contractType.references.code().optional(),
    date_of_last_review: udm.dateTimeNullable(),
    date_of_next_review: udm.dateTimeNullable(),
    date_of_contract_review: udm.dateTimeNullable(),
    date_of_contract_approval: udm.dateTimeNullable(),
    ...gm.housekeeping.columns,
  },
);

export const riskRegister = gm.autoIncPkTable(
  "risk_register",
  {
    risk_register_id: udm.autoIncPK(),
    description: udm.text(),
    risk_subject_id: riskSubject.references.code(),
    risk_type_id: riskType.references.code(),
    impact_to_the_organization: udm.text(),
    rating_likelihood_id: ratingValue.references.code().optional(),
    rating_impact_id: ratingValue.references.code().optional(),
    rating_overall_risk_id: ratingValue.references.code().optional(),
    controls_in_place: udm.text(),
    control_effectivenes: udm.integer(),
    over_all_residual_risk_rating_id: ratingValue.references.code().optional(),
    mitigation_further_actions: udm.text(),
    control_monitor_mitigation_actions_tracking_strategy: udm.text(),
    control_monitor_action_due_date: udm.dateNullable(),
    control_monitor_risk_owner_id: udm.person.references.person_id(),
    ...gm.housekeeping.columns,
  },
);

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export const incident = gm.autoIncPkTable(
  "incident",
  {
    incident_id: udm.autoIncPK(),
    title: udm.text(),
    incident_date: udm.date(),
    time_and_time_zone: udm.dateTime(),
    asset_id: asset.references.asset_id(),
    category_id: incidentCategory.references.code(),
    sub_category_id: incidentSubCategory.references.code(),
    severity_id: severity.references.code(),
    priority_id: priority.references.code().optional(),
    internal_or_external_id: incidentType.references.code().optional(),
    location: udm.text(),
    it_service_impacted: udm.text(),
    impacted_modules: udm.text(),
    impacted_dept: udm.text(),
    reported_by_id: udm.person.references.person_id(),
    reported_to_id: udm.person.references.person_id(),
    brief_description: udm.text(),
    detailed_description: udm.text(),
    assigned_to_id: udm.person.references.person_id(),
    assigned_date: udm.dateNullable(),
    investigation_details: udm.text(),
    containment_details: udm.text(),
    eradication_details: udm.text(),
    business_impact: udm.text(),
    lessons_learned: udm.text(),
    status_id: incidentStatus.references.code().optional(),
    closed_date: udm.dateNullable(),
    reopened_time: udm.dateTimeNullable(),
    feedback_from_business: udm.text(),
    reported_to_regulatory: udm.text(),
    report_date: udm.dateNullable(),
    report_time: udm.dateTimeNullable(),
    ...gm.housekeeping.columns,
  },
);

export const incidentRootCause = gm.autoIncPkTable(
  "incident_root_cause",
  {
    incident_root_cause_id: udm.autoIncPK(),
    incident_id: incident.references.incident_id().optional(),
    source: udm.text(),
    description: udm.text(),
    probability_id: priority.references.code().optional(),
    testing_analysis: udm.text(),
    solution: udm.text(),
    likelihood_of_risk_id: priority.references.code().optional(),
    modification_of_the_reported_issue: udm.text(),
    testing_for_modified_issue: udm.text(),
    test_results: udm.text(),
    ...gm.housekeeping.columns,
  },
);

export const raciMatrixAssignment = gm.autoIncPkTable(
  "raci_matrix_assignment",
  {
    raci_matrix_assignment_id: udm.autoIncPK(),
    person_id: udm.person.references.person_id(),
    subject_id: raciMatrixSubject.references.code(),
    activity_id: raciMatrixActivity.references.raci_matrix_activity_id(),
    raci_matrix_assignment_nature_id: raciMatrixAssignmentNature
      .references.code(),
    ...gm.housekeeping.columns,
  },
);

export const personSkill = gm.autoIncPkTable(
  "person_skill",
  {
    person_skill_id: udm.autoIncPK(),
    person_id: udm.person.references.person_id(),
    skill_nature_id: skillNature.references.code(),
    skill_id: skill.references.code(),
    proficiency_scale_id: proficiencyScale.references.code(),
    ...gm.housekeeping.columns,
  },
);

export const keyPerformance = gm.autoIncPkTable(
  "key_performance",
  {
    key_performance_id: udm.autoIncPK(),
    title: udm.text(),
    description: udm.text(),
    ...gm.housekeeping.columns,
  },
);

export const keyPerformanceIndicator = gm.autoIncPkTable(
  "key_performance_indicator",
  {
    key_performance_indicator_id: udm.autoIncPK(),
    key_performance_id: keyPerformance.references.key_performance_id(),
    asset_id: asset.references.asset_id(),
    calendar_period_id: calendarPeriod.references.code(),
    kpi_comparison_operator_id: comparisonOperator.references.code(),
    kpi_context: udm.text(),
    kpi_lower_threshold_critical: udm.text(),
    kpi_lower_threshold_major: udm.text(),
    kpi_lower_threshold_minor: udm.text(),
    kpi_lower_threshold_ok: udm.text(),
    kpi_lower_threshold_warning: udm.text(),
    kpi_measurement_type_id: kpiMeasurementType.references.code(),
    kpi_status_id: kpiStatus.references.code(),
    kpi_threshold_critical: udm.text(),
    kpi_threshold_major: udm.text(),
    kpi_threshold_minor: udm.text(),
    kpi_threshold_ok: udm.text(),
    kpi_threshold_warning: udm.text(),
    kpi_unit_of_measure: udm.text(),
    kpi_value: udm.text(),
    score: udm.text(),
    tracking_period_id: trackingPeriod.references.code(),
    trend_id: trend.references.code(),
    ...gm.housekeeping.columns,
  },
);

export const keyRisk = gm.autoIncPkTable(
  "key_risk",
  {
    key_risk_id: udm.autoIncPK(),
    title: udm.text(),
    description: udm.text(),
    base_value: udm.textNullable(),
    ...gm.housekeeping.columns,
  },
);

export const keyRiskIndicator = gm.autoIncPkTable(
  "key_risk_indicator",
  {
    key_risk_indicator_id: udm.autoIncPK(),
    key_risk_id: keyRisk.references.key_risk_id(),
    entry_date: udm.date(),
    entry_value: udm.textNullable(),
    ...gm.housekeeping.columns,
  },
);

export const assertion = gm.autoIncPkTable(
  "assertion",
  {
    assertion_id: udm.autoIncPK(),
    foreign_integration: udm.text(),
    assertion: udm.text(),
    assertion_explain: udm.text(),
    assertion_expires_on: udm.dateNullable(),
    assertion_expires_poam: udm.text(),
    ...gm.housekeeping.columns,
  },
);

export const attestation = gm.autoIncPkTable(
  "attestation",
  {
    attestation_id: udm.autoIncPK(),
    assertion_id: assertion.references.assertion_id(),
    person_id: udm.person.references.person_id(),
    attestation: udm.text(),
    attestation_explain: udm.text(),
    attested_on: udm.date(),
    expires_on: udm.dateNullable(),
    boundary_id: boundary.references.boundary_id().optional(),
    ...gm.housekeeping.columns,
  },
);

export const attestationEvidence = gm.autoIncPkTable(
  "attestation_evidence",
  {
    attestation_evidence_id: udm.autoIncPK(),
    attestation_id: attestation.references.attestation_id(),
    evidence_nature: udm.text(),
    evidence_summary_markdown: udm.text(),
    url: udm.text(),
    content: udm.text(),
    attachment: udm.text(),
    ...gm.housekeeping.columns,
  },
);

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allContentTables: SQLa.TableDefinition<Any, udm.EmitContext>[] = [
  udm.organizationRoleType,
  graph,
  boundary,
  host,
  hostBoundary,
  raciMatrix,
  raciMatrixSubjectBoundary,
  raciMatrixActivity,
  udm.party,
  udm.partyIdentifier,
  udm.person,
  udm.partyRelation,
  udm.organization,
  udm.organizationRole,
  udm.contactElectronic,
  udm.contactLand,
  asset,
  vulnerabilitySource,
  severity,
  vulnerability,
  threatSource,
  threatEvent,
  assetRiskType,
  assetRisk,
  priority,
  securityImpactAnalysis,
  impactOfRisk,
  proposedControls,
  billing,
  scheduledTask,
  timesheet,
  certificate,
  device,
  securityIncidentResponseTeam,
  awarenessTraining,
  rating,
  notes,
  auditAssertion,
  contract,
  riskSubject,
  riskType,
  riskRegister,
  incidentCategory,
  incidentSubCategory,
  incidentType,
  incidentStatus,
  incident,
  incidentRootCause,
  raciMatrixAssignment,
  personSkill,
  keyPerformance,
  keyPerformanceIndicator,
  keyRisk,
  keyRiskIndicator,
  assertion,
  attestation,
  attestationEvidence,
];

const securityResponseTeamView = SQLa.safeViewDefinition(
  "security_incident_response_team_view",
  {
    person_name: udm.text(),
    organization_name: udm.text(),
    team_role: udm.text(),
    email: udm.text(),
  },
)`
  SELECT p.person_first_name || ' ' || p.person_last_name AS person_name, o.name AS organization_name, ort.value AS team_role,e.electronics_details AS email
  FROM security_incident_response_team sirt
  INNER JOIN person p ON p.person_id = sirt.person_id
  INNER JOIN organization o ON o.organization_id=sirt.organization_id
  INNER JOIN organization_role orl ON orl.person_id = sirt.person_id AND orl.organization_id = sirt.organization_id
  INNER JOIN organization_role_type ort ON ort.code = orl.organization_role_type_id
  INNER JOIN party pr ON pr.party_id = p.party_id
  INNER JOIN contact_electronic e ON e.party_id=pr.party_id AND e.contact_type_id = 'OFFICIAL_EMAIL'`;

const awarenessTrainingView = SQLa.safeViewDefinition(
  "awareness_training_view",
  {
    person_name: udm.text(),
    person_role: udm.text(),
    trainigng_subject: udm.text(),
    training_status_id: udm.text(),
    attended_date: udm.date(),
  },
)`
  SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,ort.value AS person_role,sub.value AS trainigng_subject,at.training_status_id,at.attended_date
  FROM awareness_training at
  INNER JOIN person p ON p.person_id = at.person_id
  INNER JOIN organization_role orl ON orl.person_id = at.person_id AND orl.organization_id = at.organization_id
  INNER JOIN organization_role_type ort ON ort.code = orl.organization_role_type_id
  INNER JOIN training_subject sub ON sub.code = at.training_subject_id`;

const personSkillView = SQLa.safeViewDefinition(
  "person_skill_view",
  {
    person_name: udm.text(),
    skill: udm.text(),
    proficiency: udm.text(),
  },
)`
  SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,s.value AS skill,prs.value AS proficiency
  FROM person_skill ps
  INNER JOIN person p ON p.person_id = ps.person_id
  INNER JOIN skill s ON s.code = ps.skill_id
  INNER JOIN proficiency_scale prs ON prs.code = ps.proficiency_scale_id GROUP BY ps.person_id,ps.skill_id`;

const securityIncidentResponseView = SQLa.safeViewDefinition(
  "security_incident_response_view",
  {
    incident: udm.text(),
    incident_date: udm.date(),
    asset_name: udm.text(),
    category: udm.text(),
    severity: udm.text(),
    priority: udm.text(),
    internal_or_external: udm.text(),
    location: udm.text(),
    it_service_impacted: udm.text(),
    impacted_modules: udm.text(),
    impacted_dept: udm.text(),
    reported_by: udm.text(),
    reported_to: udm.text(),
    brief_description: udm.text(),
    detailed_description: udm.text(),
    assigned_to: udm.text(),
    assigned_date: udm.date(),
    investigation_details: udm.text(),
    containment_details: udm.text(),
    eradication_details: udm.text(),
    business_impact: udm.text(),
    lessons_learned: udm.text(),
    status: udm.text(),
    closed_date: udm.text(),
    feedback_from_business: udm.text(),
    reported_to_regulatory: udm.date(),
    report_date: udm.date(),
    report_time: udm.date(),
    root_cause_of_the_issue: udm.text(),
    probability_of_issue: udm.text(),
    testing_for_possible_root_cause_analysis: udm.text(),
    solution: udm.text(),
    likelihood_of_risk: udm.text(),
    modification_of_the_reported_issue: udm.text(),
    testing_for_modified_issue: udm.text(),
    test_results: udm.text(),
  },
)`
  SELECT i.title AS incident,i.incident_date,ast.name as asset_name,ic.value AS category,s.value AS severity,
  p.value AS priority,it.value AS internal_or_external,i.location,i.it_service_impacted,
  i.impacted_modules,i.impacted_dept,p1.person_first_name || ' ' || p1.person_last_name AS reported_by,
  p2.person_first_name || ' ' || p2.person_last_name AS reported_to,i.brief_description,
  i.detailed_description,p3.person_first_name || ' ' || p3.person_last_name AS assigned_to,
  i.assigned_date,i.investigation_details,i.containment_details,i.eradication_details,i.business_impact,
  i.lessons_learned,ist.value AS status,i.closed_date,i.feedback_from_business,i.reported_to_regulatory,i.report_date,i.report_time,
  irc.description AS root_cause_of_the_issue,p1.value AS probability_of_issue,irc.testing_analysis AS testing_for_possible_root_cause_analysis,
  irc.solution,p2.value AS likelihood_of_risk,irc.modification_of_the_reported_issue,irc.testing_for_modified_issue,irc.test_results
  FROM incident i
  INNER JOIN asset ast ON ast.asset_id = i.asset_id
  INNER JOIN incident_category ic ON ic.code = i.category_id
  INNER JOIN severity s ON s.code = i.severity_id
  INNER JOIN priority p ON p.code = i.priority_id
  INNER JOIN incident_type it ON it.code = i.internal_or_external_id
  INNER JOIN person p1 ON p1.person_id = i.reported_by_id
  INNER JOIN person p2 ON p2.person_id = i.reported_to_id
  INNER JOIN person p3 ON p3.person_id = i.assigned_to_id
  INNER JOIN incident_status ist ON ist.code = i.status_id
  LEFT JOIN incident_root_cause irc ON irc.incident_id = i.incident_id
  LEFT JOIN priority p1 ON p1.code = irc.probability_id
  LEFT JOIN priority p2 ON p2.code = irc.likelihood_of_risk_id`;

const raciMatrixAssignmentView = SQLa.safeViewDefinition(
  "raci_matrix_assignment_view",
  {
    person_name: udm.text(),
    subject: udm.text(),
    activity: udm.text(),
    assignment_nature: udm.text(),
  },
)`
  SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,rms.value AS subject,rma.activity,
  rman.value AS assignment_nature
  FROM raci_matrix_assignment rma
  INNER JOIN person p ON p.person_id = rma.person_id
  INNER JOIN raci_matrix_subject rms on rms.code = rma.subject_id
  INNER JOIN raci_matrix_activity rma on rma.raci_matrix_activity_id = rma.activity_id
  INNER JOIN raci_matrix_assignment_nature rman on rman.code = rma.raci_matrix_assignment_nature_id`;

const securityImpactAnalysisView = SQLa.safeViewDefinition(
  "security_impact_analysis_view",
  {
    vulnerability: udm.text(),
    security_risk: udm.text(),
    security_threat: udm.text(),
    impact_of_risk: udm.text(),
    proposed_controls: udm.text(),
    impact_level: udm.text(),
    risk_level: udm.text(),
    existing_controls: udm.text(),
    priority: udm.text(),
    reported_date: udm.date(),
    reported_by: udm.date(),
    responsible_by: udm.date(),
  },
)`
  SELECT v.short_name as vulnerability, ast.name as security_risk,te.title as security_threat,
  ir.impact as impact_of_risk,pc.controls as proposed_controls,p1.value as impact_level,
  p2.value as risk_level,sia.existing_controls,pr.value as priority,sia.reported_date,
  pn1.person_first_name || ' ' || pn1.person_last_name AS reported_by,
  pn2.person_first_name || ' ' || pn2.person_last_name AS responsible_by
  FROM security_impact_analysis sia
  INNER JOIN vulnerability v ON v.vulnerability_id = sia.vulnerability_id
  INNER JOIN asset_risk ar ON ar.asset_risk_id = sia.asset_risk_id
  INNER JOIN asset ast ON ast.asset_id = ar.asset_id
  INNER JOIN threat_event te ON te.threat_event_id = ar.threat_event_id
  INNER JOIN impact_of_risk ir ON ir.security_impact_analysis_id = sia.security_impact_analysis_id
  INNER JOIN proposed_controls pc ON pc.security_impact_analysis_id = sia.security_impact_analysis_id
  INNER JOIN probability p1 ON p1.code = sia.impact_level_id
  INNER JOIN probability p2 ON p2.code = sia.risk_level_id
  INNER JOIN priority pr ON pr.code = sia.priority_id
  INNER JOIN person pn1 ON pn1.person_id = sia.reported_by_id
  INNER JOIN person pn2 ON pn2.person_id = sia.responsible_by_id`;

const keyPerformanceIndicatorView = SQLa.safeViewDefinition(
  "key_performance_indicator_view",
  {
    kpi_lower_threshold_critical: udm.text(),
    kpi_lower_threshold_major: udm.text(),
    kpi_lower_threshold_minor: udm.text(),
    kpi_lower_threshold_ok: udm.text(),
    kpi_lower_threshold_warning: udm.text(),
    kpi_threshold_critical: udm.text(),
    kpi_threshold_major: udm.text(),
    kpi_threshold_minor: udm.text(),
    kpi_threshold_ok: udm.text(),
    kpi_threshold_warning: udm.text(),
    kpi_value: udm.text(),
    score: udm.text(),
    kpi_unit_of_measure: udm.text(),
    key_performance: udm.text(),
    calendar_period: udm.text(),
    asset_name: udm.text(),
    asset_type: udm.text(),
    kpi_comparison_operator: udm.text(),
    kpi_measurement_type: udm.text(),
    kpi_status: udm.text(),
    tracking_period: udm.text(),
    trend: udm.text(),
  },
)`
  SELECT
  kpi.kpi_lower_threshold_critical,
  kpi.kpi_lower_threshold_major,
  kpi.kpi_lower_threshold_minor,
  kpi.kpi_lower_threshold_ok,
  kpi.kpi_lower_threshold_warning,
  kpi.kpi_threshold_critical,
  kpi.kpi_threshold_major,
  kpi.kpi_threshold_minor,
  kpi.kpi_threshold_ok,
  kpi.kpi_threshold_warning,
  kpi.kpi_value,
  kpi.score,
  kpi.kpi_unit_of_measure,
  kp.title AS key_performance,
  cp.value AS calendar_period,
  ast.name AS asset_name,
  at.value AS asset_type,
  co.value AS kpi_comparison_operator,
  kmt.value AS kpi_measurement_type,
  ks.value AS kpi_status,
  tp.value AS tracking_period,
  t.value AS trend
  FROM key_performance_indicator kpi
  INNER JOIN asset ast ON ast.asset_id = kpi.asset_id
  INNER JOIN asset_type at ON at.code = ast.asset_type_id
  INNER JOIN key_performance kp ON kp.key_performance_id = kpi.key_performance_id
  INNER JOIN calendar_period cp ON cp.code = kpi.calendar_period_id
  INNER JOIN comparison_operator co ON co.code = kpi.kpi_comparison_operator_id
  INNER JOIN kpi_measurement_type kmt ON kmt.code = kpi.kpi_measurement_type_id
  INNER JOIN kpi_status ks ON ks.code = kpi.kpi_status_id
  INNER JOIN tracking_period tp ON tp.code = kpi.tracking_period_id
  INNER JOIN trend t ON t.code = kpi.trend_id`;

const attestationView = SQLa.safeViewDefinition(
  "attestation_view",
  {
    attestation: udm.text(),
    attestation_explain: udm.text(),
    attested_on: udm.date(),
    expires_on: udm.dateNullable(),
    person_name: udm.text(),
    foreign_integration: udm.text(),
    assertion: udm.text(),
    assertion_explain: udm.text(),
    assertion_expires_on: udm.dateNullable(),
    assertion_expires_poam: udm.text(),
    boundary: udm.text(),
  },
)`
  SELECT
  at.attestation,
  at.attestation_explain,
  at.attested_on,
  at.expires_on,
  p.person_first_name || ' ' || p.person_last_name AS person_name,
  ar.foreign_integration,
  ar.assertion,
  ar.assertion_explain,
  ar.assertion_expires_on,
  ar.assertion_expires_poam,
  b.name as boundary
  FROM attestation at
  INNER JOIN person p ON p.person_id = at.person_id
  INNER JOIN assertion ar ON ar.assertion_id = at.assertion_id
  LEFT JOIN boundary b on b.boundary_id = at.boundary_id`;

const rootCauseAnalysisView = SQLa.safeViewDefinition(
  "root_cause_analysis_view",
  {
    issue: udm.text(),
    source: udm.text(),
    cause_of_the_issue: udm.text(),
    testing_analysis: udm.text(),
    solution: udm.text(),
    modification_of_the_reported_issue: udm.text(),
    testing_for_modified_issue: udm.text(),
    test_results: udm.text(),
    probability_of_issue: udm.dateNullable(),
    likelihood_of_risk: udm.text(),
  },
)`
  SELECT
  i.title as issue,
  irc.source,
  irc.description as cause_of_the_issue,
  irc.testing_analysis,
  irc.solution,
  irc.modification_of_the_reported_issue,
  irc.testing_for_modified_issue,
  irc.test_results,
  p.value as probability_of_issue,
  p1.value as likelihood_of_risk
  FROM incident_root_cause irc
  INNER JOIN incident i on i.incident_id = irc.incident_id
  INNER JOIN priority p on p.code = irc.probability_id
  INNER JOIN priority p1 on p1.code = irc.likelihood_of_risk_id`;

const vendorView = SQLa.safeViewDefinition(
  "vender_view",
  {
    name: udm.text(),
    email: udm.text(),
    address: udm.text(),
    state: udm.text(),
    city: udm.text(),
    zip: udm.text(),
    country: udm.text(),
  },
)`
  SELECT pr.party_name as name,
  e.electronics_details as email,
  l.address_line1 as address,
  l.address_state as state,
  l.address_city as city,
  l.address_zip as zip,
  l.address_country as country
  FROM party_relation prl
  INNER JOIN party pr ON pr.party_id = prl.party_id
  INNER JOIN contact_electronic e ON e.party_id = pr.party_id AND e.contact_type_id = 'OFFICIAL_EMAIL'
  INNER JOIN contact_land l ON l.party_id = pr.party_id AND l.contact_type_id = 'OFFICIAL_ADDRESS'
  WHERE prl.party_role_id = 'VENDOR' AND prl.relation_type_id = 'ORGANIZATION_TO_PERSON'`;

const organizationRoleTypeProjectManagerTechnologyInsertion = udm
  .organizationRoleType.insertDML({
    code: "PROJECT_MANAGER_TECHNOLOGY",
    value: "Project Manager Technology",
  });

const organizationRoleTypeProjectManagerQualityInsertion = udm
  .organizationRoleType.insertDML({
    code: "PROJECT_MANAGER_QUALITY",
    value: "Project Manager Quality",
  });

const contractView = SQLa.safeViewDefinition(
  "contract_view",
  {
    contract_by: udm.text(),
    contract_to: udm.text(),
    payment_type: udm.text(),
    contract_status: udm.text(),
    contract_type: udm.text(),
    document_reference: udm.text(),
    periodicity: udm.text(),
    start_date: udm.date(),
    end_date: udm.dateNullable(),
    date_of_last_review: udm.dateNullable(),
    date_of_next_review: udm.dateNullable(),
    date_of_contract_review: udm.dateNullable(),
    date_of_contract_approval: udm.dateNullable(),
  },
)`
  SELECT
  p1.party_name as contract_by,
  p2.party_name as contract_to,
  pt.value as payment_type,
  cs.value as contract_status,
  ctp.value as contract_type,
  ct.document_reference,
  p.value as periodicity,
  ct.start_date,
  ct.end_date,
  ct.date_of_last_review,
  ct.date_of_next_review,
  ct.date_of_contract_review,
  ct.date_of_contract_approval
  FROM contract ct
  INNER JOIN party p1 on p1.party_id = ct.contract_from_id
  INNER JOIN party p2 on p2.party_id = ct.contract_to_id
  INNER JOIN payment_type pt on pt.code = ct.payment_type_id
  INNER JOIN contract_status cs on cs.code = ct.contract_status_id
  INNER JOIN contract_type ctp on ctp.code = ct.contract_type_id
  INNER JOIN periodicity p on p.code = ct.periodicity_id`;

export const allContentViews: SQLa.ViewDefinition<Any, udm.EmitContext>[] = [
  securityResponseTeamView,
  awarenessTrainingView,
  personSkillView,
  securityIncidentResponseView,
  raciMatrixAssignmentView,
  securityImpactAnalysisView,
  keyPerformanceIndicatorView,
  attestationView,
  rootCauseAnalysisView,
  vendorView,
  contractView,
];

export function sqlDDL() {
  // NOTE: every time the template is "executed" it will fill out tables, views
  //       in gm.tablesDeclared, etc.
  // deno-fmt-ignore
  return SQLa.SQL<udm.EmitContext>(gts.ddlOptions)`
    PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance

    -- reference tables
    ${allReferenceTables}

    -- content tables
    ${allContentTables}

    --content views
    ${allContentViews}

    -- seed Data
    ${allReferenceTables.map(e => e.seedDML).flat()}

    ${organizationRoleTypeProjectManagerTechnologyInsertion}

    ${organizationRoleTypeProjectManagerQualityInsertion}
    `;
}

if (import.meta.main) {
  typ.typicalCLI({
    resolve: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
    prepareSQL: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
    prepareDiagram: () => {
      // "executing" the following will fill gm.tablesDeclared but we don't
      // care about the SQL output, just the state management (tablesDeclared)
      sqlDDL().SQL(ctx);
      return gts.pumlERD(ctx).content;
    },
  }).commands.command("driver", typ.sqliteDriverCommand(sqlDDL, ctx))
    .parse(Deno.args);
}

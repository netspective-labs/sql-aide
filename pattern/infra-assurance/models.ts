#!/usr/bin/env -S deno run --allow-all

import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/mod.ts";
import * as govn from "./governance.ts";
import * as udm from "../udm/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const { ctx, gm, gts } = udm;

type EmitContext = typeof ctx;

export const tcf = SQLa.tableColumnFactory<Any, Any>();
const {
  text,
  textNullable,
  integer,
  date,
  dateNullable,
  dateTime,
  selfRef,
  dateTimeNullable,
} = gm.domains;
export const { autoIncPrimaryKey: autoIncPK } = gm.keys;

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
  & SQLa.TableDefinition<Any, EmitContext>
  & typ.EnumTableDefn<EmitContext>
)[] = [
  udm.execCtx,
  udm.organizationRoleType,
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
];

export const graph = gm.autoIncPkTable("graph", {
  graph_id: autoIncPK(),
  graph_nature_id: graphNature.references.code(),
  name: text(),
  description: textNullable(),
  ...gm.housekeeping.columns,
});

export const boundary_id = autoIncPK();
export const boundary = gm.autoIncPkTable("boundary", {
  boundary_id,
  parent_boundary_id: selfRef(boundary_id).optional(),
  graph_id: graph.references.graph_id(),
  boundary_nature_id: boundaryNature.references.code(),
  name: text(),
  description: textNullable(),
  ...gm.housekeeping.columns,
});

export const host = gm.autoIncPkTable("host", {
  host_id: autoIncPK(),
  host_name: tcf.unique(text()),
  description: textNullable(),
  ...gm.housekeeping.columns,
});

export const hostBoundary = gm.autoIncPkTable("host_boundary", {
  host_boundary_id: autoIncPK(),
  host_id: host.references.host_id(),
  ...gm.housekeeping.columns,
});

export const raciMatrix = gm.autoIncPkTable("raci_matrix", {
  raci_matrix_id: autoIncPK(),
  asset: text(),
  responsible: text(),
  accountable: text(),
  consulted: text(),
  informed: text(),
  ...gm.housekeeping.columns,
});

export const raciMatrixSubjectBoundary = gm.autoIncPkTable(
  "raci_matrix_subject_boundary",
  {
    raci_matrix_subject_boundary_id: autoIncPK(),
    boundary_id: boundary.references.boundary_id(),
    raci_matrix_subject_id: raciMatrixSubject.references.code(),
    ...gm.housekeeping.columns,
  },
);

export const raciMatrixActivity = gm.autoIncPkTable("raci_matrix_activity", {
  raci_matrix_activity_id: autoIncPK(),
  activity: text(),
  ...gm.housekeeping.columns,
});

export const party = gm.autoIncPkTable("party", {
  party_id: autoIncPK(),
  party_type_id: udm.partyType.references.code(),
  party_name: text(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://help.salesforce.com/s/articleView?id=sf.c360_a_partyidentification_object.htm&type=5
 */

export const partyIdentifier = gm.autoIncPkTable("party_identifier", {
  party_identifier_id: autoIncPK(),
  identifier_number: text(),
  party_identifier_type_id: udm.partyIdentifierType.references.code(),
  party_id: party.references.party_id(),
  ...gm.housekeeping.columns,
});

export const person = gm.autoIncPkTable("person", {
  person_id: autoIncPK(),
  party_id: party.references.party_id(),
  person_type_id: udm.personType.references.code(),
  person_first_name: text(),
  person_last_name: text(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://docs.oracle.com/cd/E29633_01/CDMRF/GUID-F52E49F4-AE6F-4FF5-8EEB-8366A66AF7E9.htm
 */

export const partyRelation = gm.autoIncPkTable("party_relation", {
  party_relation_id: autoIncPK(),
  party_id: party.references.party_id(),
  related_party_id: party.references.party_id(),
  relation_type_id: udm.partyRelationType.references.code(),
  party_role_id: udm.partyRole.references.code().optional(),
  ...gm.housekeeping.columns,
});

export const organization = gm.autoIncPkTable("organization", {
  organization_id: autoIncPK(),
  party_id: party.references.party_id(),
  name: text(),
  license: text(),
  registration_date: date(),
  ...gm.housekeeping.columns,
});

export const organizationRole = gm.autoIncPkTable("organization_role", {
  organization_role_id: autoIncPK(),
  person_id: person.references.person_id(),
  organization_id: organization.references.organization_id(),
  organization_role_type_id: udm.organizationRoleType.references.code(),
  ...gm.housekeeping.columns,
});

export const contactElectronic = gm.autoIncPkTable("contact_electronic", {
  contact_electronic_id: autoIncPK(),
  contact_type_id: udm.contactType.references.code(),
  party_id: party.references.party_id(),
  electronics_details: text(),
  ...gm.housekeeping.columns,
});

export const contactLand = gm.autoIncPkTable("contact_land", {
  contact_land_id: autoIncPK(),
  contact_type_id: udm.contactType.references.code(),
  party_id: party.references.party_id(),
  address_line1: text(),
  address_line2: text(),
  address_zip: text(),
  address_city: text(),
  address_state: text(),
  address_country: text(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export const asset = gm.autoIncPkTable("asset", {
  asset_id: autoIncPK(),
  organization_id: udm.organization.references.organization_id(),
  asset_retired_date: dateNullable(),
  asset_status_id: assetStatus.references.code(),
  asset_tag: text(),
  name: text(),
  description: text(),
  asset_type_id: assetType.references.code(),
  asset_workload_category: text(),
  assignment_id: assignment.references.code(),
  barcode_or_rfid_tag: text(),
  installed_date: dateNullable(),
  planned_retirement_date: dateNullable(),
  purchase_delivery_date: dateNullable(),
  purchase_order_date: dateNullable(),
  purchase_request_date: dateNullable(),
  serial_number: text(),
  tco_amount: text(),
  tco_currency: text(),
  ...gm.housekeeping.columns,
});

export const vulnerabilitySource = gm.autoIncPkTable("vulnerability_source", {
  vulnerability_source_id: autoIncPK(),
  short_code: text(), // For example cve code like CVE-2019-0708 (corresponds to a flaw in Microsoft’s Remote Desktop Protocol (RDP))
  source_url: text(),
  description: text(),
  ...gm.housekeeping.columns,
});

// TODO:
// - [ ] Need add field tag if needed in future

export const vulnerability = gm.autoIncPkTable("vulnerability", {
  vulnerability_id: autoIncPK(),
  short_name: text(),
  source_id: vulnerabilitySource.references.vulnerability_source_id(),
  affected_software: text(),
  reference: text(),
  status_id: vulnerabilityStatus.references.code(),
  patch_availability: text(),
  severity_id: severity.references.code(),
  solutions: text(),
  description: text(),
  ...gm.housekeeping.columns,
});

export const threatSource = gm.autoIncPkTable("threat_source", {
  threat_source_id: autoIncPK(),
  title: text(),
  identifier: text(),
  threat_source_type_id: threatSourceType.references.code(),
  source_of_information: text(),
  capability: text(),
  intent: text(),
  targeting: text(),
  description: text(),
  ...gm.housekeeping.columns,
});

export const threatEvent = gm.autoIncPkTable("threat_event", {
  threat_event_id: autoIncPK(),
  title: text(),
  threat_source_id: threatSource.references.threat_source_id(),
  asset_id: asset.references.asset_id(),
  identifier: text(),
  threat_event_type_id: threatEventType.references.code(),
  event_classification: text(),
  source_of_information: text(),
  description: text(),
  ...gm.housekeeping.columns,
});

export const assetRisk = gm.autoIncPkTable("asset_risk", {
  asset_risk_id: autoIncPK(),
  asset_risk_type_id: assetRiskType.references.code(),
  asset_id: asset.references.asset_id(),
  threat_event_id: threatEvent.references.threat_event_id(),
  relevance_id: severity.references.code().optional(),
  likelihood_id: probability.references.code().optional(),
  impact: text(),
  ...gm.housekeeping.columns,
});

export const securityImpactAnalysis = gm.autoIncPkTable(
  "security_impact_analysis",
  {
    security_impact_analysis_id: autoIncPK(),
    vulnerability_id: vulnerability.references.vulnerability_id(),
    asset_risk_id: assetRisk.references.asset_risk_id(),
    risk_level_id: probability.references.code(),
    impact_level_id: probability.references.code(),
    existing_controls: text(),
    priority_id: priority.references.code(),
    reported_date: date(),
    reported_by_id: udm.person.references.person_id(),
    responsible_by_id: udm.person.references.person_id(),
    ...gm.housekeeping.columns,
  },
);

export const impactOfRisk = gm.autoIncPkTable("impact_of_risk", {
  impact_of_risk_id: autoIncPK(),
  security_impact_analysis_id: securityImpactAnalysis.references
    .security_impact_analysis_id(),
  impact: text(),
  ...gm.housekeeping.columns,
});

export const proposedControls = gm.autoIncPkTable("proposed_controls", {
  proposed_controls_id: autoIncPK(),
  security_impact_analysis_id: securityImpactAnalysis.references
    .security_impact_analysis_id(),
  controls: text(),
  ...gm.housekeeping.columns,
});

export const billing = gm.autoIncPkTable("billing", {
  billing_id: autoIncPK(),
  purpose: text(),
  bill_rate: text(),
  period: text(),
  effective_from_date: dateTime(),
  effective_to_date: text(),
  prorate: integer(),
  ...gm.housekeeping.columns,
});

export const scheduledTask = gm.autoIncPkTable("scheduled_task", {
  scheduled_task_id: autoIncPK(),
  description: text(),
  task_date: dateTime(),
  reminder_date: dateTime(),
  assigned_to: text(),
  reminder_to: text(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export const timesheet = gm.autoIncPkTable("timesheet", {
  timesheet_id: autoIncPK(),
  date_of_work: dateTime(),
  is_billable_id: statusValues.references.code(),
  number_of_hours: integer(),
  time_entry_category_id: timeEntryCategory.references.code(),
  timesheet_summary: text(),
  ...gm.housekeeping.columns,
});

export const certificate = gm.autoIncPkTable("certificate", {
  certificate_id: autoIncPK(),
  certificate_name: text(),
  short_name: text(),
  certificate_category: text(),
  certificate_type: text(),
  certificate_authority: text(),
  validity: text(),
  expiration_date: dateTimeNullable(),
  domain_name: text(),
  key_size: integer(),
  path: text(),
  ...gm.housekeeping.columns,
});

export const device = gm.autoIncPkTable("device", {
  device_id: autoIncPK(),
  device_name: text(),
  short_name: text(),
  barcode: text(),
  model: text(),
  serial_number: text(),
  firmware: text(),
  data_center: text(),
  location: text(),
  purpose: text(),
  description: text(),
  ...gm.housekeeping.columns,
});

export const securityIncidentResponseTeam = gm.autoIncPkTable(
  "security_incident_response_team",
  {
    security_incident_response_team_id: autoIncPK(),
    training_subject_id: trainingSubject.references.code().optional(),
    person_id: udm.person.references.person_id(),
    organization_id: udm.organization.references.organization_id(),
    training_status_id: statusValues.references.code().optional(),
    attended_date: date().optional(),
    ...gm.housekeeping.columns,
  },
);

export const awarenessTraining = gm.autoIncPkTable(
  "awareness_training",
  {
    awareness_training_id: autoIncPK(),
    training_subject_id: trainingSubject.references.code(),
    person_id: udm.person.references.person_id(),
    organization_id: udm.organization.references.organization_id(),
    training_status_id: statusValues.references.code(),
    attended_date: date(),
    ...gm.housekeeping.columns,
  },
);

/**
 * Reference URL: https://schema.org/Rating
 */

export const rating = gm.autoIncPkTable(
  "rating",
  {
    rating_id: autoIncPK(),
    author_id: udm.person.references.person_id(),
    rating_given_to_id: udm.organization.references.organization_id(),
    rating_value_id: ratingValue.references.code(),
    best_rating_id: ratingValue.references.code().optional(),
    rating_explanation: text(),
    review_aspect: text(),
    worst_rating_id: ratingValue.references.code().optional(),
    ...gm.housekeeping.columns,
  },
);

export const notes = gm.autoIncPkTable(
  "note",
  {
    note_id: autoIncPK(),
    party_id: udm.party.references.party_id(),
    note: text(),
    ...gm.housekeeping.columns,
  },
);

export const auditAssertion = gm.autoIncPkTable(
  "audit_assertion",
  {
    audit_assertion_id: autoIncPK(),
    auditor_type_id: auditorType.references.code(),
    audit_purpose_id: auditPurpose.references.code(),
    auditor_org_id: udm.organization.references.organization_id(),
    auditor_person_id: udm.person.references.person_id(),
    auditor_status_type_id: auditorStatusType.references.code(),
    scf_identifier: text(),
    auditor_notes: text(),
    auditor_artifacts: text(),
    assertion_name: text(),
    assertion_description: text(),
    ...gm.housekeeping.columns,
  },
);

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export const contract = gm.autoIncPkTable(
  "contract",
  {
    contract_id: autoIncPK(),
    contract_from_id: udm.party.references.party_id(),
    contract_to_id: udm.party.references.party_id(),
    contract_status_id: contractStatus.references.code().optional(),
    document_reference: text(),
    payment_type_id: paymentType.references.code().optional(),
    periodicity_id: periodicity.references.code().optional(),
    start_date: dateTime(),
    end_date: dateTimeNullable(),
    contract_type_id: contractType.references.code().optional(),
    date_of_last_review: dateTimeNullable(),
    date_of_next_review: dateTimeNullable(),
    date_of_contract_review: dateTimeNullable(),
    date_of_contract_approval: dateTimeNullable(),
    ...gm.housekeeping.columns,
  },
);

export const riskRegister = gm.autoIncPkTable(
  "risk_register",
  {
    risk_register_id: autoIncPK(),
    description: text(),
    risk_subject_id: riskSubject.references.code(),
    risk_type_id: riskType.references.code(),
    impact_to_the_organization: text(),
    rating_likelihood_id: ratingValue.references.code().optional(),
    rating_impact_id: ratingValue.references.code().optional(),
    rating_overall_risk_id: ratingValue.references.code().optional(),
    controls_in_place: text(),
    control_effectivenes: integer(),
    over_all_residual_risk_rating_id: ratingValue.references.code().optional(),
    mitigation_further_actions: text(),
    control_monitor_mitigation_actions_tracking_strategy: text(),
    control_monitor_action_due_date: dateNullable(),
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
    incident_id: autoIncPK(),
    title: text(),
    incident_date: date(),
    time_and_time_zone: dateTime(),
    asset_id: asset.references.asset_id(),
    category_id: incidentCategory.references.code(),
    sub_category_id: incidentSubCategory.references.code(),
    severity_id: severity.references.code(),
    priority_id: priority.references.code().optional(),
    internal_or_external_id: incidentType.references.code().optional(),
    location: text(),
    it_service_impacted: text(),
    impacted_modules: text(),
    impacted_dept: text(),
    reported_by_id: udm.person.references.person_id(),
    reported_to_id: udm.person.references.person_id(),
    brief_description: text(),
    detailed_description: text(),
    assigned_to_id: udm.person.references.person_id(),
    assigned_date: dateNullable(),
    investigation_details: text(),
    containment_details: text(),
    eradication_details: text(),
    business_impact: text(),
    lessons_learned: text(),
    status_id: incidentStatus.references.code().optional(),
    closed_date: dateNullable(),
    reopened_time: dateTimeNullable(),
    feedback_from_business: text(),
    reported_to_regulatory: text(),
    report_date: dateNullable(),
    report_time: dateTimeNullable(),
    ...gm.housekeeping.columns,
  },
);

export const incidentRootCause = gm.autoIncPkTable(
  "incident_root_cause",
  {
    incident_root_cause_id: autoIncPK(),
    incident_id: incident.references.incident_id().optional(),
    source: text(),
    description: text(),
    probability_id: priority.references.code().optional(),
    testing_analysis: text(),
    solution: text(),
    likelihood_of_risk_id: priority.references.code().optional(),
    modification_of_the_reported_issue: text(),
    testing_for_modified_issue: text(),
    test_results: text(),
    ...gm.housekeeping.columns,
  },
);

export const raciMatrixAssignment = gm.autoIncPkTable(
  "raci_matrix_assignment",
  {
    raci_matrix_assignment_id: autoIncPK(),
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
    person_skill_id: autoIncPK(),
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
    key_performance_id: autoIncPK(),
    title: text(),
    description: text(),
    ...gm.housekeeping.columns,
  },
);

export const keyPerformanceIndicator = gm.autoIncPkTable(
  "key_performance_indicator",
  {
    key_performance_indicator_id: autoIncPK(),
    key_performance_id: keyPerformance.references.key_performance_id(),
    asset_id: asset.references.asset_id(),
    calendar_period_id: calendarPeriod.references.code(),
    kpi_comparison_operator_id: comparisonOperator.references.code(),
    kpi_context: text(),
    kpi_lower_threshold_critical: text(),
    kpi_lower_threshold_major: text(),
    kpi_lower_threshold_minor: text(),
    kpi_lower_threshold_ok: text(),
    kpi_lower_threshold_warning: text(),
    kpi_measurement_type_id: kpiMeasurementType.references.code(),
    kpi_status_id: kpiStatus.references.code(),
    kpi_threshold_critical: text(),
    kpi_threshold_major: text(),
    kpi_threshold_minor: text(),
    kpi_threshold_ok: text(),
    kpi_threshold_warning: text(),
    kpi_unit_of_measure: text(),
    kpi_value: text(),
    score: text(),
    tracking_period_id: trackingPeriod.references.code(),
    trend_id: trend.references.code(),
    ...gm.housekeeping.columns,
  },
);

export const keyRisk = gm.autoIncPkTable(
  "key_risk",
  {
    key_risk_id: autoIncPK(),
    title: text(),
    description: text(),
    base_value: textNullable(),
    ...gm.housekeeping.columns,
  },
);

export const keyRiskIndicator = gm.autoIncPkTable(
  "key_risk_indicator",
  {
    key_risk_indicator_id: autoIncPK(),
    key_risk_id: keyRisk.references.key_risk_id(),
    entry_date: date(),
    entry_value: textNullable(),
    ...gm.housekeeping.columns,
  },
);

export const assertion = gm.autoIncPkTable(
  "assertion",
  {
    assertion_id: autoIncPK(),
    foreign_integration: text(),
    assertion: text(),
    assertion_explain: text(),
    assertion_expires_on: dateNullable(),
    assertion_expires_poam: text(),
    ...gm.housekeeping.columns,
  },
);

export const attestation = gm.autoIncPkTable(
  "attestation",
  {
    attestation_id: autoIncPK(),
    assertion_id: assertion.references.assertion_id(),
    person_id: udm.person.references.person_id(),
    attestation: text(),
    attestation_explain: text(),
    attested_on: date(),
    expires_on: dateNullable(),
    boundary_id: boundary.references.boundary_id().optional(),
    ...gm.housekeeping.columns,
  },
);

export const attestationEvidence = gm.autoIncPkTable(
  "attestation_evidence",
  {
    attestation_evidence_id: autoIncPK(),
    attestation_id: attestation.references.attestation_id(),
    evidence_nature: text(),
    evidence_summary_markdown: text(),
    url: text(),
    content: text(),
    attachment: text(),
    ...gm.housekeeping.columns,
  },
);

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allContentTables: SQLa.TableDefinition<Any, EmitContext>[] = [
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
    person_name: text(),
    organization_name: text(),
    team_role: text(),
    email: text(),
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
    person_name: text(),
    person_role: text(),
    trainigng_subject: text(),
    training_status_id: text(),
    attended_date: date(),
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
    person_name: text(),
    skill: text(),
    proficiency: text(),
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
    incident: text(),
    incident_date: date(),
    asset_name: text(),
    category: text(),
    severity: text(),
    priority: text(),
    internal_or_external: text(),
    location: text(),
    it_service_impacted: text(),
    impacted_modules: text(),
    impacted_dept: text(),
    reported_by: text(),
    reported_to: text(),
    brief_description: text(),
    detailed_description: text(),
    assigned_to: text(),
    assigned_date: date(),
    investigation_details: text(),
    containment_details: text(),
    eradication_details: text(),
    business_impact: text(),
    lessons_learned: text(),
    status: text(),
    closed_date: text(),
    feedback_from_business: text(),
    reported_to_regulatory: date(),
    report_date: date(),
    report_time: date(),
    root_cause_of_the_issue: text(),
    probability_of_issue: text(),
    testing_for_possible_root_cause_analysis: text(),
    solution: text(),
    likelihood_of_risk: text(),
    modification_of_the_reported_issue: text(),
    testing_for_modified_issue: text(),
    test_results: text(),
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
    person_name: text(),
    subject: text(),
    activity: text(),
    assignment_nature: text(),
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
    vulnerability: text(),
    security_risk: text(),
    security_threat: text(),
    impact_of_risk: text(),
    proposed_controls: text(),
    impact_level: text(),
    risk_level: text(),
    existing_controls: text(),
    priority: text(),
    reported_date: date(),
    reported_by: date(),
    responsible_by: date(),
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
    kpi_lower_threshold_critical: text(),
    kpi_lower_threshold_major: text(),
    kpi_lower_threshold_minor: text(),
    kpi_lower_threshold_ok: text(),
    kpi_lower_threshold_warning: text(),
    kpi_threshold_critical: text(),
    kpi_threshold_major: text(),
    kpi_threshold_minor: text(),
    kpi_threshold_ok: text(),
    kpi_threshold_warning: text(),
    kpi_value: text(),
    score: text(),
    kpi_unit_of_measure: text(),
    key_performance: text(),
    calendar_period: text(),
    asset_name: text(),
    asset_type: text(),
    kpi_comparison_operator: text(),
    kpi_measurement_type: text(),
    kpi_status: text(),
    tracking_period: text(),
    trend: text(),
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
    attestation: text(),
    attestation_explain: text(),
    attested_on: date(),
    expires_on: dateNullable(),
    person_name: text(),
    foreign_integration: text(),
    assertion: text(),
    assertion_explain: text(),
    assertion_expires_on: dateNullable(),
    assertion_expires_poam: text(),
    boundary: text(),
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
    issue: text(),
    source: text(),
    cause_of_the_issue: text(),
    testing_analysis: text(),
    solution: text(),
    modification_of_the_reported_issue: text(),
    testing_for_modified_issue: text(),
    test_results: text(),
    probability_of_issue: dateNullable(),
    likelihood_of_risk: text(),
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
    name: text(),
    email: text(),
    address: text(),
    state: text(),
    city: text(),
    zip: text(),
    country: text(),
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

const contractView = SQLa.safeViewDefinition(
  "contract_view",
  {
    contract_by: text(),
    contract_to: text(),
    payment_type: text(),
    contract_status: text(),
    contract_type: text(),
    document_reference: text(),
    periodicity: text(),
    start_date: date(),
    end_date: dateNullable(),
    date_of_last_review: dateNullable(),
    date_of_next_review: dateNullable(),
    date_of_contract_review: dateNullable(),
    date_of_contract_approval: dateNullable(),
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

export const allContentViews: SQLa.ViewDefinition<Any, EmitContext>[] = [
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
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance

    -- reference tables
    ${allReferenceTables}

    -- content tables
    ${allContentTables}

    --content views
    ${allContentViews}

    -- seed Data
    ${allReferenceTables.map(e => e.seedDML).flat()}
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

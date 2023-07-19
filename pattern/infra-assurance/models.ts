#!/usr/bin/env -S deno run --allow-all
import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/mod.ts";
import * as govn from "./governance.ts";
import * as udm from "../udm/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const { gm, gts, tcf } = udm;

export const contractStatus = gm.autoIncPkTable(
  "contract_status",
  {
    contract_status_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const paymentType = gm.autoIncPkTable(
  "payment_type",
  {
    payment_type_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const periodicity = gm.autoIncPkTable(
  "periodicity",
  {
    periodicity_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const boundaryNature = gm.autoIncPkTable(
  "boundary_nature",
  {
    boundary_nature_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const timeEntryCategory = gm.autoIncPkTable(
  "time_entry_category",
  {
    time_entry_category_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const raciMatrixSubject = gm.autoIncPkTable(
  "raci_matrix_subject",
  {
    raci_matrix_subject_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const raciMatrixAssignmentNature = gm.textEnumTable(
  "raci_matrix_assignment_nature",
  govn.RaciMatrixAssignmentNature,
  { isIdempotent: true },
);

export const skillNature = gm.autoIncPkTable(
  "skill_nature",
  {
    skill_nature_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const skill = gm.autoIncPkTable(
  "skill",
  {
    skill_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
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

export const assetStatus = gm.autoIncPkTable(
  "asset_status",
  {
    asset_status_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const assetType = gm.autoIncPkTable(
  "asset_type",
  {
    asset_type_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const assignment = gm.autoIncPkTable(
  "assignment",
  {
    assignment_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const probability = gm.textEnumTable(
  "probability",
  govn.Probability,
  { isIdempotent: true },
);

export const threatSourceType = gm.autoIncPkTable(
  "threat_source_type",
  {
    threat_source_type_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const threatEventType = gm.autoIncPkTable(
  "threat_event_type",
  {
    threat_event_type_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const calendarPeriod = gm.autoIncPkTable(
  "calendar_period",
  {
    calendar_period_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
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

export const trackingPeriod = gm.autoIncPkTable(
  "tracking_period",
  {
    tracking_period_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
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

export const auditPurpose = gm.autoIncPkTable(
  "audit_purpose",
  {
    audit_purpose_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const auditorStatusType = gm.autoIncPkTable(
  "audit_status",
  {
    audit_status_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const trainingSubject = gm.autoIncPkTable(
  "training_subject",
  {
    training_subject_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const statusValues = gm.autoIncPkTable(
  "status_value",
  {
    status_value_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const ratingValue = gm.autoIncPkTable(
  "rating_value",
  {
    rating_value_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const contractType = gm.autoIncPkTable(
  "contract_type",
  {
    contract_type_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const graphNature = gm.autoIncPkTable(
  "graph_nature",
  {
    graph_nature_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const severity = gm.textEnumTable(
  "severity",
  govn.Severity,
  { isIdempotent: true },
);

export const assetRiskType = gm.autoIncPkTable(
  "asset_risk_type",
  {
    asset_risk_type_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const priority = gm.textEnumTable(
  "priority",
  govn.Priority,
  { isIdempotent: true },
);

export const riskSubject = gm.autoIncPkTable(
  "risk_subject",
  {
    risk_subject_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const riskType = gm.autoIncPkTable(
  "risk_type",
  {
    risk_type_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const incidentCategory = gm.autoIncPkTable(
  "incident_category",
  {
    incident_category_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const incidentSubCategory = gm.autoIncPkTable(
  "incident_sub_category",
  {
    incident_sub_category_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const incidentType = gm.autoIncPkTable(
  "incident_type",
  {
    incident_type_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const incidentStatus = gm.autoIncPkTable(
  "incident_status",
  {
    incident_status_id: udm.autoIncPK(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allReferenceTables: (
  & SQLa.TableDefinition<Any, udm.EmitContext, typ.TypicalDomainQS>
  & typ.EnumTableDefn<udm.EmitContext>
)[] = [
  udm.execCtx,
  udm.partyType,
  raciMatrixAssignmentNature,
  proficiencyScale,
  vulnerabilityStatus,
  probability,
  comparisonOperator,
  kpiMeasurementType,
  kpiStatus,
  trend,
  auditorType,
  udm.partyRelationType,
  severity,
  priority,
];

export const graph = gm.autoIncPkTable("graph", {
  graph_id: udm.autoIncPK(),
  graph_nature_id: graphNature.references.graph_nature_id(),
  name: udm.text(),
  description: udm.textNullable(),
  ...gm.housekeeping.columns,
});

export const boundary_id = udm.autoIncPK();
export const boundary = gm.autoIncPkTable("boundary", {
  boundary_id,
  parent_boundary_id: udm.selfRef(boundary_id).optional(),
  graph_id: graph.references.graph_id(),
  boundary_nature_id: boundaryNature.references.boundary_nature_id(),
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
    raci_matrix_subject_id: raciMatrixSubject.references
      .raci_matrix_subject_id(),
    ...gm.housekeeping.columns,
  },
);

export const raciMatrixActivity = gm.autoIncPkTable("raci_matrix_activity", {
  raci_matrix_activity_id: udm.autoIncPK(),
  activity: udm.text(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://help.salesforce.com/s/articleView?id=sf.c360_a_partyidentification_object.htm&type=5
 */

/**
 * Reference URL: https://docs.oracle.com/cd/E29633_01/CDMRF/GUID-F52E49F4-AE6F-4FF5-8EEB-8366A66AF7E9.htm
 */

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export const asset = gm.autoIncPkTable("asset", {
  asset_id: udm.autoIncPK(),
  organization_id: udm.organization.references.organization_id(),
  asset_retired_date: udm.dateNullable(),
  asset_status_id: assetStatus.references.asset_status_id(),
  asset_tag: udm.text(),
  name: udm.text(),
  description: udm.text(),
  asset_type_id: assetType.references.asset_type_id(),
  asset_workload_category: udm.text(),
  assignment_id: assignment.references.assignment_id(),
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
  threat_source_type_id: threatSourceType.references.threat_source_type_id(),
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
  threat_event_type_id: threatEventType.references.threat_event_type_id(),
  event_classification: udm.text(),
  source_of_information: udm.text(),
  description: udm.text(),
  ...gm.housekeeping.columns,
});

export const assetRisk = gm.autoIncPkTable("asset_risk", {
  asset_risk_id: udm.autoIncPK(),
  asset_risk_type_id: assetRiskType.references.asset_risk_type_id(),
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
  is_billable_id: statusValues.references.status_value_id(),
  number_of_hours: udm.integer(),
  time_entry_category_id: timeEntryCategory.references.time_entry_category_id(),
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
    training_subject_id: trainingSubject.references.training_subject_id()
      .optional(),
    person_id: udm.person.references.person_id(),
    organization_id: udm.organization.references.organization_id(),
    training_status_id: statusValues.references.status_value_id().optional(),
    attended_date: udm.date().optional(),
    ...gm.housekeeping.columns,
  },
);

export const awarenessTraining = gm.autoIncPkTable(
  "awareness_training",
  {
    awareness_training_id: udm.autoIncPK(),
    training_subject_id: trainingSubject.references.training_subject_id(),
    person_id: udm.person.references.person_id(),
    organization_id: udm.organization.references.organization_id(),
    training_status_id: statusValues.references.status_value_id(),
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
    rating_value_id: ratingValue.references.rating_value_id(),
    best_rating_id: ratingValue.references.rating_value_id().optional(),
    rating_explanation: udm.text(),
    review_aspect: udm.text(),
    worst_rating_id: ratingValue.references.rating_value_id().optional(),
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
    audit_purpose_id: auditPurpose.references.audit_purpose_id(),
    auditor_org_id: udm.organization.references.organization_id(),
    auditor_person_id: udm.person.references.person_id(),
    auditor_status_type_id: auditorStatusType.references
      .audit_status_id(),
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
    contract_status_id: contractStatus.references.contract_status_id()
      .optional(),
    document_reference: udm.text(),
    payment_type_id: paymentType.references.payment_type_id().optional(),
    periodicity_id: periodicity.references.periodicity_id().optional(),
    start_date: udm.dateTime(),
    end_date: udm.dateTimeNullable(),
    contract_type_id: contractType.references.contract_type_id().optional(),
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
    risk_subject_id: riskSubject.references.risk_subject_id(),
    risk_type_id: riskType.references.risk_type_id(),
    impact_to_the_organization: udm.text(),
    rating_likelihood_id: ratingValue.references.rating_value_id().optional(),
    rating_impact_id: ratingValue.references.rating_value_id().optional(),
    rating_overall_risk_id: ratingValue.references.rating_value_id().optional(),
    controls_in_place: udm.text(),
    control_effectivenes: udm.integer(),
    over_all_residual_risk_rating_id: ratingValue.references.rating_value_id()
      .optional(),
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
    category_id: incidentCategory.references.incident_category_id(),
    sub_category_id: incidentSubCategory.references.incident_sub_category_id(),
    severity_id: severity.references.code(),
    priority_id: priority.references.code().optional(),
    internal_or_external_id: incidentType.references.incident_type_id()
      .optional(),
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
    status_id: incidentStatus.references.incident_status_id().optional(),
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
    subject_id: raciMatrixSubject.references.raci_matrix_subject_id(),
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
    skill_nature_id: skillNature.references.skill_nature_id(),
    skill_id: skill.references.skill_id(),
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
    calendar_period_id: calendarPeriod.references.calendar_period_id(),
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
    tracking_period_id: trackingPeriod.references.tracking_period_id(),
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
export const allContentTables: SQLa.TableDefinition<
  Any,
  udm.EmitContext,
  typ.TypicalDomainQS
>[] = [
  udm.partyRole,
  udm.partyIdentifierType,
  udm.personType,
  udm.contactType,
  udm.organizationRoleType,
  udm.party,
  udm.partyIdentifier,
  udm.person,
  udm.partyRelation,
  udm.organization,
  udm.organizationRole,
  udm.contactElectronic,
  udm.contactLand,
  contractStatus,
  paymentType,
  periodicity,
  boundaryNature,
  timeEntryCategory,
  raciMatrixSubject,
  skillNature,
  skill,
  udm.organizationRoleType,
  graph,
  boundary,
  host,
  hostBoundary,
  assetStatus,
  assetType,
  assignment,
  raciMatrix,
  raciMatrixSubjectBoundary,
  raciMatrixActivity,
  asset,
  vulnerabilitySource,
  vulnerability,
  threatSource,
  threatEvent,
  assetRisk,
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
  threatSourceType,
  threatEventType,
  calendarPeriod,
  trackingPeriod,
  auditAssertion,
  contract,
  riskRegister,
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
  trainingSubject,
  statusValues,
  ratingValue,
  contractType,
  graphNature,
  riskSubject,
  riskType,
  incidentCategory,
  incidentSubCategory,
  incidentType,
  incidentStatus,
  assetRiskType,
  auditPurpose,
  auditorStatusType,
];

const partyRoleInsertion = udm
  .partyRole.insertDML([{
    code: "CUSTOMER",
    value: "Customer",
  }, {
    code: "VENDOR",
    value: "Vendor",
  }]);

const partyIdentifierTypeInsertion = udm
  .partyIdentifierType.insertDML([{
    code: "UUID",
    value: "UUID",
  }, {
    code: "DRIVING_LICENSE",
    value: "Driving License",
  }, {
    code: "PASSPORT",
    value: "Passport",
  }]);

const personTypeInsertion = udm
  .personType.insertDML([{
    code: "INDIVIDUAL",
    value: "Individual",
  }, {
    code: "PROFESSIONAL",
    value: "Professional",
  }]);

const contactTypeInsertion = udm
  .contactType.insertDML([{
    code: "HOME_ADDRESS",
    value: "Home Address",
  }, {
    code: "OFFICIAL_ADDRESS",
    value: "Official Address",
  }, {
    code: "MOBILE_PHONE_NUMBER",
    value: "Mobile Phone Number",
  }, {
    code: "LAND_PHONE_NUMBER",
    value: "Land Phone Number",
  }, {
    code: "OFFICIAL_EMAIL",
    value: "Official Email",
  }, {
    code: "PERSONAL_EMAIL",
    value: "Personal Email",
  }]);

const organizationRoleTypeInsertion = udm
  .organizationRoleType.insertDML([{
    code: "PROJECT_MANAGER_TECHNOLOGY",
    value: "Project Manager Technology",
  }, {
    code: "PROJECT_MANAGER_QUALITY",
    value: "Project Manager Quality",
  }, {
    code: "PROJECT_MANAGER_DEVOPS",
    value: "Project Manager DevOps",
  }, {
    code: "ASSOCIATE_MANAGER_TECHNOLOGY",
    value: "Associated Manager Technology",
  }, {
    code: "ASSOCIATE_MANAGER_QUALITY",
    value: "Associate Manager Quality",
  }, {
    code: "ASSOCIATE_MANAGER_DEVOPS",
    value: "Associate Manager DevOps",
  }, {
    code: "SENIOR_LEAD_SOFTWARE_ENGINEER_ARCHITECT",
    value: "Senior Lead Software Engineer Architect",
  }, {
    code: "LEAD_SOFTWARE_ENGINEER_ARCHITECT",
    value: "Lead Software Engineer Architect",
  }, {
    code: "SENIOR_LEAD_SOFTWARE_QUALITY_ENGINEER",
    value: "Senior Lead Software DevOps Engineer",
  }, {
    code: "LEAD_SOFTWARE_ENGINEER",
    value: "Lead Software Engineer",
  }, {
    code: "LEAD_SOFTWARE_QUALITY_ENGINEER",
    value: "Lead Software Quality Engineer",
  }, {
    code: "LEAD_SOFTWARE_DEVOPS_ENGINEER",
    value: "Lead Software DevOps Engineer",
  }, {
    code: "LEAD_SYSTEM_NETWORK_ENGINEER",
    value: "Lead System Network Engineer",
  }, {
    code: "SENIOR_SOFTWARE_ENGINEER",
    value: "Senior Software Engineer",
  }, {
    code: "SENIOR_SOFTWARE_QUALITY_ENGINEER",
    value: "Senior Software Quality Engineer",
  }, {
    code: "SOFTWARE_QUALITY_ENGINEER",
    value: "Software Quality Engineer",
  }, {
    code: "SECURITY_ENGINEER",
    value: "Security Engineer",
  }]);

const contractStatusInsertion = contractStatus.insertDML([
  { code: "ACTIVE", value: "Active" },
  { code: "AWAITING_APPROVAL", value: "Awaiting Approval" },
  {
    code: "AWAITING_APPROVAL_FOR_RENEWAL",
    value: "Awaiting Approval For Renewal",
  },
  { code: "CANCELED", value: "Canceled" },
  { code: "DENIED", value: "Denied" },
  { code: "FINISHED", value: "Finished" },
  { code: "IN_PREPARATION", value: "In Preparation" },
  { code: "QUOTE_REQUESTED", value: "Quote Requested" },
  { code: "QUOTED", value: "Quoted" },
  { code: "STANDARD_CONTRACT", value: "Standard Contract" },
  { code: "SUSPENDED", value: "Suspended" },
  { code: "VALIDATED", value: "Validated" },
]);

const periodicityInsertion = periodicity.insertDML([
  { code: "ANNUAL", value: "Annual" },
  { code: "BI_MONTHLY", value: "Bi Monthly" },
  { code: "BI_WEEKLY", value: "Bi Weekly" },
  { code: "DAILY", value: "Daily" },
  { code: "MONTHLY", value: "Monthly" },
  { code: "OTHER", value: "Other" },
  { code: "QUARTERLY", value: "Quarterly" },
  { code: "SEMI_ANNUAL", value: "Semi Annual" },
  { code: "SEMI_MONTHLY", value: "Semi Monthly" },
  { code: "WEEKLY", value: "Weekly" },
]);

const paymentTypeInsertion = paymentType.insertDML([
  { code: "BOTH", value: "Both" },
  { code: "LOANS", value: "Loans" },
  { code: "NONE", value: "None" },
  { code: "RENTS", value: "Rents" },
]);

const boundaryNatureInsertion = boundaryNature.insertDML([
  { code: "REGULATORY_TAX_ID", value: "Regulatory Tax ID" },
]);

const timeEntryCategoryInsertion = timeEntryCategory.insertDML([
  { code: "MISC_MEETINGS", value: "Misc Meetings" },
  { code: "MISC_OTHER", value: "Misc Other" },
  { code: "MISC_VACATION", value: "Misc Vacation" },
  { code: "MISC_WORK_ITEM", value: "Misc Work Item" },
  { code: "PACKAGE", value: "Package" },
  { code: "PROJECT", value: "Project" },
  { code: "REQUEST", value: "Request" },
  { code: "TASK", value: "Task" },
]);

const raciMatrixSubjectInsertion = raciMatrixSubject.insertDML([
  { code: "PROJECT_LEADERSHIP", value: "Project Leadership" },
  { code: "PROJECT_MANAGEMENT", value: "Project Management" },
  { code: "APPLICATION_DEVELOPMENT", value: "Application Development" },
  { code: "DEV_OPERATIONS", value: "Dev Operations" },
  { code: "QUALITY_ASSURANCE", value: "Quality Assurance" },
  { code: "SEARCH_ENGINE_OPTIMIZATION", value: "Search Engine Optimization" },
  { code: "USER_INTERFASE_USABILITY", value: "User Interfase And Usability" },
  { code: "BUSINESS_ANALYST", value: "Business Analyst (Abm)" },
  { code: "CURATION_COORDINATION", value: "Curation Coordination" },
  { code: "KNOWLEDGE_REPRESENTATION", value: "Knowledge Representation" },
  { code: "MARKETING_OUTREACH", value: "Marketing Outreach" },
  { code: "CURATION_WORKS", value: "Curation Works" },
]);

const skillNatureInsertion = skillNature.insertDML([
  { code: "SOFTWARE", value: "Software" },
  { code: "HARDWARE", value: "Hardware" },
]);

const skillInsertion = skill.insertDML([
  { code: "ANGULAR", value: "Angular" },
  { code: "DENO", value: "Deno" },
  { code: "TYPESCRIPT", value: "Typescript" },
  { code: "POSTGRESQL", value: "PostgreSQL" },
  { code: "MYSQL", value: "MySQL" },
  { code: "HUGO", value: "Hugo" },
  { code: "PHP", value: "PHP" },
  { code: "JAVASCRIPT", value: "JavaScript" },
  { code: "PYTHON", value: "Python" },
  { code: "DOT_NET", value: ".NET" },
  { code: "ORACLE", value: "Oracle" },
  { code: "JAVA", value: "Java" },
  { code: "JQUERY", value: "jQuery" },
  { code: "OSQUERY", value: "Osquery" },
  { code: "REACTJS", value: "ReactJs" },
]);

const assetStatusInsertion = assetStatus.insertDML([
  { code: "AWAITING_RECEIPT", value: "Awaiting Receipt" },
  { code: "IN_STOCK", value: "In Stock" },
  { code: "IN_USE", value: "In Use" },
  { code: "MISSING", value: "Missing" },
  { code: "RETIRED", value: "Retired" },
  { code: "RETURNED_FOR_MAINTENANCE", value: "Returned For Maintenance" },
  { code: "RETURNED_TO_SUPPLIER", value: "Returned To Supplier" },
  { code: "UNDEFINED", value: "Undefined" },
]);

const assetTypeInsertion = assetType.insertDML([
  { code: "ACCOUNT", value: "Account" },
  { code: "BUSINESS_SERVICE", value: "Business Service" },
  { code: "CABLE", value: "Cable" },
  { code: "CABLE_DEVICE", value: "Cable Device" },
  { code: "COLLECTIVE_EQUIPMENT", value: "Collective Equipment" },
  { code: "COMPUTER", value: "Computer" },
  { code: "CPU", value: "Cpu" },
  { code: "DOMAIN", value: "Domain" },
  { code: "SERVER", value: "Server" },
  { code: "EXTENSION_CARD", value: "Extension Card" },
  { code: "GLOBAL_SOFTWARE_LICENSE", value: "Global Software License" },
  { code: "LAPTOP", value: "Laptop" },
  { code: "LASER_PRINTER", value: "Laser Printer" },
  { code: "LICENSE_CONTRACT", value: "License Contract" },
  { code: "MAINTENANCE_CONTRACT", value: "Maintenance Contract" },
  { code: "MASS_STORAGE", value: "Mass Storage" },
  { code: "MOBILE_DEVICE", value: "Mobile Device" },
  { code: "MONITOR", value: "Monitor" },
  { code: "NETWORK_HARDWARE", value: "Network Hardware" },
  { code: "NETWORK_INTERFACE", value: "Network Interface" },
  { code: "OEM_SOFTWARE_LICENSE", value: "Oem Software License" },
  { code: "PRINTER", value: "Printer" },
  { code: "RACKMOUNT_MONITOR", value: "Rackmount Monitor" },
  { code: "SCANNER", value: "Scanner" },
  {
    code: "SOFTWARE_ACCESS_AUTHORIZATION",
    value: "Software Access Authorization",
  },
  { code: "SOFTWARE_ACCESS_REMOVAL", value: "Software Access Removal" },
  { code: "SOFTWARE_ADD_WORK_ORDER", value: "Software Add Work Order" },
  { code: "SOFTWARE_INSTALLATION", value: "Software Installation" },
  { code: "SOFTWARE_LICENSE", value: "Software License" },
  { code: "SOFTWARE_REMOVAL_WORK_ORDER", value: "Software Removal Work Order" },
  { code: "STANDARD_ASSET", value: "Standard Asset" },
  { code: "TELECOMMUNICATION_EQUIPMENT", value: "Telecommunication Equipment" },
  { code: "TELEPHONE", value: "Telephone" },
  { code: "VIRTUAL_MACHINE", value: "Virtual Machine" },
  { code: "SECURITY_POLICY", value: "Security Policy" },
  { code: "EMPLOYEE_DATA", value: "Employee Data" },
  { code: "API", value: "Api" },
  { code: "FIREWALL", value: "Firewall" },
]);

const assignmentInsertion = assignment.insertDML([
  { code: "AWAITING_RECEIPT", value: "Awaiting receipt" },
  { code: "IN_STOCK", value: "In Stock" },
  { code: "IN_USE", value: "In Use" },
  { code: "MISSING", value: "Missing" },
  { code: "RETURNED_FOR_MAINTENANCE", value: "Returned For Maintenance" },
  { code: "RETURNED_TO_SUPPLIER", value: "Returned To Supplier" },
]);

const threatSourceTypeInsertion = threatSourceType.insertDML([
  { code: "PHISHING", value: "Phishing" },
  { code: "SPAM", value: "Spam" },
  {
    code: "SPYWARE_AND_MALWARE_FOR_EXTORTION",
    value: "Spyware and malware for extortion",
  },
  {
    code: "THEFT_OF_PRIVATE_INFORMATION",
    value: "Theft of private information",
  },
  { code: "ONLINE_SCAMS", value: "Online scams" },
  {
    code: "DESTROY_OR_ABUSE_CRITICAL_INFRASTRUCTURE",
    value: "Destroy or abuse critical infrastructure",
  },
  { code: "THREATEN_NATIONAL_SECURITY", value: "Threaten national security" },
  { code: "DISRUPT_ECONOMIES", value: "Disrupt economies" },
  {
    code: "CAUSE_BODILY_HARM_TO_CITIZENS",
    value: "Cause bodily harm to citizens",
  },
  { code: "DENIAL_OF_SERVICE_ATTACKS", value: "Denial-of-Service Attacks" },
  { code: "DOXING", value: "Doxing" },
  { code: "LEAKING_INFORMATION", value: "Leaking Information" },
  {
    code: "THE_USE_OF_THE_SOFTWARE_RECAP",
    value: "The Use of the Software RECAP",
  },
  { code: "BLOGGING_ANONYMOUSLY", value: "Blogging Anonymously" },
  { code: "GEO_BOMBING", value: "Geo-bombing" },
  { code: "WEBSITE_MIRRORING", value: "Website Mirroring" },
  {
    code: "CHANGING_THE_CODE_FOR_WEBSITES_OR_WEBSITE_DEFACEMENTS",
    value: "Changing the Code for Websites or website defacements",
  },
]);

const threatEventTypeInsertion = threatEventType.insertDML([
  { code: "VIRUSES", value: "Viruses" },
  { code: "WORMS", value: "Worms" },
  { code: "TROJANS", value: "Trojans" },
  { code: "RANSOMWARE", value: "Ransomware" },
  { code: "CRYPTOJACKING", value: "Cryptojacking" },
  { code: "SPYWARE", value: "Spyware" },
  { code: "ADWARE", value: "Adware" },
  { code: "FILELESS_MALWARE", value: "Fileless malware" },
  { code: "ROOTKITS", value: "Rootkits" },
  { code: "BAITING", value: "Baiting" },
  { code: "PRETEXTING", value: "Pretexting" },
  { code: "PHISHING", value: "Phishing" },
  { code: "VISHING", value: "Vishing" },
  { code: "SMISHING", value: "Smishing" },
  { code: "PIGGYBACKING", value: "Piggybacking" },
  { code: "TAILGATING", value: "Tailgating" },
  { code: "EMAIL_HIJACKING", value: "Email Hijacking" },
  { code: "DNS_SPOOFING", value: "DNS spoofing" },
  { code: "IP_SPOOFING", value: "IP spoofing" },
  { code: "HTTPS_SPOOFING", value: "HTTPS spoofing" },
  { code: "HTTP_FLOOD_DDOS", value: "HTTP flood DDoS" },
  { code: "SYN_FLOOD_DDOS", value: "SYN flood DDoS" },
  { code: "UDP_FLOOD_DDOS", value: "UDP flood DDoS" },
  { code: "ICMP_FLOOD", value: "ICMP flood" },
  { code: "NTP_AMPLIFICATION", value: "NTP amplification" },
  { code: "SQL_INJECTION", value: "SQL injection" },
  { code: "CODE_INJECTION", value: "Code injection" },
  { code: "OS_COMMAND_INJECTION", value: "OS Command Injection" },
  { code: "LDAP_INJECTION", value: "LDAP injection" },
  {
    code: "XML_EXTERNAL_ENTITIES_INJECTION",
    value: "XML eXternal Entities (XXE) Injection",
  },
  { code: "CROSS_SITE_SCRIPTING", value: "Cross Site Scripting (XSS)" },
  { code: "BROKEN_ACCESS_CONTROL", value: "Broken Access Control" },
  { code: "CRYPTOGRAPHIC_FAILURES", value: "Cryptographic Failures" },
  { code: "INSECURE_DESIGN", value: "Insecure Design" },
  { code: "SECURITY_MISCONFIGURATION", value: "Security Misconfiguration" },
  {
    code: "VULNERABLE_AND_OUTDATED_COMPONENTS",
    value: "Vulnerable and Outdated Components",
  },
  {
    code: "IDENTIFICATION_AND_AUTHENTICATION_FAILURES",
    value: "Identification and Authentication Failures",
  },
  {
    code: "SOFTWARE_AND_DATA_INTEGRITY_FAILURES",
    value: "Software and Data Integrity Failures",
  },
  {
    code: "SECURITY_LOGGING_AND_MONITORING_FAILURES",
    value: "Security Logging and Monitoring Failures",
  },
  { code: "SERVER_SIDE_REQUEST_FORGERY", value: "Server Side Request Forgery" },
]);

const calendarPeriodInsertion = calendarPeriod.insertDML([
  { code: "TWENTY_FOUR_HOURS_SEVEN_DAYS", value: "24x7" },
  { code: "BUSINESS_HOURS", value: "Business hours" },
  { code: "NON_BUSINESS_HOURS", value: "Non-business hours" },
]);

const trackingPeriodInsertion = trackingPeriod.insertDML([
  { code: "DAY", value: "Day" },
  { code: "HOUR", value: "Hour" },
  { code: "MONTH", value: "Month" },
  { code: "OTHER", value: "Other" },
  { code: "QUARTER", value: "Quarter" },
  { code: "WEEK", value: "Week" },
  { code: "YEAR", value: "Year" },
]);

const auditPurposeInsertion = auditPurpose.insertDML([
  { code: "MEANING_DRY_RUN", value: "exmeaning dry runternal" },
  { code: "OFFICIAL", value: "official" },
]);

const auditorStatusTypeInsertion = auditorStatusType.insertDML([
  { code: "OUTSTANDING", value: "Outstanding" },
  { code: "FULFILLED", value: "Fulfilled" },
  { code: "REJECTED", value: "Rejected" },
  { code: "ACCEPTED", value: "Accepted" },
]);

const trainingSubjectInsertion = trainingSubject.insertDML([
  { code: "HIPAA", value: "HIPAA" },
  { code: "CYBER_SECURITY", value: "Cyber Security" },
  {
    code: "OBSERVABILITY_OPEN_TELEMETRY",
    value: "Observability Open Telemetry",
  },
  { code: "BEST_PRACTICES_OF_AGILE", value: "Practices of Agile Workflow" },
]);

const statusValuesInsertion = statusValues.insertDML([
  { code: "YES", value: "Yes" },
  { code: "NO", value: "No" },
]);

const ratingValueInsertion = ratingValue.insertDML([
  { code: "ONE", value: "1" },
  { code: "TWO", value: "2" },
  { code: "THREE", value: "3" },
  { code: "FOUR", value: "4" },
  { code: "FIVE", value: "5" },
]);

const contractTypeInsertion = contractType.insertDML([
  {
    code: "GENERAL_CONTRACT_FOR_SERVICES",
    value: "General Contract for Services",
  },
  { code: "EMPLOYMENT_AGREEMENT", value: "Employment Agreement" },
  { code: "NONCOMPETE_AGREEMENT", value: "Noncompete Agreement" },
  { code: "VENDOR_SLA", value: "Vendor SLA" },
  { code: "VENDOR_NDA", value: "Vendor NDA" },
]);

const graphNatureInsertion = graphNature.insertDML([
  { code: "SERVICE", value: "Service" },
  { code: "APP", value: "Application" },
]);

const assetRiskTypeInsertion = assetRiskType.insertDML([
  { code: "SECURITY", value: "Security" },
]);

const riskSubjectInsertion = riskSubject.insertDML([
  { code: "TECHNICAL_RISK", value: "Technical Risk" },
]);

const riskTypeInsertion = riskType.insertDML([
  { code: "BUDGET", value: "Budget" },
  { code: "QUALITY", value: "Quality" },
  { code: "SCHEDULE", value: "Schedule" },
  { code: "SCHEDULE_AND_BUDGET", value: "Schedule And Budget" },
]);

const incidentCategoryInsertion = incidentCategory.insertDML([
  { code: "ACCESS", value: "Access" },
  { code: "DATA", value: "Data" },
  { code: "FACILITIES", value: "Facilities" },
  { code: "FAILURE", value: "Failure" },
  { code: "GENERAL_INFORMATION", value: "General Information" },
  { code: "HARDWARE", value: "Hardware" },
  { code: "HOW_TO", value: "How To" },
  { code: "OTHER", value: "Other" },
  { code: "PERFORMANCE", value: "Performance" },
  { code: "SECURITY", value: "Security" },
  { code: "SERVICE_DELIVERY", value: "Service Delivery" },
  { code: "SERVICE_PORTFOLIO", value: "Service Portfolio" },
  { code: "STATUS", value: "Status" },
  { code: "SUPPORT", value: "Support" },
  { code: "THRIFTY", value: "Thrifty" },
]);

const incidentSubCategoryInsertion = incidentSubCategory.insertDML([
  { code: "AUTHORIZATION_ERROR", value: "Authorization Error" },
  { code: "AVAILABILITY", value: "Availability" },
  { code: "DATA_OR_FILE_CORRUPTED", value: "Data Or File Corrupted" },
  { code: "DATA_OR_FILE_INCORRECT", value: "Data Or File Incorrect" },
  { code: "DATA_OR_FILE_MISSING", value: "Data Or File Missing" },
  { code: "ERROR_MESSAGE", value: "Error Message" },
  {
    code: "FUNCTION_OR_FEATURE_NOT_WORKING",
    value: "Function Or Feature Not Working",
  },
  { code: "FUNCTIONALITY", value: "Functionality" },
  { code: "GENERAL_INFORMATION", value: "General Information" },
  { code: "HARDWARE_FAILURE", value: "Hardware Failure" },
  { code: "HOW_TO", value: "How To" },
  { code: "INCIDENT_RESOLUTION_QUALITY", value: "Incident Resolution Quality" },
  { code: "INCIDENT_RESOLUTION_TIME", value: "Incident Resolution Time" },
  { code: "JOB_FAILED", value: "Job Failed" },
  { code: "LOGIN_FAILURE", value: "Login Failure" },
  { code: "MISSING_OR_STOLEN", value: "Missing Or Stolen" },
  { code: "NEW_SERVICE", value: "New Service" },
  { code: "PERFORMANCE", value: "Performance" },
  { code: "PERFORMANCE_DEGRADATION", value: "Performance Degradation" },
  { code: "PERSON", value: "Person" },
  { code: "SECURITY_BREACH", value: "Security Breach" },
  { code: "SECURITY_EVENT", value: "Security Event/Message" },
  { code: "STATUS", value: "Status" },
  { code: "STORAGE_LIMIT_EXCEEDED", value: "Storage Limit Exceeded" },
  { code: "SYSTEM_DOWN", value: "System Down" },
  { code: "SYSTEM_OR_APPLICATION_HANGS", value: "System Or Application Hangs" },
  { code: "UPGRADE_NEW_RELEASE", value: "Upgrade/New Release" },
  { code: "VIRUS_ALERT", value: "Virus Alert" },
]);

const incidentTypeInsertion = incidentType.insertDML([
  { code: "COMPLAINT", value: "Complaint" },
  { code: "INCIDENT", value: "Incident" },
  { code: "REQUEST_FOR_INFORMATION", value: "Request For Information" },
]);

const incidentStatusInsertion = incidentStatus.insertDML([
  { code: "ACCEPTED", value: "Accepted" },
  { code: "ASSIGNED", value: "Assigned" },
  { code: "CANCELLED", value: "Cancelled" },
  { code: "CATEGORIZE", value: "Categorize" },
  { code: "CLOSED", value: "Closed" },
  { code: "OPEN", value: "Open" },
  { code: "PENDING_CHANGE", value: "Pending Change" },
  { code: "PENDING_CUSTOMER", value: "Pending Customer" },
  { code: "PENDING_EVIDENCE", value: "Pending Evidence" },
  { code: "PENDING_OTHER", value: "Pending Other" },
  { code: "PENDING_VENDOR", value: "Pending Vendor" },
  { code: "REFERRED", value: "Referred" },
  { code: "REJECTED", value: "Rejected" },
  { code: "REOPENED", value: "Reopened" },
  { code: "REPLACED_PROBLEM", value: "Replaced Problem" },
  { code: "RESOLVED", value: "Resolved" },
  { code: "SUSPENDED", value: "Suspended" },
  { code: "WORK_IN_PROGRESS", value: "Work In Progress" },
]);

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
  INNER JOIN organization_role_type ort ON ort.organization_role_type_id = orl.organization_role_type_id
  INNER JOIN party pr ON pr.party_id = p.party_id
  INNER JOIN contact_electronic e ON e.party_id=pr.party_id AND e.contact_type_id = (SELECT contact_type_id FROM contact_type WHERE code='OFFICIAL_EMAIL')`;

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
  INNER JOIN organization_role_type ort ON ort.organization_role_type_id = orl.organization_role_type_id
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
  INNER JOIN skill s ON s.skill_id = ps.skill_id
  INNER JOIN proficiency_scale prs ON prs.code = ps.proficiency_scale_id GROUP BY ps.person_id,ps.skill_id,person_name,s.value,proficiency`;

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
  irc.description AS root_cause_of_the_issue,p4.value AS probability_of_issue,irc.testing_analysis AS testing_for_possible_root_cause_analysis,
  irc.solution,p5.value AS likelihood_of_risk,irc.modification_of_the_reported_issue,irc.testing_for_modified_issue,irc.test_results
  FROM incident i
  INNER JOIN asset ast ON ast.asset_id = i.asset_id
  INNER JOIN incident_category ic ON ic.incident_category_id = i.category_id
  INNER JOIN severity s ON s.code = i.severity_id
  INNER JOIN priority p ON p.code = i.priority_id
  INNER JOIN incident_type it ON it.incident_type_id = i.internal_or_external_id
  INNER JOIN person p1 ON p1.person_id = i.reported_by_id
  INNER JOIN person p2 ON p2.person_id = i.reported_to_id
  INNER JOIN person p3 ON p3.person_id = i.assigned_to_id
  INNER JOIN incident_status ist ON ist.incident_status_id = i.status_id
  LEFT JOIN incident_root_cause irc ON irc.incident_id = i.incident_id
  LEFT JOIN priority p4 ON p4.code = irc.probability_id
  LEFT JOIN priority p5 ON p5.code = irc.likelihood_of_risk_id`;

const raciMatrixAssignmentView = SQLa.safeViewDefinition(
  "raci_matrix_assignment_view",
  {
    person_name: udm.text(),
    subject: udm.text(),
    activity: udm.text(),
    assignment_nature: udm.text(),
  },
)`
  SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,rms.value AS subject,rmac.activity,
  rman.value AS assignment_nature
  FROM raci_matrix_assignment rma
  INNER JOIN person p ON p.person_id = rma.person_id
  INNER JOIN raci_matrix_subject rms on rms.raci_matrix_subject_id = rma.subject_id
  INNER JOIN raci_matrix_activity rmac on rmac.raci_matrix_activity_id = rma.activity_id
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
  INNER JOIN asset_type at ON at.asset_type_id = ast.asset_type_id
  INNER JOIN key_performance kp ON kp.key_performance_id = kpi.key_performance_id
  INNER JOIN calendar_period cp ON cp.calendar_period_id = kpi.calendar_period_id
  INNER JOIN comparison_operator co ON co.code = kpi.kpi_comparison_operator_id
  INNER JOIN kpi_measurement_type kmt ON kmt.code = kpi.kpi_measurement_type_id
  INNER JOIN kpi_status ks ON ks.code = kpi.kpi_status_id
  INNER JOIN tracking_period tp ON tp.tracking_period_id = kpi.tracking_period_id
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
  INNER JOIN contact_electronic e ON e.party_id = pr.party_id AND e.contact_type_id = (SELECT contact_type_id FROM contact_type WHERE code='OFFICIAL_EMAIL')
  INNER JOIN contact_land l ON l.party_id = pr.party_id AND l.contact_type_id = (SELECT contact_type_id FROM contact_type WHERE code='OFFICIAL_ADDRESS')
  WHERE prl.party_role_id = (SELECT party_role_id FROM party_role WHERE code='VENDOR') AND prl.relation_type_id = 'ORGANIZATION_TO_PERSON'`;

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

export const allContentViews: SQLa.ViewDefinition<
  Any,
  udm.EmitContext,
  SQLa.SqlDomainQS
>[] = [
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

    ${partyRoleInsertion}

    ${partyIdentifierTypeInsertion}

    ${personTypeInsertion}

    ${contactTypeInsertion}

    ${organizationRoleTypeInsertion}

    ${contractStatusInsertion}

    ${paymentTypeInsertion}

    ${periodicityInsertion}

    ${boundaryNatureInsertion}

    ${timeEntryCategoryInsertion}

    ${raciMatrixSubjectInsertion}

    ${skillNatureInsertion}

    ${skillInsertion}

    ${assetStatusInsertion}

    ${assetTypeInsertion}

    ${assignmentInsertion}

    ${threatSourceTypeInsertion}

    ${threatEventTypeInsertion}

    ${calendarPeriodInsertion}

    ${trackingPeriodInsertion}

    ${auditPurposeInsertion}

    ${auditorStatusTypeInsertion}

    ${trainingSubjectInsertion}

    ${statusValuesInsertion}

    ${ratingValueInsertion}

    ${contractTypeInsertion}

    ${graphNatureInsertion}

    ${assetRiskTypeInsertion}

    ${riskSubjectInsertion}

    ${riskTypeInsertion}

    ${incidentCategoryInsertion}

    ${incidentSubCategoryInsertion}

    ${incidentTypeInsertion}

    ${incidentStatusInsertion}
    `;
}

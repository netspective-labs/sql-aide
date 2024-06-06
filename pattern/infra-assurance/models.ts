#!/usr/bin/env -S deno run --allow-all
import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/mod.ts";
import * as govn from "./governance.ts";
import * as udm from "../udm/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const { gm, gts, tcf } = udm;

export const contractStatus = gm.textPkTable(
  "contract_status",
  {
    contract_status_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const paymentType = gm.textPkTable(
  "payment_type",
  {
    payment_type_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const periodicity = gm.textPkTable(
  "periodicity",
  {
    periodicity_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const boundaryNature = gm.textPkTable(
  "boundary_nature",
  {
    boundary_nature_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const timeEntryCategory = gm.textPkTable(
  "time_entry_category",
  {
    time_entry_category_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const raciMatrixSubject = gm.textPkTable(
  "raci_matrix_subject",
  {
    raci_matrix_subject_id: udm.ulidPrimaryKey(),
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

export const skillNature = gm.textPkTable(
  "skill_nature",
  {
    skill_nature_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const skill = gm.textPkTable(
  "skill",
  {
    skill_id: udm.ulidPrimaryKey(),
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

export const assetStatus = gm.textPkTable(
  "asset_status",
  {
    asset_status_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

/**
 * Reference URL: https://docs.microfocuss.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/application_server.html
 */
/**
 * https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/directory_server.html
 */
/**
 * https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/mail_server.html
 */
/**
 * https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/lb_software.html
 */
/**
 * https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/web_server.html
 */
/**
 * https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/database.html
 */

export const assetServiceType = gm.textPkTable(
  "asset_service_type",
  {
    asset_service_type_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const assetServiceStatus = gm.textPkTable(
  "asset_service_status",
  {
    asset_service_status_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const assetType = gm.textPkTable(
  "asset_type",
  {
    asset_type_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const assignment = gm.textPkTable(
  "assignment",
  {
    assignment_id: udm.ulidPrimaryKey(),
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

export const threatSourceType = gm.textPkTable(
  "threat_source_type",
  {
    threat_source_type_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const threatEventType = gm.textPkTable(
  "threat_event_type",
  {
    threat_event_type_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const calendarPeriod = gm.textPkTable(
  "calendar_period",
  {
    calendar_period_id: udm.ulidPrimaryKey(),
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

export const trackingPeriod = gm.textPkTable(
  "tracking_period",
  {
    tracking_period_id: udm.ulidPrimaryKey(),
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

export const auditPurpose = gm.textPkTable(
  "audit_purpose",
  {
    audit_purpose_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const auditorStatusType = gm.textPkTable(
  "audit_status",
  {
    audit_status_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const trainingSubject = gm.textPkTable(
  "training_subject",
  {
    training_subject_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const statusValues = gm.textPkTable(
  "status_value",
  {
    status_value_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const ratingValue = gm.textPkTable(
  "rating_value",
  {
    rating_value_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const contractType = gm.textPkTable(
  "contract_type",
  {
    contract_type_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const graphNature = gm.textPkTable(
  "graph_nature",
  {
    graph_nature_id: udm.ulidPrimaryKey(),
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

export const assetRiskType = gm.textPkTable(
  "asset_risk_type",
  {
    asset_risk_type_id: udm.ulidPrimaryKey(),
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

export const riskSubject = gm.textPkTable(
  "risk_subject",
  {
    risk_subject_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const riskType = gm.textPkTable(
  "risk_type",
  {
    risk_type_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const incidentCategory = gm.textPkTable(
  "incident_category",
  {
    incident_category_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const incidentSubCategory = gm.textPkTable(
  "incident_sub_category",
  {
    incident_sub_category_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const incidentType = gm.textPkTable(
  "incident_type",
  {
    incident_type_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const incidentStatus = gm.textPkTable(
  "incident_status",
  {
    incident_status_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

/**
 * Reference URL: https://vertabelo.com/blog/designing-a-database-for-a-recruitment-system/
 */

export const employeeProcessStatus = gm.textPkTable(
  "employee_process_status",
  {
    employee_process_status_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const interviewMedium = gm.textPkTable(
  "interview_medium",
  {
    interview_medium_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const payrollItemsType = gm.textPkTable(
  "payroll_items_type",
  {
    payroll_items_type_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const hiringProcess = gm.textPkTable(
  "hiring_process",
  {
    hiring_process_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const hiringProcessChecklist = gm.textPkTable(
  "hiring_process_checklist",
  {
    hiring_process_checklist_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const terminationProcess = gm.textPkTable(
  "termination_process",
  {
    termination_process_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const terminationProcessChecklist = gm.textPkTable(
  "termination_process_checklist",
  {
    termination_process_checklist_id: udm.ulidPrimaryKey(),
    code: tcf.unique(udm.text()),
    value: udm.text(),
    ...gm.housekeeping.columns,
  },
  { isIdempotent: true },
);

export const noticePeriod = gm.textPkTable(
  "notice_period",
  {
    notice_period_id: udm.ulidPrimaryKey(),
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
  raciMatrixAssignmentNature,
  proficiencyScale,
  vulnerabilityStatus,
  probability,
  comparisonOperator,
  kpiMeasurementType,
  kpiStatus,
  trend,
  auditorType,
  severity,
  priority,
];

export const graph = gm.textPkTable("graph", {
  graph_id: udm.ulidPrimaryKey(),
  graph_nature_id: graphNature.references.graph_nature_id(),
  name: udm.text(),
  description: udm.textNullable(),
  ...gm.housekeeping.columns,
});

export const boundary_id = udm.ulidPrimaryKey();
export const boundary = gm.textPkTable("boundary", {
  boundary_id,
  parent_boundary_id: udm.selfRef(boundary_id).optional(),
  graph_id: graph.references.graph_id(),
  boundary_nature_id: boundaryNature.references.boundary_nature_id(),
  name: udm.text(),
  description: udm.textNullable(),
  ...gm.housekeeping.columns,
});

export const host = gm.textPkTable("host", {
  host_id: udm.ulidPrimaryKey(),
  host_name: tcf.unique(udm.text()),
  description: udm.textNullable(),
  ...gm.housekeeping.columns,
});

export const hostBoundary = gm.textPkTable("host_boundary", {
  host_boundary_id: udm.ulidPrimaryKey(),
  host_id: host.references.host_id(),
  ...gm.housekeeping.columns,
});

export const raciMatrix = gm.textPkTable("raci_matrix", {
  raci_matrix_id: udm.ulidPrimaryKey(),
  asset: udm.text(),
  responsible: udm.text(),
  accountable: udm.text(),
  consulted: udm.text(),
  informed: udm.text(),
  ...gm.housekeeping.columns,
});

export const raciMatrixSubjectBoundary = gm.textPkTable(
  "raci_matrix_subject_boundary",
  {
    raci_matrix_subject_boundary_id: udm.ulidPrimaryKey(),
    boundary_id: boundary.references.boundary_id(),
    raci_matrix_subject_id: raciMatrixSubject.references
      .raci_matrix_subject_id(),
    ...gm.housekeeping.columns,
  },
);

export const raciMatrixActivity = gm.textPkTable("raci_matrix_activity", {
  raci_matrix_activity_id: udm.ulidPrimaryKey(),
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

export const asset = gm.textPkTable("asset", {
  asset_id: udm.ulidPrimaryKey(),
  organization_id: udm.organization.references.organization_id(),
  boundary_id: boundary.references.boundary_id().optional(),
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
  criticality: udm.textNullable(),
  asymmetric_keys_encryption_enabled: udm.textNullable(),
  cryptographic_key_encryption_enabled: udm.textNullable(),
  symmetric_keys_encryption_enabled: udm.textNullable(),
  ...gm.housekeeping.columns,
});

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/infrastructure_service.html
 */
/**
 * https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/installed_software.html
 */
/**
 * https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/running_software.html
 */

export const assetService = gm.textPkTable("asset_service", {
  asset_service_id: udm.ulidPrimaryKey(),
  asset_id: asset.references
    .asset_id(),
  asset_service_type_id: assetServiceType.references.asset_service_type_id(),
  name: udm.text(),
  description: udm.text(),
  asset_service_status_id: assetServiceStatus.references
    .asset_service_status_id(),
  port: udm.text(),
  experimental_version: udm.text(),
  production_version: udm.text(),
  latest_vendor_version: udm.text(),
  resource_utilization: udm.text(),
  log_file: udm.text(),
  url: udm.text(),
  vendor_link: udm.text(),
  installation_date: udm.dateNullable(),
  criticality: udm.text(),
  ...gm.housekeeping.columns,
});

export const vulnerabilitySource = gm.textPkTable("vulnerability_source", {
  vulnerability_source_id: udm.ulidPrimaryKey(),
  short_code: udm.text(), // For example cve code like CVE-2019-0708 (corresponds to a flaw in Microsoft’s Remote Desktop Protocol (RDP))
  source_url: udm.text(),
  description: udm.text(),
  ...gm.housekeeping.columns,
});

// TODO:
// - [ ] Need add field tag if needed in future

export const vulnerability = gm.textPkTable("vulnerability", {
  vulnerability_id: udm.ulidPrimaryKey(),
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

export const threatSource = gm.textPkTable("threat_source", {
  threat_source_id: udm.ulidPrimaryKey(),
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

export const threatEvent = gm.textPkTable("threat_event", {
  threat_event_id: udm.ulidPrimaryKey(),
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

export const assetRisk = gm.textPkTable("asset_risk", {
  asset_risk_id: udm.ulidPrimaryKey(),
  asset_risk_type_id: assetRiskType.references.asset_risk_type_id(),
  asset_id: asset.references.asset_id(),
  threat_event_id: threatEvent.references.threat_event_id(),
  relevance_id: severity.references.code().optional(),
  likelihood_id: probability.references.code().optional(),
  impact: udm.text(),
  ...gm.housekeeping.columns,
});

export const securityImpactAnalysis = gm.textPkTable(
  "security_impact_analysis",
  {
    security_impact_analysis_id: udm.ulidPrimaryKey(),
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

export const impactOfRisk = gm.textPkTable("impact_of_risk", {
  impact_of_risk_id: udm.ulidPrimaryKey(),
  security_impact_analysis_id: securityImpactAnalysis.references
    .security_impact_analysis_id(),
  impact: udm.text(),
  ...gm.housekeeping.columns,
});

export const proposedControls = gm.textPkTable("proposed_controls", {
  proposed_controls_id: udm.ulidPrimaryKey(),
  security_impact_analysis_id: securityImpactAnalysis.references
    .security_impact_analysis_id(),
  controls: udm.text(),
  ...gm.housekeeping.columns,
});

export const billing = gm.textPkTable("billing", {
  billing_id: udm.ulidPrimaryKey(),
  purpose: udm.text(),
  bill_rate: udm.text(),
  period: udm.text(),
  effective_from_date: udm.dateTime(),
  effective_to_date: udm.text(),
  prorate: udm.integer(),
  ...gm.housekeeping.columns,
});

export const scheduledTask = gm.textPkTable("scheduled_task", {
  scheduled_task_id: udm.ulidPrimaryKey(),
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

export const timesheet = gm.textPkTable("timesheet", {
  timesheet_id: udm.ulidPrimaryKey(),
  date_of_work: udm.dateTime(),
  is_billable_id: statusValues.references.status_value_id(),
  number_of_hours: udm.integer(),
  time_entry_category_id: timeEntryCategory.references.time_entry_category_id(),
  timesheet_summary: udm.text(),
  ...gm.housekeeping.columns,
});

export const certificate = gm.textPkTable("certificate", {
  certificate_id: udm.ulidPrimaryKey(),
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

export const device = gm.textPkTable("device", {
  device_id: udm.ulidPrimaryKey(),
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

export const securityIncidentResponseTeam = gm.textPkTable(
  "security_incident_response_team",
  {
    security_incident_response_team_id: udm.ulidPrimaryKey(),
    training_subject_id: trainingSubject.references.training_subject_id()
      .optional(),
    person_id: udm.person.references.person_id(),
    organization_id: udm.organization.references.organization_id(),
    training_status_id: statusValues.references.status_value_id().optional(),
    attended_date: udm.date().optional(),
    ...gm.housekeeping.columns,
  },
);

export const awarenessTraining = gm.textPkTable(
  "awareness_training",
  {
    awareness_training_id: udm.ulidPrimaryKey(),
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

export const rating = gm.textPkTable(
  "rating",
  {
    rating_id: udm.ulidPrimaryKey(),
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

export const notes = gm.textPkTable(
  "note",
  {
    note_id: udm.ulidPrimaryKey(),
    party_id: udm.party.references.party_id(),
    note: udm.text(),
    ...gm.housekeeping.columns,
  },
);

export const auditAssertion = gm.textPkTable(
  "audit_assertion",
  {
    audit_assertion_id: udm.ulidPrimaryKey(),
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

export const contract = gm.textPkTable(
  "contract",
  {
    contract_id: udm.ulidPrimaryKey(),
    contract_from_id: udm.party.references.party_id().optional(),
    contract_to_id: udm.party.references.party_id().optional(),
    contract_status_id: contractStatus.references.contract_status_id()
      .optional(),
    document_reference: udm.text(),
    payment_type_id: paymentType.references.payment_type_id().optional(),
    periodicity_id: periodicity.references.periodicity_id().optional(),
    start_date: udm.dateTimeNullable(),
    end_date: udm.dateTimeNullable(),
    contract_type_id: contractType.references.contract_type_id().optional(),
    date_of_last_review: udm.dateTimeNullable(),
    date_of_next_review: udm.dateTimeNullable(),
    date_of_contract_review: udm.dateTimeNullable(),
    date_of_contract_approval: udm.dateTimeNullable(),
    ...gm.housekeeping.columns,
  },
);

export const riskRegister = gm.textPkTable(
  "risk_register",
  {
    risk_register_id: udm.ulidPrimaryKey(),
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

export const incident = gm.textPkTable(
  "incident",
  {
    incident_id: udm.ulidPrimaryKey(),
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

export const incidentRootCause = gm.textPkTable(
  "incident_root_cause",
  {
    incident_root_cause_id: udm.ulidPrimaryKey(),
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

export const raciMatrixAssignment = gm.textPkTable(
  "raci_matrix_assignment",
  {
    raci_matrix_assignment_id: udm.ulidPrimaryKey(),
    person_id: udm.person.references.person_id(),
    subject_id: raciMatrixSubject.references.raci_matrix_subject_id(),
    activity_id: raciMatrixActivity.references.raci_matrix_activity_id(),
    raci_matrix_assignment_nature_id: raciMatrixAssignmentNature
      .references.code(),
    ...gm.housekeeping.columns,
  },
);

export const personSkill = gm.textPkTable(
  "person_skill",
  {
    person_skill_id: udm.ulidPrimaryKey(),
    person_id: udm.person.references.person_id(),
    skill_nature_id: skillNature.references.skill_nature_id(),
    skill_id: skill.references.skill_id(),
    proficiency_scale_id: proficiencyScale.references.code(),
    ...gm.housekeeping.columns,
  },
);

export const keyPerformance = gm.textPkTable(
  "key_performance",
  {
    key_performance_id: udm.ulidPrimaryKey(),
    title: udm.text(),
    description: udm.text(),
    ...gm.housekeeping.columns,
  },
);

export const keyPerformanceIndicator = gm.textPkTable(
  "key_performance_indicator",
  {
    key_performance_indicator_id: udm.ulidPrimaryKey(),
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

export const keyRisk = gm.textPkTable(
  "key_risk",
  {
    key_risk_id: udm.ulidPrimaryKey(),
    title: udm.text(),
    description: udm.text(),
    base_value: udm.textNullable(),
    ...gm.housekeeping.columns,
  },
);

export const keyRiskIndicator = gm.textPkTable(
  "key_risk_indicator",
  {
    key_risk_indicator_id: udm.ulidPrimaryKey(),
    key_risk_id: keyRisk.references.key_risk_id(),
    entry_date: udm.date(),
    entry_value: udm.textNullable(),
    ...gm.housekeeping.columns,
  },
);

export const assertion = gm.textPkTable(
  "assertion",
  {
    assertion_id: udm.ulidPrimaryKey(),
    foreign_integration: udm.text(),
    assertion: udm.text(),
    assertion_explain: udm.text(),
    assertion_expires_on: udm.dateNullable(),
    assertion_expires_poam: udm.text(),
    ...gm.housekeeping.columns,
  },
);

export const attestation = gm.textPkTable(
  "attestation",
  {
    attestation_id: udm.ulidPrimaryKey(),
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

export const attestationEvidence = gm.textPkTable(
  "attestation_evidence",
  {
    attestation_evidence_id: udm.ulidPrimaryKey(),
    attestation_id: attestation.references.attestation_id(),
    evidence_nature: udm.text(),
    evidence_summary_markdown: udm.text(),
    url: udm.text(),
    content: udm.text(),
    attachment: udm.text(),
    ...gm.housekeeping.columns,
  },
);

/**
 * Reference URL: https://vertabelo.com/blog/designing-a-database-for-a-recruitment-system/
 */

export const hiringChecklist = gm.textPkTable(
  "hiring_checklist",
  {
    hiring_checklist_id: udm.ulidPrimaryKey(),
    hiring_process: hiringProcess.references.hiring_process_id(),
    hiring_process_checklist: hiringProcessChecklist.references
      .hiring_process_checklist_id().optional(),
    contract_id: contract.references.contract_id(),
    summary: udm.textNullable(),
    note: udm.textNullable(),
    asset_id: asset.references.asset_id().optional(),
    assign_party: udm.party.references.party_id().optional(),
    checklist_date: udm.dateTimeNullable(),
    interview_medium: interviewMedium.references.interview_medium_id()
      .optional(),
    payroll_items_type: payrollItemsType.references.payroll_items_type_id()
      .optional(),
    notice_period: noticePeriod.references.notice_period_id()
      .optional(),
    process_status: employeeProcessStatus.references
      .employee_process_status_id().optional(),
    ...gm.housekeeping.columns,
  },
);

export const terminationChecklist = gm.textPkTable(
  "termination_checklist",
  {
    termination_checklist_id: udm.ulidPrimaryKey(),
    termination_process: terminationProcess.references.termination_process_id(),
    termination_process_checklist: terminationProcessChecklist.references
      .termination_process_checklist_id().optional(),
    contract_id: contract.references.contract_id(),
    summary: udm.textNullable(),
    note: udm.textNullable(),
    asset_id: asset.references.asset_id().optional(),
    assign_party: udm.party.references.party_id().optional(),
    checklist_date: udm.dateNullable(),
    process_status: employeeProcessStatus.references
      .employee_process_status_id().optional(),
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
  udm.partyType,
  udm.partyRelationType,
  udm.sexType,
  udm.genderType,
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
  assetServiceStatus,
  assetServiceType,
  assetType,
  assignment,
  raciMatrix,
  raciMatrixSubjectBoundary,
  raciMatrixActivity,
  asset,
  assetService,
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
  employeeProcessStatus,
  payrollItemsType,
  interviewMedium,
  noticePeriod,
  hiringProcess,
  hiringProcessChecklist,
  hiringChecklist,
  terminationProcess,
  terminationProcessChecklist,
  terminationChecklist,
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
    organization_id: udm.text(),
    organization: udm.text(),
  },
)`
  SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,s.value AS skill,prs.value AS proficiency,organization_id,
  org.name as organization
  FROM person_skill ps
  INNER JOIN person p ON p.person_id = ps.person_id
  INNER JOIN party_relation pr ON pr.party_id = p.party_id
  INNER JOIN organization org ON org.party_id = pr.related_party_id
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

const assetServiceView = SQLa.safeViewDefinition(
  "asset_service_view",
  {
    name: udm.text(),
    server: udm.text(),
    organization_id: udm.text(),
    asset_type: udm.text(),
    asset_service_type_id: udm.text(),
    boundary: udm.text(),
    description: udm.text(),
    port: udm.text(),
    experimental_version: udm.text(),
    production_version: udm.text(),
    latest_vendor_version: udm.text(),
    resource_utilization: udm.text(),
    log_file: udm.text(),
    url: udm.text(),
    vendor_link: udm.text(),
    installation_date: udm.dateNullable(),
    criticality: udm.text(),
    owner: udm.text(),
    tag: udm.text(),
    asset_criticality: udm.text(),
    asymmetric_keys: udm.text(),
    cryptographic_key: udm.text(),
    symmetric_keys: udm.text(),
  },
)`
  SELECT
  asser.name,ast.name as server,ast.organization_id,astyp.value as asset_type,astyp.asset_service_type_id,bnt.name as boundary,asser.description,asser.port,asser.experimental_version,asser.production_version,asser.latest_vendor_version,asser.resource_utilization,asser.log_file,asser.url,
  asser.vendor_link,asser.installation_date,asser.criticality,o.name AS owner,sta.value as tag, ast.criticality as asset_criticality,ast.asymmetric_keys_encryption_enabled as asymmetric_keys,
  ast.cryptographic_key_encryption_enabled as cryptographic_key,ast.symmetric_keys_encryption_enabled as symmetric_keys
  FROM asset_service asser
  INNER JOIN asset_service_type astyp ON astyp.asset_service_type_id = asser.asset_service_type_id
  INNER JOIN asset ast ON ast.asset_id = asser.asset_id
  INNER JOIN organization o ON o.organization_id=ast.organization_id
  INNER JOIN asset_status sta ON sta.asset_status_id=ast.asset_status_id
  INNER JOIN boundary bnt ON bnt.boundary_id=ast.boundary_id`;

export const riskRegisterView = SQLa.safeViewDefinition(
  "risk_register_view",
  {
    risk_register_id: udm.integer(),
    description: udm.text(),
    risk_subject: udm.text(),
    risk_type: udm.text(),
    impact_to_the_organization: udm.text(),
    rating_likelihood_id: udm.text(),
    rating_impact_id: udm.text(),
    rating_overall_risk_id: udm.text(),
    controls_in_place: udm.text(),
    control_effectivenes: udm.text(),
    over_all_residual_risk_rating_id: udm.text(),
    mitigation_further_actions: udm.text(),
    control_monitor_mitigation_actions_tracking_strategy: udm.text(),
    control_monitor_action_due_date: udm.text(),
    control_monitor_risk_owner: udm.text(),
  },
)`
  SELECT rr.risk_register_id,
  rr.description,
  rs."value" as risk_subject,
  rt."value" as risk_type,
  impact_to_the_organization,
  rating_likelihood_id,
  rating_impact_id,
  rating_overall_risk_id,
  controls_in_place,
  control_effectivenes,
  over_all_residual_risk_rating_id,
  mitigation_further_actions,
  control_monitor_mitigation_actions_tracking_strategy,
  control_monitor_action_due_date,
  p.person_first_name  as control_monitor_risk_owner
  FROM risk_register rr
  INNER JOIN risk_subject rs on rs.risk_subject_id = rr.risk_subject_id
  INNER JOIN risk_type rt on rt.risk_type_id=rr.risk_type_id
  INNER JOIN person p on p.person_id=rr.control_monitor_risk_owner_id`;

const personOrganiztionView = SQLa.safeViewDefinition(
  "person_organiztion_view",
  {
    person_name: udm.text(),
    organization_id: udm.text(),
    organization: udm.text(),
  },
)`
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,organization_id,org.name as organization
    FROM person p
    INNER JOIN party_relation pr ON pr.party_id = p.party_id
    INNER JOIN party_relation_type prt ON prt.party_relation_type_id = pr.relation_type_id AND prt.code = 'ORGANIZATION_TO_PERSON'
    INNER JOIN organization org ON org.party_id = pr.related_party_id`;

const employeContractView = SQLa.safeViewDefinition(
  "employe_contract_view",
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
      INNER JOIN contract_type ctp on ctp.code = ct.contract_type_id AND ctp.code = 'EMPLOYMENT_AGREEMENT'
      INNER JOIN periodicity p on p.code = ct.periodicity_id`;

const hiringChecklistView = SQLa.safeViewDefinition(
  "hiring_checklist_view",
  {
    employee_name: udm.text(),
    first_name: udm.text(),
    middle_name: udm.text(),
    last_name: udm.text(),
    process: udm.text(),
    checklist: udm.text(),
    check_list_value: udm.text(),
    note: udm.text(),
    organization: udm.text(),
    address_line1: udm.text(),
    address_line2: udm.text(),
    address_zip: udm.text(),
    address_city: udm.text(),
    address_state: udm.text(),
    address_country: udm.text(),
  },
)`SELECT
    paremp.party_name as employee_name,
    peremp.person_first_name first_name,
    peremp.person_middle_name middle_name,
    peremp.person_last_name last_name,
    hp.value as process,
    hpc.value as checklist,
    CASE
      WHEN hpc.code IN ('DATE_OF_DATA_COLLECTION', 'DATE_OF_INTERVIEW','DATE_OF_JOINING') THEN hc.checklist_date
      WHEN hpc.code IN ('INTERVIEWER','IDENTIFYING_THE_REPORTING_OFFICER','EXPERIENCE_CERTIFICATES_FROM_PREVIOUS_EMPLOYERS','RELIEVING_ORDER_FROM_PREVIOUS_EMPLOYERS','SALARY_CERTIFICATE_FROM_THE_LAST_EMPLOYER','ALL_EDUCATIONAL_CERTIFICATES_AND_FINAL_MARK_LIST_FROM_10TH_ONWARDS','PASSPORT_SIZE_COLOUR_PHOTOGRAPH','FOR_ADDRESS_PROOF_AADHAAR_&_PAN_CARD','ASSIGNING_TO_THE_TEAM_AND_REPORTING_OFFICER','INDUCTION_TO_THE_TEAM') THEN parint.party_name
      WHEN hpc.code IN ('MEDIUM_OF_INTERVIEW') THEN im.value
      WHEN hpc.code IN ('DEDUCTIONS','EMPLOYEE_BENEFITS_AND_FACILITIES') THEN pit.value
      WHEN hpc.code IN ('NOTICE_PERIOD') THEN np.value
      WHEN hpc.code IN ('LATEST_RESUME(HARD_COPY)_[UPDATE_YOUR_HOME_ADDRESS_,_RESIDENCE_PHONE_AND_MOBILE_NUMBER_CORRECTLY]','PREPARING_WELCOME_CARD','JOINING_REPORT','FILLING_JOINING_FORM_WITH_PERSONNEL_AND_OFFICIAL_DETAILS(BANK,EPF,_ESI_&_KERALA_SHOPS_ACCOUNT_DETAILS)','SIGNING_THE_CONFIDENTIALITY_AGREEMENT','THE_GREETING_OF_NEW_EMPLOYEES','THE_JOB','THE_MAIN_TERMS_AND_CONDITIONS_OF_EMPLOYMENT','COMPANY_RULES','EMPLOYEE_BENEFITS_AND_FACILITIES_HR_INDUCTION','WORKING_DAYS_&_HOURS','DREES_CODE','LAYOUT_OF_THE_WORKPLACE') THEN eps.value
      ELSE hc.summary
    END AS check_list_value,
    hc.note,
    parorg.party_name as organization,
    clemp.address_line1,
    clemp.address_line2,
    clemp.address_zip,
    clemp.address_city,
    clemp.address_state,
    clemp.address_country
    FROM hiring_checklist hc
    LEFT JOIN hiring_process hp on hp.hiring_process_id = hc.hiring_process
    LEFT JOIN hiring_process_checklist hpc on hpc.hiring_process_checklist_id = hc.hiring_process_checklist
    INNER JOIN contract c on c.contract_id = hc.contract_id
    INNER JOIN party parorg on parorg.party_id = c.contract_from_id
    INNER JOIN party paremp on paremp.party_id = c.contract_to_id
    INNER JOIN person peremp on peremp.party_id = c.contract_to_id
    INNER JOIN contact_land clemp on  clemp.party_id = paremp.party_id
    LEFT JOIN asset ast on ast.asset_id = hc.asset_id
    LEFT JOIN party pr on pr.party_id = hc.assign_party
    LEFT JOIN employee_process_status eps on eps.employee_process_status_id = hc.process_status
    LEFT JOIN party parint on parint.party_id = hc.assign_party
    LEFT JOIN interview_medium im on im.interview_medium_id = hc.interview_medium
    LEFT JOIN payroll_items_type pit on pit.payroll_items_type_id = hc.payroll_items_type
    LEFT JOIN notice_period np on np.notice_period_id = hc.notice_period`;

const terminationChecklistView = SQLa.safeViewDefinition(
  "termination_checklist_view",
  {
    employee_name: udm.text(),
    first_name: udm.text(),
    middle_name: udm.text(),
    last_name: udm.text(),
    process: udm.text(),
    checklist: udm.text(),
    check_list_value: udm.text(),
    note: udm.text(),
    organization: udm.text(),
    address_line1: udm.text(),
    address_line2: udm.text(),
    address_zip: udm.text(),
    address_city: udm.text(),
    address_state: udm.text(),
    address_country: udm.text(),
  },
)`SELECT
    paremp.party_name as employee_name,
    peremp.person_first_name first_name,
    peremp.person_middle_name middle_name,
    peremp.person_last_name last_name,
    tp.value as process,
    tpc.value as checklist,
    CASE
        WHEN ast.name IS NOT NULL THEN ast.name
        WHEN tpc.code IN ('DATE_OF_RESIGNATION', 'ACCEPTANCE_OF_RESIGNATION','INFORM_HR_DEPARTMENT_AND_NEGOTIATE_THE_EXIT_DATES_BASED_ON_PROJECT_NEEDS','FINALISING_THE_DATE_OF_RELIEVING','RELIEVING_CONFIRMATION_FROM_PROJECT_MANAGER') THEN tc.checklist_date
        WHEN tpc.code IN ('TEAM_COMMUNICATION','TRANSITION_OF_RESPONSIBILITIES','DOCUMENT_WORK_FOR_KNOWLEDGE_TRANSFER') THEN eps.value
        WHEN tp.code IN ('CONDUCT_AN_EXIT_INTERVIEW','COMMUNICATE_THE_DEPARTURE','COMPLETE_AND_FILE_THE_PAPERWORK','SETTLE_THE_FINAL_PAY','ISSUING_RELIEVING_LETTER_SALARY_CERTIFICATE_AND_EXPERIENCE_CERTIFICATE','UPDATE_ORGANIZATIONAL_CHARTS-MASTER_DATA') THEN eps.value
        ELSE tc.summary
    END as check_list_value,
    tc.note,
    clemp.address_line1,
    clemp.address_line2,
    clemp.address_zip,
    clemp.address_city,
    clemp.address_state,
    clemp.address_country,
    parorg.party_name as organization
    FROM termination_checklist tc
    LEFT JOIN termination_process tp on tp.termination_process_id=tc.termination_process
    LEFT JOIN termination_process_checklist tpc on tpc.termination_process_checklist_id=tc.termination_process_checklist
    LEFT JOIN asset ast on ast.asset_id = tc.asset_id
    LEFT JOIN employee_process_status eps on eps.employee_process_status_id = tc.process_status
    INNER JOIN contract c on c.contract_id = tc.contract_id
    INNER JOIN party parorg on parorg.party_id = c.contract_from_id
    INNER JOIN party paremp on paremp.party_id = c.contract_to_id
    INNER JOIN person peremp on peremp.party_id = c.contract_to_id
    INNER JOIN contact_land clemp on  clemp.party_id = paremp.party_id`;

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
  assetServiceView,
  riskRegisterView,
  personOrganiztionView,
  employeContractView,
  hiringChecklistView,
  terminationChecklistView,
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
    `;
}

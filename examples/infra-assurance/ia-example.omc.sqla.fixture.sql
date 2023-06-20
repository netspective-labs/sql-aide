PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance

-- reference tables
CREATE TABLE IF NOT EXISTS "execution_context" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "party_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "party_role_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "contract_status" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "payment_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "periodicity" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "boundary_nature" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "time_entry_category" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "raci_matrix_subject" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "raci_matrix_assignment_nature" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "skill_nature" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "skill" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "proficiency_scale" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "vulnerability_status" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "asset_status" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "asset_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "assignment" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "probability" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "threat_source_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "threat_event_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "calendar_period" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "comparison_operator" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "kpi_measurement_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "kpi_status" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "tracking_period" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "trend" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "auditor_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "audit_purpose" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "audit_status" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "party_relation_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "party_identifier_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "person_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "contact_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "training_subject" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "status_value" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "rating_value" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "contract_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "graph_nature" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "risk_subject" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "risk_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "incident_category" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "incident_sub_category" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "severity" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "priority" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "incident_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "incident_status" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "asset_risk_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- content tables
CREATE TABLE IF NOT EXISTS "organization_role_type" (
    "organization_role_type_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "graph" (
    "graph_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "graph_nature_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("graph_nature_id") REFERENCES "graph_nature"("code")
);
CREATE TABLE IF NOT EXISTS "boundary" (
    "boundary_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "parent_boundary_id" INTEGER,
    "graph_id" INTEGER NOT NULL,
    "boundary_nature_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("parent_boundary_id") REFERENCES "boundary"("boundary_id"),
    FOREIGN KEY("graph_id") REFERENCES "graph"("graph_id"),
    FOREIGN KEY("boundary_nature_id") REFERENCES "boundary_nature"("code")
);
CREATE TABLE IF NOT EXISTS "host" (
    "host_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "host_name" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    UNIQUE("host_name")
);
CREATE TABLE IF NOT EXISTS "host_boundary" (
    "host_boundary_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "host_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("host_id") REFERENCES "host"("host_id")
);
CREATE TABLE IF NOT EXISTS "raci_matrix" (
    "raci_matrix_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "asset" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "accountable" TEXT NOT NULL,
    "consulted" TEXT NOT NULL,
    "informed" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "raci_matrix_subject_boundary" (
    "raci_matrix_subject_boundary_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "boundary_id" INTEGER NOT NULL,
    "raci_matrix_subject_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("boundary_id") REFERENCES "boundary"("boundary_id"),
    FOREIGN KEY("raci_matrix_subject_id") REFERENCES "raci_matrix_subject"("code")
);
CREATE TABLE IF NOT EXISTS "raci_matrix_activity" (
    "raci_matrix_activity_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "activity" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "party" (
    "party_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "party_type_id" TEXT NOT NULL,
    "party_name" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("party_type_id") REFERENCES "party_type"("code")
);
CREATE TABLE IF NOT EXISTS "party_identifier" (
    "party_identifier_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "identifier_number" TEXT NOT NULL,
    "party_identifier_type_id" TEXT NOT NULL,
    "party_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("party_identifier_type_id") REFERENCES "party_identifier_type"("code"),
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "person" (
    "person_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "party_id" INTEGER NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "person_first_name" TEXT NOT NULL,
    "person_last_name" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("party_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("person_type_id") REFERENCES "person_type"("code")
);
CREATE TABLE IF NOT EXISTS "party_relation" (
    "party_relation_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "party_id" INTEGER NOT NULL,
    "related_party_id" INTEGER NOT NULL,
    "relation_type_id" TEXT NOT NULL,
    "party_role_id" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("party_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("related_party_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("relation_type_id") REFERENCES "party_relation_type"("code"),
    FOREIGN KEY("party_role_id") REFERENCES "party_role_type"("code")
);
CREATE TABLE IF NOT EXISTS "organization" (
    "organization_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "party_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "registration_date" DATE NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "organization_role" (
    "organization_role_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "person_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "organization_role_type_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("organization_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("organization_role_type_id") REFERENCES "organization_role_type"("organization_role_type_id")
);
CREATE TABLE IF NOT EXISTS "contact_electronic" (
    "contact_electronic_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "contact_type_id" TEXT NOT NULL,
    "party_id" INTEGER NOT NULL,
    "electronics_details" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("contact_type_id") REFERENCES "contact_type"("code"),
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "contact_land" (
    "contact_land_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "contact_type_id" TEXT NOT NULL,
    "party_id" INTEGER NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT NOT NULL,
    "address_zip" TEXT NOT NULL,
    "address_city" TEXT NOT NULL,
    "address_state" TEXT NOT NULL,
    "address_country" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("contact_type_id") REFERENCES "contact_type"("code"),
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "asset" (
    "asset_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "asset_retired_date" DATE,
    "asset_status_id" TEXT NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "asset_type_id" TEXT NOT NULL,
    "asset_workload_category" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "barcode_or_rfid_tag" TEXT NOT NULL,
    "installed_date" DATE,
    "planned_retirement_date" DATE,
    "purchase_delivery_date" DATE,
    "purchase_order_date" DATE,
    "purchase_request_date" DATE,
    "serial_number" TEXT NOT NULL,
    "tco_amount" TEXT NOT NULL,
    "tco_currency" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("organization_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("asset_status_id") REFERENCES "asset_status"("code"),
    FOREIGN KEY("asset_type_id") REFERENCES "asset_type"("code"),
    FOREIGN KEY("assignment_id") REFERENCES "assignment"("code")
);
CREATE TABLE IF NOT EXISTS "vulnerability_source" (
    "vulnerability_source_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "short_code" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "severity" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "vulnerability" (
    "vulnerability_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "short_name" TEXT NOT NULL,
    "source_id" INTEGER NOT NULL,
    "affected_software" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "patch_availability" TEXT NOT NULL,
    "severity_id" TEXT NOT NULL,
    "solutions" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("source_id") REFERENCES "vulnerability_source"("vulnerability_source_id"),
    FOREIGN KEY("status_id") REFERENCES "vulnerability_status"("code"),
    FOREIGN KEY("severity_id") REFERENCES "severity"("code")
);
CREATE TABLE IF NOT EXISTS "threat_source" (
    "threat_source_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "threat_source_type_id" TEXT NOT NULL,
    "source_of_information" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "targeting" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("threat_source_type_id") REFERENCES "threat_source_type"("code")
);
CREATE TABLE IF NOT EXISTS "threat_event" (
    "threat_event_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "threat_source_id" INTEGER NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "identifier" TEXT NOT NULL,
    "threat_event_type_id" TEXT NOT NULL,
    "event_classification" TEXT NOT NULL,
    "source_of_information" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("threat_source_id") REFERENCES "threat_source"("threat_source_id"),
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("threat_event_type_id") REFERENCES "threat_event_type"("code")
);
CREATE TABLE IF NOT EXISTS "asset_risk_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "asset_risk" (
    "asset_risk_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "asset_risk_type_id" TEXT NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "threat_event_id" INTEGER NOT NULL,
    "relevance_id" TEXT,
    "likelihood_id" TEXT,
    "impact" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("asset_risk_type_id") REFERENCES "asset_risk_type"("code"),
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("threat_event_id") REFERENCES "threat_event"("threat_event_id"),
    FOREIGN KEY("relevance_id") REFERENCES "severity"("code"),
    FOREIGN KEY("likelihood_id") REFERENCES "probability"("code")
);
CREATE TABLE IF NOT EXISTS "priority" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "security_impact_analysis" (
    "security_impact_analysis_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "vulnerability_id" INTEGER NOT NULL,
    "asset_risk_id" INTEGER NOT NULL,
    "risk_level_id" TEXT NOT NULL,
    "impact_level_id" TEXT NOT NULL,
    "existing_controls" TEXT NOT NULL,
    "priority_id" TEXT NOT NULL,
    "reported_date" DATE NOT NULL,
    "reported_by_id" INTEGER NOT NULL,
    "responsible_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("vulnerability_id") REFERENCES "vulnerability"("vulnerability_id"),
    FOREIGN KEY("asset_risk_id") REFERENCES "asset_risk"("asset_risk_id"),
    FOREIGN KEY("risk_level_id") REFERENCES "probability"("code"),
    FOREIGN KEY("impact_level_id") REFERENCES "probability"("code"),
    FOREIGN KEY("priority_id") REFERENCES "priority"("code"),
    FOREIGN KEY("reported_by_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("responsible_by_id") REFERENCES "person"("person_id")
);
CREATE TABLE IF NOT EXISTS "impact_of_risk" (
    "impact_of_risk_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "security_impact_analysis_id" INTEGER NOT NULL,
    "impact" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("security_impact_analysis_id") REFERENCES "security_impact_analysis"("security_impact_analysis_id")
);
CREATE TABLE IF NOT EXISTS "proposed_controls" (
    "proposed_controls_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "security_impact_analysis_id" INTEGER NOT NULL,
    "controls" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("security_impact_analysis_id") REFERENCES "security_impact_analysis"("security_impact_analysis_id")
);
CREATE TABLE IF NOT EXISTS "billing" (
    "billing_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "purpose" TEXT NOT NULL,
    "bill_rate" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "effective_from_date" TIMESTAMP NOT NULL,
    "effective_to_date" TEXT NOT NULL,
    "prorate" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "scheduled_task" (
    "scheduled_task_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "task_date" TIMESTAMP NOT NULL,
    "reminder_date" TIMESTAMP NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "reminder_to" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "timesheet" (
    "timesheet_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "date_of_work" TIMESTAMP NOT NULL,
    "is_billable_id" TEXT NOT NULL,
    "number_of_hours" INTEGER NOT NULL,
    "time_entry_category_id" TEXT NOT NULL,
    "timesheet_summary" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("is_billable_id") REFERENCES "status_value"("code"),
    FOREIGN KEY("time_entry_category_id") REFERENCES "time_entry_category"("code")
);
CREATE TABLE IF NOT EXISTS "certificate" (
    "certificate_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "certificate_name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "certificate_category" TEXT NOT NULL,
    "certificate_type" TEXT NOT NULL,
    "certificate_authority" TEXT NOT NULL,
    "validity" TEXT NOT NULL,
    "expiration_date" TIMESTAMP,
    "domain_name" TEXT NOT NULL,
    "key_size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "device" (
    "device_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "device_name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "firmware" TEXT NOT NULL,
    "data_center" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "security_incident_response_team" (
    "security_incident_response_team_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "training_subject_id" TEXT,
    "person_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "training_status_id" TEXT,
    "attended_date" DATE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("training_subject_id") REFERENCES "training_subject"("code"),
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("organization_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("training_status_id") REFERENCES "status_value"("code")
);
CREATE TABLE IF NOT EXISTS "awareness_training" (
    "awareness_training_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "training_subject_id" TEXT NOT NULL,
    "person_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "training_status_id" TEXT NOT NULL,
    "attended_date" DATE NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("training_subject_id") REFERENCES "training_subject"("code"),
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("organization_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("training_status_id") REFERENCES "status_value"("code")
);
CREATE TABLE IF NOT EXISTS "rating" (
    "rating_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "author_id" INTEGER NOT NULL,
    "rating_given_to_id" INTEGER NOT NULL,
    "rating_value_id" TEXT NOT NULL,
    "best_rating_id" TEXT,
    "rating_explanation" TEXT NOT NULL,
    "review_aspect" TEXT NOT NULL,
    "worst_rating_id" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("author_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("rating_given_to_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("rating_value_id") REFERENCES "rating_value"("code"),
    FOREIGN KEY("best_rating_id") REFERENCES "rating_value"("code"),
    FOREIGN KEY("worst_rating_id") REFERENCES "rating_value"("code")
);
CREATE TABLE IF NOT EXISTS "note" (
    "note_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "party_id" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "audit_assertion" (
    "audit_assertion_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "auditor_type_id" TEXT NOT NULL,
    "audit_purpose_id" TEXT NOT NULL,
    "auditor_org_id" INTEGER NOT NULL,
    "auditor_person_id" INTEGER NOT NULL,
    "auditor_status_type_id" TEXT NOT NULL,
    "scf_identifier" TEXT NOT NULL,
    "auditor_notes" TEXT NOT NULL,
    "auditor_artifacts" TEXT NOT NULL,
    "assertion_name" TEXT NOT NULL,
    "assertion_description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("auditor_type_id") REFERENCES "auditor_type"("code"),
    FOREIGN KEY("audit_purpose_id") REFERENCES "audit_purpose"("code"),
    FOREIGN KEY("auditor_org_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("auditor_person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("auditor_status_type_id") REFERENCES "audit_status"("code")
);
CREATE TABLE IF NOT EXISTS "contract" (
    "contract_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "contract_from_id" INTEGER NOT NULL,
    "contract_to_id" INTEGER NOT NULL,
    "contract_status_id" TEXT,
    "document_reference" TEXT NOT NULL,
    "payment_type_id" TEXT,
    "periodicity_id" TEXT,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP,
    "contract_type_id" TEXT,
    "date_of_last_review" TIMESTAMP,
    "date_of_next_review" TIMESTAMP,
    "date_of_contract_review" TIMESTAMP,
    "date_of_contract_approval" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("contract_from_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("contract_to_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("contract_status_id") REFERENCES "contract_status"("code"),
    FOREIGN KEY("payment_type_id") REFERENCES "payment_type"("code"),
    FOREIGN KEY("periodicity_id") REFERENCES "periodicity"("code"),
    FOREIGN KEY("contract_type_id") REFERENCES "contract_type"("code")
);
CREATE TABLE IF NOT EXISTS "risk_subject" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "risk_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "risk_register" (
    "risk_register_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "risk_subject_id" TEXT NOT NULL,
    "risk_type_id" TEXT NOT NULL,
    "impact_to_the_organization" TEXT NOT NULL,
    "rating_likelihood_id" TEXT,
    "rating_impact_id" TEXT,
    "rating_overall_risk_id" TEXT,
    "controls_in_place" TEXT NOT NULL,
    "control_effectivenes" INTEGER NOT NULL,
    "over_all_residual_risk_rating_id" TEXT,
    "mitigation_further_actions" TEXT NOT NULL,
    "control_monitor_mitigation_actions_tracking_strategy" TEXT NOT NULL,
    "control_monitor_action_due_date" DATE,
    "control_monitor_risk_owner_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("risk_subject_id") REFERENCES "risk_subject"("code"),
    FOREIGN KEY("risk_type_id") REFERENCES "risk_type"("code"),
    FOREIGN KEY("rating_likelihood_id") REFERENCES "rating_value"("code"),
    FOREIGN KEY("rating_impact_id") REFERENCES "rating_value"("code"),
    FOREIGN KEY("rating_overall_risk_id") REFERENCES "rating_value"("code"),
    FOREIGN KEY("over_all_residual_risk_rating_id") REFERENCES "rating_value"("code"),
    FOREIGN KEY("control_monitor_risk_owner_id") REFERENCES "person"("person_id")
);
CREATE TABLE IF NOT EXISTS "incident_category" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "incident_sub_category" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "incident_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "incident_status" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "incident" (
    "incident_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "incident_date" DATE NOT NULL,
    "time_and_time_zone" TIMESTAMP NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "category_id" TEXT NOT NULL,
    "sub_category_id" TEXT NOT NULL,
    "severity_id" TEXT NOT NULL,
    "priority_id" TEXT,
    "internal_or_external_id" TEXT,
    "location" TEXT NOT NULL,
    "it_service_impacted" TEXT NOT NULL,
    "impacted_modules" TEXT NOT NULL,
    "impacted_dept" TEXT NOT NULL,
    "reported_by_id" INTEGER NOT NULL,
    "reported_to_id" INTEGER NOT NULL,
    "brief_description" TEXT NOT NULL,
    "detailed_description" TEXT NOT NULL,
    "assigned_to_id" INTEGER NOT NULL,
    "assigned_date" DATE,
    "investigation_details" TEXT NOT NULL,
    "containment_details" TEXT NOT NULL,
    "eradication_details" TEXT NOT NULL,
    "business_impact" TEXT NOT NULL,
    "lessons_learned" TEXT NOT NULL,
    "status_id" TEXT,
    "closed_date" DATE,
    "reopened_time" TIMESTAMP,
    "feedback_from_business" TEXT NOT NULL,
    "reported_to_regulatory" TEXT NOT NULL,
    "report_date" DATE,
    "report_time" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("category_id") REFERENCES "incident_category"("code"),
    FOREIGN KEY("sub_category_id") REFERENCES "incident_sub_category"("code"),
    FOREIGN KEY("severity_id") REFERENCES "severity"("code"),
    FOREIGN KEY("priority_id") REFERENCES "priority"("code"),
    FOREIGN KEY("internal_or_external_id") REFERENCES "incident_type"("code"),
    FOREIGN KEY("reported_by_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("reported_to_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("assigned_to_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("status_id") REFERENCES "incident_status"("code")
);
CREATE TABLE IF NOT EXISTS "incident_root_cause" (
    "incident_root_cause_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "incident_id" INTEGER,
    "source" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "probability_id" TEXT,
    "testing_analysis" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "likelihood_of_risk_id" TEXT,
    "modification_of_the_reported_issue" TEXT NOT NULL,
    "testing_for_modified_issue" TEXT NOT NULL,
    "test_results" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("incident_id") REFERENCES "incident"("incident_id"),
    FOREIGN KEY("probability_id") REFERENCES "priority"("code"),
    FOREIGN KEY("likelihood_of_risk_id") REFERENCES "priority"("code")
);
CREATE TABLE IF NOT EXISTS "raci_matrix_assignment" (
    "raci_matrix_assignment_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "person_id" INTEGER NOT NULL,
    "subject_id" TEXT NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "raci_matrix_assignment_nature_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("subject_id") REFERENCES "raci_matrix_subject"("code"),
    FOREIGN KEY("activity_id") REFERENCES "raci_matrix_activity"("raci_matrix_activity_id"),
    FOREIGN KEY("raci_matrix_assignment_nature_id") REFERENCES "raci_matrix_assignment_nature"("code")
);
CREATE TABLE IF NOT EXISTS "person_skill" (
    "person_skill_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "person_id" INTEGER NOT NULL,
    "skill_nature_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "proficiency_scale_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("skill_nature_id") REFERENCES "skill_nature"("code"),
    FOREIGN KEY("skill_id") REFERENCES "skill"("code"),
    FOREIGN KEY("proficiency_scale_id") REFERENCES "proficiency_scale"("code")
);
CREATE TABLE IF NOT EXISTS "key_performance" (
    "key_performance_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "key_performance_indicator" (
    "key_performance_indicator_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "key_performance_id" INTEGER NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "calendar_period_id" TEXT NOT NULL,
    "kpi_comparison_operator_id" TEXT NOT NULL,
    "kpi_context" TEXT NOT NULL,
    "kpi_lower_threshold_critical" TEXT NOT NULL,
    "kpi_lower_threshold_major" TEXT NOT NULL,
    "kpi_lower_threshold_minor" TEXT NOT NULL,
    "kpi_lower_threshold_ok" TEXT NOT NULL,
    "kpi_lower_threshold_warning" TEXT NOT NULL,
    "kpi_measurement_type_id" TEXT NOT NULL,
    "kpi_status_id" TEXT NOT NULL,
    "kpi_threshold_critical" TEXT NOT NULL,
    "kpi_threshold_major" TEXT NOT NULL,
    "kpi_threshold_minor" TEXT NOT NULL,
    "kpi_threshold_ok" TEXT NOT NULL,
    "kpi_threshold_warning" TEXT NOT NULL,
    "kpi_unit_of_measure" TEXT NOT NULL,
    "kpi_value" TEXT NOT NULL,
    "score" TEXT NOT NULL,
    "tracking_period_id" TEXT NOT NULL,
    "trend_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("key_performance_id") REFERENCES "key_performance"("key_performance_id"),
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("calendar_period_id") REFERENCES "calendar_period"("code"),
    FOREIGN KEY("kpi_comparison_operator_id") REFERENCES "comparison_operator"("code"),
    FOREIGN KEY("kpi_measurement_type_id") REFERENCES "kpi_measurement_type"("code"),
    FOREIGN KEY("kpi_status_id") REFERENCES "kpi_status"("code"),
    FOREIGN KEY("tracking_period_id") REFERENCES "tracking_period"("code"),
    FOREIGN KEY("trend_id") REFERENCES "trend"("code")
);
CREATE TABLE IF NOT EXISTS "key_risk" (
    "key_risk_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "base_value" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "key_risk_indicator" (
    "key_risk_indicator_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "key_risk_id" INTEGER NOT NULL,
    "entry_date" DATE NOT NULL,
    "entry_value" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("key_risk_id") REFERENCES "key_risk"("key_risk_id")
);
CREATE TABLE IF NOT EXISTS "assertion" (
    "assertion_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "foreign_integration" TEXT NOT NULL,
    "assertion" TEXT NOT NULL,
    "assertion_explain" TEXT NOT NULL,
    "assertion_expires_on" DATE,
    "assertion_expires_poam" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE IF NOT EXISTS "attestation" (
    "attestation_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "assertion_id" INTEGER NOT NULL,
    "person_id" INTEGER NOT NULL,
    "attestation" TEXT NOT NULL,
    "attestation_explain" TEXT NOT NULL,
    "attested_on" DATE NOT NULL,
    "expires_on" DATE,
    "boundary_id" INTEGER,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("assertion_id") REFERENCES "assertion"("assertion_id"),
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("boundary_id") REFERENCES "boundary"("boundary_id")
);
CREATE TABLE IF NOT EXISTS "attestation_evidence" (
    "attestation_evidence_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "attestation_id" INTEGER NOT NULL,
    "evidence_nature" TEXT NOT NULL,
    "evidence_summary_markdown" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachment" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY("attestation_id") REFERENCES "attestation"("attestation_id")
);

--content views
CREATE VIEW IF NOT EXISTS "security_incident_response_team_view"("person_name", "organization_name", "team_role", "email") AS
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name, o.name AS organization_name, ort.value AS team_role,e.electronics_details AS email
    FROM security_incident_response_team sirt
    INNER JOIN person p ON p.person_id = sirt.person_id
    INNER JOIN organization o ON o.organization_id=sirt.organization_id
    INNER JOIN organization_role orl ON orl.person_id = sirt.person_id AND orl.organization_id = sirt.organization_id
    INNER JOIN organization_role_type ort ON ort.code = orl.organization_role_type_id
    INNER JOIN party pr ON pr.party_id = p.party_id
    INNER JOIN contact_electronic e ON e.party_id=pr.party_id AND e.contact_type_id = 'OFFICIAL_EMAIL';
CREATE VIEW IF NOT EXISTS "awareness_training_view"("person_name", "person_role", "trainigng_subject", "training_status_id", "attended_date") AS
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,ort.value AS person_role,sub.value AS trainigng_subject,at.training_status_id,at.attended_date
    FROM awareness_training at
    INNER JOIN person p ON p.person_id = at.person_id
    INNER JOIN organization_role orl ON orl.person_id = at.person_id AND orl.organization_id = at.organization_id
    INNER JOIN organization_role_type ort ON ort.code = orl.organization_role_type_id
    INNER JOIN training_subject sub ON sub.code = at.training_subject_id;
CREATE VIEW IF NOT EXISTS "person_skill_view"("person_name", "skill", "proficiency") AS
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,s.value AS skill,prs.value AS proficiency
    FROM person_skill ps
    INNER JOIN person p ON p.person_id = ps.person_id
    INNER JOIN skill s ON s.code = ps.skill_id
    INNER JOIN proficiency_scale prs ON prs.code = ps.proficiency_scale_id GROUP BY ps.person_id,ps.skill_id;
CREATE VIEW IF NOT EXISTS "security_incident_response_view"("incident", "incident_date", "asset_name", "category", "severity", "priority", "internal_or_external", "location", "it_service_impacted", "impacted_modules", "impacted_dept", "reported_by", "reported_to", "brief_description", "detailed_description", "assigned_to", "assigned_date", "investigation_details", "containment_details", "eradication_details", "business_impact", "lessons_learned", "status", "closed_date", "feedback_from_business", "reported_to_regulatory", "report_date", "report_time", "root_cause_of_the_issue", "probability_of_issue", "testing_for_possible_root_cause_analysis", "solution", "likelihood_of_risk", "modification_of_the_reported_issue", "testing_for_modified_issue", "test_results") AS
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
    LEFT JOIN priority p2 ON p2.code = irc.likelihood_of_risk_id;
CREATE VIEW IF NOT EXISTS "raci_matrix_assignment_view"("person_name", "subject", "activity", "assignment_nature") AS
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,rms.value AS subject,rma.activity,
    rman.value AS assignment_nature
    FROM raci_matrix_assignment rma
    INNER JOIN person p ON p.person_id = rma.person_id
    INNER JOIN raci_matrix_subject rms on rms.code = rma.subject_id
    INNER JOIN raci_matrix_activity rma on rma.raci_matrix_activity_id = rma.activity_id
    INNER JOIN raci_matrix_assignment_nature rman on rman.code = rma.raci_matrix_assignment_nature_id;
CREATE VIEW IF NOT EXISTS "security_impact_analysis_view"("vulnerability", "security_risk", "security_threat", "impact_of_risk", "proposed_controls", "impact_level", "risk_level", "existing_controls", "priority", "reported_date", "reported_by", "responsible_by") AS
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
    INNER JOIN person pn2 ON pn2.person_id = sia.responsible_by_id;
CREATE VIEW IF NOT EXISTS "key_performance_indicator_view"("kpi_lower_threshold_critical", "kpi_lower_threshold_major", "kpi_lower_threshold_minor", "kpi_lower_threshold_ok", "kpi_lower_threshold_warning", "kpi_threshold_critical", "kpi_threshold_major", "kpi_threshold_minor", "kpi_threshold_ok", "kpi_threshold_warning", "kpi_value", "score", "kpi_unit_of_measure", "key_performance", "calendar_period", "asset_name", "asset_type", "kpi_comparison_operator", "kpi_measurement_type", "kpi_status", "tracking_period", "trend") AS
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
    INNER JOIN trend t ON t.code = kpi.trend_id;
CREATE VIEW IF NOT EXISTS "attestation_view"("attestation", "attestation_explain", "attested_on", "expires_on", "person_name", "foreign_integration", "assertion", "assertion_explain", "assertion_expires_on", "assertion_expires_poam", "boundary") AS
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
    LEFT JOIN boundary b on b.boundary_id = at.boundary_id;
CREATE VIEW IF NOT EXISTS "root_cause_analysis_view"("issue", "source", "cause_of_the_issue", "testing_analysis", "solution", "modification_of_the_reported_issue", "testing_for_modified_issue", "test_results", "probability_of_issue", "likelihood_of_risk") AS
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
    INNER JOIN priority p1 on p1.code = irc.likelihood_of_risk_id;
CREATE VIEW IF NOT EXISTS "vender_view"("name", "email", "address", "state", "city", "zip", "country") AS
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
    WHERE prl.party_role_id = 'VENDOR' AND prl.relation_type_id = 'ORGANIZATION_TO_PERSON';
CREATE VIEW IF NOT EXISTS "contract_view"("contract_by", "contract_to", "payment_type", "contract_status", "contract_type", "document_reference", "periodicity", "start_date", "end_date", "date_of_last_review", "date_of_next_review", "date_of_contract_review", "date_of_contract_approval") AS
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
    INNER JOIN periodicity p on p.code = ct.periodicity_id;

-- seed Data
INSERT INTO "execution_context" ("code", "value") VALUES ('PRODUCTION', 'production');
INSERT INTO "execution_context" ("code", "value") VALUES ('TEST', 'test');
INSERT INTO "execution_context" ("code", "value") VALUES ('DEVELOPMENT', 'devl');
INSERT INTO "execution_context" ("code", "value") VALUES ('SANDBOX', 'sandbox');
INSERT INTO "execution_context" ("code", "value") VALUES ('EXPERIMENTAL', 'experimental');
INSERT INTO "party_type" ("code", "value") VALUES ('PERSON', 'Person');
INSERT INTO "party_type" ("code", "value") VALUES ('ORGANIZATION', 'Organization');
INSERT INTO "party_role_type" ("code", "value") VALUES ('CUSTOMER', 'Customer');
INSERT INTO "party_role_type" ("code", "value") VALUES ('VENDOR', 'Vendor');
INSERT INTO "contract_status" ("code", "value") VALUES ('ACTIVE', 'Active');
INSERT INTO "contract_status" ("code", "value") VALUES ('AWAITING_APPROVAL', 'Awaiting Approval');
INSERT INTO "contract_status" ("code", "value") VALUES ('AWAITING_APPROVAL_FOR_RENEWAL', 'Awaiting Approval For Renewal');
INSERT INTO "contract_status" ("code", "value") VALUES ('CANCELED', 'Canceled');
INSERT INTO "contract_status" ("code", "value") VALUES ('DENIED', 'Denied');
INSERT INTO "contract_status" ("code", "value") VALUES ('FINISHED', 'Finished');
INSERT INTO "contract_status" ("code", "value") VALUES ('IN_PREPARATION', 'In Preparation');
INSERT INTO "contract_status" ("code", "value") VALUES ('QUOTE_REQUESTED', 'Quote Requested');
INSERT INTO "contract_status" ("code", "value") VALUES ('QUOTED', 'Quoted');
INSERT INTO "contract_status" ("code", "value") VALUES ('STANDARD_CONTRACT', 'Standard Contract');
INSERT INTO "contract_status" ("code", "value") VALUES ('SUSPENDED', 'Suspended');
INSERT INTO "contract_status" ("code", "value") VALUES ('VALIDATED', 'Validated');
INSERT INTO "payment_type" ("code", "value") VALUES ('BOTH', 'Both');
INSERT INTO "payment_type" ("code", "value") VALUES ('LOANS', 'Loans');
INSERT INTO "payment_type" ("code", "value") VALUES ('NONE', 'None');
INSERT INTO "payment_type" ("code", "value") VALUES ('RENTS', 'Rents');
INSERT INTO "periodicity" ("code", "value") VALUES ('ANNUAL', 'Annual');
INSERT INTO "periodicity" ("code", "value") VALUES ('BI_MONTHLY', 'Bi Monthly');
INSERT INTO "periodicity" ("code", "value") VALUES ('BI_WEEKLY', 'Bi Weekly');
INSERT INTO "periodicity" ("code", "value") VALUES ('DAILY', 'Daily');
INSERT INTO "periodicity" ("code", "value") VALUES ('MONTHLY', 'Monthly');
INSERT INTO "periodicity" ("code", "value") VALUES ('OTHER', 'Other');
INSERT INTO "periodicity" ("code", "value") VALUES ('QUARTERLY', 'Quarterly');
INSERT INTO "periodicity" ("code", "value") VALUES ('SEMI_ANNUAL', 'Semi Annual');
INSERT INTO "periodicity" ("code", "value") VALUES ('SEMI_MONTHLY', 'Semi Monthly');
INSERT INTO "periodicity" ("code", "value") VALUES ('WEEKLY', 'Weekly');
INSERT INTO "boundary_nature" ("code", "value") VALUES ('REGULATORY_TAX_ID', 'Regulatory Tax ID');
INSERT INTO "time_entry_category" ("code", "value") VALUES ('MISC_MEETINGS', 'Misc Meetings');
INSERT INTO "time_entry_category" ("code", "value") VALUES ('MISC_OTHER', 'Misc Other');
INSERT INTO "time_entry_category" ("code", "value") VALUES ('MISC_VACATION', 'Misc Vacation');
INSERT INTO "time_entry_category" ("code", "value") VALUES ('MISC_WORK_ITEM', 'Misc Work Item');
INSERT INTO "time_entry_category" ("code", "value") VALUES ('PACKAGE', 'Package');
INSERT INTO "time_entry_category" ("code", "value") VALUES ('PROJECT', 'Project');
INSERT INTO "time_entry_category" ("code", "value") VALUES ('REQUEST', 'Request');
INSERT INTO "time_entry_category" ("code", "value") VALUES ('TASK', 'Task');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('PROJECT_LEADERSHIP', 'Project Leadership');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('PROJECT_MANAGEMENT', 'Project Management');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('APPLICATION_DEVELOPMENT', 'Application Development');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('DEV_OPERATIONS', 'Dev Operations');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('QUALITY_ASSURANCE', 'Quality Assurance');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('SEARCH_ENGINE_OPTIMIZATION', 'Search Engine Optimization');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('USER_INTERFASE_USABILITY', 'User Interfase And Usability');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('BUSINESS_ANALYST', 'Business Analyst (Abm)');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('CURATION_COORDINATION', 'Curation Coordination');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('KNOWLEDGE_REPRESENTATION', 'Knowledge Representation');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('MARKETING_OUTREACH', 'Marketing Outreach');
INSERT INTO "raci_matrix_subject" ("code", "value") VALUES ('CURATION_WORKS', 'Curation Works');
INSERT INTO "raci_matrix_assignment_nature" ("code", "value") VALUES ('RESPONSIBLE', 'Responsible');
INSERT INTO "raci_matrix_assignment_nature" ("code", "value") VALUES ('ACCOUNTABLE', 'Accountable');
INSERT INTO "raci_matrix_assignment_nature" ("code", "value") VALUES ('CONSULTED', 'Consulted');
INSERT INTO "raci_matrix_assignment_nature" ("code", "value") VALUES ('INFORMED', 'Informed');
INSERT INTO "skill_nature" ("code", "value") VALUES ('SOFTWARE', 'Software');
INSERT INTO "skill_nature" ("code", "value") VALUES ('HARDWARE', 'Hardware');
INSERT INTO "skill" ("code", "value") VALUES ('ANGULAR', 'Angular');
INSERT INTO "skill" ("code", "value") VALUES ('DENO', 'Deno');
INSERT INTO "skill" ("code", "value") VALUES ('TYPESCRIPT', 'Typescript');
INSERT INTO "skill" ("code", "value") VALUES ('POSTGRESQL', 'Postgresql');
INSERT INTO "skill" ("code", "value") VALUES ('MYSQL', 'Mysql');
INSERT INTO "skill" ("code", "value") VALUES ('HUGO', 'Hugo');
INSERT INTO "skill" ("code", "value") VALUES ('PHP', 'Php');
INSERT INTO "skill" ("code", "value") VALUES ('JAVASCRIPT', 'JavaScript');
INSERT INTO "skill" ("code", "value") VALUES ('PYTHON', 'Python');
INSERT INTO "skill" ("code", "value") VALUES ('DOT_NET', '.Net');
INSERT INTO "skill" ("code", "value") VALUES ('ORACLE', 'Oracle');
INSERT INTO "skill" ("code", "value") VALUES ('JAVA', 'Java');
INSERT INTO "skill" ("code", "value") VALUES ('JQUERY', 'JQuery');
INSERT INTO "skill" ("code", "value") VALUES ('OSQUERY', 'Osquery');
INSERT INTO "skill" ("code", "value") VALUES ('REACTJS', 'ReactJs');
INSERT INTO "proficiency_scale" ("code", "value") VALUES ('NA', 'Not Applicable');
INSERT INTO "proficiency_scale" ("code", "value") VALUES ('FUNDAMENTAL_AWARENESS', 'Fundamental Awareness (basic knowledge)');
INSERT INTO "proficiency_scale" ("code", "value") VALUES ('NOVICE', 'Novice (limited experience)');
INSERT INTO "proficiency_scale" ("code", "value") VALUES ('INTERMEDIATE', 'Intermediate (practical application)');
INSERT INTO "proficiency_scale" ("code", "value") VALUES ('ADVANCED', 'Advanced (applied theory)');
INSERT INTO "proficiency_scale" ("code", "value") VALUES ('EXPERT', 'Expert (recognized authority)');
INSERT INTO "vulnerability_status" ("code", "value") VALUES ('OPEN', 'Open');
INSERT INTO "vulnerability_status" ("code", "value") VALUES ('CLOSED', 'Closed');
INSERT INTO "vulnerability_status" ("code", "value") VALUES ('ACCEPTED', 'Accepted');
INSERT INTO "vulnerability_status" ("code", "value") VALUES ('OUT_OF_SCOPE', 'Out of Scope');
INSERT INTO "vulnerability_status" ("code", "value") VALUES ('MITIGATED', 'Mitigated');
INSERT INTO "vulnerability_status" ("code", "value") VALUES ('INVALID', 'Invalid');
INSERT INTO "asset_status" ("code", "value") VALUES ('AWAITING_RECEIPT', 'Awaiting Receipt');
INSERT INTO "asset_status" ("code", "value") VALUES ('IN_STOCK', 'In Stock');
INSERT INTO "asset_status" ("code", "value") VALUES ('IN_USE', 'In Use');
INSERT INTO "asset_status" ("code", "value") VALUES ('MISSING', 'Missing');
INSERT INTO "asset_status" ("code", "value") VALUES ('RETIRED', 'Retired');
INSERT INTO "asset_status" ("code", "value") VALUES ('RETURNED_FOR_MAINTENANCE', 'Returned For Maintenance');
INSERT INTO "asset_status" ("code", "value") VALUES ('RETURNED_TO_SUPPLIER', 'Returned To Supplier	');
INSERT INTO "asset_status" ("code", "value") VALUES ('UNDEFINED', 'Undefined');
INSERT INTO "asset_type" ("code", "value") VALUES ('ACCOUNT', 'Account');
INSERT INTO "asset_type" ("code", "value") VALUES ('BUSINESS_SERVICE', 'Business Service');
INSERT INTO "asset_type" ("code", "value") VALUES ('CABLE', 'Cable');
INSERT INTO "asset_type" ("code", "value") VALUES ('CABLE_DEVICE', 'Cable Device');
INSERT INTO "asset_type" ("code", "value") VALUES ('COLLECTIVE_EQUIPMENT', 'Collective Equipment');
INSERT INTO "asset_type" ("code", "value") VALUES ('COMPUTER', 'Computer');
INSERT INTO "asset_type" ("code", "value") VALUES ('CPU', 'Cpu');
INSERT INTO "asset_type" ("code", "value") VALUES ('DOMAIN', 'Domain');
INSERT INTO "asset_type" ("code", "value") VALUES ('SERVER', 'Server');
INSERT INTO "asset_type" ("code", "value") VALUES ('EXTENSION_CARD', 'Extension Card');
INSERT INTO "asset_type" ("code", "value") VALUES ('GLOBAL_SOFTWARE_LICENSE', 'Global Software License');
INSERT INTO "asset_type" ("code", "value") VALUES ('LAPTOP', 'Laptop');
INSERT INTO "asset_type" ("code", "value") VALUES ('LASER_PRINTER', 'Laser Printer');
INSERT INTO "asset_type" ("code", "value") VALUES ('LICENSE_CONTRACT', 'License Contract');
INSERT INTO "asset_type" ("code", "value") VALUES ('MAINTENANCE_CONTRACT', 'Maintenance Contract');
INSERT INTO "asset_type" ("code", "value") VALUES ('MASS_STORAGE', 'Mass Storage');
INSERT INTO "asset_type" ("code", "value") VALUES ('MOBILE_DEVICE', 'Mobile Device');
INSERT INTO "asset_type" ("code", "value") VALUES ('MONITOR', 'Monitor');
INSERT INTO "asset_type" ("code", "value") VALUES ('NETWORK_HARDWARE', 'Network Hardware');
INSERT INTO "asset_type" ("code", "value") VALUES ('NETWORK_INTERFACE', 'Network Interface');
INSERT INTO "asset_type" ("code", "value") VALUES ('OEM_SOFTWARE_LICENSE', 'Oem Software License');
INSERT INTO "asset_type" ("code", "value") VALUES ('PRINTER', 'Printer');
INSERT INTO "asset_type" ("code", "value") VALUES ('RACKMOUNT_MONITOR', 'Rackmount Monitor');
INSERT INTO "asset_type" ("code", "value") VALUES ('SCANNER', 'Scanner');
INSERT INTO "asset_type" ("code", "value") VALUES ('SOFTWARE_ACCESS_AUTHORIZATION', 'Software Access Authorization');
INSERT INTO "asset_type" ("code", "value") VALUES ('SOFTWARE_ACCESS_REMOVAL', 'Software Access Removal');
INSERT INTO "asset_type" ("code", "value") VALUES ('SOFTWARE_ADD_WORK_ORDER', 'Software Add Work Order');
INSERT INTO "asset_type" ("code", "value") VALUES ('SOFTWARE_INSTALLATION', 'Software Installation');
INSERT INTO "asset_type" ("code", "value") VALUES ('SOFTWARE_LICENSE', 'Software License');
INSERT INTO "asset_type" ("code", "value") VALUES ('SOFTWARE_REMOVAL_WORK_ORDER', 'Software Removal Work Order');
INSERT INTO "asset_type" ("code", "value") VALUES ('STANDARD_ASSET', 'Standard Asset');
INSERT INTO "asset_type" ("code", "value") VALUES ('TELECOMMUNICATION_EQUIPMENT', 'Telecommunication Equipment');
INSERT INTO "asset_type" ("code", "value") VALUES ('TELEPHONE', 'Telephone');
INSERT INTO "asset_type" ("code", "value") VALUES ('VIRTUAL_MACHINE', 'Virtual Machine');
INSERT INTO "asset_type" ("code", "value") VALUES ('SECURITY_POLICY', 'Security Policy');
INSERT INTO "asset_type" ("code", "value") VALUES ('EMPLOYEE_DATA', 'Employee Data');
INSERT INTO "asset_type" ("code", "value") VALUES ('API', 'Api');
INSERT INTO "asset_type" ("code", "value") VALUES ('FIREWALL', 'Firewall');
INSERT INTO "assignment" ("code", "value") VALUES ('AWAITING_RECEIPT', 'Awaiting receipt');
INSERT INTO "assignment" ("code", "value") VALUES ('IN_STOCK', 'In Stock');
INSERT INTO "assignment" ("code", "value") VALUES ('IN_USE', 'In Use');
INSERT INTO "assignment" ("code", "value") VALUES ('MISSING', 'Missing');
INSERT INTO "assignment" ("code", "value") VALUES ('RETURNED_FOR_MAINTENANCE', 'Returned For Maintenance');
INSERT INTO "assignment" ("code", "value") VALUES ('RETURNED_TO_SUPPLIER', 'Returned To Supplier');
INSERT INTO "probability" ("code", "value") VALUES ('HIGH', 'High');
INSERT INTO "probability" ("code", "value") VALUES ('MEDIUM', 'Medium');
INSERT INTO "probability" ("code", "value") VALUES ('LOW', 'Low');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('PHISHING', 'Phishing');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('SPAM', 'Spam');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('SPYWARE_AND_MALWARE_FOR_EXTORTION', 'Spyware and malware for extortion');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('THEFT_OF_PRIVATE_INFORMATION', 'Theft of private information');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('ONLINE_SCAMS', 'Online scams');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('DESTROY_OR_ABUSE_CRITICAL_INFRASTRUCTURE', 'Destroy or abuse critical infrastructure');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('THREATEN_NATIONAL_SECURITY', 'Threaten national security');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('DISRUPT_ECONOMIES', 'Disrupt economies');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('CAUSE_BODILY_HARM_TO_CITIZENS', 'Cause bodily harm to citizens');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('DENIAL_OF_SERVICE_ATTACKS', 'Denial-of-Service Attacks');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('DOXING', 'Doxing');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('LEAKING_INFORMATION', 'Leaking Information');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('THE_USE_OF_THE_SOFTWARE_RECAP', 'The Use of the Software RECAP');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('BLOGGING_ANONYMOUSLY', 'Blogging Anonymously');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('GEO_BOMBING', 'Geo-bombing');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('WEBSITE_MIRRORING', 'Website Mirroring');
INSERT INTO "threat_source_type" ("code", "value") VALUES ('CHANGING_THE_CODE_FOR_WEBSITES_OR_WEBSITE_DEFACEMENTS', 'Changing the Code for Websites or website defacements');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('VIRUSES', 'Viruses');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('WORMS', 'Worms');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('TROJANS', 'Trojans');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('RANSOMWARE', 'Ransomware');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('CRYPTOJACKING', 'Cryptojacking');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('SPYWARE', 'Spyware');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('ADWARE', 'Adware');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('FILELESS_MALWARE', 'Fileless malware');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('ROOTKITS', 'Rootkits');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('BAITING', 'Baiting');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('PRETEXTING', 'Pretexting');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('PHISHING', 'Phishing');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('VISHING', 'Vishing');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('SMISHING', 'Smishing');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('PIGGYBACKING', 'Piggybacking');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('TAILGATING', 'Tailgating');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('EMAIL_HIJACKING', 'Email Hijacking');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('DNS_SPOOFING', 'DNS spoofing');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('IP_SPOOFING', 'IP spoofing');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('HTTPS_SPOOFING', 'HTTPS spoofing');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('HTTP_FLOOD_DDOS', 'HTTP flood DDoS');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('SYN_FLOOD_DDOS', 'SYN flood DDoS');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('UDP_FLOOD_DDOS', 'UDP flood DDoS');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('ICMP_FLOOD', 'ICMP flood');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('NTP_AMPLIFICATION', 'NTP amplification');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('SQL_INJECTION', 'SQL injection');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('CODE_INJECTION', 'Code injection');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('OS_COMMAND_INJECTION', 'OS Command Injection');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('LDAP_INJECTION', 'LDAP injection');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('XML_EXTERNAL_ENTITIES_INJECTION', 'XML eXternal Entities (XXE) Injection');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('CROSS_SITE_SCRIPTING', 'Cross Site Scripting (XSS)');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('BROKEN_ACCESS_CONTROL', 'Broken Access Control');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('CRYPTOGRAPHIC_FAILURES', 'Cryptographic Failures');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('INSECURE_DESIGN', 'Insecure Design');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('SECURITY_MISCONFIGURATION', 'Security Misconfiguration');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('VULNERABLE_AND_OUTDATED_COMPONENTS', 'Vulnerable and Outdated Components');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('IDENTIFICATION_AND_AUTHENTICATION_FAILURES', 'Identification and Authentication Failures');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('SOFTWARE_AND_DATA_INTEGRITY_FAILURES', 'Software and Data Integrity Failures');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('SECURITY_LOGGING_AND_MONITORING_FAILURES', 'Security Logging and Monitoring Failures');
INSERT INTO "threat_event_type" ("code", "value") VALUES ('SERVER_SIDE_REQUEST_FORGERY', 'Server Side Request Forgery');
INSERT INTO "calendar_period" ("code", "value") VALUES ('TWENTY_FOUR_HOURS_SEVEN_DAYS', '24x7');
INSERT INTO "calendar_period" ("code", "value") VALUES ('BUSINESS_HOURS', 'Business hours');
INSERT INTO "calendar_period" ("code", "value") VALUES ('NON_BUSINESS_HOURS', 'Non-business hours');
INSERT INTO "comparison_operator" ("code", "value") VALUES ('GREATER_THAN', '<');
INSERT INTO "comparison_operator" ("code", "value") VALUES ('GREATER_THAN_EQUAL_TO', '<=');
INSERT INTO "comparison_operator" ("code", "value") VALUES ('EQUAL_TO', '=');
INSERT INTO "comparison_operator" ("code", "value") VALUES ('LESS_THAN', '>');
INSERT INTO "comparison_operator" ("code", "value") VALUES ('LESS_THAN_EQUAL_TO', '>=');
INSERT INTO "comparison_operator" ("code", "value") VALUES ('NA', 'na');
INSERT INTO "kpi_measurement_type" ("code", "value") VALUES ('BANDWIDTH', 'Bandwidth');
INSERT INTO "kpi_measurement_type" ("code", "value") VALUES ('CAPACITY', 'Capacity');
INSERT INTO "kpi_measurement_type" ("code", "value") VALUES ('CURRENCY', 'Currency');
INSERT INTO "kpi_measurement_type" ("code", "value") VALUES ('PERCENTAGE', 'Percentage');
INSERT INTO "kpi_measurement_type" ("code", "value") VALUES ('TIME', 'Time');
INSERT INTO "kpi_measurement_type" ("code", "value") VALUES ('UNITLESS', 'Unitless');
INSERT INTO "kpi_status" ("code", "value") VALUES ('CRITICAL', 'Critical');
INSERT INTO "kpi_status" ("code", "value") VALUES ('MAJOR', 'Major');
INSERT INTO "kpi_status" ("code", "value") VALUES ('MINOR', 'Minor');
INSERT INTO "kpi_status" ("code", "value") VALUES ('OK', 'Ok');
INSERT INTO "kpi_status" ("code", "value") VALUES ('WARNING', 'Warning');
INSERT INTO "tracking_period" ("code", "value") VALUES ('DAY', 'Day');
INSERT INTO "tracking_period" ("code", "value") VALUES ('HOUR', 'Hour');
INSERT INTO "tracking_period" ("code", "value") VALUES ('MONTH', 'Month');
INSERT INTO "tracking_period" ("code", "value") VALUES ('OTHER', 'Other');
INSERT INTO "tracking_period" ("code", "value") VALUES ('QUARTER', 'Quarter');
INSERT INTO "tracking_period" ("code", "value") VALUES ('WEEK', 'Week');
INSERT INTO "tracking_period" ("code", "value") VALUES ('YEAR', 'Year');
INSERT INTO "trend" ("code", "value") VALUES ('DOWN', 'Down');
INSERT INTO "trend" ("code", "value") VALUES ('NO_CHANGE', 'No Change	');
INSERT INTO "trend" ("code", "value") VALUES ('UP', 'Up');
INSERT INTO "auditor_type" ("code", "value") VALUES ('EXTERNAL', 'external');
INSERT INTO "auditor_type" ("code", "value") VALUES ('INTERNAL', 'internal');
INSERT INTO "audit_purpose" ("code", "value") VALUES ('MEANING_DRY_RUN', 'exmeaning dry runternal');
INSERT INTO "audit_purpose" ("code", "value") VALUES ('OFFICIAL', 'official');
INSERT INTO "audit_status" ("code", "value") VALUES ('OUTSTANDING', 'Outstanding');
INSERT INTO "audit_status" ("code", "value") VALUES ('FULFILLED', 'Fulfilled');
INSERT INTO "audit_status" ("code", "value") VALUES ('REJECTED', 'Rejected');
INSERT INTO "audit_status" ("code", "value") VALUES ('ACCEPTED', 'Accepted');
INSERT INTO "party_relation_type" ("code", "value") VALUES ('PERSON_TO_PERSON', 'Person To Person');
INSERT INTO "party_relation_type" ("code", "value") VALUES ('ORGANIZATION_TO_PERSON', 'Organization To Person');
INSERT INTO "party_relation_type" ("code", "value") VALUES ('ORGANIZATION_TO_ORGANIZATION', 'Organization To Organization');
INSERT INTO "party_identifier_type" ("code", "value") VALUES ('UUID', 'UUID');
INSERT INTO "party_identifier_type" ("code", "value") VALUES ('DRIVING_LICENSE', 'Driving License');
INSERT INTO "party_identifier_type" ("code", "value") VALUES ('PASSPORT', 'Passport');
INSERT INTO "person_type" ("code", "value") VALUES ('INDIVIDUAL', 'Individual');
INSERT INTO "person_type" ("code", "value") VALUES ('PROFESSIONAL', 'Professional');
INSERT INTO "contact_type" ("code", "value") VALUES ('HOME_ADDRESS', 'Home Address');
INSERT INTO "contact_type" ("code", "value") VALUES ('OFFICIAL_ADDRESS', 'Official Address');
INSERT INTO "contact_type" ("code", "value") VALUES ('MOBILE_PHONE_NUMBER', 'Mobile Phone Number');
INSERT INTO "contact_type" ("code", "value") VALUES ('LAND_PHONE_NUMBER', 'Land Phone Number');
INSERT INTO "contact_type" ("code", "value") VALUES ('OFFICIAL_EMAIL', 'Official Email');
INSERT INTO "contact_type" ("code", "value") VALUES ('PERSONAL_EMAIL', 'Personal Email');
INSERT INTO "training_subject" ("code", "value") VALUES ('HIPAA', 'HIPAA');
INSERT INTO "training_subject" ("code", "value") VALUES ('CYBER_SECURITY', 'Cyber Security');
INSERT INTO "training_subject" ("code", "value") VALUES ('OBSERVABILITY_OPEN_TELEMETRY', 'Observability Open Telemetry');
INSERT INTO "training_subject" ("code", "value") VALUES ('BEST_PRACTICES_OF_AGILE', 'Practices of Agile Workflow');
INSERT INTO "status_value" ("code", "value") VALUES ('YES', 'Yes');
INSERT INTO "status_value" ("code", "value") VALUES ('NO', 'No');
INSERT INTO "rating_value" ("code", "value") VALUES ('ONE', '1');
INSERT INTO "rating_value" ("code", "value") VALUES ('TWO', '2');
INSERT INTO "rating_value" ("code", "value") VALUES ('THREE', '3');
INSERT INTO "rating_value" ("code", "value") VALUES ('FOUR', '4');
INSERT INTO "rating_value" ("code", "value") VALUES ('FIVE', '5');
INSERT INTO "contract_type" ("code", "value") VALUES ('GENERAL_CONTRACT_FOR_SERVICES', 'General Contract for Services');
INSERT INTO "contract_type" ("code", "value") VALUES ('EMPLOYMENT_AGREEMENT', 'Employment Agreement');
INSERT INTO "contract_type" ("code", "value") VALUES ('NONCOMPETE_AGREEMENT', 'Noncompete Agreement');
INSERT INTO "contract_type" ("code", "value") VALUES ('VENDOR_SLA', 'Vendor SLA');
INSERT INTO "contract_type" ("code", "value") VALUES ('VENDOR_NDA', 'Vendor NDA');
INSERT INTO "graph_nature" ("code", "value") VALUES ('SERVICE', 'Service');
INSERT INTO "graph_nature" ("code", "value") VALUES ('APP', 'Application');
INSERT INTO "risk_subject" ("code", "value") VALUES ('TECHNICAL_RISK', 'Technical Risk');
INSERT INTO "risk_type" ("code", "value") VALUES ('BUDGET', 'Budget');
INSERT INTO "risk_type" ("code", "value") VALUES ('QUALITY', 'Quality');
INSERT INTO "risk_type" ("code", "value") VALUES ('SCHEDULE', 'Schedule');
INSERT INTO "risk_type" ("code", "value") VALUES ('SCHEDULE_AND_BUDGET', 'Schedule And Budget');
INSERT INTO "incident_category" ("code", "value") VALUES ('ACCESS', 'Access');
INSERT INTO "incident_category" ("code", "value") VALUES ('DATA', 'Data');
INSERT INTO "incident_category" ("code", "value") VALUES ('FACILITIES', 'Facilities');
INSERT INTO "incident_category" ("code", "value") VALUES ('FAILURE', 'Failure');
INSERT INTO "incident_category" ("code", "value") VALUES ('GENERAL_INFORMATION', 'General Information');
INSERT INTO "incident_category" ("code", "value") VALUES ('HARDWARE', 'Hardware');
INSERT INTO "incident_category" ("code", "value") VALUES ('HOW_TO', 'How To');
INSERT INTO "incident_category" ("code", "value") VALUES ('OTHER', 'Other');
INSERT INTO "incident_category" ("code", "value") VALUES ('PERFORMANCE', 'Performance');
INSERT INTO "incident_category" ("code", "value") VALUES ('SECURITY', 'Security');
INSERT INTO "incident_category" ("code", "value") VALUES ('SERVICE_DELIVERY', 'Service Delivery');
INSERT INTO "incident_category" ("code", "value") VALUES ('SERVICE_PORTFOLIO', 'Service Portfolio');
INSERT INTO "incident_category" ("code", "value") VALUES ('STATUS', 'Status');
INSERT INTO "incident_category" ("code", "value") VALUES ('SUPPORT', 'Support');
INSERT INTO "incident_category" ("code", "value") VALUES ('THRIFTY', 'Thrifty');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('AUTHORIZATION_ERROR', 'Authorization Error');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('AVAILABILITY', 'Availability');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('DATA_OR_FILE_CORRUPTED', 'Data Or File Corrupted');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('DATA_OR_FILE_INCORRECT', 'Data Or File Incorrect');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('DATA_OR_FILE_MISSING', 'Data Or File Missing');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('ERROR_MESSAGE', 'Error Message');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('FUNCTION_OR_FEATURE_NOT_WORKING', 'Function Or Feature Not Working');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('FUNCTIONALITY', 'Functionality');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('GENERAL_INFORMATION', 'General Information');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('HARDWARE_FAILURE', 'Hardware Failure');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('HOW_TO', 'How To');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('INCIDENT_RESOLUTION_QUALITY', 'Incident Resolution Quality');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('INCIDENT_RESOLUTION_TIME', 'Incident Resolution Time');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('JOB_FAILED', 'Job Failed');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('LOGIN_FAILURE', 'Login Failure');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('MISSING_OR_STOLEN', 'Missing Or Stolen');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('NEW_SERVICE', 'New Service');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('PERFORMANCE', 'Performance');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('PERFORMANCE_DEGRADATION', 'Performance Degradation');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('PERSON', 'Person');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('SECURITY_BREACH', 'Security Breach');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('SECURITY_EVENT', 'Security Event/Message');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('STATUS', 'Status');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('STORAGE_LIMIT_EXCEEDED', 'Storage Limit Exceeded');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('SYSTEM_DOWN', 'System Down');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('SYSTEM_OR_APPLICATION_HANGS', 'System Or Application Hangs');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('UPGRADE_NEW_RELEASE', 'Upgrade/New Release');
INSERT INTO "incident_sub_category" ("code", "value") VALUES ('VIRUS_ALERT', 'Virus Alert');
INSERT INTO "severity" ("code", "value") VALUES ('CRITICAL', 'Critical');
INSERT INTO "severity" ("code", "value") VALUES ('MAJOR', 'Major');
INSERT INTO "severity" ("code", "value") VALUES ('MINOR', 'Minor');
INSERT INTO "severity" ("code", "value") VALUES ('LOW', 'Low');
INSERT INTO "priority" ("code", "value") VALUES ('HIGH', 'High');
INSERT INTO "priority" ("code", "value") VALUES ('MEDIUM', 'Medium');
INSERT INTO "priority" ("code", "value") VALUES ('LOW', 'Low');
INSERT INTO "incident_type" ("code", "value") VALUES ('COMPLAINT', 'Complaint');
INSERT INTO "incident_type" ("code", "value") VALUES ('INCIDENT', 'Incident');
INSERT INTO "incident_type" ("code", "value") VALUES ('REQUEST_FOR_INFORMATION', 'Request For Information');
INSERT INTO "incident_status" ("code", "value") VALUES ('ACCEPTED', 'Accepted');
INSERT INTO "incident_status" ("code", "value") VALUES ('ASSIGNED', 'Assigned');
INSERT INTO "incident_status" ("code", "value") VALUES ('CANCELLED', 'Cancelled');
INSERT INTO "incident_status" ("code", "value") VALUES ('CATEGORIZE', 'Categorize');
INSERT INTO "incident_status" ("code", "value") VALUES ('CLOSED', 'Closed');
INSERT INTO "incident_status" ("code", "value") VALUES ('OPEN', 'Open');
INSERT INTO "incident_status" ("code", "value") VALUES ('PENDING_CHANGE', 'Pending Change');
INSERT INTO "incident_status" ("code", "value") VALUES ('PENDING_CUSTOMER', 'Pending Customer');
INSERT INTO "incident_status" ("code", "value") VALUES ('PENDING_EVIDENCE', 'Pending Evidence');
INSERT INTO "incident_status" ("code", "value") VALUES ('PENDING_OTHER', 'Pending Other');
INSERT INTO "incident_status" ("code", "value") VALUES ('PENDING_VENDOR', 'Pending Vendor');
INSERT INTO "incident_status" ("code", "value") VALUES ('REFERRED', 'Referred');
INSERT INTO "incident_status" ("code", "value") VALUES ('REJECTED', 'Rejected');
INSERT INTO "incident_status" ("code", "value") VALUES ('REOPENED', 'Reopened');
INSERT INTO "incident_status" ("code", "value") VALUES ('REPLACED_PROBLEM', 'Replaced Problem');
INSERT INTO "incident_status" ("code", "value") VALUES ('RESOLVED', 'Resolved');
INSERT INTO "incident_status" ("code", "value") VALUES ('SUSPENDED', 'Suspended');
INSERT INTO "incident_status" ("code", "value") VALUES ('WORK_IN_PROGRESS', 'Work In Progress');
INSERT INTO "asset_risk_type" ("code", "value") VALUES ('SECURITY', 'Security');

INSERT INTO "organization_role_type" ("code", "value", "created_by") VALUES ('PROJECT_MANAGER_TECHNOLOGY', 'Project Manager Technology', NULL);

INSERT INTO "organization_role_type" ("code", "value", "created_by") VALUES ('PROJECT_MANAGER_QUALITY', 'Project Manager Quality', NULL);
;
INSERT INTO "party" ("party_type_id", "party_name", "created_by") VALUES ('ORGANIZATION', 'Orgnization Name', NULL);
INSERT INTO "organization" ("party_id", "name", "license", "registration_date", "created_by") VALUES ((SELECT "party_id" FROM "party" WHERE "party_type_id" = 'ORGANIZATION' AND "party_name" = 'Orgnization Name'), 'Orgnization Name', 'XXXX-XXXXX-XXXX', '2010-01-15', NULL);
INSERT INTO "contact_electronic" ("contact_type_id", "party_id", "electronics_details", "created_by") VALUES ('OFFICIAL_EMAIL', (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'ORGANIZATION' AND "party_name" = 'Orgnization Name'), 'orgnization@email.com', NULL);
INSERT INTO "contact_electronic" ("contact_type_id", "party_id", "electronics_details", "created_by") VALUES ('LAND_PHONE_NUMBER', (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'ORGANIZATION' AND "party_name" = 'Orgnization Name'), '0523 852 9945', NULL);
;
INSERT INTO "contact_land" ("contact_type_id", "party_id", "address_line1", "address_line2", "address_zip", "address_city", "address_state", "address_country", "created_by") VALUES ('OFFICIAL_ADDRESS', (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'ORGANIZATION' AND "party_name" = 'Orgnization Name'), 'Address line 1', 'Address line 2', '', 'City', 'State', 'Country', NULL);
INSERT INTO "party" ("party_type_id", "party_name", "created_by") VALUES ('PERSON', 'First Name Last Name', NULL);
INSERT INTO "person" ("party_id", "person_type_id", "person_first_name", "person_last_name", "created_by") VALUES ((SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name'), 'INDIVIDUAL', 'First Name', 'Last Name', NULL);
INSERT INTO "contact_electronic" ("contact_type_id", "party_id", "electronics_details", "created_by") VALUES ('OFFICIAL_EMAIL', (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name'), 'person@org.com', NULL);
INSERT INTO "contact_electronic" ("contact_type_id", "party_id", "electronics_details", "created_by") VALUES ('MOBILE_PHONE_NUMBER', (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name'), '+911234567890', NULL);
;
INSERT INTO "contact_land" ("contact_type_id", "party_id", "address_line1", "address_line2", "address_zip", "address_city", "address_state", "address_country", "created_by") VALUES ('OFFICIAL_ADDRESS', (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name'), 'Address line 1', 'Address line 2', '', 'City', 'State', 'Country', NULL);
;
INSERT INTO "party_relation" ("party_id", "related_party_id", "relation_type_id", "party_role_id", "created_by") VALUES ((SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name'), (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'ORGANIZATION' AND "party_name" = 'Orgnization Name'), 'ORGANIZATION_TO_PERSON', 'VENDOR', NULL);
INSERT INTO "organization_role" ("person_id", "organization_id", "organization_role_type_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), (SELECT "organization_id" FROM "organization" WHERE "name" = 'Orgnization Name' AND "license" = 'XXXX-XXXXX-XXXX'), 'LEAD_SOFTWARE_ENGINEER', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'REACTJS', 'INTERMEDIATE', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'JAVASCRIPT', 'ADVANCED', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'HUGO', 'FUNDAMENTAL_AWARENESS', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'DENO', 'INTERMEDIATE', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'ANGULAR', 'INTERMEDIATE', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'TYPESCRIPT', 'INTERMEDIATE', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'POSTGRESQL', 'INTERMEDIATE', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'MYSQL', 'INTERMEDIATE', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'PHP', 'INTERMEDIATE', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'PYTHON', 'FUNDAMENTAL_AWARENESS', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'DOT_NET', 'NA', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'ORACLE', 'NA', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'JAVA', 'FUNDAMENTAL_AWARENESS', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'JQUERY', 'ADVANCED', NULL);
INSERT INTO "person_skill" ("person_id", "skill_nature_id", "skill_id", "proficiency_scale_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'SOFTWARE', 'OSQUERY', 'FUNDAMENTAL_AWARENESS', NULL);
INSERT INTO "awareness_training" ("training_subject_id", "person_id", "organization_id", "training_status_id", "attended_date", "created_by") VALUES ('HIPAA', (SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), (SELECT "organization_id" FROM "organization" WHERE "name" = 'Orgnization Name' AND "license" = 'XXXX-XXXXX-XXXX'), 'YES', '2022-02-21', NULL);
INSERT INTO "security_incident_response_team" ("training_subject_id", "person_id", "organization_id", "training_status_id", "attended_date", "created_by") VALUES (NULL, (SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), (SELECT "organization_id" FROM "organization" WHERE "name" = 'Orgnization Name' AND "license" = 'XXXX-XXXXX-XXXX'), NULL, NULL, NULL);
INSERT INTO "rating" ("author_id", "rating_given_to_id", "rating_value_id", "best_rating_id", "rating_explanation", "review_aspect", "worst_rating_id", "created_by") VALUES ((SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), (SELECT "organization_id" FROM "organization" WHERE "name" = 'Orgnization Name' AND "license" = 'XXXX-XXXXX-XXXX'), 'FOUR', 'FIVE', 'Good Service', 'Satisfied', 'THREE', NULL);
INSERT INTO "contract" ("contract_from_id", "contract_to_id", "contract_status_id", "document_reference", "payment_type_id", "periodicity_id", "start_date", "end_date", "contract_type_id", "date_of_last_review", "date_of_next_review", "date_of_contract_review", "date_of_contract_approval", "created_by") VALUES ((SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name'), (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'ORGANIZATION' AND "party_name" = 'Orgnization Name'), 'FINISHED', 'google.com', 'RENTS', 'WEEKLY', '2021-04-20T00:00:00.000Z', '2021-04-20T00:00:00.000Z', 'GENERAL_CONTRACT_FOR_SERVICES', '2021-04-20T00:00:00.000Z', '2021-04-20T00:00:00.000Z', '2021-04-20T00:00:00.000Z', '2021-04-20T00:00:00.000Z', NULL);
INSERT INTO "risk_register" ("description", "risk_subject_id", "risk_type_id", "impact_to_the_organization", "rating_likelihood_id", "rating_impact_id", "rating_overall_risk_id", "controls_in_place", "control_effectivenes", "over_all_residual_risk_rating_id", "mitigation_further_actions", "control_monitor_mitigation_actions_tracking_strategy", "control_monitor_action_due_date", "control_monitor_risk_owner_id", "created_by") VALUES ('Risk description', 'TECHNICAL_RISK', 'QUALITY', 'Impact to the organization', 'THREE', 'THREE', 'THREE', 'Try forgot password', 1, NULL, 'Mitigation further actions', 'Control monitor mitigation actions tracking strategy', '2022-06-13', (SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), NULL);
INSERT INTO "asset" ("organization_id", "asset_retired_date", "asset_status_id", "asset_tag", "name", "description", "asset_type_id", "asset_workload_category", "assignment_id", "barcode_or_rfid_tag", "installed_date", "planned_retirement_date", "purchase_delivery_date", "purchase_order_date", "purchase_request_date", "serial_number", "tco_amount", "tco_currency", "created_by") VALUES ((SELECT "organization_id" FROM "organization" WHERE "name" = 'Orgnization Name' AND "license" = 'XXXX-XXXXX-XXXX'), NULL, 'IN_USE', '', 'Asset Name', 'Service used for asset etc', 'VIRTUAL_MACHINE', '', 'IN_USE', '', '2021-04-20', NULL, '2021-04-20', '2021-04-20', '2021-04-20', '', '100', 'dollar', NULL);
INSERT INTO "incident" ("title", "incident_date", "time_and_time_zone", "asset_id", "category_id", "sub_category_id", "severity_id", "priority_id", "internal_or_external_id", "location", "it_service_impacted", "impacted_modules", "impacted_dept", "reported_by_id", "reported_to_id", "brief_description", "detailed_description", "assigned_to_id", "assigned_date", "investigation_details", "containment_details", "eradication_details", "business_impact", "lessons_learned", "status_id", "closed_date", "reopened_time", "feedback_from_business", "reported_to_regulatory", "report_date", "report_time", "created_by") VALUES ('Server Down - Due to CPU utilization reached 100%', '2021-04-20', '2021-04-20T00:00:00.000Z', (SELECT "asset_id" FROM "asset" WHERE "name" = 'Asset Name' AND "description" = 'Service used for asset etc' AND "asset_type_id" = 'VIRTUAL_MACHINE'), 'PERFORMANCE', 'HARDWARE_FAILURE', 'MAJOR', 'HIGH', 'COMPLAINT', 'USA', 'Application down', '', 'All', (SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), (SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), 'Server will down due to CPU utilization', 'We got an alert message of server due to CPU utilization reaching 100% on 02-07-2022 07:30 GTM', (SELECT "person_id" FROM "person" WHERE "party_id" = (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'First Name Last Name') AND "person_type_id" = 'INDIVIDUAL' AND "person_first_name" = 'First Name' AND "person_last_name" = 'Last Name'), '2021-04-20', 'Server was facing issue using due to insufficient harware specfication which cause high CPU utilization, resulting in Crashing of the application', 'Migrated few services to another server in that network range and Restarted server', 'Migrated few services to another server in that network range', 'Application was completely down', 'We need to evlaute the hardware specification and remaining CPU/Memory resources before deploying new applications', 'CLOSED', NULL, NULL, '', '', '2021-04-20', '2021-04-20T00:00:00.000Z', NULL);
INSERT INTO "incident_root_cause" ("incident_id", "source", "description", "probability_id", "testing_analysis", "solution", "likelihood_of_risk_id", "modification_of_the_reported_issue", "testing_for_modified_issue", "test_results", "created_by") VALUES ((SELECT "incident_id" FROM "incident" WHERE "title" = 'Server Down - Due to CPU utilization reached 100%' AND "sub_category_id" = 'HARDWARE_FAILURE' AND "severity_id" = 'MAJOR' AND "priority_id" = 'HIGH' AND "internal_or_external_id" = 'COMPLAINT' AND "location" = 'USA'), 'Server', 'Sample description', 'HIGH', 'Sample testing analysis', 'Server restarted', 'HIGH', 'No modifications', 'Sample test case', 'Sample test result', NULL);
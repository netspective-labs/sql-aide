#!/bin/bash

destroy_first=0
db_file=""

# Parse command-line options
for arg in "$@"
do
    case $arg in
        --destroy-first)
            destroy_first=1
            shift # Remove --destroy-first from processing
            ;;
        *)
            db_file=$1
            shift # Remove database filename from processing
            break # Stop processing after the filename so we can pass the rest into final SQLite DB
            ;;
    esac
done

# Check if the database file parameter is supplied
if [ -z "$db_file" ]
then
    echo "No database file supplied. Usage: ./driver.sh [--destroy-first] <database_file> [<sqlite3 arguments>...]"
    exit 1
fi

# If the destroy_first flag is set, delete the database file
if [ $destroy_first -eq 1 ] && [ -f "$db_file" ]; then
    rm "$db_file"
fi

SQL=$(cat <<-EOF
    PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance

-- reference tables
CREATE TABLE IF NOT EXISTS "execution_context" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "raci_matrix_assignment_nature" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "proficiency_scale" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "vulnerability_status" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "probability" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "comparison_operator" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "kpi_measurement_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "kpi_status" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "trend" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "auditor_type" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "severity" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "priority" (
    "code" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- content tables
CREATE TABLE IF NOT EXISTS "party_type" (
    "party_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "party_relation_type" (
    "party_relation_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "sex_type" (
    "sex_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "gender_type" (
    "gender_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "party_role" (
    "party_role_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "party_identifier_type" (
    "party_identifier_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "person_type" (
    "person_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "contact_type" (
    "contact_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "organization_role_type" (
    "organization_role_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "party" (
    "party_id" TEXT PRIMARY KEY NOT NULL,
    "party_type_id" TEXT NOT NULL,
    "party_name" TEXT NOT NULL,
    "elaboration" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("party_type_id") REFERENCES "party_type"("party_type_id")
);
CREATE TABLE IF NOT EXISTS "party_identifier" (
    "party_identifier_id" TEXT PRIMARY KEY NOT NULL,
    "identifier_name" TEXT NOT NULL,
    "identifier_value" TEXT NOT NULL,
    "party_identifier_type_id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "elaboration" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("party_identifier_type_id") REFERENCES "party_identifier_type"("party_identifier_type_id"),
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "person" (
    "person_id" TEXT PRIMARY KEY NOT NULL,
    "party_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "person_first_name" TEXT NOT NULL,
    "person_middle_name" TEXT,
    "person_last_name" TEXT NOT NULL,
    "previous_name" TEXT,
    "honorific_prefix" TEXT,
    "honorific_suffix" TEXT,
    "gender_id" TEXT NOT NULL,
    "sex_id" TEXT NOT NULL,
    "elaboration" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("party_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("person_type_id") REFERENCES "person_type"("person_type_id"),
    FOREIGN KEY("gender_id") REFERENCES "gender_type"("gender_type_id"),
    FOREIGN KEY("sex_id") REFERENCES "sex_type"("sex_type_id")
);
CREATE TABLE IF NOT EXISTS "party_relation" (
    "party_relation_id" TEXT PRIMARY KEY NOT NULL,
    "party_id" TEXT NOT NULL,
    "related_party_id" TEXT NOT NULL,
    "relation_type_id" TEXT NOT NULL,
    "party_role_id" TEXT,
    "elaboration" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("party_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("related_party_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("relation_type_id") REFERENCES "party_relation_type"("party_relation_type_id"),
    FOREIGN KEY("party_role_id") REFERENCES "party_role"("party_role_id")
);
CREATE TABLE IF NOT EXISTS "organization" (
    "organization_id" TEXT PRIMARY KEY NOT NULL,
    "party_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alias" TEXT,
    "description" TEXT,
    "license" TEXT NOT NULL,
    "federal_tax_id_num" TEXT,
    "registration_date" DATE NOT NULL,
    "elaboration" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "organization_role" (
    "organization_role_id" TEXT PRIMARY KEY NOT NULL,
    "person_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "organization_role_type_id" TEXT NOT NULL,
    "elaboration" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("organization_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("organization_role_type_id") REFERENCES "organization_role_type"("organization_role_type_id")
);
CREATE TABLE IF NOT EXISTS "contact_electronic" (
    "contact_electronic_id" TEXT PRIMARY KEY NOT NULL,
    "contact_type_id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "electronics_details" TEXT NOT NULL,
    "elaboration" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("contact_type_id") REFERENCES "contact_type"("contact_type_id"),
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "contact_land" (
    "contact_land_id" TEXT PRIMARY KEY NOT NULL,
    "contact_type_id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT NOT NULL,
    "address_zip" TEXT NOT NULL,
    "address_city" TEXT NOT NULL,
    "address_state" TEXT NOT NULL,
    "address_territory" TEXT,
    "address_country" TEXT NOT NULL,
    "elaboration" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("contact_type_id") REFERENCES "contact_type"("contact_type_id"),
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "contract_status" (
    "contract_status_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "payment_type" (
    "payment_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "periodicity" (
    "periodicity_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "boundary_nature" (
    "boundary_nature_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "time_entry_category" (
    "time_entry_category_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "raci_matrix_subject" (
    "raci_matrix_subject_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "skill_nature" (
    "skill_nature_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "skill" (
    "skill_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "organization_role_type" (
    "organization_role_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "graph" (
    "graph_id" TEXT PRIMARY KEY NOT NULL,
    "graph_nature_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("graph_nature_id") REFERENCES "graph_nature"("graph_nature_id")
);
CREATE TABLE IF NOT EXISTS "boundary" (
    "boundary_id" TEXT PRIMARY KEY NOT NULL,
    "parent_boundary_id" TEXT,
    "graph_id" TEXT NOT NULL,
    "boundary_nature_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("parent_boundary_id") REFERENCES "boundary"("boundary_id"),
    FOREIGN KEY("graph_id") REFERENCES "graph"("graph_id"),
    FOREIGN KEY("boundary_nature_id") REFERENCES "boundary_nature"("boundary_nature_id")
);
CREATE TABLE IF NOT EXISTS "host" (
    "host_id" TEXT PRIMARY KEY NOT NULL,
    "host_name" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("host_name")
);
CREATE TABLE IF NOT EXISTS "host_boundary" (
    "host_boundary_id" TEXT PRIMARY KEY NOT NULL,
    "host_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("host_id") REFERENCES "host"("host_id")
);
CREATE TABLE IF NOT EXISTS "asset_status" (
    "asset_status_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "asset_service_status" (
    "asset_service_status_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "asset_service_type" (
    "asset_service_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "asset_type" (
    "asset_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "assignment" (
    "assignment_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "raci_matrix" (
    "raci_matrix_id" TEXT PRIMARY KEY NOT NULL,
    "asset" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "accountable" TEXT NOT NULL,
    "consulted" TEXT NOT NULL,
    "informed" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "raci_matrix_subject_boundary" (
    "raci_matrix_subject_boundary_id" TEXT PRIMARY KEY NOT NULL,
    "boundary_id" TEXT NOT NULL,
    "raci_matrix_subject_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("boundary_id") REFERENCES "boundary"("boundary_id"),
    FOREIGN KEY("raci_matrix_subject_id") REFERENCES "raci_matrix_subject"("raci_matrix_subject_id")
);
CREATE TABLE IF NOT EXISTS "raci_matrix_activity" (
    "raci_matrix_activity_id" TEXT PRIMARY KEY NOT NULL,
    "activity" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "asset" (
    "asset_id" TEXT PRIMARY KEY NOT NULL,
    "organization_id" TEXT NOT NULL,
    "boundary_id" TEXT,
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
    "criticality" TEXT,
    "asymmetric_keys_encryption_enabled" TEXT,
    "cryptographic_key_encryption_enabled" TEXT,
    "symmetric_keys_encryption_enabled" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("organization_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("boundary_id") REFERENCES "boundary"("boundary_id"),
    FOREIGN KEY("asset_status_id") REFERENCES "asset_status"("asset_status_id"),
    FOREIGN KEY("asset_type_id") REFERENCES "asset_type"("asset_type_id"),
    FOREIGN KEY("assignment_id") REFERENCES "assignment"("assignment_id")
);
CREATE TABLE IF NOT EXISTS "asset_service" (
    "asset_service_id" TEXT PRIMARY KEY NOT NULL,
    "asset_id" TEXT NOT NULL,
    "asset_service_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "asset_service_status_id" TEXT NOT NULL,
    "port" TEXT NOT NULL,
    "experimental_version" TEXT NOT NULL,
    "production_version" TEXT NOT NULL,
    "latest_vendor_version" TEXT NOT NULL,
    "resource_utilization" TEXT NOT NULL,
    "log_file" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "vendor_link" TEXT NOT NULL,
    "installation_date" DATE,
    "criticality" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("asset_service_type_id") REFERENCES "asset_service_type"("asset_service_type_id"),
    FOREIGN KEY("asset_service_status_id") REFERENCES "asset_service_status"("asset_service_status_id")
);
CREATE TABLE IF NOT EXISTS "vulnerability_source" (
    "vulnerability_source_id" TEXT PRIMARY KEY NOT NULL,
    "short_code" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "vulnerability" (
    "vulnerability_id" TEXT PRIMARY KEY NOT NULL,
    "short_name" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "affected_software" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "patch_availability" TEXT NOT NULL,
    "severity_id" TEXT NOT NULL,
    "solutions" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("source_id") REFERENCES "vulnerability_source"("vulnerability_source_id"),
    FOREIGN KEY("status_id") REFERENCES "vulnerability_status"("code"),
    FOREIGN KEY("severity_id") REFERENCES "severity"("code")
);
CREATE TABLE IF NOT EXISTS "threat_source" (
    "threat_source_id" TEXT PRIMARY KEY NOT NULL,
    "title" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "threat_source_type_id" TEXT NOT NULL,
    "source_of_information" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "targeting" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("threat_source_type_id") REFERENCES "threat_source_type"("threat_source_type_id")
);
CREATE TABLE IF NOT EXISTS "threat_event" (
    "threat_event_id" TEXT PRIMARY KEY NOT NULL,
    "title" TEXT NOT NULL,
    "threat_source_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "threat_event_type_id" TEXT NOT NULL,
    "event_classification" TEXT NOT NULL,
    "source_of_information" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("threat_source_id") REFERENCES "threat_source"("threat_source_id"),
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("threat_event_type_id") REFERENCES "threat_event_type"("threat_event_type_id")
);
CREATE TABLE IF NOT EXISTS "asset_risk" (
    "asset_risk_id" TEXT PRIMARY KEY NOT NULL,
    "asset_risk_type_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "threat_event_id" TEXT NOT NULL,
    "relevance_id" TEXT,
    "likelihood_id" TEXT,
    "impact" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("asset_risk_type_id") REFERENCES "asset_risk_type"("asset_risk_type_id"),
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("threat_event_id") REFERENCES "threat_event"("threat_event_id"),
    FOREIGN KEY("relevance_id") REFERENCES "severity"("code"),
    FOREIGN KEY("likelihood_id") REFERENCES "probability"("code")
);
CREATE TABLE IF NOT EXISTS "security_impact_analysis" (
    "security_impact_analysis_id" TEXT PRIMARY KEY NOT NULL,
    "vulnerability_id" TEXT NOT NULL,
    "asset_risk_id" TEXT NOT NULL,
    "risk_level_id" TEXT NOT NULL,
    "impact_level_id" TEXT NOT NULL,
    "existing_controls" TEXT NOT NULL,
    "priority_id" TEXT NOT NULL,
    "reported_date" DATE NOT NULL,
    "reported_by_id" TEXT NOT NULL,
    "responsible_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("vulnerability_id") REFERENCES "vulnerability"("vulnerability_id"),
    FOREIGN KEY("asset_risk_id") REFERENCES "asset_risk"("asset_risk_id"),
    FOREIGN KEY("risk_level_id") REFERENCES "probability"("code"),
    FOREIGN KEY("impact_level_id") REFERENCES "probability"("code"),
    FOREIGN KEY("priority_id") REFERENCES "priority"("code"),
    FOREIGN KEY("reported_by_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("responsible_by_id") REFERENCES "person"("person_id")
);
CREATE TABLE IF NOT EXISTS "impact_of_risk" (
    "impact_of_risk_id" TEXT PRIMARY KEY NOT NULL,
    "security_impact_analysis_id" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("security_impact_analysis_id") REFERENCES "security_impact_analysis"("security_impact_analysis_id")
);
CREATE TABLE IF NOT EXISTS "proposed_controls" (
    "proposed_controls_id" TEXT PRIMARY KEY NOT NULL,
    "security_impact_analysis_id" TEXT NOT NULL,
    "controls" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("security_impact_analysis_id") REFERENCES "security_impact_analysis"("security_impact_analysis_id")
);
CREATE TABLE IF NOT EXISTS "billing" (
    "billing_id" TEXT PRIMARY KEY NOT NULL,
    "purpose" TEXT NOT NULL,
    "bill_rate" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "effective_from_date" TIMESTAMPTZ NOT NULL,
    "effective_to_date" TEXT NOT NULL,
    "prorate" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "scheduled_task" (
    "scheduled_task_id" TEXT PRIMARY KEY NOT NULL,
    "description" TEXT NOT NULL,
    "task_date" TIMESTAMPTZ NOT NULL,
    "reminder_date" TIMESTAMPTZ NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "reminder_to" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "timesheet" (
    "timesheet_id" TEXT PRIMARY KEY NOT NULL,
    "date_of_work" TIMESTAMPTZ NOT NULL,
    "is_billable_id" TEXT NOT NULL,
    "number_of_hours" INTEGER NOT NULL,
    "time_entry_category_id" TEXT NOT NULL,
    "timesheet_summary" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("is_billable_id") REFERENCES "status_value"("status_value_id"),
    FOREIGN KEY("time_entry_category_id") REFERENCES "time_entry_category"("time_entry_category_id")
);
CREATE TABLE IF NOT EXISTS "certificate" (
    "certificate_id" TEXT PRIMARY KEY NOT NULL,
    "certificate_name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "certificate_category" TEXT NOT NULL,
    "certificate_type" TEXT NOT NULL,
    "certificate_authority" TEXT NOT NULL,
    "validity" TEXT NOT NULL,
    "expiration_date" TIMESTAMPTZ,
    "domain_name" TEXT NOT NULL,
    "key_size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "device" (
    "device_id" TEXT PRIMARY KEY NOT NULL,
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
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "security_incident_response_team" (
    "security_incident_response_team_id" TEXT PRIMARY KEY NOT NULL,
    "training_subject_id" TEXT,
    "person_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "training_status_id" TEXT,
    "attended_date" DATE,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("training_subject_id") REFERENCES "training_subject"("training_subject_id"),
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("organization_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("training_status_id") REFERENCES "status_value"("status_value_id")
);
CREATE TABLE IF NOT EXISTS "awareness_training" (
    "awareness_training_id" TEXT PRIMARY KEY NOT NULL,
    "training_subject_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "training_status_id" TEXT NOT NULL,
    "attended_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("training_subject_id") REFERENCES "training_subject"("training_subject_id"),
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("organization_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("training_status_id") REFERENCES "status_value"("status_value_id")
);
CREATE TABLE IF NOT EXISTS "rating" (
    "rating_id" TEXT PRIMARY KEY NOT NULL,
    "author_id" TEXT NOT NULL,
    "rating_given_to_id" TEXT NOT NULL,
    "rating_value_id" TEXT NOT NULL,
    "best_rating_id" TEXT,
    "rating_explanation" TEXT NOT NULL,
    "review_aspect" TEXT NOT NULL,
    "worst_rating_id" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("author_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("rating_given_to_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("rating_value_id") REFERENCES "rating_value"("rating_value_id"),
    FOREIGN KEY("best_rating_id") REFERENCES "rating_value"("rating_value_id"),
    FOREIGN KEY("worst_rating_id") REFERENCES "rating_value"("rating_value_id")
);
CREATE TABLE IF NOT EXISTS "note" (
    "note_id" TEXT PRIMARY KEY NOT NULL,
    "party_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
);
CREATE TABLE IF NOT EXISTS "threat_source_type" (
    "threat_source_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "threat_event_type" (
    "threat_event_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "calendar_period" (
    "calendar_period_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "tracking_period" (
    "tracking_period_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "audit_assertion" (
    "audit_assertion_id" TEXT PRIMARY KEY NOT NULL,
    "auditor_type_id" TEXT NOT NULL,
    "audit_purpose_id" TEXT NOT NULL,
    "auditor_org_id" TEXT NOT NULL,
    "auditor_person_id" TEXT NOT NULL,
    "auditor_status_type_id" TEXT NOT NULL,
    "scf_identifier" TEXT NOT NULL,
    "auditor_notes" TEXT NOT NULL,
    "auditor_artifacts" TEXT NOT NULL,
    "assertion_name" TEXT NOT NULL,
    "assertion_description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("auditor_type_id") REFERENCES "auditor_type"("code"),
    FOREIGN KEY("audit_purpose_id") REFERENCES "audit_purpose"("audit_purpose_id"),
    FOREIGN KEY("auditor_org_id") REFERENCES "organization"("organization_id"),
    FOREIGN KEY("auditor_person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("auditor_status_type_id") REFERENCES "audit_status"("audit_status_id")
);
CREATE TABLE IF NOT EXISTS "contract" (
    "contract_id" TEXT PRIMARY KEY NOT NULL,
    "contract_from_id" TEXT,
    "contract_to_id" TEXT,
    "contract_status_id" TEXT,
    "document_reference" TEXT NOT NULL,
    "payment_type_id" TEXT,
    "periodicity_id" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "contract_type_id" TEXT,
    "date_of_last_review" TIMESTAMPTZ,
    "date_of_next_review" TIMESTAMPTZ,
    "date_of_contract_review" TIMESTAMPTZ,
    "date_of_contract_approval" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("contract_from_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("contract_to_id") REFERENCES "party"("party_id"),
    FOREIGN KEY("contract_status_id") REFERENCES "contract_status"("contract_status_id"),
    FOREIGN KEY("payment_type_id") REFERENCES "payment_type"("payment_type_id"),
    FOREIGN KEY("periodicity_id") REFERENCES "periodicity"("periodicity_id"),
    FOREIGN KEY("contract_type_id") REFERENCES "contract_type"("contract_type_id")
);
CREATE TABLE IF NOT EXISTS "risk_register" (
    "risk_register_id" TEXT PRIMARY KEY NOT NULL,
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
    "control_monitor_risk_owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("risk_subject_id") REFERENCES "risk_subject"("risk_subject_id"),
    FOREIGN KEY("risk_type_id") REFERENCES "risk_type"("risk_type_id"),
    FOREIGN KEY("rating_likelihood_id") REFERENCES "rating_value"("rating_value_id"),
    FOREIGN KEY("rating_impact_id") REFERENCES "rating_value"("rating_value_id"),
    FOREIGN KEY("rating_overall_risk_id") REFERENCES "rating_value"("rating_value_id"),
    FOREIGN KEY("over_all_residual_risk_rating_id") REFERENCES "rating_value"("rating_value_id"),
    FOREIGN KEY("control_monitor_risk_owner_id") REFERENCES "person"("person_id")
);
CREATE TABLE IF NOT EXISTS "incident" (
    "incident_id" TEXT PRIMARY KEY NOT NULL,
    "title" TEXT NOT NULL,
    "incident_date" DATE NOT NULL,
    "time_and_time_zone" TIMESTAMPTZ NOT NULL,
    "asset_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sub_category_id" TEXT NOT NULL,
    "severity_id" TEXT NOT NULL,
    "priority_id" TEXT,
    "internal_or_external_id" TEXT,
    "location" TEXT NOT NULL,
    "it_service_impacted" TEXT NOT NULL,
    "impacted_modules" TEXT NOT NULL,
    "impacted_dept" TEXT NOT NULL,
    "reported_by_id" TEXT NOT NULL,
    "reported_to_id" TEXT NOT NULL,
    "brief_description" TEXT NOT NULL,
    "detailed_description" TEXT NOT NULL,
    "assigned_to_id" TEXT NOT NULL,
    "assigned_date" DATE,
    "investigation_details" TEXT NOT NULL,
    "containment_details" TEXT NOT NULL,
    "eradication_details" TEXT NOT NULL,
    "business_impact" TEXT NOT NULL,
    "lessons_learned" TEXT NOT NULL,
    "status_id" TEXT,
    "closed_date" DATE,
    "reopened_time" TIMESTAMPTZ,
    "feedback_from_business" TEXT NOT NULL,
    "reported_to_regulatory" TEXT NOT NULL,
    "report_date" DATE,
    "report_time" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("category_id") REFERENCES "incident_category"("incident_category_id"),
    FOREIGN KEY("sub_category_id") REFERENCES "incident_sub_category"("incident_sub_category_id"),
    FOREIGN KEY("severity_id") REFERENCES "severity"("code"),
    FOREIGN KEY("priority_id") REFERENCES "priority"("code"),
    FOREIGN KEY("internal_or_external_id") REFERENCES "incident_type"("incident_type_id"),
    FOREIGN KEY("reported_by_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("reported_to_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("assigned_to_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("status_id") REFERENCES "incident_status"("incident_status_id")
);
CREATE TABLE IF NOT EXISTS "incident_root_cause" (
    "incident_root_cause_id" TEXT PRIMARY KEY NOT NULL,
    "incident_id" TEXT,
    "source" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "probability_id" TEXT,
    "testing_analysis" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "likelihood_of_risk_id" TEXT,
    "modification_of_the_reported_issue" TEXT NOT NULL,
    "testing_for_modified_issue" TEXT NOT NULL,
    "test_results" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("incident_id") REFERENCES "incident"("incident_id"),
    FOREIGN KEY("probability_id") REFERENCES "priority"("code"),
    FOREIGN KEY("likelihood_of_risk_id") REFERENCES "priority"("code")
);
CREATE TABLE IF NOT EXISTS "raci_matrix_assignment" (
    "raci_matrix_assignment_id" TEXT PRIMARY KEY NOT NULL,
    "person_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "raci_matrix_assignment_nature_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("subject_id") REFERENCES "raci_matrix_subject"("raci_matrix_subject_id"),
    FOREIGN KEY("activity_id") REFERENCES "raci_matrix_activity"("raci_matrix_activity_id"),
    FOREIGN KEY("raci_matrix_assignment_nature_id") REFERENCES "raci_matrix_assignment_nature"("code")
);
CREATE TABLE IF NOT EXISTS "person_skill" (
    "person_skill_id" TEXT PRIMARY KEY NOT NULL,
    "person_id" TEXT NOT NULL,
    "skill_nature_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "proficiency_scale_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("skill_nature_id") REFERENCES "skill_nature"("skill_nature_id"),
    FOREIGN KEY("skill_id") REFERENCES "skill"("skill_id"),
    FOREIGN KEY("proficiency_scale_id") REFERENCES "proficiency_scale"("code")
);
CREATE TABLE IF NOT EXISTS "key_performance" (
    "key_performance_id" TEXT PRIMARY KEY NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "key_performance_indicator" (
    "key_performance_indicator_id" TEXT PRIMARY KEY NOT NULL,
    "key_performance_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
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
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("key_performance_id") REFERENCES "key_performance"("key_performance_id"),
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("calendar_period_id") REFERENCES "calendar_period"("calendar_period_id"),
    FOREIGN KEY("kpi_comparison_operator_id") REFERENCES "comparison_operator"("code"),
    FOREIGN KEY("kpi_measurement_type_id") REFERENCES "kpi_measurement_type"("code"),
    FOREIGN KEY("kpi_status_id") REFERENCES "kpi_status"("code"),
    FOREIGN KEY("tracking_period_id") REFERENCES "tracking_period"("tracking_period_id"),
    FOREIGN KEY("trend_id") REFERENCES "trend"("code")
);
CREATE TABLE IF NOT EXISTS "key_risk" (
    "key_risk_id" TEXT PRIMARY KEY NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "base_value" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "key_risk_indicator" (
    "key_risk_indicator_id" TEXT PRIMARY KEY NOT NULL,
    "key_risk_id" TEXT NOT NULL,
    "entry_date" DATE NOT NULL,
    "entry_value" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("key_risk_id") REFERENCES "key_risk"("key_risk_id")
);
CREATE TABLE IF NOT EXISTS "assertion" (
    "assertion_id" TEXT PRIMARY KEY NOT NULL,
    "foreign_integration" TEXT NOT NULL,
    "assertion" TEXT NOT NULL,
    "assertion_explain" TEXT NOT NULL,
    "assertion_expires_on" DATE,
    "assertion_expires_poam" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "attestation" (
    "attestation_id" TEXT PRIMARY KEY NOT NULL,
    "assertion_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "attestation" TEXT NOT NULL,
    "attestation_explain" TEXT NOT NULL,
    "attested_on" DATE NOT NULL,
    "expires_on" DATE,
    "boundary_id" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("assertion_id") REFERENCES "assertion"("assertion_id"),
    FOREIGN KEY("person_id") REFERENCES "person"("person_id"),
    FOREIGN KEY("boundary_id") REFERENCES "boundary"("boundary_id")
);
CREATE TABLE IF NOT EXISTS "attestation_evidence" (
    "attestation_evidence_id" TEXT PRIMARY KEY NOT NULL,
    "attestation_id" TEXT NOT NULL,
    "evidence_nature" TEXT NOT NULL,
    "evidence_summary_markdown" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachment" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("attestation_id") REFERENCES "attestation"("attestation_id")
);
CREATE TABLE IF NOT EXISTS "training_subject" (
    "training_subject_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "status_value" (
    "status_value_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "rating_value" (
    "rating_value_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "contract_type" (
    "contract_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "graph_nature" (
    "graph_nature_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "risk_subject" (
    "risk_subject_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "risk_type" (
    "risk_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "incident_category" (
    "incident_category_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "incident_sub_category" (
    "incident_sub_category_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "incident_type" (
    "incident_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "incident_status" (
    "incident_status_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "asset_risk_type" (
    "asset_risk_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "audit_purpose" (
    "audit_purpose_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "audit_status" (
    "audit_status_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "employee_process_status" (
    "employee_process_status_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "payroll_items_type" (
    "payroll_items_type_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "interview_medium" (
    "interview_medium_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "notice_period" (
    "notice_period_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "hiring_process" (
    "hiring_process_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "hiring_process_checklist" (
    "hiring_process_checklist_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "hiring_checklist" (
    "hiring_checklist_id" TEXT PRIMARY KEY NOT NULL,
    "hiring_process" TEXT NOT NULL,
    "hiring_process_checklist" TEXT,
    "contract_id" TEXT NOT NULL,
    "summary" TEXT,
    "note" TEXT,
    "asset_id" TEXT,
    "assign_party" TEXT,
    "checklist_date" TIMESTAMPTZ,
    "interview_medium" TEXT,
    "payroll_items_type" TEXT,
    "notice_period" TEXT,
    "process_status" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("hiring_process") REFERENCES "hiring_process"("hiring_process_id"),
    FOREIGN KEY("hiring_process_checklist") REFERENCES "hiring_process_checklist"("hiring_process_checklist_id"),
    FOREIGN KEY("contract_id") REFERENCES "contract"("contract_id"),
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("assign_party") REFERENCES "party"("party_id"),
    FOREIGN KEY("interview_medium") REFERENCES "interview_medium"("interview_medium_id"),
    FOREIGN KEY("payroll_items_type") REFERENCES "payroll_items_type"("payroll_items_type_id"),
    FOREIGN KEY("notice_period") REFERENCES "notice_period"("notice_period_id"),
    FOREIGN KEY("process_status") REFERENCES "employee_process_status"("employee_process_status_id")
);
CREATE TABLE IF NOT EXISTS "termination_process" (
    "termination_process_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "termination_process_checklist" (
    "termination_process_checklist_id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT /* UNIQUE COLUMN */ NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "termination_checklist" (
    "termination_checklist_id" TEXT PRIMARY KEY NOT NULL,
    "termination_process" TEXT NOT NULL,
    "termination_process_checklist" TEXT,
    "contract_id" TEXT NOT NULL,
    "summary" TEXT,
    "note" TEXT,
    "asset_id" TEXT,
    "assign_party" TEXT,
    "checklist_date" DATE,
    "process_status" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("termination_process") REFERENCES "termination_process"("termination_process_id"),
    FOREIGN KEY("termination_process_checklist") REFERENCES "termination_process_checklist"("termination_process_checklist_id"),
    FOREIGN KEY("contract_id") REFERENCES "contract"("contract_id"),
    FOREIGN KEY("asset_id") REFERENCES "asset"("asset_id"),
    FOREIGN KEY("assign_party") REFERENCES "party"("party_id"),
    FOREIGN KEY("process_status") REFERENCES "employee_process_status"("employee_process_status_id")
);

--content views
CREATE VIEW IF NOT EXISTS "security_incident_response_team_view"("person_name", "organization_name", "team_role", "email") AS
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name, o.name AS organization_name, ort.value AS team_role,e.electronics_details AS email
    FROM security_incident_response_team sirt
    INNER JOIN person p ON p.person_id = sirt.person_id
    INNER JOIN organization o ON o.organization_id=sirt.organization_id
    INNER JOIN organization_role orl ON orl.person_id = sirt.person_id AND orl.organization_id = sirt.organization_id
    INNER JOIN organization_role_type ort ON ort.organization_role_type_id = orl.organization_role_type_id
    INNER JOIN party pr ON pr.party_id = p.party_id
    INNER JOIN contact_electronic e ON e.party_id=pr.party_id AND e.contact_type_id = (SELECT contact_type_id FROM contact_type WHERE code='OFFICIAL_EMAIL');
CREATE VIEW IF NOT EXISTS "awareness_training_view"("person_name", "person_role", "trainigng_subject", "training_status_id", "attended_date") AS
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,ort.value AS person_role,sub.value AS trainigng_subject,at.training_status_id,at.attended_date
    FROM awareness_training at
    INNER JOIN person p ON p.person_id = at.person_id
    INNER JOIN organization_role orl ON orl.person_id = at.person_id AND orl.organization_id = at.organization_id
    INNER JOIN organization_role_type ort ON ort.organization_role_type_id = orl.organization_role_type_id
    INNER JOIN training_subject sub ON sub.code = at.training_subject_id;
CREATE VIEW IF NOT EXISTS "person_skill_view"("person_name", "skill", "proficiency", "organization_id", "organization") AS
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,s.value AS skill,prs.value AS proficiency,organization_id,
    org.name as organization
    FROM person_skill ps
    INNER JOIN person p ON p.person_id = ps.person_id
    INNER JOIN party_relation pr ON pr.party_id = p.party_id
    INNER JOIN organization org ON org.party_id = pr.related_party_id
    INNER JOIN skill s ON s.skill_id = ps.skill_id
    INNER JOIN proficiency_scale prs ON prs.code = ps.proficiency_scale_id GROUP BY ps.person_id,ps.skill_id,person_name,s.value,proficiency;
CREATE VIEW IF NOT EXISTS "security_incident_response_view"("incident", "incident_date", "asset_name", "category", "severity", "priority", "internal_or_external", "location", "it_service_impacted", "impacted_modules", "impacted_dept", "reported_by", "reported_to", "brief_description", "detailed_description", "assigned_to", "assigned_date", "investigation_details", "containment_details", "eradication_details", "business_impact", "lessons_learned", "status", "closed_date", "feedback_from_business", "reported_to_regulatory", "report_date", "report_time", "root_cause_of_the_issue", "probability_of_issue", "testing_for_possible_root_cause_analysis", "solution", "likelihood_of_risk", "modification_of_the_reported_issue", "testing_for_modified_issue", "test_results") AS
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
    LEFT JOIN priority p5 ON p5.code = irc.likelihood_of_risk_id;
CREATE VIEW IF NOT EXISTS "raci_matrix_assignment_view"("person_name", "subject", "activity", "assignment_nature") AS
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,rms.value AS subject,rmac.activity,
    rman.value AS assignment_nature
    FROM raci_matrix_assignment rma
    INNER JOIN person p ON p.person_id = rma.person_id
    INNER JOIN raci_matrix_subject rms on rms.raci_matrix_subject_id = rma.subject_id
    INNER JOIN raci_matrix_activity rmac on rmac.raci_matrix_activity_id = rma.activity_id
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
    INNER JOIN asset_type at ON at.asset_type_id = ast.asset_type_id
    INNER JOIN key_performance kp ON kp.key_performance_id = kpi.key_performance_id
    INNER JOIN calendar_period cp ON cp.calendar_period_id = kpi.calendar_period_id
    INNER JOIN comparison_operator co ON co.code = kpi.kpi_comparison_operator_id
    INNER JOIN kpi_measurement_type kmt ON kmt.code = kpi.kpi_measurement_type_id
    INNER JOIN kpi_status ks ON ks.code = kpi.kpi_status_id
    INNER JOIN tracking_period tp ON tp.tracking_period_id = kpi.tracking_period_id
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
    INNER JOIN contact_electronic e ON e.party_id = pr.party_id AND e.contact_type_id = (SELECT contact_type_id FROM contact_type WHERE code='OFFICIAL_EMAIL')
    INNER JOIN contact_land l ON l.party_id = pr.party_id AND l.contact_type_id = (SELECT contact_type_id FROM contact_type WHERE code='OFFICIAL_ADDRESS')
    WHERE prl.party_role_id = (SELECT party_role_id FROM party_role WHERE code='VENDOR') AND prl.relation_type_id = 'ORGANIZATION_TO_PERSON';
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
CREATE VIEW IF NOT EXISTS "asset_service_view"("name", "server", "organization_id", "asset_type", "asset_service_type_id", "boundary", "description", "port", "experimental_version", "production_version", "latest_vendor_version", "resource_utilization", "log_file", "url", "vendor_link", "installation_date", "criticality", "owner", "tag", "asset_criticality", "asymmetric_keys", "cryptographic_key", "symmetric_keys") AS
    SELECT
    asser.name,ast.name as server,ast.organization_id,astyp.value as asset_type,astyp.asset_service_type_id,bnt.name as boundary,asser.description,asser.port,asser.experimental_version,asser.production_version,asser.latest_vendor_version,asser.resource_utilization,asser.log_file,asser.url,
    asser.vendor_link,asser.installation_date,asser.criticality,o.name AS owner,sta.value as tag, ast.criticality as asset_criticality,ast.asymmetric_keys_encryption_enabled as asymmetric_keys,
    ast.cryptographic_key_encryption_enabled as cryptographic_key,ast.symmetric_keys_encryption_enabled as symmetric_keys
    FROM asset_service asser
    INNER JOIN asset_service_type astyp ON astyp.asset_service_type_id = asser.asset_service_type_id
    INNER JOIN asset ast ON ast.asset_id = asser.asset_id
    INNER JOIN organization o ON o.organization_id=ast.organization_id
    INNER JOIN asset_status sta ON sta.asset_status_id=ast.asset_status_id
    INNER JOIN boundary bnt ON bnt.boundary_id=ast.boundary_id;
CREATE VIEW IF NOT EXISTS "risk_register_view"("risk_register_id", "description", "risk_subject", "risk_type", "impact_to_the_organization", "rating_likelihood_id", "rating_impact_id", "rating_overall_risk_id", "controls_in_place", "control_effectivenes", "over_all_residual_risk_rating_id", "mitigation_further_actions", "control_monitor_mitigation_actions_tracking_strategy", "control_monitor_action_due_date", "control_monitor_risk_owner") AS
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
    INNER JOIN person p on p.person_id=rr.control_monitor_risk_owner_id;
CREATE VIEW IF NOT EXISTS "person_organiztion_view"("person_name", "organization_id", "organization") AS
    SELECT p.person_first_name || ' ' || p.person_last_name AS person_name,organization_id,org.name as organization
    FROM person p
    INNER JOIN party_relation pr ON pr.party_id = p.party_id
    INNER JOIN party_relation_type prt ON prt.party_relation_type_id = pr.relation_type_id AND prt.code = 'ORGANIZATION_TO_PERSON'
    INNER JOIN organization org ON org.party_id = pr.related_party_id;
CREATE VIEW IF NOT EXISTS "employe_contract_view"("contract_by", "contract_to", "payment_type", "contract_status", "contract_type", "document_reference", "periodicity", "start_date", "end_date", "date_of_last_review", "date_of_next_review", "date_of_contract_review", "date_of_contract_approval") AS
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
    INNER JOIN periodicity p on p.code = ct.periodicity_id;
CREATE VIEW IF NOT EXISTS "hiring_checklist_view"("employee_name", "first_name", "middle_name", "last_name", "process", "checklist", "check_list_value", "note", "organization", "address_line1", "address_line2", "address_zip", "address_city", "address_state", "address_country") AS
    SELECT
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
        LEFT JOIN notice_period np on np.notice_period_id = hc.notice_period;
CREATE VIEW IF NOT EXISTS "termination_checklist_view"("employee_name", "first_name", "middle_name", "last_name", "process", "checklist", "check_list_value", "note", "organization", "address_line1", "address_line2", "address_zip", "address_city", "address_state", "address_country") AS
    SELECT
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
        INNER JOIN contact_land clemp on  clemp.party_id = paremp.party_id;

-- seed Data
INSERT INTO "execution_context" ("code", "value") VALUES ('PRODUCTION', 'production');
INSERT INTO "execution_context" ("code", "value") VALUES ('TEST', 'test');
INSERT INTO "execution_context" ("code", "value") VALUES ('DEVELOPMENT', 'devl');
INSERT INTO "execution_context" ("code", "value") VALUES ('SANDBOX', 'sandbox');
INSERT INTO "execution_context" ("code", "value") VALUES ('EXPERIMENTAL', 'experimental');
INSERT INTO "raci_matrix_assignment_nature" ("code", "value") VALUES ('RESPONSIBLE', 'Responsible');
INSERT INTO "raci_matrix_assignment_nature" ("code", "value") VALUES ('ACCOUNTABLE', 'Accountable');
INSERT INTO "raci_matrix_assignment_nature" ("code", "value") VALUES ('CONSULTED', 'Consulted');
INSERT INTO "raci_matrix_assignment_nature" ("code", "value") VALUES ('INFORMED', 'Informed');
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
INSERT INTO "probability" ("code", "value") VALUES ('HIGH', 'High');
INSERT INTO "probability" ("code", "value") VALUES ('MEDIUM', 'Medium');
INSERT INTO "probability" ("code", "value") VALUES ('LOW', 'Low');
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
INSERT INTO "trend" ("code", "value") VALUES ('DOWN', 'Down');
INSERT INTO "trend" ("code", "value") VALUES ('NO_CHANGE', 'No Change	');
INSERT INTO "trend" ("code", "value") VALUES ('UP', 'Up');
INSERT INTO "auditor_type" ("code", "value") VALUES ('EXTERNAL', 'external');
INSERT INTO "auditor_type" ("code", "value") VALUES ('INTERNAL', 'internal');
INSERT INTO "severity" ("code", "value") VALUES ('CRITICAL', 'Critical');
INSERT INTO "severity" ("code", "value") VALUES ('MAJOR', 'Major');
INSERT INTO "severity" ("code", "value") VALUES ('MINOR', 'Minor');
INSERT INTO "severity" ("code", "value") VALUES ('LOW', 'Low');
INSERT INTO "priority" ("code", "value") VALUES ('HIGH', 'High');
INSERT INTO "priority" ("code", "value") VALUES ('MEDIUM', 'Medium');
INSERT INTO "priority" ("code", "value") VALUES ('LOW', 'Low');
;

-- synthetic / test data
INSERT INTO "graph" ("graph_id", "graph_nature_id", "name", "description", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('1', (SELECT "graph_nature_id" FROM "graph_nature" WHERE "code" = 'SERVICE'), 'text-value', 'description', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "boundary" ("boundary_id", "parent_boundary_id", "graph_id", "boundary_nature_id", "name", "description", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('2', NULL, (SELECT "graph_id" FROM "graph" WHERE "graph_id" = '1' AND "graph_nature_id" = (SELECT "graph_nature_id" FROM "graph_nature" WHERE "code" = 'SERVICE') AND "name" = 'text-value' AND "description" = 'description'), (SELECT "boundary_nature_id" FROM "boundary_nature" WHERE "code" = 'REGULATORY_TAX_ID'), 'Boundery Name', 'test description', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "boundary" ("boundary_id", "parent_boundary_id", "graph_id", "boundary_nature_id", "name", "description", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('3', (SELECT "boundary_id" FROM "boundary" WHERE "boundary_id" = '2' AND "graph_id" = (SELECT "graph_id" FROM "graph" WHERE "graph_id" = '1' AND "graph_nature_id" = (SELECT "graph_nature_id" FROM "graph_nature" WHERE "code" = 'SERVICE') AND "name" = 'text-value' AND "description" = 'description') AND "boundary_nature_id" = (SELECT "boundary_nature_id" FROM "boundary_nature" WHERE "code" = 'REGULATORY_TAX_ID') AND "name" = 'Boundery Name' AND "description" = 'test description'), (SELECT "graph_id" FROM "graph" WHERE "graph_id" = '1' AND "graph_nature_id" = (SELECT "graph_nature_id" FROM "graph_nature" WHERE "code" = 'SERVICE') AND "name" = 'text-value' AND "description" = 'description'), (SELECT "boundary_nature_id" FROM "boundary_nature" WHERE "code" = 'REGULATORY_TAX_ID'), 'Boundery Name Self Test', 'test description', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "host" ("host_id", "host_name", "description", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('4', 'Test Host Name', 'description test', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "host_boundary" ("host_boundary_id", "host_id", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('5', (SELECT "host_id" FROM "host" WHERE "host_id" = '4' AND "host_name" = 'Test Host Name' AND "description" = 'description test'), NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "raci_matrix" ("raci_matrix_id", "asset", "responsible", "accountable", "consulted", "informed", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('6', 'asset test', 'responsible', 'accountable', 'consulted', 'informed', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "raci_matrix_subject_boundary" ("raci_matrix_subject_boundary_id", "boundary_id", "raci_matrix_subject_id", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('7', (SELECT "boundary_id" FROM "boundary" WHERE "name" = 'Boundery Name Self Test'), (SELECT "raci_matrix_subject_id" FROM "raci_matrix_subject" WHERE "code" = 'CURATION_WORKS'), NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "raci_matrix_activity" ("raci_matrix_activity_id", "activity", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('8', 'Activity', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "party" ("party_id", "party_type_id", "party_name", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('9', 'PERSON', 'person', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "party_identifier" ("party_identifier_id", "identifier_name", "identifier_value", "party_identifier_type_id", "party_id", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('10', 'idenitifier name', 'test identifier', (SELECT "party_identifier_type_id" FROM "party_identifier_type" WHERE "code" = 'PASSPORT'), (SELECT "party_id" FROM "party" WHERE "party_id" = '9' AND "party_type_id" = 'PERSON' AND "party_name" = 'person'), NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "gender_type" ("gender_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log")
       VALUES ('11', 'MALE', 'Male', NULL, NULL, NULL, NULL, NULL, NULL),
              ('12', 'FEMALE', 'Female', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "sex_type" ("sex_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log")
       VALUES ('13', 'MALE', 'Male', NULL, NULL, NULL, NULL, NULL, NULL),
              ('14', 'FEMALE', 'Female', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "person" ("person_id", "party_id", "person_type_id", "person_first_name", "person_middle_name", "person_last_name", "previous_name", "honorific_prefix", "honorific_suffix", "gender_id", "sex_id", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('15', (SELECT "party_id" FROM "party" WHERE "party_id" = '9' AND "party_type_id" = 'PERSON' AND "party_name" = 'person'), (SELECT "person_type_id" FROM "person_type" WHERE "code" = 'PROFESSIONAL'), 'Test First Name', NULL, 'Test Last Name', NULL, NULL, NULL, (SELECT "gender_type_id" FROM "gender_type" WHERE "code" = 'MALE'), (SELECT "sex_type_id" FROM "sex_type" WHERE "code" = 'MALE'), NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "party_relation" ("party_relation_id", "party_id", "related_party_id", "relation_type_id", "party_role_id", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('16', (SELECT "party_id" FROM "party" WHERE "party_id" = '9' AND "party_type_id" = 'PERSON' AND "party_name" = 'person'), (SELECT "party_id" FROM "party" WHERE "party_id" = '9' AND "party_type_id" = 'PERSON' AND "party_name" = 'person'), 'ORGANIZATION_TO_PERSON', (SELECT "party_role_id" FROM "party_role" WHERE "code" = 'VENDOR'), NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "organization" ("organization_id", "party_id", "name", "alias", "description", "license", "federal_tax_id_num", "registration_date", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('17', (SELECT "party_id" FROM "party" WHERE "party_id" = '9' AND "party_type_id" = 'PERSON' AND "party_name" = 'person'), 'Test Name', NULL, NULL, 'Test License', NULL, '2023-02-06', NULL, NULL, NULL, NULL, NULL, NULL, NULL);


INSERT INTO "organization_role" ("organization_role_id", "person_id", "organization_id", "organization_role_type_id", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('18', (SELECT "person_id" FROM "person" WHERE "person_first_name" = 'Test First Name' AND "person_last_name" = 'Test Last Name'), (SELECT "organization_id" FROM "organization" WHERE "name" = 'Test Name'), (SELECT "organization_role_type_id" FROM "organization_role_type" WHERE "code" = 'ASSOCIATE_MANAGER_TECHNOLOGY'), NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "contact_electronic" ("contact_electronic_id", "contact_type_id", "party_id", "electronics_details", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('19', (SELECT "contact_type_id" FROM "contact_type" WHERE "code" = 'MOBILE_PHONE_NUMBER'), (SELECT "party_id" FROM "party" WHERE "party_id" = '9' AND "party_type_id" = 'PERSON' AND "party_name" = 'person'), 'electronics details', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- the .dump in the last line is necessary because we load into :memory:
-- first because performance is better and then emit all the SQL for saving
-- into the destination file, e.g. when insert DML uses (select x from y where a = b))
.dump
EOF
)

# Create an in-memory SQLite database, load the first pass for optimal
# performance then export the in-memory database to the given file; this
# two phase approach works because the last line in the SQL is '.dump'.
# All arguments after <database_file> will be passed into the final DB.
sqlite3 "$db_file" "$(echo "$SQL" | sqlite3 ":memory:")" "${@}"
  
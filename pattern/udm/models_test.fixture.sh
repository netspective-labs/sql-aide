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
CREATE TABLE IF NOT EXISTS "verification_type" (
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
CREATE TABLE IF NOT EXISTS "party_state" (
    "party_state_id" TEXT PRIMARY KEY NOT NULL,
    "party_id" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "transition_result" TEXT NOT NULL,
    "transition_reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("party_id") REFERENCES "party"("party_id")
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
CREATE TABLE IF NOT EXISTS "contact_electronic_assurance" (
    "contact_electronic_assurance_id" TEXT PRIMARY KEY NOT NULL,
    "contact_electronic_id" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "transition_result" TEXT NOT NULL,
    "transition_reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("contact_electronic_id") REFERENCES "contact_electronic"("contact_electronic_id")
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
CREATE TABLE IF NOT EXISTS "party_role_type" (
    "party_role_type_id" TEXT PRIMARY KEY NOT NULL,
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


--content views
CREATE VIEW IF NOT EXISTS "vendor_view"("name", "email", "address", "state", "city", "zip", "country") AS
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
    WHERE prl.party_role_id = 'VENDOR' AND prl.relation_type_id = 'ORGANIZATION_TO_PERSON';

-- seed Data
INSERT INTO "execution_context" ("code", "value") VALUES ('PRODUCTION', 'production');
INSERT INTO "execution_context" ("code", "value") VALUES ('TEST', 'test');
INSERT INTO "execution_context" ("code", "value") VALUES ('DEVELOPMENT', 'devl');
INSERT INTO "execution_context" ("code", "value") VALUES ('SANDBOX', 'sandbox');
INSERT INTO "execution_context" ("code", "value") VALUES ('EXPERIMENTAL', 'experimental');
INSERT INTO "verification_type" ("code", "value") VALUES ('NOT_VERIFIED', 'Not Verified');
INSERT INTO "verification_type" ("code", "value") VALUES ('PENDING_VERIFICATION', 'Verification Pending');
INSERT INTO "verification_type" ("code", "value") VALUES ('VERIFIED', 'Verified');
INSERT INTO "verification_type" ("code", "value") VALUES ('FAILED_VERIFICATION', 'Verification Failed');
INSERT INTO "verification_type" ("code", "value") VALUES ('OPTED_OUT', 'Opted Out');
;

-- synthetic / test data

INSERT INTO "party_role" ("party_role_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log")
       VALUES ('15', 'VENDOR', 'Vendor', NULL, NULL, NULL, NULL, NULL, NULL),
              ('16', 'CUSTOMER', 'Customer', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "party_type" ("party_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('1', 'PERSON', 'person', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "party" ("party_id", "party_type_id", "party_name", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('3', (SELECT "party_type_id" FROM "party_type" WHERE "code" = 'PERSON'), 'person name', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "gender_type" ("gender_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log")
       VALUES ('8', 'MALE', 'Male', NULL, NULL, NULL, NULL, NULL, NULL),
              ('9', 'FEMALE', 'Female', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "sex_type" ("sex_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log")
       VALUES ('10', 'MALE', 'Male', NULL, NULL, NULL, NULL, NULL, NULL),
              ('11', 'FEMALE', 'Female', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "person_type" ("person_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log")
       VALUES ('12', 'INDIVIDUAL', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL),
              ('13', 'PROFESSIONAL', 'Professional', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "party_relation_type" ("party_relation_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('2', 'PERSON_TO_PERSON', 'personToPerson', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "party_identifier_type" ("party_identifier_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log")
       VALUES ('4', 'PASSPORT', 'Passport', NULL, NULL, NULL, NULL, NULL, NULL),
              ('5', 'UUID', 'UUID', NULL, NULL, NULL, NULL, NULL, NULL),
              ('6', 'DRIVING_LICENSE', 'Driving License', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "party_identifier" ("party_identifier_id", "identifier_name", "identifier_value", "party_identifier_type_id", "party_id", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('7', 'test name', 'test value', (SELECT "party_identifier_type_id" FROM "party_identifier_type" WHERE "code" = 'PASSPORT'), (SELECT "party_id" FROM "party" WHERE "party_name" = 'person name'), NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "person" ("person_id", "party_id", "person_type_id", "person_first_name", "person_middle_name", "person_last_name", "previous_name", "honorific_prefix", "honorific_suffix", "gender_id", "sex_id", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('14', (SELECT "party_id" FROM "party" WHERE "party_name" = 'person name'), (SELECT "person_type_id" FROM "person_type" WHERE "code" = 'PROFESSIONAL'), 'Test First Name', NULL, 'Test Last Name', NULL, NULL, NULL, (SELECT "gender_type_id" FROM "gender_type" WHERE "code" = 'MALE'), (SELECT "sex_type_id" FROM "sex_type" WHERE "code" = 'MALE'), NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "party_relation" ("party_relation_id", "party_id", "related_party_id", "relation_type_id", "party_role_id", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('17', (SELECT "party_id" FROM "party" WHERE "party_name" = 'person name'), (SELECT "party_id" FROM "party" WHERE "party_name" = 'person name'), (SELECT "party_relation_type_id" FROM "party_relation_type" WHERE "code" = 'PERSON_TO_PERSON'), (SELECT "party_role_id" FROM "party_role" WHERE "code" = 'VENDOR'), NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "organization" ("organization_id", "party_id", "name", "alias", "description", "license", "federal_tax_id_num", "registration_date", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('18', (SELECT "party_id" FROM "party" WHERE "party_name" = 'person name'), 'Test Name', NULL, NULL, 'Test License', NULL, '2023-02-06', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "organization_role_type" ("organization_role_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('19', 'ASSOCIATE_MANAGER_TECHNOLOGY', 'Associate Manager Technology', NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "organization_role" ("organization_role_id", "person_id", "organization_id", "organization_role_type_id", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('20', (SELECT "person_id" FROM "person" WHERE "person_first_name" = 'Test First Name' AND "person_last_name" = 'Test Last Name'), (SELECT "organization_id" FROM "organization" WHERE "name" = 'Test Name'), (SELECT "organization_role_type_id" FROM "organization_role_type" WHERE "code" = 'ASSOCIATE_MANAGER_TECHNOLOGY'), NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "contact_type" ("contact_type_id", "code", "value", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log")
       VALUES ('21', 'HOME_ADDRESS', 'Home Address', NULL, NULL, NULL, NULL, NULL, NULL),
              ('22', 'OFFICIAL_ADDRESS', 'Official Address', NULL, NULL, NULL, NULL, NULL, NULL),
              ('23', 'MOBILE_PHONE_NUMBER', 'Mobile Phone Number', NULL, NULL, NULL, NULL, NULL, NULL),
              ('24', 'LAND_PHONE_NUMBER', 'Land Phone Number', NULL, NULL, NULL, NULL, NULL, NULL),
              ('25', 'OFFICIAL_EMAIL', 'Official Email', NULL, NULL, NULL, NULL, NULL, NULL),
              ('26', 'PERSONAL_EMAIL', 'Personal Email', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "contact_electronic" ("contact_electronic_id", "contact_type_id", "party_id", "electronics_details", "elaboration", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('27', (SELECT "contact_type_id" FROM "contact_type" WHERE "code" = 'MOBILE_PHONE_NUMBER'), (SELECT "party_id" FROM "party" WHERE "party_name" = 'person name'), 'electronics details', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "contact_electronic_assurance" ("contact_electronic_assurance_id", "contact_electronic_id", "from_state", "to_state", "transition_result", "transition_reason", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('28', (SELECT "contact_electronic_id" FROM "contact_electronic" WHERE "contact_electronic_id" = '27'), 'INACTIVE', 'ACTIVE', '', 'Party became active', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "party_state" ("party_state_id", "party_id", "from_state", "to_state", "transition_result", "transition_reason", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('29', (SELECT "party_id" FROM "party" WHERE "party_name" = 'person name'), 'INACTIVE', 'ACTIVE', '', 'Party became active', NULL, NULL, NULL, NULL, NULL, NULL);

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
  
-- not destroying first (for development)
-- no schemaName provided

CREATE TABLE "er_algorithm" (
    "algorithm_id" TEXT PRIMARY KEY NOT NULL,
    "algorithm_name" TEXT NOT NULL,
    "algorithm_version" TEXT NOT NULL,
    "algorithm_sp" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "hub_er_entity" (
    "hub_er_entity_id" TEXT PRIMARY KEY NOT NULL,
    "ssn_business_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "hub_er_job" (
    "hub_er_job_id" TEXT PRIMARY KEY NOT NULL,
    "job_business_job_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "sat_er_job_er_job_state" (
    "sat_er_job_er_job_state_id" TEXT PRIMARY KEY NOT NULL,
    "hub_er_job_id" TEXT NOT NULL,
    "algorithm_id" INTEGER NOT NULL,
    "run_date_time" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    FOREIGN KEY("hub_er_job_id") REFERENCES "hub_er_job"("hub_er_job_id")
);

CREATE TABLE IF NOT EXISTS "link_er_entity_match" (
    "link_er_entity_match_id" TEXT PRIMARY KEY NOT NULL,
    "hub_entity_id" TEXT NOT NULL,
    "algorithm_ref" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    FOREIGN KEY("hub_entity_id") REFERENCES "sat_er_entity_er_entity_attribute"("sat_er_entity_er_entity_attribute_id"),
    FOREIGN KEY("algorithm_ref") REFERENCES "er_algorithm"("algorithm_id")
);

CREATE TABLE IF NOT EXISTS "sat_er_entity_match_er_entity_match_levenshtien" (
    "sat_er_entity_match_er_entity_match_levenshtien_id" TEXT PRIMARY KEY NOT NULL,
    "link_er_entity_match_id" TEXT NOT NULL,
    "distance_value" INTEGER NOT NULL,
    "similarity_score" INTEGER NOT NULL,
    "normalized_distance" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    FOREIGN KEY("link_er_entity_match_id") REFERENCES "link_er_entity_match"("link_er_entity_match_id")
);

CREATE TABLE IF NOT EXISTS "sat_er_entity_match_er_entity_match_soundex" (
    "sat_er_entity_match_er_entity_match_soundex_id" TEXT PRIMARY KEY NOT NULL,
    "link_er_entity_match_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "similarity_score" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    FOREIGN KEY("link_er_entity_match_id") REFERENCES "link_er_entity_match"("link_er_entity_match_id")
);
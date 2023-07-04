PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance

-- reference tables
CREATE TABLE IF NOT EXISTS "lineage_source_type" (
    "lineage_source_type_id" TEXT PRIMARY KEY NOT NULL,
    "lineage_source_type" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "lineage_destination_type" (
    "lineage_destination_type_id" TEXT PRIMARY KEY NOT NULL,
    "lineage_destination_type" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "lineage_transform_type" (
    "lineage_transform_type_id" TEXT PRIMARY KEY NOT NULL,
    "lineage_transform_type" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "classification_level" (
    "classification_level_id" INTEGER,
    "classification_level_name" TEXT NOT NULL,
    "classification_level_description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "sensitivity_level" (
    "sensitivity_level_id" INTEGER,
    "sensitivity_level" TEXT NOT NULL,
    "sensitivity_description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);

-- content tables
-- TODO:SqlObjectComment
CREATE TABLE IF NOT EXISTS "lineage_source" (
    "lineage_source_id" INTEGER,
    "lineage_source_type_id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "classification_level_id" INTEGER NOT NULL,
    "sensitivity_level_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("lineage_source_type_id") REFERENCES "lineage_source_type"("lineage_source_type_id"),
    FOREIGN KEY("classification_level_id") REFERENCES "classification_level"("classification_level_id"),
    FOREIGN KEY("sensitivity_level_id") REFERENCES "sensitivity_level"("sensitivity_level_id")
);
CREATE TABLE IF NOT EXISTS "lineage_destination" (
    "lineage_destination_id" INTEGER,
    "lineage_dest_type_id" TEXT NOT NULL,
    "dest_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "classification_level_id" INTEGER NOT NULL,
    "sensitivity_level_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("lineage_dest_type_id") REFERENCES "lineage_destination_type"("lineage_destination_type_id"),
    FOREIGN KEY("classification_level_id") REFERENCES "classification_level"("classification_level_id"),
    FOREIGN KEY("sensitivity_level_id") REFERENCES "sensitivity_level"("sensitivity_level_id")
);
CREATE TABLE IF NOT EXISTS "lineage_transform" (
    "lineage_transform_id" INTEGER,
    "lineage_transform_type_id" TEXT NOT NULL,
    "transform_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("lineage_transform_type_id") REFERENCES "lineage_transform_type"("lineage_transform_type_id")
);
CREATE TABLE IF NOT EXISTS "lineage_graph_node" (
    "lineage_graph_node_id" INTEGER,
    "lineage_source_id" INTEGER NOT NULL,
    "lineage_dest_id" INTEGER NOT NULL,
    "lineage_transform_id" INTEGER NOT NULL,
    "graph_node_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("lineage_source_id") REFERENCES "lineage_source"("lineage_source_id"),
    FOREIGN KEY("lineage_dest_id") REFERENCES "lineage_destination"("lineage_destination_id"),
    FOREIGN KEY("lineage_transform_id") REFERENCES "lineage_transform"("lineage_transform_id")
);
CREATE TABLE IF NOT EXISTS "data_lineage" (
    "data_lineage_id" INTEGER,
    "source_table_id" INTEGER NOT NULL,
    "lineage_destination_id" INTEGER NOT NULL,
    "transformation_id" INTEGER NOT NULL,
    "lineage_type" TEXT NOT NULL,
    "lineage_quality_rating" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("source_table_id") REFERENCES "lineage_source"("lineage_source_id"),
    FOREIGN KEY("lineage_destination_id") REFERENCES "lineage_destination"("lineage_destination_id"),
    FOREIGN KEY("transformation_id") REFERENCES "lineage_transform"("lineage_transform_id")
);
CREATE TABLE IF NOT EXISTS "steward" (
    "steward_id" INTEGER,
    "steward_name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "steward_assignment" (
    "steward_assignment_id" INTEGER,
    "steward_id" INTEGER NOT NULL,
    "source_table_id" INTEGER NOT NULL,
    "target_table_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("steward_id") REFERENCES "steward"("steward_id"),
    FOREIGN KEY("source_table_id") REFERENCES "lineage_source"("lineage_source_id"),
    FOREIGN KEY("target_table_id") REFERENCES "lineage_destination"("lineage_destination_id")
);
CREATE TABLE IF NOT EXISTS "quality_issue" (
    "quality_issue_id" INTEGER,
    "source_table_id" INTEGER NOT NULL,
    "column_name" TEXT NOT NULL,
    "issue_description" TEXT NOT NULL,
    "reported_date" DATE NOT NULL,
    "resolution_status" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("source_table_id") REFERENCES "lineage_source"("lineage_source_id")
);
CREATE TABLE IF NOT EXISTS "quality_rule" (
    "quality_rule_id" INTEGER,
    "source_table_id" INTEGER NOT NULL,
    "column_name" TEXT NOT NULL,
    "rule_description" TEXT NOT NULL,
    "rule_expression" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("source_table_id") REFERENCES "lineage_source"("lineage_source_id")
);
CREATE TABLE IF NOT EXISTS "quality_score" (
    "quality_score_id" INTEGER,
    "source_table_id" INTEGER NOT NULL,
    "column_name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "assessment_date" DATE NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("source_table_id") REFERENCES "lineage_source"("lineage_source_id")
);
CREATE TABLE IF NOT EXISTS "privacy_policy" (
    "privacy_policy_id" INTEGER,
    "policy_name" TEXT NOT NULL,
    "policy_description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "access_control" (
    "access_control_id" INTEGER,
    "table_name" TEXT NOT NULL,
    "column_name" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "permission_type" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "audit_log" (
    "audit_log_id" INTEGER,
    "table_name" TEXT NOT NULL,
    "column_name" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_date" DATE NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "retention_policy" (
    "retention_policy_id" INTEGER,
    "table_name" TEXT NOT NULL,
    "retention_period" INTEGER NOT NULL,
    "retention_description" DATE NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "archival" (
    "archival_id" INTEGER,
    "table_name" TEXT NOT NULL,
    "archival_location" TEXT NOT NULL,
    "archival_date" DATE NOT NULL,
    "archival_policy" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT
);
CREATE TABLE IF NOT EXISTS "lineage_history" (
    "lineage_history_id" INTEGER,
    "lineage_id" INTEGER NOT NULL,
    "modification_type" TEXT NOT NULL,
    "modified_by" TEXT NOT NULL,
    "modification_date" DATE NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" TEXT,
    FOREIGN KEY("lineage_id") REFERENCES "data_lineage"("data_lineage_id")
);


--content views
-- {allContentViews}

-- seed Data
-- {allReferenceTables.map(e => e.seedDML).flat()}
;

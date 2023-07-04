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
    "activity_log" JSONB
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
    "activity_log" JSONB
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
    "activity_log" JSONB
);

-- content tables
-- TODO:SqlObjectComment
CREATE TABLE IF NOT EXISTS "lineage_source" (
    "lineage_source_id" SERIAL PRIMARY KEY,
    "lineage_source_type_id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" JSONB,
    FOREIGN KEY("lineage_source_type_id") REFERENCES "lineage_source_type"("lineage_source_type_id")
);
CREATE TABLE IF NOT EXISTS "lineage_destination" (
    "lineage_destination_id" SERIAL PRIMARY KEY,
    "lineage_dest_type_id" TEXT NOT NULL,
    "dest_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" JSONB,
    FOREIGN KEY("lineage_dest_type_id") REFERENCES "lineage_destination_type"("lineage_destination_type_id")
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
    "activity_log" JSONB,
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
    "activity_log" JSONB,
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
    "activity_log" JSONB,
    FOREIGN KEY("source_table_id") REFERENCES "lineage_source"("lineage_source_id"),
    FOREIGN KEY("lineage_destination_id") REFERENCES "lineage_destination"("lineage_destination_id"),
    FOREIGN KEY("transformation_id") REFERENCES "lineage_transform"("lineage_transform_id")
);




--content views
-- {allContentViews}

-- seed Data
-- {allReferenceTables.map(e => e.seedDML).flat()}
;

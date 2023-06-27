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
    echo "No database file supplied. Usage: ./your_script.sh [--destroy-first] <database_file> [<sqlite3 arguments>...]"
    exit 1
fi

# If the destroy_first flag is set, delete the database file
if [ $destroy_first -eq 1 ] && [ -f "$db_file" ]; then
    rm "$db_file"
fi

SQL=$(cat <<-EOF
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

COMMENT ON column "lineage_source_type"."activity_log" IS '{"isSqlDomainZodDescrMeta":true,"isJsonSqlDomain":true}';
COMMENT ON column "lineage_destination_type"."activity_log" IS '{"isSqlDomainZodDescrMeta":true,"isJsonSqlDomain":true}';
COMMENT ON column "lineage_transform_type"."activity_log" IS '{"isSqlDomainZodDescrMeta":true,"isJsonSqlDomain":true}';
COMMENT ON table "lineage_source" IS 'Entity representing sources of data transformations.';
COMMENT ON column "lineage_source"."source_name" IS 'The name of the data source from which the lineage originates.';
COMMENT ON column "lineage_source"."description" IS 'Description or additional information about the data source.';
COMMENT ON column "lineage_source"."activity_log" IS '{"isSqlDomainZodDescrMeta":true,"isJsonSqlDomain":true}';
COMMENT ON table "lineage_destination" IS 'Entity representing destinations of data transformations.';
COMMENT ON column "lineage_destination"."dest_name" IS 'The name of the data destination to the lineage target.';
COMMENT ON column "lineage_destination"."description" IS 'Description or additional information about the data target.';
COMMENT ON column "lineage_destination"."activity_log" IS '{"isSqlDomainZodDescrMeta":true,"isJsonSqlDomain":true}';
COMMENT ON table "lineage_transform" IS 'Entity representing transformations of data transformations.';
COMMENT ON column "lineage_transform"."transform_name" IS 'The name of the data transormation';
COMMENT ON column "lineage_transform"."description" IS 'Description of the transformation';
COMMENT ON column "lineage_transform"."activity_log" IS '{"isSqlDomainZodDescrMeta":true,"isJsonSqlDomain":true}';
COMMENT ON table "lineage_graph_node" IS 'Entity representing a single node of the lineage graph.';
COMMENT ON column "lineage_graph_node"."lineage_source_id" IS 'Foreign key referencing the lineage_source_id column in the lineage_source table.';
COMMENT ON column "lineage_graph_node"."lineage_dest_id" IS 'Foreign key referencing the lineage_dest_id column in the lineage_target table.';
COMMENT ON column "lineage_graph_node"."lineage_transform_id" IS 'Foreign key referencing the lineage_transform_id column in the lineage_transform table.';
COMMENT ON column "lineage_graph_node"."description" IS 'description or additional information about the node of the lineage graph';
COMMENT ON column "lineage_graph_node"."activity_log" IS '{"isSqlDomainZodDescrMeta":true,"isJsonSqlDomain":true}';
COMMENT ON table "data_lineage" IS 'Used for trace and understand the origin, transformations, and movement of data / managing data lineage.';
COMMENT ON column "data_lineage"."source_table_id" IS 'Foreign key referencing the lineage_source_id column in the lineage_source table.';
COMMENT ON column "data_lineage"."lineage_destination_id" IS 'Foreign key referencing the lineage_dest_id column in the lineage_target table.';
COMMENT ON column "data_lineage"."transformation_id" IS 'Foreign key referencing the lineage_transform_id column in the lineage_transform table.';
COMMENT ON column "data_lineage"."lineage_type" IS 'TODO';
COMMENT ON column "data_lineage"."lineage_quality_rating" IS 'The quality rating of the data lineage entry, indicating the reliability or trustworthiness of the lineage information.';
COMMENT ON column "data_lineage"."activity_log" IS '{"isSqlDomainZodDescrMeta":true,"isJsonSqlDomain":true}';


--content views
-- {allContentViews}

-- seed Data
-- {allReferenceTables.map(e => e.seedDML).flat()}
;

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
  
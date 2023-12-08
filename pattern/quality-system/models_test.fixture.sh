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
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" JSONB
);
CREATE TABLE IF NOT EXISTS "lineage_destination_type" (
    "lineage_destination_type_id" TEXT PRIMARY KEY NOT NULL,
    "lineage_destination_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" JSONB
);
CREATE TABLE IF NOT EXISTS "lineage_transform_type" (
    "lineage_transform_type_id" TEXT PRIMARY KEY NOT NULL,
    "lineage_transform_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
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
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" JSONB,
    FOREIGN KEY("lineage_source_type_id") REFERENCES "lineage_source_type"("lineage_source_type_id")
);
CREATE TABLE IF NOT EXISTS "lineage_destination" (
    "lineage_destination_id" SERIAL PRIMARY KEY,
    "lineage_dest_type_id" TEXT NOT NULL,
    "dest_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" JSONB,
    FOREIGN KEY("lineage_dest_type_id") REFERENCES "lineage_destination_type"("lineage_destination_type_id")
);
CREATE TABLE IF NOT EXISTS "lineage_transform" (
    "lineage_transform_id" SERIAL PRIMARY KEY,
    "lineage_transform_type_id" TEXT NOT NULL,
    "transform_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
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
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
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
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
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
  
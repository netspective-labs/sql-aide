-- synthetic / test data
CREATE SCHEMA IF NOT EXISTS "info_schema_lifecycle";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "info_schema_lifecycle";

CREATE OR REPLACE PROCEDURE "info_schema_lifecycle"."islm_init"() AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS "info_schema_lifecycle"."islm_governance" (
      "islm_governance_id" TEXT PRIMARY KEY NOT NULL,
      "state_sort_index" FLOAT NOT NULL,
      "sp_migration" TEXT NOT NULL,
      "sp_migration_undo" TEXT NOT NULL,
      "fn_migration_status" TEXT NOT NULL,
      "from_state" TEXT NOT NULL,
      "to_state" TEXT NOT NULL,
      "transition_result" JSONB NOT NULL,
      "transition_reason" TEXT NOT NULL,
      "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      "created_by" TEXT DEFAULT 'UNKNOWN',
      "updated_at" TIMESTAMPTZ,
      "updated_by" TEXT,
      "deleted_at" TIMESTAMPTZ,
      "deleted_by" TEXT,
      "activity_log" JSONB,
      UNIQUE("sp_migration", "from_state", "to_state")
  );
  EXCEPTION
  -- Catch the exception if the table already exists
  WHEN duplicate_table THEN
    -- Do nothing, just ignore the exception
    NULL;
  
END;
$$ LANGUAGE PLPGSQL;

CREATE OR REPLACE PROCEDURE "info_schema_lifecycle"."islm_migrate_ctl"("task" TEXT, "target_version_number" FLOAT) AS $$
BEGIN
  DECLARE
    r RECORD;
    t text;
  BEGIN
    CASE task
    WHEN 'migrate' THEN
      FOR r IN (
        SELECT sp_migration,sp_migration_undo,fn_migration_status FROM info_schema_lifecycle.islm_governance WHERE from_state = 'None' AND to_state = 'SQL Loaded' AND (state_sort_index NOT IN (SELECT state_sort_index FROM info_schema_lifecycle.islm_governance WHERE from_state = 'SQL Loaded' AND to_state = 'Migrated')) AND
        (target_version_number IS NULL OR state_sort_index<=target_version_number)
        ORDER BY state_sort_index
      ) LOOP
        -- Check if migration has been executed
        -- Construct procedure and status function names
          DECLARE
            procedure_name TEXT := format('info_schema_lifecycle."%s"()', r.sp_migration);
            procedure_undo_name TEXT := format('info_schema_lifecycle."%s"()', r.sp_migration_undo);
            status_function_name TEXT := format('info_schema_lifecycle."%s"()', r.fn_migration_status);
            islm_governance_id TEXT:= info_schema_lifecycle.uuid_generate_v4();
            status INT;
            migrate_insertion_sql TEXT;
          BEGIN
            -- Check if migration has been executed
            --EXECUTE SELECT (status_function_name)::INT INTO status;
            EXECUTE 'SELECT ' || status_function_name INTO status;
  
            IF status = 0 THEN
              -- Call the migration procedure
              EXECUTE  'call ' || procedure_name;
  
              -- Insert into the governance table
              migrate_insertion_sql := $dynSQL$
                INSERT INTO info_schema_lifecycle.islm_governance ("islm_governance_id","state_sort_index", "sp_migration", "sp_migration_undo", "fn_migration_status", "from_state", "to_state", "transition_result", "transition_reason") VALUES ($1, $2, $3, $4, $5, 'SQL Loaded', 'Migrated', '{}', 'Migration') ON CONFLICT DO NOTHING
              $dynSQL$;
              EXECUTE migrate_insertion_sql USING islm_governance_id, target_version_number, r.sp_migration, r.sp_migration_undo, r.fn_migration_status;
            END IF;
          END;
      END LOOP;
    WHEN 'rollback' THEN
    -- Implement rollback logic here...
    -- Construct procedure names
      DECLARE
        migrate_rb_insertion_sql TEXT;
        procedure_name text;
        procedure_undo_name text;
        status_function_name text;
        islm_governance_id text;
        sp_migration_undo_sql RECORD;
      BEGIN
        SELECT sp_migration,sp_migration_undo,fn_migration_status FROM info_schema_lifecycle.islm_governance WHERE from_state = 'SQL Loaded' AND to_state = 'Migrated' AND state_sort_index=target_version_number AND (target_version_number IN (SELECT state_sort_index FROM info_schema_lifecycle.islm_governance WHERE from_state = 'SQL Loaded' AND to_state = 'Migrated' ORDER BY state_sort_index DESC LIMIT 1))  INTO sp_migration_undo_sql;
        IF sp_migration_undo_sql IS NOT NULL THEN
          procedure_name := format('info_schema_lifecycle."%s"()', sp_migration_undo_sql.sp_migration);
          procedure_undo_name := format('info_schema_lifecycle."%s"()', sp_migration_undo_sql.sp_migration_undo);
          status_function_name := format('info_schema_lifecycle."%s"()', sp_migration_undo_sql.fn_migration_status);
          islm_governance_id := info_schema_lifecycle.uuid_generate_v4();
          EXECUTE  'call ' || procedure_undo_name;
  
          -- Insert the governance table
          migrate_rb_insertion_sql := $dynSQL$
                    INSERT INTO info_schema_lifecycle.islm_governance ("islm_governance_id","state_sort_index", "sp_migration", "sp_migration_undo", "fn_migration_status", "from_state", "to_state", "transition_result", "transition_reason") VALUES ($1, $2, $3, $4, $5, 'Migrated', 'Rollback', '{}', 'Rollback for migration') ON CONFLICT DO NOTHING
  
                  $dynSQL$;
          EXECUTE migrate_rb_insertion_sql USING islm_governance_id, target_version_number, sp_migration_undo_sql.sp_migration, sp_migration_undo_sql.sp_migration_undo, sp_migration_undo_sql.fn_migration_status;
        ELSE
          RAISE EXCEPTION 'Cannot perform a rollback for this version';
        END IF;
      END;
    ELSE
      RAISE EXCEPTION 'Unknown task: %', task;
    END CASE;
  
  END;
  
END;
$$ LANGUAGE PLPGSQL;

CREATE OR REPLACE PROCEDURE "info_schema_lifecycle"."migrate_sample_20231016101645"() AS $migrateVersionSP$
BEGIN
  IF info_schema_lifecycle."migration_sample_20231016101645_status"() = 0 THEN
    -- Add any PostgreSQL you need either manually constructed or SQLa.
-- Your code will be placed automatically into a ISLM migration stored procedure.
-- Use SQLa or Atlas for any code that you need. For example:

  /*
   CREATE SCHEMA IF NOT EXISTS "sample_schema";
   CREATE TABLE IF NOT EXISTS "sample_schema"."sample_table1" (
    "sample_table1_id" SERIAL PRIMARY KEY,
    "name" TEXT,
    "age" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "activity_log" JSONB
);
  */


        
  END IF;
END

$migrateVersionSP$ LANGUAGE PLPGSQL;

CREATE OR REPLACE PROCEDURE "info_schema_lifecycle"."migration_sample_20231016101645_undo"() AS $migrateVersionUndo$
BEGIN
  -- Add any PostgreSQL you need either manually constructed or SQLa.
  -- Your code will be placed automatically into a ISLM rollback stored procedure.
  -- DROP table if exists "sample_schema".sample_table1;
          
END;
$migrateVersionUndo$ LANGUAGE PLPGSQL;

CREATE OR REPLACE FUNCTION "info_schema_lifecycle"."migration_sample_20231016101645_status"() RETURNS integer AS $fnMigrateVersionStatus$
DECLARE
  status INTEGER := 0; -- Initialize status to 0 (not executed)
BEGIN
  -- Add any PostgreSQL you need either manually constructed or SQLa.
  -- Your code will be placed automatically into a ISLM status stored function.
  -- All your checks must be idempotent and not have any side effects.
  -- Use information_schema and other introspection capabilities of PostgreSQL
  -- instead of manually checking. For example:
  
  -- IF EXISTS (
  --  SELECT FROM information_schema.columns
  --  WHERE table_name = 'sample_table1'
  -- ) THEN
  --  status := 1; -- Set status to 1 (already executed)
  -- END IF;
  RETURN status; -- Return the status
          
END;

$fnMigrateVersionStatus$ LANGUAGE PLPGSQL;

CALL islm_init();
INSERT INTO "islm_governance" ("islm_governance_id", "state_sort_index", "sp_migration", "sp_migration_undo", "fn_migration_status", "from_state", "to_state", "transition_result", "transition_reason", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('1b671a64-40d5-491e-99b0-da01ff1f3341', 1, 'migration_Vsample20231016101645', 'migration_Vsample20231016101645_undo', 'migration_Vsample20231016101645_status', 'None', 'SQL Loaded', '{}', 'SQL load for migration', (CURRENT_TIMESTAMP), 'Admin', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;



-- synthetic / test data
CREATE SCHEMA IF NOT EXISTS "info_schema_lifecycle";

CREATE OR REPLACE PROCEDURE "info_schema_lifecycle"."islm_init"() AS $$
BEGIN
  CREATE TABLE "info_schema_lifecycle"."islm_governance" (
      "version" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "applied_at" TIMESTAMP NOT NULL,
      "execution_time" INTEGER NOT NULL,
      "success" BOOLEAN NOT NULL,
      "rollback_status" BOOLEAN NOT NULL,
      UNIQUE("version")
  );
  
END;
$$ LANGUAGE PLPGSQL;

CREATE OR REPLACE PROCEDURE "info_schema_lifecycle"."islm_migrate_ctl"("task" TEXT, "target_version" TEXT) AS $$
BEGIN
  DECLARE
    r RECORD;
  BEGIN
    CASE task
    WHEN 'migrate' THEN
      FOR r IN (
        SELECT version FROM info_schema_lifecycle.islm_governance WHERE success IS NULL AND ($1 IS NULL OR version <= $1)
        ORDER BY version
      ) LOOP
        -- Check if migration has been executed
        -- Construct procedure and status function names
          DECLARE
            procedure_name TEXT := format('info_schema_lifecycle.migrate_%s()', r.version);
            status_function_name TEXT := format('info_schema_lifecycle.migrate_%s_status()', r.version);
            status INT;
          BEGIN
            -- Check if migration has been executed
            --EXECUTE SELECT (status_function_name)::INT INTO status;
            EXECUTE 'SELECT ' || status_function_name INTO status;
  
            IF status = 0 THEN
              -- Call the migration procedure
              EXECUTE procedure_name;
  
              -- Update the governance table
              EXECUTE format('
                UPDATE info_schema_lifecycle.islm_governance
                SET success = TRUE,
                  applied_at = NOW()
                WHERE version = $1', r.version)
              USING r.version;
            END IF;
          END;
      END LOOP;
    WHEN 'rollback' THEN
    -- Implement rollback logic here...
    -- Construct procedure names
      EXECUTE format('CALL info_schema_lifecycle.migrate_%s_undo()', target_version);
  
      -- Update the governance table, corrected WHERE clause
      EXECUTE format('
          UPDATE info_schema_lifecycle.islm_governance
          SET rollback_status = TRUE,
              applied_at = NOW()
          WHERE version = $1', target_version)
      USING target_version;
    ELSE
      RAISE EXCEPTION 'Unknown task: %', task;
    END CASE;
  
  END;
  
END;
$$ LANGUAGE PLPGSQL;

SET search_path TO "info_schema_lifecycle";

INSERT INTO "islm_governance" ("version", "description", "applied_at", "execution_time", "success", "rollback_status") VALUES ('Vsample20231016_101645', 'Initial migration', '2023-10-16T00:00:00.000Z', 10, true, false) ON CONFLICT DO NOTHING;

CREATE OR REPLACE PROCEDURE "info_schema_lifecycle"."migrate_Vsample20231016_101645"() AS $migrateVersionVsample20231016_101645SP$
IF info_schema_lifecycle.migration_Vsample20231016_101645_status() = 0 THEN
  -- Add any PostgreSQL you need either manually constructed or SQLa.
-- Your code will be placed automatically into a ISLM migration stored procedure.
-- Use SQLa or Atlas for any code that you need. For example:

  CREATE SCHEMA IF NOT EXISTS "sample_schema"
  SET search_path TO "sample_schema";
  CREATE TABLE IF NOT EXISTS "sample_table1" (
    "sample_table1_id" SERIAL PRIMARY KEY,
    "name" TEXT,
    "age" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" JSONB
)

        
END IF;

$migrateVersionVsample20231016_101645SP$ LANGUAGE PLPGSQL;

CREATE OR REPLACE PROCEDURE "info_schema_lifecycle"."migration_Vsample20231016_101645_undo"() AS $migrateVersionVsample20231016_101645undo$
BEGIN
  -- Add any PostgreSQL you need either manually constructed or SQLa.
  -- Your code will be placed automatically into a ISLM rollback stored procedure.
          
END;
$migrateVersionVsample20231016_101645undo$ LANGUAGE PLPGSQL;

CREATE OR REPLACE FUNCTION "info_schema_lifecycle"."migration_Vsample20231016_101645_status"() RETURNS text AS $fnMigrateVersionVsample20231016_101645Status$
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

$fnMigrateVersionVsample20231016_101645Status$ LANGUAGE PLPGSQL;



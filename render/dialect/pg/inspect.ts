#!/usr/bin/env -S deno run --allow-all

import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as SQLa from "../../mod.ts";

const getMetaDataSQL = await Deno.readTextFile("inspect.sql");
/**
 * Generate the SQL for a stored routine that can produce a comprehensive
 * summary of all meta data associated with a given schema name.
 * @returns SqlTextSupplier which contains the idempotent stored routine
 */
export function schemaMetaData<Context extends SQLa.SqlEmitContext>() {
  const result: SQLa.SqlTextSupplier<Context> = {
    SQL: () => {
      return uws(`
      ${getMetaDataSQL}
    `);
    },
  };
  return result;
}

/**
 * Generate the SQL for a stored routine that can produce a basic PlantUML
 * source file for the given schema's tables, views, procedures, and functions.
 * @returns SqlTextSupplier which contains the idempotent stored routine
 */
export function plantUmlERD<Context extends SQLa.SqlEmitContext>() {
  const result: SQLa.SqlTextSupplier<Context> = {
    SQL: () => {
      return uws(`
        CREATE OR REPLACE FUNCTION plantuml_erd(p_schema_name TEXT) RETURNS TEXT AS $$
        DECLARE
            result TEXT := '';
            entity_separator TEXT := '';
        BEGIN
            -- Retrieve tables and columns
            FOR table_rec IN (
                SELECT
                    t.table_name,
                    c.column_name,
                    c.data_type,
                    c.character_maximum_length,
                    c.column_default,
                    c.is_nullable
                FROM
                    information_schema.tables t
                INNER JOIN
                    information_schema.columns c
                    ON t.table_name = c.table_name
                WHERE
                    t.table_schema = p_schema_name
                    AND t.table_type = 'BASE TABLE'
            ) LOOP
                -- Append table and column definitions to the result string
                result := result || entity_separator || 'class ' || table_rec.table_name || ' {' || E'\\n';
                result := result || '    +' || table_rec.column_name || ': ' || table_rec.data_type;
                IF table_rec.character_maximum_length IS NOT NULL THEN
                    result := result || '(' || table_rec.character_maximum_length || ')';
                END IF;
                IF table_rec.column_default IS NOT NULL THEN
                    result := result || ' = ' || table_rec.column_default;
                END IF;
                IF table_rec.is_nullable = 'NO' THEN
                    result := result || ' [not null]';
                END IF;
                result := result || E'\\n';
                result := result || '}' || E'\\n';

                entity_separator := '    ';
            END LOOP;

            -- Retrieve views
            FOR view_rec IN (
                SELECT
                    v.table_name,
                    c.column_name,
                    c.data_type,
                    c.character_maximum_length,
                    c.column_default,
                    c.is_nullable
                FROM
                    information_schema.views v
                INNER JOIN
                    information_schema.columns c
                    ON v.table_name = c.table_name
                WHERE
                    v.table_schema = p_schema_name
            ) LOOP
                -- Append view and column definitions to the result string
                result := result || entity_separator || 'class ' || view_rec.table_name || ' <<view>> {' || E'\\n';
                result := result || '    +' || view_rec.column_name || ': ' || view_rec.data_type;
                IF view_rec.character_maximum_length IS NOT NULL THEN
                    result := result || '(' || view_rec.character_maximum_length || ')';
                END IF;
                IF view_rec.column_default IS NOT NULL THEN
                    result := result || ' = ' || view_rec.column_default;
                END IF;
                IF view_rec.is_nullable = 'NO' THEN
                    result := result || ' [not null]';
                END IF;
                result := result || E'\\n';
                result := result || '}' || E'\\n';

                entity_separator := '    ';
            END LOOP;

            -- Retrieve procedures
            FOR proc_rec IN (
                SELECT
                    p.proname AS procedure_name,
                    pg_get_function_arguments(p.oid) AS arguments,
                    pg_get_function_result(p.oid) AS return_type
                FROM
                    pg_catalog.pg_proc p
                LEFT JOIN
                    pg_catalog.pg_namespace n
                    ON n.oid = p.pronamespace
                WHERE
                    n.nspname = p_schema_name
            ) LOOP
                -- Append procedure definition to the result string
                result := result || entity_separator || 'class ' || proc_rec.procedure_name || ' <<procedure>> {' || E'\\n';
                result := result || '    +' || proc_rec.arguments || ' : ' || proc_rec.return_type || E'\\n';
                result := result || '}' || E'\\n';

                entity_separator := '    ';
            END LOOP;

            -- Retrieve functions
            FOR func_rec IN (
                SELECT
                    p.proname AS function_name,
                    pg_get_function_arguments(p.oid) AS arguments,
                    pg_get_function_result(p.oid) AS return_type
                FROM
                    pg_catalog.pg_proc p
                LEFT JOIN
                    pg_catalog.pg_namespace n
                    ON n.oid = p.pronamespace
                WHERE
                    n.nspname = p_schema_name
                    AND p.prokind = 'f'
            ) LOOP
                -- Append function definition to the result string
                result := result || entity_separator || 'class ' || func_rec.function_name || ' <<function>> {' || E'\\n';
                result := result || '    +' || func_rec.arguments || ' : ' || func_rec.return_type || E'\\n';
                result := result || '}' || E'\\n';

                entity_separator := '    ';
            END LOOP;

            -- Retrieve foreign key relationships
            FOR fk_rec IN (
                SELECT
                    kcu.table_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM
                    information_schema.table_constraints AS tc
                JOIN
                    information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN
                    information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE
                    tc.table_schema = p_schema_name
                    AND tc.constraint_type = 'FOREIGN KEY'
            ) LOOP
                -- Append relationship definition to the result string
                result := result || fk_rec.table_name || ' "1" -- "0..*" ' || fk_rec.foreign_table_name || ' : has' || E'\\n';
            END LOOP;

            RETURN result;
        END;
        $$ LANGUAGE plpgsql`);
    },
  };
  return result;
}

if (import.meta.main) {
  new cli.Command()
    .name("inspect")
    .description("Emit PostgreSQL inspection SQL")
    .action(() => {
      const result = SQLa.SQL(SQLa.typicalSqlTextSupplierOptions())`
        ${schemaMetaData()}

        ${plantUmlERD()}
      `;
      console.log(uws(result.SQL(SQLa.typicalSqlEmitContext())));
    })
    .parse();
}

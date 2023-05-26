#!/usr/bin/env -S deno run --allow-all

import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as SQLa from "../../mod.ts";

/**
 * Generate the SQL for a stored routine that can produce a comprehensive
 * summary of all meta data associated with a given schema name.
 * @returns SqlTextSupplier which contains the idempotent stored routine
 */
export function schemaMetaData<Context extends SQLa.SqlEmitContext>() {
  const result: SQLa.SqlTextSupplier<Context> = {
    SQL: () => {
      return uws(`
        CREATE OR REPLACE FUNCTION get_schema_metadata(schema_name text) RETURNS json AS $$
        DECLARE
          result json;
        BEGIN
          SELECT json_build_object(
            'tables', (
              SELECT json_agg(json_build_object(
                'table_name', table_name,
                'columns', (
                  SELECT json_agg(json_build_object(
                    'column_name', column_name,
                    'data_type', data_type,
                    'is_nullable', is_nullable,
                    'character_maximum_length', character_maximum_length,
                    'numeric_precision', numeric_precision,
                    'numeric_scale', numeric_scale
                    ))
                  FROM information_schema.columns
                  WHERE table_schema = schema_name AND table_name = t.table_name
                ),
                'indexes', (
                  SELECT json_agg(json_build_object(
                    'index_name', index_name,
                    'index_columns', index_columns,
                    'is_unique', index_is_unique,
                    'is_primary', index_is_primary
                    ))
                  FROM (
                    SELECT i.relname AS index_name,
                          array_agg(a.attname) AS index_columns,
                          bool_or(i.indisunique) AS index_is_unique,
                          bool_or(i.indisprimary) AS index_is_primary
                    FROM pg_index idx
                    JOIN pg_class t ON t.oid = idx.indrelid
                    JOIN pg_class i ON i.oid = idx.indexrelid
                    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
                    WHERE t.relkind = 'r'::"char" AND t.relname NOT LIKE 'pg_%' AND t.relname NOT LIKE 'sql_%'
                      AND idx.indisprimary = FALSE AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                    GROUP BY i.relname
                  ) AS indexes
                ),
                'constraints', (
                  SELECT json_agg(json_build_object(
                    'constraint_name', constraint_name,
                    'constraint_type', constraint_type,
                    'table_name', table_name,
                    'columns', columns
                    ))
                  FROM (
                    SELECT tc.constraint_name, tc.constraint_type, tc.table_name,
                          array_agg(kcu.column_name) AS columns
                    FROM information_schema.table_constraints tc
                    LEFT JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                      AND tc.table_name = kcu.table_name
                    WHERE tc.table_schema = schema_name
                    GROUP BY tc.constraint_name, tc.constraint_type, tc.table_name
                  ) AS constraints
                ),
                'check_constraints', (
                  SELECT json_agg(json_build_object(
                    'constraint_name', constraint_name,
                    'table_name', table_name,
                    'check_clause', check_clause
                    ))
                  FROM information_schema.check_constraints
                  WHERE constraint_schema = schema_name
                ),
                'table_comments', (
                  SELECT json_agg(json_build_object(
                    'table_name', c.relname,
                    'comment', pg_catalog.obj_description(c.oid, 'pg_class')
                    ))
                  FROM pg_class c
                  JOIN pg_namespace n ON c.relnamespace = n.oid
                  WHERE n.nspname = schema_name AND c.relkind = 'r'::"char"
                ),
                'foreign_keys', (
                  SELECT json_agg(json_build_object(
                    'constraint_name', conname,
                    'table_name', conrelid::regclass,
                    'foreign_table_name', confrelid::regclass,
                    'columns', (
                      SELECT json_agg(json_build_object(
                        'column_name', colname,
                        'foreign_column_name', confkey[array_position(conkey, colnum)]
                        ))
                      FROM pg_constraint
                      JOIN pg_attribute ON conrelid = attrelid AND unnest(conkey) = attnum
                      WHERE conrelid = c.oid AND confrelid = confoid
                    )
                  ))
                  FROM pg_constraint
                  JOIN pg_class c ON conrelid = c.oid
                  JOIN pg_namespace n ON c.relnamespace = n.oid
                  WHERE n.nspname = schema_name AND contype = 'f'
                ),
                'triggers', (
                  SELECT json_agg(json_build_object(
                    'trigger_name', tgname,
                    'event', tgtype::text,
                    'event_object_table', relname,
                    'action_statement', tgdeferrable || ' ' || tginitdeferred || ' ' || tgenabled || ' ' || tgdefinition
                    ))
                  FROM pg_trigger
                  JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
                  JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
                  WHERE pg_namespace.nspname = schema_name
                ),
                'sequences', (
                  SELECT json_agg(json_build_object(
                    'sequence_name', sequence_name,
                    'data_type', data_type,
                    'start_value', start_value,
                    'minimum_value', minimum_value,
                    'maximum_value', maximum_value,
                    'increment', increment,
                    'cycle_option', is_cycled
                    ))
                  FROM information_schema.sequences
                  WHERE sequence_schema = schema_name
                ),
                'materialized_views', (
                  SELECT json_agg(json_build_object(
                    'view_name', matviewname,
                    'definition', pg_get_viewdef(c.oid)
                    ))
                  FROM pg_matviews m
                  JOIN pg_class c ON m.matviewname = c.relname
                  WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                ),
                'rules', (
                  SELECT json_agg(json_build_object(
                    'rule_name', rulename,
                    'event', ev_type,
                    'condition', ev_condition,
                    'action', ev_action
                    ))
                  FROM pg_rules
                  WHERE schemaname = schema_name
                ),
                'table_partitions', (
                  SELECT json_agg(json_build_object(
                    'table_name', partitiontablename,
                    'partition_name', partitionname,
                    'partition_method', partitionmethod,
                    'partition_expression', partitionexpression
                    ))
                  FROM pg_partitioned_table
                  WHERE partnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                ),
                'table_statistics', (
                  SELECT json_agg(json_build_object(
                    'table_name', relname,
                    'total_rows', reltuples,
                    'total_pages', relpages
                    ))
                  FROM pg_class
                  WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name) AND relkind = 'r'::"char"
                ),
                'extended_statistics', (
                  SELECT json_agg(json_build_object(
                    'statistic_name', mname,
                    'table_name', mrelname,
                    'statistics', json_agg(json_build_object(
                      'column_name', mcolumn,
                      'value', mvalue
                      ))
                    ))
                  FROM pg_statistic
                  WHERE starelnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                  GROUP BY mname, mrelname
                ),
                'table_inheritance', (
                  SELECT json_agg(json_build_object(
                    'table_name', inhrelname,
                    'parent_table_name', parent.relname
                    ))
                  FROM pg_class inh
                  JOIN pg_inherits i ON inh.oid = i.inhrelid
                  JOIN pg_class parent ON i.inhparent = parent.oid
                  WHERE inh.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                ),
                'collations', (
                  SELECT json_agg(json_build_object(
                    'collation_name', collname,
                    'schema', collnamespace::regnamespace,
                    'data_type', collprovider::regproc
                    ))
                  FROM pg_collation
                  WHERE collnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                ),
                'domains', (
                  SELECT json_agg(json_build_object(
                    'domain_name', domain_name,
                    'data_type', data_type,
                    'default_value', domain_default,
                    'constraints', (
                      SELECT json_agg(json_build_object(
                        'constraint_name', constraint_name,
                        'constraint_type', constraint_type
                        ))
                      FROM information_schema.domain_constraints
                      WHERE domain_schema = schema_name AND domain_name = d.domain_name
                    )
                    ))
                  FROM information_schema.domains d
                  WHERE domain_schema = schema_name
                ),
                'user_defined_types', (
                  SELECT json_agg(json_build_object(
                    'type_name', typname,
                    'schema', typnamespace::regnamespace,
                    'internal_type', typbasetype::regtype,
                    'input_function', typinput::regprocedure,
                    'output_function', typoutput::regprocedure
                    ))
                  FROM pg_type
                  WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name) AND typtype = 'd'
                ),
                'operators', (
                  SELECT json_agg(json_build_object(
                    'operator_name', oprname,
                    'schema', oprnamespace::regnamespace,
                    'left_operand_type', oprleft::regtype,
                    'right_operand_type', oprright::regtype,
                    'operator_function', oprcode::regprocedure
                    ))
                  FROM pg_operator
                  WHERE oprnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                ),
                'operator_classes', (
                  SELECT json_agg(json_build_object(
                    'class_name', opcname,
                    'schema', opcnamespace::regnamespace,
                    'access_method', amname,
                    'operators', (
                      SELECT json_agg(json_build_object(
                        'operator_name', op.oprname,
                        'left_operand_type', op.oprleft::regtype,
                        'right_operand_type', op.oprright::regtype
                        ))
                      FROM pg_amop amop
                      JOIN pg_operator op ON amop.amopopr = op.oid
                      WHERE amop.amopfamily = opc.oid
                    )
                    ))
                  FROM pg_opclass opc
                  JOIN pg_am am ON opc.opcmethod = am.oid
                  WHERE opcnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                ),
                'operator_families', (
                  SELECT json_agg(json_build_object(
                    'family_name', opfname,
                    'schema', opfnamespace::regnamespace,
                    'access_method', amname,
                    'operator_classes', (
                      SELECT json_agg(json_build_object(
                        'class_name', opc.opcname,
                        'schema', opc.opcnamespace::regnamespace
                        ))
                      FROM pg_opfamily opc
                      WHERE opc.opfmethod = opf.oid
                    )
                    ))
                  FROM pg_opfamily opf
                  JOIN pg_am am ON opf.opfmethod = am.oid
                  WHERE opfnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                ),
                'extension_objects', (
                  SELECT json_agg(json_build_object(
                    'object_name', objname,
                    'object_type', objtype,
                    'schema', objnamespace::regnamespace,
                    'extension_name', extname
                    ))
                  FROM pg_extension_objects
                  WHERE objnamespace = (SELECT oid FROM pg_namespace WHERE nspname = schema_name)
                )
              )
            )
          INTO result;

          RETURN result;
        END;
        $$
        LANGUAGE plpgsql`);
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

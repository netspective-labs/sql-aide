/*
This function takes a schema name as input and returns metadata information about the tables, columns, indexes,
constraints, triggers, sequences, views, statistics, partitions, and other objects within that schema in the form
of a JSON object.

The function uses various PostgreSQL system catalogs, such as information_schema, pg_class,pg_namespace, pg_attribute,
pg_constraint, pg_trigger, pg_collation, pg_type, pg_operator, pg_am, pg_opclass, pg_opfamily, and pg_extension, to gather
the necessary metadata.

Overall, this function is designed to provide comprehensive schema information, enabling users to retrieve a detailed overview
of the structure and characteristics of database objects within a specified schema.
*/
CREATE OR REPLACE FUNCTION get_schema_metadata (schema_name text)
      RETURNS json
      AS $$
  DECLARE
      result json;
      database_details json;
  begin
      SELECT json_build_object('database_details',
      							(SELECT json_build_object('host', (SELECT reset_val FROM pg_settings WHERE name='listen_addresses'),
                               							  'port', (SELECT reset_val FROM pg_settings WHERE name='port'))),
                               'schema_details', (
        SELECT
          json_build_object('tables', (
                  SELECT
                      json_agg(json_build_object('table_name', table_name, 'columns', (
                                  SELECT
                                      json_agg(json_build_object('column_name', column_name, 'data_type', data_type, 'is_nullable', is_nullable, 'character_maximum_length', character_maximum_length, 'numeric_precision', numeric_precision, 'numeric_scale', numeric_scale))
                              FROM information_schema.columns
                              WHERE
                                  table_schema = schema_name
                                  AND table_name = t.table_name), 'indexes', (
                                  SELECT
                                      json_agg(json_build_object('index_name', index_name, 'index_columns', index_columns, 'is_unique', index_is_unique, 'is_primary', index_is_primary))
                                  FROM (
                                      SELECT
                                          i.relname AS index_name, array_agg(a.attname) AS index_columns, bool_or(idx.indisunique) AS index_is_unique, bool_or(idx.indisprimary) AS index_is_primary FROM pg_index idx
                                      JOIN pg_class t ON t.oid = idx.indrelid
                                      JOIN pg_class i ON i.oid = idx.indexrelid
                                      JOIN pg_attribute a ON a.attrelid = t.oid
                                          AND a.attnum = ANY (idx.indkey)
                                      WHERE
                                          t.relkind = 'r'::"char"
                                          AND t.relname NOT LIKE 'pg_%'
                                          AND t.relname NOT LIKE 'sql_%'
                                          AND idx.indisprimary = FALSE
                                          AND t.relnamespace = (
                                              SELECT
                                                  oid
                                              FROM pg_namespace
                                              WHERE
                                                  nspname = schema_name)
                                      GROUP BY i.relname) AS indexes), 'constraints', (
                                      SELECT
                                          json_agg(json_build_object('constraint_name', constraint_name, 'constraint_type', constraint_type, 'table_name', table_name, 'columns', columns))
                                      FROM (
                                          SELECT
                                              tc.constraint_name, tc.constraint_type, tc.table_name, array_agg(kcu.column_name) AS columns FROM information_schema.table_constraints tc
                                      LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                                          AND tc.table_schema = kcu.table_schema
                                          AND tc.table_name = kcu.table_name
                                      WHERE
                                          tc.table_schema = schema_name GROUP BY tc.constraint_name, tc.constraint_type, tc.table_name) AS constraints), 'check_constraints', (
                                      SELECT
                                          json_agg(json_build_object('constraint_name', constraint_name, 'table_name', table_name, 'check_clause', check_clause))
                                      FROM information_schema.check_constraints
                                      WHERE
                                          constraint_schema = schema_name), 'table_comments', (
                                          SELECT
                                              json_agg(json_build_object('table_name', c.relname, 'comment', pg_catalog.obj_description(c.oid, 'pg_class')))
                                          FROM pg_class c
                                          JOIN pg_namespace n ON c.relnamespace = n.oid
                                      WHERE
                                          n.nspname = schema_name
                                          AND c.relkind = 'r'::"char"), 'foreign_keys', (
                                          SELECT
                                              json_agg(json_build_object('constraint_name', conname, 'table_name', conrelid::regclass, 'foreign_table_name', confrelid::regclass, 'columns', (
                                                          SELECT
                                                              json_agg(json_build_object('column_name', pa.attname, 'foreign_column_name', confkey[array_position(conkey, pa.attnum)]))
                                                      FROM pg_constraint pc
                                                      JOIN pg_attribute pa ON pc.conrelid = pa.attrelid
                                                          AND pa.attnum = ANY (pc.conkey)
                                                  WHERE
                                                      pc.oid = c.oid
                                                      AND pc.confrelid = confrelid))) AS result FROM pg_constraint
                                          JOIN pg_class c ON conrelid = c.oid
                                          JOIN pg_namespace n ON c.relnamespace = n.oid
                                      WHERE
                                          n.nspname = schema_name
                                          AND contype = 'f'), 'triggers', (
                                          SELECT
                                              json_agg(json_build_object('trigger_name', tgname, 'event', tgtype::text, 'event_object_table', relname, 'action_statement', tgdeferrable || ' ' || tginitdeferred || ' ' || tgenabled || ' ' || pg_get_triggerdef(pg_trigger.oid)))
                                          FROM pg_trigger
                                          JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
                                          JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
                                      WHERE
                                          pg_namespace.nspname = schema_name), 'sequences', (
                                          SELECT
                                              json_agg(json_build_object('sequence_name', sequence_name, 'data_type', data_type, 'start_value', start_value, 'minimum_value', minimum_value, 'maximum_value', maximum_value, 'increment', INCREMENT, 'cycle_option', cycle_option))
                                          FROM information_schema.sequences
                                      WHERE
                                          sequence_schema = schema_name), 'materialized_views', (
                                          SELECT
                                              json_agg(json_build_object('view_name', matviewname, 'definition', pg_get_viewdef(c.oid)))
                                          FROM pg_matviews m
                                          JOIN pg_class c ON m.matviewname = c.relname
                                      WHERE
                                          c.relnamespace = (
                                              SELECT
                                                  oid
                                              FROM pg_namespace
                                          WHERE
                                              nspname = schema_name)), 'rules', (
                                      SELECT
                                          json_agg(json_build_object('trigger_name', tgname, 'event', tgtype::text, 'condition', pg_get_triggerdef(pg_trigger.oid), 'action', pg_get_triggerdef(pg_trigger.oid, TRUE)))
                                      FROM pg_trigger
                                      JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
                                      JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
                                  WHERE
                                      pg_namespace.nspname = schema_name), 'table_partitions', (
                                      SELECT
                                          json_agg(json_build_object('table_name', parent.relname, 'partition_name', child.relname, 'partition_expression', pg_get_expr(child.relpartbound, child.oid), 'partition_method', CASE WHEN child.relkind = 'p' THEN
                                                  'LIST'
                                              WHEN child.relkind = 'r' THEN
                                                  'RANGE'
                                              ELSE
                                                  'UNKNOWN'
                                              END))
                                      FROM pg_class parent
                                      JOIN pg_inherits ON parent.oid = pg_inherits.inhparent
                                      JOIN pg_class child ON pg_inherits.inhrelid = child.oid
                                      JOIN pg_namespace ON parent.relnamespace = pg_namespace.oid
                                  WHERE
                                      pg_namespace.nspname = schema_name
                                      AND parent.relkind = 'r'
                                      AND child.relkind = 'p'), 'table_statistics', (
                                      SELECT
                                          json_agg(json_build_object('table_name', relname, 'total_rows', reltuples, 'total_pages', relpages))
                                      FROM pg_class
                                  WHERE
                                      relnamespace = (
                                          SELECT
                                              oid
                                          FROM pg_namespace
                                      WHERE
                                          nspname = schema_name)
                                  AND relkind = 'r'::"char"), 'extended_statistics', (
                                  SELECT
                                      json_agg(json_build_object('statistic_name', t.attname, 'table_name', t.tablename, 'statistics', (
                                                  SELECT
                                                      json_agg(json_build_object('null_fraction', null_frac, 'distinct_values', n_distinct, 'most_common_values', most_common_vals, 'most_common_frequencies', most_common_freqs, 'histogram_bounds', histogram_bounds, 'correlation', correlation))
                                              FROM pg_stats
                                          WHERE
                                              pg_stats.schemaname = schema_name
                                              AND pg_stats.tablename = t.tablename
                                              AND pg_stats.attname = t.attname)))
                                  FROM pg_stats t
                              WHERE
                                  t.schemaname = schema_name), 'table_inheritance', (
                                  SELECT
                                      json_agg(json_build_object('table_name', inh.relname, 'parent_table_name', parent.relname))
                                  FROM pg_class inh
                                  JOIN pg_inherits i ON inh.oid = i.inhrelid
                                  JOIN pg_class parent ON i.inhparent = parent.oid
                              WHERE
                                  inh.relnamespace = (
                                      SELECT
                                          oid
                                      FROM pg_namespace
                                  WHERE
                                      nspname = schema_name)), 'collations', (
                              SELECT
                                  json_agg(json_build_object('collation_name', collname, 'schema', collnamespace::regnamespace, 'data_type', collprovider::regproc))
                              FROM pg_collation
                          WHERE
                              collnamespace = (
                                  SELECT
                                      oid
                                  FROM pg_namespace
                              WHERE
                                  nspname = schema_name)), 'domains', (
                          SELECT
                              json_agg(json_build_object('domain_name', domain_name, 'data_type', data_type, 'default_value', domain_default, 'constraints', (
                                          SELECT
                                              json_agg(json_build_object('constraint_name', constraint_name, 'constraint_type', 'domain'))
                                      FROM information_schema.domain_constraints
                                  WHERE
                                      domain_schema = schema_name
                                      AND domain_name = d.domain_name)))
                          FROM information_schema.domains d
                      WHERE
                          domain_schema = schema_name), 'user_defined_types', (
                          SELECT
                              json_agg(json_build_object('type_name', typname, 'schema', typnamespace::regnamespace, 'internal_type', typbasetype::regtype, 'input_function', typinput::regprocedure, 'output_function', typoutput::regprocedure))
                          FROM pg_type
                      WHERE
                          typnamespace = (
                              SELECT
                                  oid
                              FROM pg_namespace
                          WHERE
                              nspname = schema_name)
                      AND typtype = 'd'), 'operators', (
                      SELECT
                          json_agg(json_build_object('operator_name', oprname, 'schema', oprnamespace::regnamespace, 'left_operand_type', oprleft::regtype, 'right_operand_type', oprright::regtype, 'operator_function', oprcode::regprocedure))
                      FROM pg_operator
                  WHERE
                      oprnamespace = (
                          SELECT
                              oid
                          FROM pg_namespace
                      WHERE
                          nspname = schema_name)), 'operator_classes', (
                  SELECT
                      json_agg(json_build_object('class_name', opcname, 'schema', opcnamespace::regnamespace, 'access_method', amname, 'operators', (
                                  SELECT
                                      json_agg(json_build_object('operator_name', op.oprname, 'left_operand_type', op.oprleft::regtype, 'right_operand_type', op.oprright::regtype))
                              FROM pg_amop amop
                              JOIN pg_operator op ON amop.amopopr = op.oid
                          WHERE
                              amop.amopfamily = opc.oid)))
                  FROM pg_opclass opc
                  JOIN pg_am am ON opc.opcmethod = am.oid
              WHERE
                  opcnamespace = (
                      SELECT
                          oid
                      FROM pg_namespace
                  WHERE
                      nspname = schema_name)), 'operator_families', (
              SELECT
                  json_agg(json_build_object('family_name', opfname, 'schema', opfnamespace::regnamespace, 'access_method', amname, 'operator_classes', (
                              SELECT
                                  json_agg(json_build_object('class_name', opc.opfname, 'schema', opc.opfnamespace::regnamespace))
                          FROM pg_opfamily opc
                      WHERE
                          opc.opfmethod = opf.oid)))
              FROM pg_opfamily opf
              JOIN pg_am am ON opf.opfmethod = am.oid
          WHERE
              opfnamespace = (
                  SELECT
                      oid
                  FROM pg_namespace
              WHERE
                  nspname = schema_name)), 'extension_objects', (
          SELECT
              json_agg(json_build_object('object_name', extname, 'object_type', 'extension', 'schema', oid::regnamespace, 'extension_name', extname))
          FROM pg_extension objects
      WHERE
          oid = (
              SELECT
                  oid
              FROM pg_namespace
          WHERE
              nspname = schema_name))))
  FROM information_schema.tables t
  WHERE
      table_schema = schema_name)))) INTO result;
      RETURN result;
  END;
  $$
  LANGUAGE plpgsql;

-- Function to retrieve metadata about the database
-- Returns a JSON object containing details about the database, schemas, tables, columns, indexes, constraints, and more.

CREATE OR REPLACE FUNCTION get_database_metadata ()
      RETURNS json
      AS $$
  DECLARE
      result json;
  begin
  SELECT
    json_build_object('database_details', (
            SELECT
                json_build_object('host', (
                        SELECT
                            reset_val
                        FROM pg_settings
                        WHERE
                            name = 'listen_addresses'), 'port', (
                        SELECT
                            reset_val
                        FROM pg_settings
                    WHERE
                        name = 'port'), 'database_name', (
                    SELECT
                        current_database()), 'schemas', (
            SELECT
                json_build_object('schema_details', (
                        SELECT
                            json_agg(json_build_object('schema_name', s.nspname, 'table_details', (
                                        SELECT
                                            json_agg(json_build_object('table_name', table_name, 'columns', (
                                                        SELECT
                                                            json_agg(json_build_object('column_name', column_name, 'data_type', data_type, 'is_nullable', is_nullable, 'character_maximum_length', character_maximum_length, 'numeric_precision', numeric_precision, 'numeric_scale', numeric_scale))
                                                FROM information_schema.columns
                                            WHERE
                                                table_schema = s.nspname
                                                AND table_name = t.table_name), 'indexes', (
                                            SELECT
                                                json_agg(json_build_object('index_name', index_name, 'index_columns', index_columns, 'is_unique', index_is_unique, 'is_primary', index_is_primary))
                                        FROM (
                                            SELECT
                                                i.relname AS index_name, array_agg(a.attname) AS index_columns, bool_or(idx.indisunique) AS index_is_unique, bool_or(idx.indisprimary) AS index_is_primary FROM pg_index idx
                                            JOIN pg_class t ON t.oid = idx.indrelid
                                            JOIN pg_class i ON i.oid = idx.indexrelid
                                            JOIN pg_attribute a ON a.attrelid = t.oid
                                                AND a.attnum = ANY (idx.indkey)
                                        WHERE
                                            t.relkind = 'r'::"char"
                                            AND t.relname NOT LIKE 'pg_%'
                                            AND t.relname NOT LIKE 'sql_%'
                                            AND idx.indisprimary = FALSE
                                            AND t.relnamespace = (
                                                SELECT
                                                    oid
                                                FROM pg_namespace
                                            WHERE
                                                nspname = s.nspname)
                                    GROUP BY i.relname) AS indexes), 'constraints', (
                                    SELECT
                                        json_agg(json_build_object('constraint_name', constraint_name, 'constraint_type', constraint_type, 'table_name', table_name, 'columns', columns))
                                    FROM (
                                        SELECT
                                            tc.constraint_name, tc.constraint_type, tc.table_name, array_agg(kcu.column_name) AS columns FROM information_schema.table_constraints tc
                                    LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                                        AND tc.table_schema = kcu.table_schema
                                        AND tc.table_name = kcu.table_name
                                WHERE
                                    tc.table_schema = s.nspname GROUP BY tc.constraint_name, tc.constraint_type, tc.table_name) AS constraints), 'check_constraints', (
                                SELECT
                                    json_agg(json_build_object('constraint_name', constraint_name, 'table_name', table_name, 'check_clause', check_clause))
                                FROM information_schema.check_constraints
                            WHERE
                                constraint_schema = s.nspname), 'table_comments', (
                                SELECT
                                    json_agg(json_build_object('table_name', c.relname, 'comment', pg_catalog.obj_description(c.oid, 'pg_class')))
                                FROM pg_class c
                                JOIN pg_namespace n ON c.relnamespace = n.oid
                            WHERE
                                n.nspname = s.nspname
                                AND c.relkind = 'r'::"char"), 'foreign_keys', (
                                SELECT
                                    json_agg(json_build_object('constraint_name', conname, 'table_name', conrelid::regclass, 'foreign_table_name', confrelid::regclass, 'columns', (
                                                SELECT
                                                    json_agg(json_build_object('column_name', pa.attname, 'foreign_column_name', confkey[array_position(conkey, pa.attnum)]))
                                            FROM pg_constraint pc
                                            JOIN pg_attribute pa ON pc.conrelid = pa.attrelid
                                                AND pa.attnum = ANY (pc.conkey)
                                        WHERE
                                            pc.oid = c.oid
                                            AND pc.confrelid = confrelid))) AS result FROM pg_constraint
                                JOIN pg_class c ON conrelid = c.oid
                                JOIN pg_namespace n ON c.relnamespace = n.oid
                            WHERE
                                n.nspname = s.nspname
                                AND contype = 'f'), 'triggers', (
                                SELECT
                                    json_agg(json_build_object('trigger_name', tgname, 'event', tgtype::text, 'event_object_table', relname, 'action_statement', tgdeferrable || ' ' || tginitdeferred || ' ' || tgenabled || ' ' || pg_get_triggerdef(pg_trigger.oid)))
                                FROM pg_trigger
                                JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
                                JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
                            WHERE
                                pg_namespace.nspname = s.nspname), 'sequences', (
                                SELECT
                                    json_agg(json_build_object('sequence_name', sequence_name, 'data_type', data_type, 'start_value', start_value, 'minimum_value', minimum_value, 'maximum_value', maximum_value, 'increment', INCREMENT, 'cycle_option', cycle_option))
                                FROM information_schema.sequences
                            WHERE
                                sequence_schema = s.nspname), 'materialized_views', (
                                SELECT
                                    json_agg(json_build_object('view_name', matviewname, 'definition', pg_get_viewdef(c.oid)))
                                FROM pg_matviews m
                                JOIN pg_class c ON m.matviewname = c.relname
                            WHERE
                                c.relnamespace = (
                                    SELECT
                                        oid
                                    FROM pg_namespace
                                WHERE
                                    nspname = s.nspname)), 'rules', (
                            SELECT
                                json_agg(json_build_object('trigger_name', tgname, 'event', tgtype::text, 'condition', pg_get_triggerdef(pg_trigger.oid), 'action', pg_get_triggerdef(pg_trigger.oid, TRUE)))
                            FROM pg_trigger
                            JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
                            JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
                        WHERE
                            pg_namespace.nspname = s.nspname), 'table_partitions', (
                            SELECT
                                json_agg(json_build_object('table_name', parent.relname, 'partition_name', child.relname, 'partition_expression', pg_get_expr(child.relpartbound, child.oid), 'partition_method', CASE WHEN child.relkind = 'p' THEN
                                        'LIST'
                                    WHEN child.relkind = 'r' THEN
                                        'RANGE'
                                    ELSE
                                        'UNKNOWN'
                                    END))
                            FROM pg_class parent
                            JOIN pg_inherits ON parent.oid = pg_inherits.inhparent
                            JOIN pg_class child ON pg_inherits.inhrelid = child.oid
                            JOIN pg_namespace ON parent.relnamespace = pg_namespace.oid
                        WHERE
                            pg_namespace.nspname = s.nspname
                            AND parent.relkind = 'r'
                            AND child.relkind = 'p'), 'table_statistics', (
                            SELECT
                                json_agg(json_build_object('table_name', relname, 'total_rows', reltuples, 'total_pages', relpages))
                            FROM pg_class
                        WHERE
                            relnamespace = (
                                SELECT
                                    oid
                                FROM pg_namespace
                            WHERE
                                nspname = s.nspname)
                        AND relkind = 'r'::"char"), 'extended_statistics', (
                        SELECT
                            json_agg(json_build_object('statistic_name', t.attname, 'table_name', t.tablename, 'statistics', (
                                        SELECT
                                            json_agg(json_build_object('null_fraction', null_frac, 'distinct_values', n_distinct, 'most_common_values', most_common_vals, 'most_common_frequencies', most_common_freqs, 'histogram_bounds', histogram_bounds, 'correlation', correlation))
                                    FROM pg_stats
                                WHERE
                                    pg_stats.schemaname = s.nspname
                                    AND pg_stats.tablename = t.tablename
                                    AND pg_stats.attname = t.attname)))
                        FROM pg_stats t
                    WHERE
                        t.schemaname = s.nspname), 'table_inheritance', (
                        SELECT
                            json_agg(json_build_object('table_name', inh.relname, 'parent_table_name', parent.relname))
                        FROM pg_class inh
                        JOIN pg_inherits i ON inh.oid = i.inhrelid
                        JOIN pg_class parent ON i.inhparent = parent.oid
                    WHERE
                        inh.relnamespace = (
                            SELECT
                                oid
                            FROM pg_namespace
                        WHERE
                            nspname = s.nspname)), 'collations', (
                    SELECT
                        json_agg(json_build_object('collation_name', collname, 'schema', collnamespace::regnamespace, 'data_type', collprovider::regproc))
                    FROM pg_collation
                WHERE
                    collnamespace = (
                        SELECT
                            oid
                        FROM pg_namespace
                    WHERE
                        nspname = s.nspname)), 'domains', (
                SELECT
                    json_agg(json_build_object('domain_name', domain_name, 'data_type', data_type, 'default_value', domain_default, 'constraints', (
                                SELECT
                                    json_agg(json_build_object('constraint_name', constraint_name, 'constraint_type', 'domain'))
                            FROM information_schema.domain_constraints
                        WHERE
                            domain_schema = s.nspname
                            AND domain_name = d.domain_name)))
                FROM information_schema.domains d
            WHERE
                domain_schema = s.nspname), 'user_defined_types', (
                SELECT
                    json_agg(json_build_object('type_name', typname, 'schema', typnamespace::regnamespace, 'internal_type', typbasetype::regtype, 'input_function', typinput::regprocedure, 'output_function', typoutput::regprocedure))
                FROM pg_type
            WHERE
                typnamespace = (
                    SELECT
                        oid
                    FROM pg_namespace
                WHERE
                    nspname = s.nspname)
            AND typtype = 'd'), 'operators', (
            SELECT
                json_agg(json_build_object('operator_name', oprname, 'schema', oprnamespace::regnamespace, 'left_operand_type', oprleft::regtype, 'right_operand_type', oprright::regtype, 'operator_function', oprcode::regprocedure))
            FROM pg_operator
        WHERE
            oprnamespace = (
                SELECT
                    oid
                FROM pg_namespace
            WHERE
                nspname = s.nspname)), 'operator_classes', (
        SELECT
            json_agg(json_build_object('class_name', opcname, 'schema', opcnamespace::regnamespace, 'access_method', amname, 'operators', (
                        SELECT
                            json_agg(json_build_object('operator_name', op.oprname, 'left_operand_type', op.oprleft::regtype, 'right_operand_type', op.oprright::regtype))
                    FROM pg_amop amop
                    JOIN pg_operator op ON amop.amopopr = op.oid
                WHERE
                    amop.amopfamily = opc.oid)))
        FROM pg_opclass opc
        JOIN pg_am am ON opc.opcmethod = am.oid
    WHERE
        opcnamespace = (
            SELECT
                oid
            FROM pg_namespace
        WHERE
            nspname = s.nspname)), 'operator_families', (
    SELECT
        json_agg(json_build_object('family_name', opfname, 'schema', opfnamespace::regnamespace, 'access_method', amname, 'operator_classes', (
                    SELECT
                        json_agg(json_build_object('class_name', opc.opfname, 'schema', opc.opfnamespace::regnamespace))
                FROM pg_opfamily opc
            WHERE
                opc.opfmethod = opf.oid)))
    FROM pg_opfamily opf
    JOIN pg_am am ON opf.opfmethod = am.oid
WHERE
    opfnamespace = (
        SELECT
            oid
        FROM pg_namespace
    WHERE
        nspname = s.nspname)), 'extension_objects', (
    SELECT
        json_agg(json_build_object('object_name', extname, 'object_type', 'extension', 'schema', oid::regnamespace, 'extension_name', extname))
    FROM pg_extension objects
WHERE
    oid = (
        SELECT
            oid
        FROM pg_namespace
    WHERE
        nspname = s.nspname))))
FROM information_schema.tables t
WHERE
    table_schema = s.nspname)))
FROM pg_catalog.pg_namespace s
JOIN pg_catalog.pg_user u ON u.usesysid = s.nspowner
WHERE
    nspname NOT IN ('information_schema', 'pg_catalog', 'public')
    AND nspname NOT LIKE 'pg_toast%'
    AND nspname NOT LIKE 'pg_temp_%')))))) INTO result;
      RETURN result;
  END;
  $$
  LANGUAGE plpgsql;



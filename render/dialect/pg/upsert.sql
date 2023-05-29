-- In PostgreSQL, creating a generic upsert function that works for any table
-- is not straightforward due to the strong type safety and type checking. You
-- can't simply create a stored function that accepts any table and column,
-- because PostgreSQL needs to know at the time of function creation what the
-- table and column types are, and it doesn't support a universal table row
-- type. Also, the ON CONFLICT clause requires knowledge of which columns make
-- up the unique or primary key of the table.

-- However, you can create a function generator that generates an upsert
-- function for a specific table and its unique or primary key.

-- how to use:
-- One time: SELECT execute_generated_upsert_function(generate_upsert_function('my_table'));
--    After: SELECT * FROM upsert_my_table((1, 'John Doe', 'john.doe@example.com')::my_table);

CREATE OR REPLACE FUNCTION generate_upsert_function(tablename text) RETURNS text AS $$
DECLARE
    _table_cols text;
    _uniquekey_cols text;
BEGIN
    -- Find the primary key columns
    SELECT string_agg(a.attname, ', ')
    INTO _uniquekey_cols
    FROM pg_index i
    JOIN pg_attribute a ON a.attnum = ANY(i.indkey)
    WHERE i.indrelid = tablename::regclass
    AND i.indisprimary;

    -- Find all the columns of the table
    SELECT string_agg(column_name, ', ')
    INTO _table_cols
    FROM information_schema.columns
    WHERE table_name = tablename;

    RETURN format(
        'CREATE OR REPLACE FUNCTION upsert_%1$I(_new %1$I) ' ||
        'RETURNS %1$I AS ' ||
        '$func$ ' ||
        'BEGIN ' ||
            'INSERT INTO %1$I(%3$s) ' ||
            'VALUES((_new).*).' ||
            'ON CONFLICT (%4$s) DO UPDATE ' ||
            'SET (%3$s) = ROW((_new).*).' ||
            'RETURNING *; ' ||
        'END ' ||
        '$func$ LANGUAGE plpgsql;',
        tablename, _table_cols, _uniquekey_cols);
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION execute_generated_upsert_function(sql_statement text) RETURNS void AS $$
BEGIN
    EXECUTE sql_statement;
END
$$ LANGUAGE plpgsql;

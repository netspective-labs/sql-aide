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
-- One time: SELECT execute_generated_upsert_sql(generate_upsert_sql('my_table'));
--    After: SELECT * FROM upsert_my_table((1, 'John Doe', 'john.doe@example.com')::my_table);

CREATE OR REPLACE FUNCTION generate_upsert_sql(schema_name text, tablename text)
    RETURNS text
AS
$$
DECLARE
    _table_cols text;
    _uniquekey_cols text;
    _qualified_table text = schema_name || '.' || tablename;
BEGIN
    -- Find the primary key columns
    SELECT string_agg(a.attname, ', ')
    INTO _uniquekey_cols
    FROM pg_index i
    JOIN pg_attribute a ON a.attnum = ANY(i.indkey)
    WHERE i.indrelid = _qualified_table::regclass
    AND i.indisprimary;

    -- Find all the columns of the table
    SELECT string_agg(column_name, ', ')
    INTO _table_cols
    FROM information_schema.columns
    WHERE table_schema = schema_name AND table_name = tablename;

    RETURN format(
        'CREATE OR REPLACE FUNCTION %1$I.upsert_%2$I(_new %3$I) ' ||
        'RETURNS %3$I AS ' ||
        '$func$ ' ||
        'BEGIN ' ||
            'INSERT INTO %3$I(%4$s) ' ||
            'VALUES((_new).*).' ||
            'ON CONFLICT (%5$s) DO UPDATE ' ||
            'SET (%4$s) = ROW((_new).*).' ||
            'RETURNING *; ' ||
        'END ' ||
        '$func$ LANGUAGE plpgsql;',
        schema_name, tablename, _qualified_table, _table_cols, _uniquekey_cols);
END
$$
LANGUAGE plpgsql;

-- this is a very simple function for now but might have feature flags in the
-- future
CREATE OR REPLACE FUNCTION execute_generated_upsert_sql(sql_statement text) RETURNS void AS $$
BEGIN
    EXECUTE sql_statement;
END
$$ LANGUAGE plpgsql;

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

-- Prepare some data for testing
CREATE SCHEMA IF NOT EXISTS dcp_assurance;

CREATE TABLE IF NOT EXISTS dcp_assurance.test_user (
    id serial PRIMARY KEY,
    name text,
    email text UNIQUE
);

INSERT INTO dcp_assurance.test_user (name, email)
VALUES
('John Doe', 'john.doe@example.com'),
('Jane Doe', 'jane.doe@example.com')
ON CONFLICT DO NOTHING;

-- Generate the upsert function for testing
SELECT execute_generated_upsert_sql(generate_upsert_sql('dcp_assurance', 'test_user'));

-- Tests
SELECT plan(3);

-- Test that the function exists
SELECT has_function('dcp_assurance', 'upsert_test_user');

-- Test that the function updates existing records correctly
SELECT is(
    (
        SELECT email FROM dcp_assurance.upsert_test_user((1, 'Updated Name', 'john.doe@example.com')::dcp_assurance.test_user)
    ),
    'john.doe@example.com',
    'Updates existing record correctly'
);

-- Test that the function inserts new records correctly
SELECT is(
    (
        SELECT email FROM dcp_assurance.upsert_test_user((3, 'New User', 'new.user@example.com')::dcp_assurance.test_user)
    ),
    'new.user@example.com',
    'Inserts new record correctly'
);

SELECT * FROM finish();

ROLLBACK;

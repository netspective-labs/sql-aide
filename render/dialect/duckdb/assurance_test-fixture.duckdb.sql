-- you can test this in DuckDB using:
-- $ cat assurance_test-fixture.duckdb.sql | duckdb ":memory:"

CREATE TABLE ingest_session (
    ingest_session_id VARCHAR NOT NULL,
    ingest_src VARCHAR NOT NULL,
    ingest_table_name VARCHAR NOT NULL,
);

CREATE TABLE ingest_issue (
    session_id VARCHAR NOT NULL,
    issue_row INT,
    issue_type VARCHAR NOT NULL,
    issue_column VARCHAR,
    invalid_value VARCHAR,
    issue_message VARCHAR NOT NULL,
    remediation VARCHAR
);

INSERT INTO ingest_session (ingest_session_id, ingest_src, ingest_table_name)
                    VALUES (uuid(), 'assurance_test-fixture-fail.csv', 'synthetic_csv_fail');

CREATE TEMPORARY TABLE synthetic_csv_fail AS
  SELECT *, row_number() OVER () as src_file_row_number, (SELECT ingest_session_id from ingest_session LIMIT 1) as ingest_session_id
    FROM read_csv_auto('assurance_test-fixture-fail.csv', header=true);

SELECT * FROM synthetic_csv_fail;

WITH required_column_names_in_src AS (
    SELECT column_name
      FROM (VALUES ('COLUMN1'), ('COLUMN2'), ('COLUMN3'), ('COLUMN4'), ('COLUMN5'), ('COLUMN6'), ('COLUMN7'), ('COLUMN8'), ('COLUMN9')) AS required(column_name)
     WHERE required.column_name NOT IN (
         SELECT upper(trim(column_name))
           FROM information_schema.columns
          WHERE table_name = 'synthetic_csv_fail')
)
INSERT INTO ingest_issue (session_id, issue_type, issue_message, remediation)
    SELECT (SELECT ingest_session_id FROM ingest_session LIMIT 1),
           'Missing Column',
           'Required column ' || column_name || ' is missing in synthetic_csv_fail.',
           'Ensure synthetic_csv_fail contains the column "' || column_name || '"'
      FROM required_column_names_in_src;

-- NOTE: If the above does not pass, meaning not all columns with the proper
--       names are present, do not run the queries below because they assume
--       proper names and existence of columns.

WITH numeric_value_in_all_rows AS (
    SELECT 'column4' AS issue_column,
           column4 AS invalid_value,
           src_file_row_number AS issue_row
      FROM synthetic_csv_fail
     WHERE column4 IS NOT NULL
       AND column4 NOT SIMILAR TO '^[+-]?[0-9]+$'
)
INSERT INTO ingest_issue (session_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
    SELECT (SELECT ingest_session_id FROM ingest_session LIMIT 1),
           'Data Type Mismatch',
           issue_row,
           issue_column,
           invalid_value,
           'Non-integer value "' || invalid_value || '" found in ' || issue_column,
           'Convert non-integer values to INTEGER'
      FROM numeric_value_in_all_rows;

WITH int_range_assurance AS (
    SELECT 'column5' AS issue_column,
           column5 AS invalid_value,
           src_file_row_number AS issue_row
      FROM synthetic_csv_fail
     WHERE column5 IS NOT NULL
       AND column5::INT > 100 OR column5::INT < 10
)
INSERT INTO ingest_issue (session_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
    SELECT (SELECT ingest_session_id FROM ingest_session LIMIT 1),
           'Range Violation',
           issue_row,
           issue_column,
           invalid_value,
           'Value ' || invalid_value || ' in ' || issue_column || ' out of range (10-100)',
           'Ensure values in column5 are between 10 and 100'
      FROM int_range_assurance;

WITH unique_value AS (
    SELECT 'column6' AS issue_column,
           column6 AS invalid_value,
           src_file_row_number AS issue_row
      FROM synthetic_csv_fail
     WHERE column6 IS NOT NULL
       AND column6 IN (
          SELECT column6
            FROM synthetic_csv_fail
        GROUP BY column6
          HAVING COUNT(*) > 1)
)
INSERT INTO ingest_issue (session_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
    SELECT (SELECT ingest_session_id FROM ingest_session LIMIT 1),
           'Unique Value Violation',
           issue_row,
           issue_column,
           invalid_value,
           'Duplicate value "' || invalid_value || '" found in ' || issue_column,
           'Ensure each value in column6 is unique'
      FROM unique_value;

WITH mandatory_value AS (
    SELECT 'column7' AS issue_column,
           column7 AS invalid_value,
           src_file_row_number AS issue_row
      FROM synthetic_csv_fail
     WHERE column7 IS NULL
        OR TRIM(column7) = ''
)
INSERT INTO ingest_issue (session_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
    SELECT (SELECT ingest_session_id FROM ingest_session LIMIT 1),
           'Missing Mandatory Value',
           issue_row,
           issue_column,
           invalid_value,
           'Mandatory field ' || issue_column || ' is empty',
           'Provide a value for ' || issue_column
      FROM mandatory_value;

WITH pattern AS (
    SELECT 'column8' AS issue_column,
           column8 AS invalid_value,
           src_file_row_number AS issue_row
      FROM synthetic_csv_fail
     WHERE column8 NOT SIMILAR TO '^ABC-[0-9]{4}$'
)
INSERT INTO ingest_issue (session_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
    SELECT (SELECT ingest_session_id FROM ingest_session LIMIT 1),
           'Pattern Mismatch',
           issue_row,
           issue_column,
           invalid_value,
           'Value ' || invalid_value || ' in ' || issue_column || ' does not match the pattern ABC-1234',
           'Follow the pattern ABC-1234 in ' || issue_column
      FROM pattern;

WITH allowed_values AS (
    SELECT 'column9' AS issue_column,
           column9 AS invalid_value,
           src_file_row_number AS issue_row
      FROM synthetic_csv_fail
     WHERE column9 NOT IN ('Yes', 'No', 'Maybe')
)
INSERT INTO ingest_issue (session_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
    SELECT (SELECT ingest_session_id FROM ingest_session LIMIT 1),
           'Invalid Value',
           issue_row,
           issue_column,
           invalid_value,
           'Value ' || invalid_value || ' in ' || issue_column || ' not in allowed list (Yes, No, or Maybe)',
           'Use only allowed values Yes, No, or Maybe in ' || issue_column
      FROM allowed_values;

WITH proper_dot_com_email_address_in_all_rows AS (
    SELECT 'column2' AS issue_column,
           column2 AS invalid_value,
           src_file_row_number AS issue_row
      FROM synthetic_csv_fail
     WHERE column2 IS NOT NULL
       AND column2 NOT SIMILAR TO '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.com$'
)
INSERT INTO ingest_issue (session_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
    SELECT (SELECT ingest_session_id FROM ingest_session LIMIT 1),
           'Format Mismatch',
           issue_row,
           issue_column,
           invalid_value,
           'Invalid email format "' || invalid_value || '" in ' || issue_column,
           'Correct the email format'
      FROM proper_dot_com_email_address_in_all_rows;

SELECT * FROM ingest_issue;
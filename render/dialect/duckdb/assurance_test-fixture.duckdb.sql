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

WITH required_column_names_in_src AS (
    SELECT column_name
      FROM (VALUES ('column1'), ('column2'), ('column3'), ('column4'), ('column5'), ('column6'), ('column7'), ('column8'), ('column9')) AS required(column_name)
     WHERE required.column_name NOT IN (
         SELECT upper(trim(column_name))
           FROM information_schema.columns
          WHERE table_name = 'synthetic_csv_fail')
)
INSERT INTO ingest_issue (session_id, issue_type, issue_message, remediation)
    SELECT (SELECT ingest_session_id FROM ingest_session LIMIT 1),
           'Missing Column',
           'Required column ' || column_name || ' is missing in the CSV file.',
           'Ensure the CSV contains the column "' || column_name || '"'
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
-- fixture-01

\set name 'John Doe'
\set table users
\set unit_test_schema dcp_assurance

SELECT * FROM users WHERE username = :'name';
SELECT * FROM :table WHERE username = :'name';
SELECT * FROM :"table" WHERE username = :'name';
SELECT * FROM :"table" WHERE username::"varchar" = :'name';
SELECT email FROM :unit_test_schema.upsert_test_user((1, 'Updated Name', 'john.doe@example.com'):::"unit_test_schema".test_user);
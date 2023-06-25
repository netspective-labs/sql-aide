---------------------------------------
--- Quality System Data Lineage SQL ---
---------------------------------------
-- prefix all tables using `qs_lineage` (Quality System: Data Lineage)

-- UNTESTED DRAFT of data lineage schema strategy ... needs to be converted to SQLa
-- Storing data lineage as metadata in PostgreSQL can be achieved by extending 
-- the database schema and utilizing additional tables and columns to capture
-- the necessary information. Here's a suggested approach:

-- Remember to populate the metadata tables with appropriate information and
-- maintain the data governance metadata as part of your ETL processes. You
-- can then query and retrieve the data governance metadata using SQL queries,
-- joining the relevant tables and applying filters based on your specific criteria.
-- Customize the schema and tables further based on your organization's data
-- governance practices, such as incorporating fields for data stewardship,
-- data retention policies, data lineage completeness, or any other metadata
-- attributes relevant to your data governance framework.

CREATE TABLE qs_lineage_source_table (
  source_id SERIAL PRIMARY KEY,
  table_name TEXT,
  column_name TEXT,
  description TEXT,
  owner TEXT,
  last_updated TIMESTAMP,
  -- Additional columns for data governance metadata
  data_quality_rating INTEGER,
  data_classification TEXT,
  data_privacy_level TEXT,
  -- Other relevant metadata columns
);

CREATE TABLE qs_lineage_target_table (
  target_id SERIAL PRIMARY KEY,
  table_name TEXT,
  column_name TEXT,
  description TEXT,
  owner TEXT,
  last_updated TIMESTAMP,
  -- Additional columns for data governance metadata
  data_quality_rating INTEGER,
  data_classification TEXT,
  data_privacy_level TEXT,
  -- Other relevant metadata columns
);

CREATE TABLE qs_lineage_transformation (
  qs_lineage_transformation_id SERIAL PRIMARY KEY,
  qs_lineage_transformation_name TEXT,
  description TEXT,
  owner TEXT,
  last_updated TIMESTAMP,
  -- Additional columns for data governance metadata
  qs_lineage_transformation_type TEXT,
  execution_frequency TEXT,
  -- Other relevant metadata columns
);

CREATE TABLE qs_lineage (
  lineage_id SERIAL PRIMARY KEY,
  qs_lineage_source_table_id INTEGER REFERENCES qs_lineage_source_table (source_id),
  qs_lineage_target_table_id INTEGER REFERENCES qs_lineage_target_table (target_id),
  qs_lineage_transformation_id INTEGER REFERENCES qs_lineage_transformation (qs_lineage_transformation_id),
  lineage_type TEXT,
  -- Additional columns for data governance metadata
  lineage_quality_rating INTEGER,
  -- Other relevant metadata columns
);

SELECT s.table_name AS qs_lineage_source_table,
       t.table_name AS qs_lineage_target_table,
       tr.qs_lineage_transformation_name
FROM qs_lineage_source_table s
JOIN qs_lineage_transformation tr ON s.qs_lineage_transformation_id = tr.qs_lineage_transformation_id
JOIN qs_lineage_target_table t ON tr.qs_lineage_target_table_id = t.target_id
WHERE s.table_name = 'your_qs_lineage_source_table'
  AND t.table_name = 'your_qs_lineage_target_table';


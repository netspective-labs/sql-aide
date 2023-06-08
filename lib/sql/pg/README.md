# Reusable PostgreSQL `psql`-formatted SQL for PgDCP

Each file should have these common elements:

- `\set` meta commands to setup variables for at least the schema and usually
  many other optional configurable settings
- consider putting all variables into `headers.psql` and putting
  `\ir headers.psql`
- PgTAP Unit tests for use after loading / SQL migration
- `doctor` and `health` checks to run anytime
- tested using SQLpp to make sure variables are properly being used
- consider moving parts of the SQL into `~/support/infra/pg-instance` where
  appropriate

## General purpose SQL

- `inspect.psql`: Function to retrieve metadata about the database, returns a
  JSON object containing details about the database, schemas, tables, columns,
  indexes, constraints, and more.
- `upsert.psql`: Function which generates an `upsert` function for any given
  table and its unique or primary key
- `plantuml-erd.psql`: (maybe works, but hasn't been tested yet) explain...

## PgDCP SQL

- `engine.psql`: explain...
- `federated`: explain...
- ``: explain...
- ``: explain...
- ``: explain...

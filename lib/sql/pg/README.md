# Reusable PostgreSQL `psql`-formatted SQL for PgDCP

Each file should have these common elements:

- `\set` meta commands to setup variables for at least the schema and usually
  many other optional configurable settings
- consider putting all variables into `headers.psql` and putting
  `\ir headers.psql`
- PgTAP Unit tests for use after loading / SQL migration
- `doctor` and `health` checks to run anytime
- tested using SQLpp to make sure variables are properly being used
-

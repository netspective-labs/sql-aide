# SQL-first ETL / ELT Orchestration

The objective of SQL-based orchestration engine is to get from ingestable
content in CSV, Excel, and similar formats into a SQL-queryable analyst-friendly
format as quickly as possible. Once content is SQL-queryable and
analyst-friendly it can be anonymized, enriched, cleansed, validated,
transformed, and pushed to other formats such as JSON, XML, etc.

SQL-native encourages performing work inside a SQL database as early as possible
in the ingestion process but all ingested and orchestrated resources can be
exported into SQLite, MySQL, PostgreSQL, AWS Cloud, Azure Cloud, or other
databases for portability.

To facilitate quickly getting ingestable content into a SQL-queryable
analyst-friendly format, this SQLa pattern employs the following architecture
strategy:

- All declarative ingestion is done using a relational database (e.g. DuckDB,
  SQLite, PostgreSQL, etc.).
- Some imperative structural validation is done using TypeScript (e.g. minimally
  validating the existence of specific sheets in an Excel workbook before
  ingesting so if a source document such as an Excel workbook is deemed invalid
  it's data is never read into the database).
- Most structural validation of ingested CSVs and Excel workbooks is done using
  SQL (e.g. checking column names).
- All declarative content validation is done using SQL (using CTEs) with an
  imperative TypeScript or external commands fallback.
- All declarative content anonymization can be done using SQL CTEs with an
  imperative TypeScript or external commands fallback.
- All declarative content enrichment can be done using SQL CTEs with an
  imperative TypeScript or external commands fallback (e.g. running REST API to
  match patient IDs or facility IDs in an MPI).
- All declarative content cleansing can be done using SQL whenever possible
  using CTEs with an imperative TypeScript or external commands fallback.
- All declarative content transformations can be done using SQL (using CTEs)
  with an imperative TypeScript or external commands fallback.
- All error reporting is done using a database (for machine consumption), via
  web browser or Excel (for human consumption).
- All business reporting is done directly from within the database or exported
  to SQLite for easy integration into other systems.
- Local business reporting may also be done using SQLPage, Jupyter notebooks, or
  other edge computing environments.

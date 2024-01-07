# DuckDB-based SQL-first ETL / ELT Orchestration

The objective of the DuckDB Orchestration engine is to use the general purpose
Orchestration structures defined in the [parent module](../README.md) and
implement the DuckDB-specific strategies for getting content in CSV, Excel, and
similar formats into a SQL-queryable analyst-friendly format as quickly as
possible.

Once content is SQL-queryable and analyst-friendly it can be anonymized,
enriched, cleansed, validated, transformed, and pushed to other formats such as
JSON, XML, etc.

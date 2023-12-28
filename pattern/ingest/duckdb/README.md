# DuckDB Ingestion Center Strategy

SQL-native encourages performing work inside a database as early as possible.

- All ingestion is done using a relational database
- All validation is done using a relational database and pure SQL
- All error reporting is done using a database (for machine consumption) or
  Excel (for human consumption)
- All business reporting is done using a database

# DuckDB-based SQL-first ETL / ELT Orchestration

The objective of the DuckDB Orchestration engine is to use the general purpose
Orchestration structures defined in the [parent module](../README.md) and
implement the DuckDB-specific strategies for getting content in CSV, Excel, and
similar formats into a SQL-queryable analyst-friendly format as quickly as
possible.

Once content is SQL-queryable and analyst-friendly it can be anonymized,
enriched, cleansed, validated, transformed, and pushed to other formats such as
JSON, XML, etc.

## assurance.ts

assurance.ts facilitates the generation of SQL code for comprehensive data
quality checks. It leverages a governance object and SQL generator to implement
various rules using Common Table Expressions (CTEs).

### Key Features

Implemented rules using Common Table Expressions (CTEs) for enhanced readability
and simplification of code blocks.

The code includes following methods:

##### typicalAssuranceRules

Implements rules such as missing columns, data type mismatches, range
violations, unique value violations, missing mandatory values, pattern
mismatches, .com email values, and more.

##### typicalTableAssuranceRules

Applies specific data assurance rules to a given table.

### Usage

```
import * as SQLa from "../../../render/mod.ts";
import * as mod from "./assurance.ts";
import * as oa from "../assurance.ts";
import * as ws from "../../../lib/universal/whitespace.ts";

class SyntheticAssuranceRulesGovernance implements oa.AssuranceRulesGovernance {
  constructor(readonly SQL: ReturnType<typeof SQLa.SQL<SQLa.SqlEmitContext>>) {
  }

  insertIssueCtePartial(
    from: string,
    typeText: string,
    messageSql: string,
    remediationSql?: string,
  ) {
    return ws.unindentWhitespace(`
      INSERT INTO ingest_issue (session_id, issue_type, issue_message, remediation)
          SELECT (SELECT orch_session_id FROM orch_session LIMIT 1),
                 '${typeText}',
                 ${messageSql},
                 ${remediationSql ?? "NULL"}
            FROM ${from}`);
  }

  insertRowValueIssueCtePartial(
    from: string,
    typeText: string,
    rowNumSql: string,
    columnNameSql: string,
    valueSql: string,
    messageSql: string,
    remediationSql?: string,
  ) {
    return ws.unindentWhitespace(`
      INSERT INTO ingest_issue (session_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
          SELECT (SELECT orch_session_id FROM orch_session LIMIT 1),
                 '${typeText}',
                 ${rowNumSql},
                 ${columnNameSql},
                 ${valueSql},
                 ${messageSql},
                 ${remediationSql ?? "NULL"}
            FROM ${from}`);
    tableName;
  }
}

// Define synthetic governance object with a SQL context
const ctx = SQLa.typicalSqlEmitContext({ sqlDialect: SQLa.duckDbDialect() });
const ddlOptions = SQLa.typicalSqlTextSupplierOptions<typeof ctx>();

const arGovn = new SyntheticAssuranceRulesGovernance(
  SQLa.SQL<typeof ctx>(ddlOptions),
);

// Usage of typicalAssuranceRules
const ar = mod.typicalAssuranceRules(arGovn, arGovn.SQL);

// Define test parameters
const tableName = "test_table";
const requiredColNames = ["column1", "column2", "column3"];
const columnName = "column4";
const minSql = 10;
const maxSql = 100;

// Generate SQL for the required column names assurance rule
const requiredColumnNamesSql = ar.requiredColumnNamesInTable(
  tableName,
  requiredColNames,
);
//console.log(requiredColumnNamesSql.SQL(arGovn.SQL));

// Generate SQL for the int value assurance rule
const intValueInAllRowsSql = ar.intValueInAllTableRows(tableName, columnName);
//console.log(intValueInAllRowsSql.SQL(arGovn.SQL));

// Generate SQL for the int range assurance rule
const intRangeInAllRowsSql = ar.intRangeInAllTableRows(
  tableName,
  columnName,
  minSql,
  maxSql,
);
console.log(intRangeInAllRowsSql.SQL(arGovn.SQL));
```

In this example, the ar object is an instance of typicalAssuranceRules, and you
can use its methods to apply various assurance rules that are not specific to a
particular table.

- The first Common Table Expression (CTE) used to identify and report issues
  related to missing columns.
- The second Common Table Expression (CTE) identifies rows in a table
  (test_table) where the value in the column4 is not a valid integer. The
  identified rows are then inserted into the ingest_issue table to report a data
  type mismatch issue.
- The third Common Table Expression (CTE) named int_range_assurance to identify
  and report issues related to values in column4 that fall outside a specified
  range ( 10 to 100).

## notebook.ts

The notebook.ts contains the module which provides classes and functionality for
orchestrating DuckDB databases. It includes components for executing SQL
queries, handling assurance rules, and generating diagnostics (used to identify
problems).

### Key Features

The code includes following classes and methods:

##### DuckDbOrchEmitContext

This class implements the OrchEmitContext interface for DuckDB.

- Provides a set of utilities for SQL text generation and emission.
- Manages UUID generation, allowing for deterministic or random UUIDs.
- Defines methods for computing the current timestamp.

##### Note:

`Deterministic primary key` - The value is generated in a predictable, ordered
sequence. (eg:`id SERIAL PRIMARY KEY`).

`Non-deterministic primary key` -The value lack the predictability and order as
seen in deterministic keys. (eg:
`id UUID DEFAULT uuid_generate_v4() PRIMARY KEY`)

##### DuckDbOrchGovernance

This class extends the generic OrchGovernance and specializes it for DuckDB.

- Manages the governance context for DuckDB orchestration.
- Supports deterministic primary keys.

##### DuckDbShell

This class represents a DuckDB shell for executing SQL queries.

- Executes SQL queries using the DuckDB shell.
- Generates diagnostics and handles execution results.
- Supports writing diagnostics in Markdown format.

##### DuckDbOrchAssuranceRules

Extends the generic OrchAssuranceRules to provide assurance rule functionality
for DuckDB.

- Integrates with the assurance rules defined in assurance.ts.
- Manages typical assurance rules for DuckDB.

##### DuckDbOrchTableAssuranceRules

Specialized class for table-specific assurance rules in DuckDB.

- Inherits from DuckDbOrchAssuranceRules.
- Provides assurance rules specific to a particular table

## Assurance Test

This test script evaluates data quality and integrity checks on a DuckDB
database table. It establishes a synthetic environment, defines assurance rules,
applies them to a table, and verifies the generated SQL against expected results
from a fixture file.

### Test Execution

To run the test script, use the following commands:

##### create test fixture file 'assurance_test-fixture.duckdb.sql', if it is not exixts in the directory or if the developer updated the source code

`deno-run ./pattern/orchestration/duckdb/assurance_test.ts test-fixtures`

##### Run the Deno test function for DuckDB Table Content Assurance

`deno-test ./pattern/orchestration/duckdb/assurance_test.ts`

##### View the expected SQL output by executing the fixture file in DuckDB

`cat ./pattern/orchestration/duckdb/assurance_test-fixture.duckdb.sql | duckdb ":memory:"`

### Test Overview

- Sets up a synthetic environment for testing assurance rules on a DuckDB
  database.
- Defines various assurance rules and applies them to a table.
- Verifies the generated SQL against expected results from a fixture file.
- Tests include the creation of tables, insertion of test data, and application
  of assurance rules.

### Results Comparison

The test script reads the expected SQL from the fixture file
(assurance_test-fixture.duckdb.sql) and compares it with the SQL generated
during the test execution. Any discrepancies indicate potential issues in the
assurance rules or the data quality of the tested table.

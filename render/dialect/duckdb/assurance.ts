import * as ws from "../../../lib/universal/whitespace.ts";
import * as tmpl from "../../emit/mod.ts";

export class AssuranceRules<Context extends tmpl.SqlEmitContext> {
  constructor(
    readonly govn: {
      readonly SQL: ReturnType<typeof tmpl.SQL<Context>>;
    },
  ) {
  }

  insertIssue(
    from: string,
    typeText: string,
    messageSql: string,
    remediationSql?: string,
  ) {
    return ws.unindentWhitespace(
      `INSERT INTO ingest_issue (issue_type, issue_message, remediation)
          SELECT '${typeText}',
                 ${messageSql},
                 ${remediationSql ?? "NULL"}
            FROM ${from}`,
    );
  }

  insertRowValueIssue(
    from: string,
    typeText: string,
    rowNumSql: string,
    columnNameSql: string,
    valueSql: string,
    messageSql: string,
    remediationSql?: string,
  ) {
    return ws.unindentWhitespace(
      `INSERT INTO ingest_issue (issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
          SELECT '${typeText}',
                 ${rowNumSql},
                 ${columnNameSql},
                 ${valueSql},
                 ${messageSql},
                 ${remediationSql ?? "NULL"}
            FROM ${from}`,
    );
  }

  requiredColumnNamesInTable(
    tableName: string,
    requiredColNames: string[],
  ): tmpl.SqlTextSupplier<Context> {
    const cteName = "required_column_names_in_src";
    // deno-fmt-ignore
    return this.govn.SQL`
      WITH ${cteName} AS (
          SELECT column_name
            FROM (VALUES ${requiredColNames.map(cn => `('${cn}')`).join(', ')}) AS required(column_name)
           WHERE required.column_name NOT IN (
               SELECT upper(trim(column_name))
                 FROM information_schema.columns
                WHERE table_name = '${tableName}')
      )
      ${this.insertIssue(cteName,
        'Missing Column',
        `'Required column ' || column_name || ' is missing in the CSV file.'`,
        `'Ensure the CSV contains the column "' || column_name || '"'`
        )}`;
  }

  intValueInAllTableRows(
    tableName: string,
    columnName: string,
  ): tmpl.SqlTextSupplier<Context> {
    const cteName = "numeric_value_in_all_rows";
    // deno-fmt-ignore
    return this.govn.SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${columnName} IS NOT NULL
             AND ${columnName} NOT SIMILAR TO '^[+-]?[0-9]+$'
      )
      ${this.insertRowValueIssue(cteName,
        'Data Type Mismatch',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Non-integer value "' || invalid_value || '" found in ' || issue_column`,
        `'Convert non-integer values to INTEGER'`
        )}`;
  }

  dotComEmailValueInAllTableRows(
    tableName: string,
    columnName: string,
  ): tmpl.SqlTextSupplier<Context> {
    const cteName = "proper_dot_com_email_address_in_all_rows";
    // deno-fmt-ignore
    return this.govn.SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${columnName} IS NOT NULL
             AND ${columnName} NOT SIMILAR TO '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$'
      )
      ${this.insertRowValueIssue(cteName,
        'Format Mismatch',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Invalid email format "' || invalid_value || '" in ' || issue_column`,
        `'Correct the email format'`
        )}`;
  }
}

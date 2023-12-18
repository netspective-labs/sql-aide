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

  intRangeInAllTableRows(
    tableName: string,
    columnName: string,
    minSql: number | string,
    maxSql: number | string,
  ): tmpl.SqlTextSupplier<Context> {
    const cteName = "int_range_assurance";
    // deno-fmt-ignore
    return this.govn.SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${columnName} IS NOT NULL
             AND ${columnName}::INT <= ${maxSql} OR ${columnName}::INT >= ${minSql}
      )
      ${this.insertRowValueIssue(cteName,
        'Range Violation',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Value ' || invalid_value || ' in ' || issue_column || ' out of range (${minSql}-${maxSql})'`,
        `'Ensure values in ${columnName} are between ${minSql} and ${maxSql}'`
        )}`;
  }

  uniqueValueInAllTableRows(
    tableName: string,
    columnName: string,
  ): tmpl.SqlTextSupplier<Context> {
    const cteName = "unique_value";
    // deno-fmt-ignore
    return this.govn.SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${columnName} IS NOT NULL
             AND ${columnName} IN (
                SELECT ${columnName}
                  FROM ${tableName}
              GROUP BY ${columnName}
                HAVING COUNT(*) > 1)
      )
      ${this.insertRowValueIssue(cteName,
        'Unique Value Violation',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Duplicate value "' || invalid_value || '" found in ' || issue_column`,
        `'Ensure each value in column6 is unique'`
        )}`;
  }

  mandatoryValueInAllTableRows(
    tableName: string,
    columnName: string,
  ): tmpl.SqlTextSupplier<Context> {
    const cteName = "mandatory_value";
    // deno-fmt-ignore
    return this.govn.SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${columnName} IS NULL
              OR TRIM(${columnName}) = ''
      )
      ${this.insertRowValueIssue(cteName,
        'Missing Mandatory Value',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Mandatory field ' || issue_column || ' is empty'`,
        `'Provide a value for ' || issue_column`
        )}`;
  }

  patternValueInAllTableRows(
    tableName: string,
    columnName: string,
    pattern: string,
    patternHuman = pattern,
    patternSql = `${columnName} NOT SIMILAR TO '${pattern}'`,
  ): tmpl.SqlTextSupplier<Context> {
    const cteName = "pattern";
    // deno-fmt-ignore
    return this.govn.SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${patternSql}
      )
      ${this.insertRowValueIssue(cteName,
        'Pattern Mismatch',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Value ' || invalid_value || ' in ' || issue_column || ' does not match the pattern ${patternHuman}'`,
        `'Follow the pattern ${patternHuman} in ' || issue_column`
        )}`;
  }

  onlyAllowedValuesInAllTableRows(
    tableName: string,
    columnName: string,
    valuesSql: string,
    valuesHuman = valuesSql,
    patternSql = `${columnName} NOT IN (${valuesSql})`,
  ): tmpl.SqlTextSupplier<Context> {
    const cteName = "allowed_values";
    // deno-fmt-ignore
    return this.govn.SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${patternSql}
      )
      ${this.insertRowValueIssue(cteName,
        'Invalid Value',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Value ' || invalid_value || ' in ' || issue_column || ' not in allowed list (${valuesHuman})'`,
        `'Use only allowed values ${valuesHuman} in ' || issue_column`
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

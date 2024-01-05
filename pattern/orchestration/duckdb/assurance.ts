import * as SQLa from "../../../render/mod.ts";

/**
 * Governs how issues are recorded and managed. Most assurance rules are CTEs
 * so governance usually involves assembling the common parts of the CTE to help
 * reduce duplication of code and improve consistency of generated SQL CTEs.
 */
export interface AssuranceRulesGovernance {
  /**
   * SQL CTE partial for inserting a non-row-value issue (usually structural)
   * issue into a an issue tracking table.
   * @param from the top-level CTE name
   * @param nature the nature (category, classification) of the issue
   * @param messageSql human friendly message
   * @param remediationSql if the issue has a remediation, the message that explains how
   * @returns a string that can be inserted into a SQL query
   */
  readonly insertIssueCtePartial: (
    from: string,
    nature: string,
    messageSql: string,
    remediationSql?: string,
  ) => string;

  /**
   * SQL CTE partial for inserting a row-value issue into a an issue tracking
   * table.
   * @param from the top-level CTE name
   * @param nature the nature (category, classification) of the issue
   * @param rowNumSql the row number in which the data issue was detected
   * @param columnNameSql the name of the column in which the data issue was detected
   * @param valueSql the value which caused the data issue
   * @param messageSql human friendly message
   * @param remediationSql if the issue has a remediation, the message that explains how
   * @returns a string that can be inserted into a SQL query
   */
  readonly insertRowValueIssueCtePartial: (
    from: string,
    nature: string,
    rowNumSql: string,
    columnNameSql: string,
    valueSql: string,
    messageSql: string,
    remediationSql?: string,
  ) => string;
}

export function typicalAssuranceRules<Context extends SQLa.SqlEmitContext>(
  govn: AssuranceRulesGovernance,
  SQL: ReturnType<typeof SQLa.SQL<Context>>,
) {
  const requiredColumnNamesInTable = (
    tableName: string,
    requiredColNames: string[],
  ) => {
    const cteName = "required_column_names_in_src";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT column_name
            FROM (VALUES ${requiredColNames.map(cn => `('${cn.toLocaleUpperCase()}')`).join(', ')}) AS required(column_name)
           WHERE required.column_name NOT IN (
               SELECT upper(trim(column_name))
                 FROM information_schema.columns
                WHERE table_name = '${tableName}')
      )
      ${govn.insertIssueCtePartial(cteName,
        'Missing Column',
        `'Required column ' || column_name || ' is missing in ${tableName}.'`,
        `'Ensure ${tableName} contains the column "' || column_name || '"'`
        )}`;
  };

  const intValueInAllTableRows = (
    tableName: string,
    columnName: string,
  ) => {
    const cteName = "numeric_value_in_all_rows";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${columnName} IS NOT NULL
             AND ${columnName} NOT SIMILAR TO '^[+-]?[0-9]+$'
      )
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Data Type Mismatch',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Non-integer value "' || invalid_value || '" found in ' || issue_column`,
        `'Convert non-integer values to INTEGER'`
        )}`;
  };

  const intRangeInAllTableRows = (
    tableName: string,
    columnName: string,
    minSql: number | string,
    maxSql: number | string,
  ) => {
    const cteName = "int_range_assurance";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${columnName} IS NOT NULL
             AND ${columnName}::INT > ${maxSql} OR ${columnName}::INT < ${minSql}
      )
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Range Violation',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Value ' || invalid_value || ' in ' || issue_column || ' out of range (${minSql}-${maxSql})'`,
        `'Ensure values in ${columnName} are between ${minSql} and ${maxSql}'`
        )}`;
  };

  const uniqueValueInAllTableRows = (
    tableName: string,
    columnName: string,
  ) => {
    const cteName = "unique_value";
    // deno-fmt-ignore
    return SQL`
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
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Unique Value Violation',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Duplicate value "' || invalid_value || '" found in ' || issue_column`,
        `'Ensure each value in column6 is unique'`
        )}`;
  };

  const mandatoryValueInAllTableRows = (
    tableName: string,
    columnName: string,
  ) => {
    const cteName = "mandatory_value";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${columnName} IS NULL
              OR TRIM(${columnName}) = ''
      )
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Missing Mandatory Value',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Mandatory field ' || issue_column || ' is empty'`,
        `'Provide a value for ' || issue_column`
        )}`;
  };

  const patternValueInAllTableRows = (
    tableName: string,
    columnName: string,
    pattern: string,
    patternHuman = pattern,
    patternSql = `${columnName} NOT SIMILAR TO '${pattern}'`,
  ) => {
    const cteName = "pattern";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${patternSql}
      )
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Pattern Mismatch',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Value ' || invalid_value || ' in ' || issue_column || ' does not match the pattern ${patternHuman}'`,
        `'Follow the pattern ${patternHuman} in ' || issue_column`
        )}`;
  };

  const onlyAllowedValuesInAllTableRows = (
    tableName: string,
    columnName: string,
    valuesSql: string,
    valuesHuman = valuesSql,
    patternSql = `${columnName} NOT IN (${valuesSql})`,
  ) => {
    const cteName = "allowed_values";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${patternSql}
      )
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Invalid Value',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Value ' || invalid_value || ' in ' || issue_column || ' not in allowed list (${valuesHuman})'`,
        `'Use only allowed values ${valuesHuman} in ' || issue_column`
        )}`;
  };

  // this is not a particularly helpful rule, but it's a good example approach
  const dotComEmailValueInAllTableRows = (
    tableName: string,
    columnName: string,
  ) => {
    const cteName = "proper_dot_com_email_address_in_all_rows";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 ${columnName} AS invalid_value,
                 src_file_row_number AS issue_row
            FROM ${tableName}
           WHERE ${columnName} IS NOT NULL
             AND ${columnName} NOT SIMILAR TO '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$'
      )
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Format Mismatch',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Invalid email format "' || invalid_value || '" in ' || issue_column`,
        `'Correct the email format'`
        )}`;
  };

  return {
    requiredColumnNamesInTable,
    intValueInAllTableRows,
    intRangeInAllTableRows,
    uniqueValueInAllTableRows,
    mandatoryValueInAllTableRows,
    patternValueInAllTableRows,
    onlyAllowedValuesInAllTableRows,
    dotComEmailValueInAllTableRows,
  };
}

export function typicalTableAssuranceRules<
  TableName extends string,
  Context extends SQLa.SqlEmitContext,
>(
  tableName: TableName,
  govn: AssuranceRulesGovernance,
  SQL: ReturnType<typeof SQLa.SQL<Context>>,
) {
  const ar = typicalAssuranceRules(govn, SQL);

  const requiredColumnNames = (requiredColNames: string[]) =>
    ar.requiredColumnNamesInTable(tableName, requiredColNames);

  const intValueInAllRows = (columnName: string) =>
    ar.intValueInAllTableRows(tableName, columnName);

  const intRangeInAllRows = (
    columnName: string,
    minSql: number | string,
    maxSql: number | string,
  ) => ar.intRangeInAllTableRows(tableName, columnName, minSql, maxSql);

  const uniqueValueInAllRows = (columnName: string) =>
    ar.uniqueValueInAllTableRows(tableName, columnName);

  const mandatoryValueInAllRows = (columnName: string) =>
    ar.mandatoryValueInAllTableRows(tableName, columnName);

  const patternValueInAllRows = (
    columnName: string,
    pattern: string,
    patternHuman = pattern,
    patternSql = `${columnName} NOT SIMILAR TO '${pattern}'`,
  ) =>
    ar.patternValueInAllTableRows(
      tableName,
      columnName,
      pattern,
      patternHuman,
      patternSql,
    );

  const onlyAllowedValuesInAllRows = (
    columnName: string,
    valuesSql: string,
    valuesHuman = valuesSql,
    patternSql = `${columnName} NOT IN (${valuesSql})`,
  ) =>
    ar.onlyAllowedValuesInAllTableRows(
      tableName,
      columnName,
      valuesSql,
      valuesHuman,
      patternSql,
    );

  return {
    requiredColumnNames,
    intValueInAllRows,
    intRangeInAllRows,
    uniqueValueInAllRows,
    mandatoryValueInAllRows,
    patternValueInAllRows,
    onlyAllowedValuesInAllRows,
  };
}

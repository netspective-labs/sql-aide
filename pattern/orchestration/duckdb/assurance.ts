import * as SQLa from "../../../render/mod.ts";
import * as oa from "../assurance.ts";

const escapedSqlLiteral = (literal: string) => literal.replaceAll("'", "''");

export function typicalStructureAssuranceRules<
  Context extends SQLa.SqlEmitContext,
>(
  govn: oa.AssuranceRulesGovernance,
  SQL: ReturnType<typeof SQLa.SQL<Context>>,
) {
  const requiredColumnNamesInTable = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    requiredColNames: ColumnName[],
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

  const requiredColumnNamesInTableStrict = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    requiredColNames: ColumnName[],
  ) => {
    const cteName = "required_column_names_in_src";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT column_name
            FROM (VALUES ${requiredColNames.map(cn => `('${cn}')`).join(', ')}) AS required(column_name)
           WHERE required.column_name NOT IN (
               SELECT column_name
                 FROM information_schema.columns
                WHERE table_name = '${tableName}')
      )
      ${govn.insertIssueCtePartial(cteName,
        'Missing Column',
        `'Required column ' || column_name || ' is missing in ${tableName}.'`,
        `'Ensure ${tableName} contains the column "' || column_name || '"'`
        )}`;
  };

  return {
    requiredColumnNamesInTable,
    requiredColumnNamesInTableStrict,
  };
}

export function typicalValueAssuranceRules<Context extends SQLa.SqlEmitContext>(
  govn: oa.AssuranceRulesGovernance,
  SQL: ReturnType<typeof SQLa.SQL<Context>>,
) {
  const intValueInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    columnName: ColumnName,
  ) => {
    const cteName = "numeric_value_in_all_rows";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE "${columnName}" IS NOT NULL
             AND CAST("${columnName}" AS VARCHAR) NOT SIMILAR TO '^[+-]?[0-9]+$'
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

  const intRangeInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    columnName: ColumnName,
    minSql: number | string,
    maxSql: number | string,
  ) => {
    const cteName = "int_range_assurance";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE "${columnName}" IS NOT NULL
             AND "${columnName}"::INT > ${maxSql} OR "${columnName}"::INT < ${minSql}
      )
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Range Violation',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Value ' || invalid_value || ' in ' || issue_column || ' out of range (${minSql}-${maxSql})'`,
        `'Ensure values in "${columnName}" are between ${minSql} and ${maxSql}'`
        )}`;
  };

  const uniqueValueInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    columnName: ColumnName,
  ) => {
    const cteName = "unique_value";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE "${columnName}" IS NOT NULL
             AND "${columnName}" IN (
                SELECT "${columnName}"
                  FROM "${tableName}"
              GROUP BY "${columnName}"
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

  const mandatoryValueInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    columnName: ColumnName,
  ) => {
    const cteName = "mandatory_value";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE "${columnName}" IS NULL
              OR TRIM(CAST("${columnName}" AS VARCHAR)) = ''
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

  const patternValueInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    columnName: ColumnName,
    pattern: string,
    patternHuman = pattern,
    patternSql = `CAST("${columnName}" AS VARCHAR) NOT SIMILAR TO '${pattern}'`,
  ) => {
    const cteName = "pattern";
    const escapedHumanMsgFragment = escapedSqlLiteral(patternHuman);

    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE ${patternSql}
      )
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Pattern Mismatch',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Value ' || invalid_value || ' in ' || issue_column || ' does not match the pattern ${escapedHumanMsgFragment}'`,
        `'Follow the pattern ${escapedHumanMsgFragment} in ' || issue_column`
        )}`;
  };

  const onlyAllowedValuesInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    columnName: ColumnName,
    valuesSql: string,
    valuesHuman = valuesSql,
    patternSql = `"${columnName}" NOT IN (${valuesSql})`,
  ) => {
    const cteName = "allowed_values";
    const escapedHumanMsgFragment = escapedSqlLiteral(valuesHuman);

    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE ${patternSql}
      )
      ${govn.insertRowValueIssueCtePartial(cteName,
        'Invalid Value',
        'issue_row',
        'issue_column',
        'invalid_value',
        `'Value ' || invalid_value || ' in ' || issue_column || ' not in allowed list (${escapedHumanMsgFragment})'`,
        `'Use only allowed values ${escapedHumanMsgFragment} in ' || issue_column`
        )}`;
  };

  const onlyAllowValidDateInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(tableName: TableName, columnName: ColumnName) => {
    const cteName = "valid_date_in_all_rows";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE "${columnName}" IS NOT NULL
            AND TRY_CAST("${columnName}" AS DATE) IS NOT NULL
      )
      ${govn.insertRowValueIssueCtePartial(
        cteName,
        "Invalid Date",
        "issue_row",
        "issue_column",
        "invalid_value",
        `'Invalid Date "' || invalid_value || '" found in ' || issue_column`,
        `'Convert non-date values to valid dates'`,
      )}`;
  };

  const onlyAllowValidBirthDateInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    columnName: ColumnName,
    maxAgeYear = 1915,
  ) => {
    const cteName = "valid_birth_date_in_all_rows";

    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE "${columnName}" IS NOT NULL
             AND TRY_CAST("${columnName}" AS DATE) IS NULL
             AND EXTRACT(YEAR FROM TRY_CAST("${columnName}" AS TIMESTAMP)) < ${maxAgeYear}
      )
      ${govn.insertRowValueIssueCtePartial(
        cteName,
        "Invalid Date",
        "issue_row",
        "issue_column",
        "invalid_value",
        `'Invalid Birth Date "' || invalid_value || '" found in ' || issue_column`,
        `'Provide a valid birthdate on or after ${maxAgeYear}.'`,
      )}`;
  };

  const onlyAllowAlphabetsInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(tableName: TableName, columnName: ColumnName) => {
    return patternValueInAllTableRows(tableName, columnName, "^[A-Za-z]+$");
  };

  const onlyAllowAlphabetsAndNumbersInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(tableName: TableName, columnName: ColumnName) => {
    return patternValueInAllTableRows(tableName, columnName, "^[0-9A-Za-z]+$");
  };

  const onlyAllowValidDateTimeInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(tableName: TableName, columnName: ColumnName) => {
    const cteName = "valid_date_time_in_all_rows";

    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE "${columnName}" IS NOT NULL
             AND TRY_CAST("${columnName}" AS TIMESTAMP) IS NULL
      )
      ${govn.insertRowValueIssueCtePartial(
        cteName,
        "Invalid Date",
        "issue_row",
        "issue_column",
        "invalid_value",
        `'Invalid timestamp "' || invalid_value || '" found in ' || issue_column`,
        `'Please be sure to provide both a valid date and time.'`,
      )}`;
  };

  // this is not a particularly helpful rule, but it's a good example approach
  const dotComEmailValueInAllTableRows = <
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
    columnName: ColumnName,
  ) => {
    const cteName = "proper_dot_com_email_address_in_all_rows";
    // deno-fmt-ignore
    return SQL`
      WITH ${cteName} AS (
          SELECT '${columnName}' AS issue_column,
                 "${columnName}" AS invalid_value,
                 src_file_row_number AS issue_row
            FROM "${tableName}"
           WHERE "${columnName}" IS NOT NULL
             AND CAST("${columnName}" AS VARCHAR) NOT SIMILAR TO '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$'
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
    intValueInAllTableRows,
    intRangeInAllTableRows,
    uniqueValueInAllTableRows,
    mandatoryValueInAllTableRows,
    patternValueInAllTableRows,
    onlyAllowedValuesInAllTableRows,
    onlyAllowValidDateInAllTableRows,
    onlyAllowValidBirthDateInAllTableRows,
    onlyAllowAlphabetsInAllTableRows,
    onlyAllowAlphabetsAndNumbersInAllTableRows,
    onlyAllowValidDateTimeInAllTableRows,
    dotComEmailValueInAllTableRows,
  };
}

export function typicalTableAssuranceRules<
  TableName extends string,
  ColumnName extends string,
  Context extends SQLa.SqlEmitContext,
>(
  tableName: TableName,
  govn: oa.AssuranceRulesGovernance,
  SQL: ReturnType<typeof SQLa.SQL<Context>>,
) {
  const structAR = typicalStructureAssuranceRules(govn, SQL);
  const valueAR = typicalValueAssuranceRules(govn, SQL);

  const requiredColumnNames = (requiredColNames: ColumnName[]) =>
    structAR.requiredColumnNamesInTable<TableName, ColumnName>(
      tableName,
      requiredColNames,
    );

  const requiredColumnNamesStrict = (requiredColNames: ColumnName[]) =>
    structAR.requiredColumnNamesInTableStrict<TableName, ColumnName>(
      tableName,
      requiredColNames,
    );

  const intValueInAllRows = (columnName: ColumnName) =>
    valueAR.intValueInAllTableRows<TableName, ColumnName>(
      tableName,
      columnName,
    );

  const intRangeInAllRows = (
    columnName: ColumnName,
    minSql: number | string,
    maxSql: number | string,
  ) =>
    valueAR.intRangeInAllTableRows<TableName, ColumnName>(
      tableName,
      columnName,
      minSql,
      maxSql,
    );

  const uniqueValueInAllRows = (columnName: ColumnName) =>
    valueAR.uniqueValueInAllTableRows<TableName, ColumnName>(
      tableName,
      columnName,
    );

  const mandatoryValueInAllRows = (columnName: ColumnName) =>
    valueAR.mandatoryValueInAllTableRows<TableName, ColumnName>(
      tableName,
      columnName,
    );

  const patternValueInAllRows = (
    columnName: ColumnName,
    pattern: string,
    patternHuman = pattern,
    patternSql = `CAST("${columnName}" AS VARCHAR) NOT SIMILAR TO '${pattern}'`,
  ) =>
    valueAR.patternValueInAllTableRows<TableName, ColumnName>(
      tableName,
      columnName,
      pattern,
      patternHuman,
      patternSql,
    );

  const onlyAllowedValuesInAllRows = (
    columnName: ColumnName,
    valuesSql: string,
    valuesHuman = valuesSql,
    patternSql = `"${columnName}" NOT IN (${valuesSql})`,
  ) =>
    valueAR.onlyAllowedValuesInAllTableRows<TableName, ColumnName>(
      tableName,
      columnName,
      valuesSql,
      valuesHuman,
      patternSql,
    );

  const onlyAllowValidDateInAllRows = (
    columnName: ColumnName,
  ) => valueAR.onlyAllowValidDateInAllTableRows(tableName, columnName);

  const onlyAllowValidBirthDateInAllRows = (
    columnName: ColumnName,
    maxAgeYear = 1915,
  ) =>
    valueAR.onlyAllowValidBirthDateInAllTableRows(
      tableName,
      columnName,
      maxAgeYear,
    );

  const onlyAllowAlphabetsInAllRows = (columnName: ColumnName) => {
    return valueAR.onlyAllowAlphabetsInAllTableRows(tableName, columnName);
  };

  const onlyAllowAlphabetsAndNumbersInAllRows = (
    columnName: ColumnName,
  ) => {
    return valueAR.onlyAllowAlphabetsAndNumbersInAllTableRows(
      tableName,
      columnName,
    );
  };

  const onlyAllowValidDateTimeInAllRows = (columnName: ColumnName) =>
    valueAR.onlyAllowValidDateTimeInAllTableRows(tableName, columnName);

  return {
    requiredColumnNames,
    intValueInAllRows,
    intRangeInAllRows,
    uniqueValueInAllRows,
    mandatoryValueInAllRows,
    patternValueInAllRows,
    onlyAllowedValuesInAllRows,
    onlyAllowValidDateInAllRows,
    onlyAllowValidBirthDateInAllRows,
    onlyAllowAlphabetsInAllRows,
    onlyAllowAlphabetsAndNumbersInAllRows,
    onlyAllowValidDateTimeInAllRows,
    requiredColumnNamesStrict,
  };
}

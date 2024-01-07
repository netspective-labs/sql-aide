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

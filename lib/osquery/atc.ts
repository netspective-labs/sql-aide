export type OsQueryAutoTableConstrRecord = {
  readonly query: string;
  readonly path: string;
  readonly columns: string[];
  readonly platform?: string;
};

export type OsQueryAutoTableConstrConfig = {
  readonly auto_table_construction: Record<
    string,
    OsQueryAutoTableConstrRecord
  >;
};

/**
 * Create an osQuery Automatic Table Construction (ATC) configuration file
 * content from a series of tables.
 * See: https://osquery.readthedocs.io/en/stable/deployment/configuration/#automatic-table-construction
 * and: https://www.kolide.com/blog/how-to-build-custom-osquery-tables-using-atc
 * @param tables the list of tables that should be included in the ATC configuration
 * @returns a function which, when called, will produce an ATC configuratin object
 */
export function osQueryATCConfigSupplier(
  tables: Generator<{
    readonly tableName: string;
    readonly columns: Array<{ readonly columnName: string }>;
    readonly query?: string;
  }>,
) {
  const osQueryATCPartials: Record<
    string,
    Omit<OsQueryAutoTableConstrRecord, "path">
  > = {};

  for (const table of tables) {
    const columns = table.columns.map((c) => c.columnName);
    const query = table.query ??
      `select ${columns.join(", ")} from ${table.tableName}`;
    osQueryATCPartials[table.tableName] = { query, columns };
  }

  return (
    atcRecConfig: (
      suggested: string,
      atcPartial: Omit<OsQueryAutoTableConstrRecord, "path">,
    ) => {
      readonly osQueryTableName: string;
      readonly atcRec: OsQueryAutoTableConstrRecord;
    },
  ): OsQueryAutoTableConstrConfig => {
    const ATC: Record<string, OsQueryAutoTableConstrRecord> = {};
    for (const atcPartialEntry of Object.entries(osQueryATCPartials)) {
      const [suggestedTableName, atcPartialRec] = atcPartialEntry;
      const { osQueryTableName, atcRec } = atcRecConfig(
        suggestedTableName,
        atcPartialRec,
      );
      ATC[osQueryTableName] = atcRec;
    }
    return {
      auto_table_construction: ATC,
    };
  };
}

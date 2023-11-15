import * as SQLa from "../mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface TblsConfig extends Record<string, unknown> {
  name?: string;
  format?: Format;
  er?: EntityRelDiagram;
  desc?: string;
  labels?: string[];
  comments?: TblsCommentConfig[];
  include?: string[];
  exclude?: string[];
}

export interface EntityRelDiagram {
  comment?: boolean;
  hideDef?: boolean;
  distance?: number;
}

export interface Format {
  adjust: boolean;
  hideColumnsWithoutValues: string[];
}

export interface TblsCommentConfig {
  table: string;
  tableComment?: string;
  columnComments?: Record<string, string>;
  labels?: string[];
  columnLabels?: Record<string, string>;
}

export interface TblsOptions {
  readonly includeTable: (
    table: ReturnType<
      typeof SQLa.tableDefinition<Any, Any, Any, Any, Any>
    >,
  ) => boolean;
  readonly tableComments?: (
    table: ReturnType<
      typeof SQLa.tableDefinition<Any, Any, Any, Any, Any>
    >,
  ) => TblsCommentConfig;
}

export function defaultTblsOptions(
  inherit?: Partial<TblsOptions>,
): TblsOptions {
  return {
    includeTable: () => true,
    tableComments: (table) => {
      const tc: TblsCommentConfig = {
        table: table.tableName,
        columnComments: {},
      };

      if (table.tblQualitySystem?.description) {
        tc.tableComment = table.tblQualitySystem?.description;
      }
      if (table.columnsQS) {
        for (const cqs of table.columnsQS) {
          tc.columnComments![cqs.identity] = cqs.qualitySystem.description;
        }
      }
      return tc;
    },
    ...inherit,
  };
}

/**
 * Generate a [tbls](https://github.com/k1LoW/tbls) config file using definitions
 * and documentation from `tables` generator. This `tbls` config, by itself, is
 * not complete and needs to be paired with actual database that `tbls` can
 * introspect.
 * @param tables the tables to include in the `tbls` output
 * @param options comments and other content providers
 * @param inherit any `tbls` configuration options to inherit
 * @returns
 */
export function tblsConfig(
  tables: () => Generator<
    ReturnType<
      typeof SQLa.tableDefinition<Any, Any, Any, Any, Any>
    >
  >,
  options: TblsOptions,
  inherit?: Partial<TblsConfig>,
) {
  const includeTables: string[] = [];
  const tableComments: TblsCommentConfig[] = [];

  const result: TblsConfig = {
    format: {
      adjust: true,
      hideColumnsWithoutValues: ["Parents", "Children"],
    },
    er: { hideDef: true, distance: 2 },
    include: includeTables,
    ...inherit,
  };

  for (const table of tables()) {
    if (options.includeTable(table)) {
      includeTables.push(table.tableName);

      const tc = options?.tableComments?.(table);
      if (tc) tableComments.push(tc);
    }
  }

  if (tableComments.length) result.comments = tableComments;

  return result;
}

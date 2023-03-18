import { zod as z } from "../../deps.ts";
import * as tmpl from "../../sql.ts";
import * as l from "../../lint.ts";
import * as d from "../../core/mod.ts";
import * as c from "./column.ts";
import * as t from "./table.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type TableNamePrimaryKeyLintOptions = {
  readonly ignoreTableLacksPrimaryKey?:
    | boolean
    | ((tableName: string) => boolean);
};

/**
 * Lint rule which checks that a given table name has a primary key
 * @param tableDefn the table definition to check
 * @returns a lint rule which, when executed and is not being ignored, will add
 *          a lintIssue to a given LintIssuesSupplier
 */
export const tableLacksPrimaryKeyLintRule = <
  Context extends tmpl.SqlEmitContext,
>(
  tableDefn: t.TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
) => {
  const rule: l.SqlLintRule<TableNamePrimaryKeyLintOptions> = {
    lint: (lis, lOptions) => {
      const { ignoreTableLacksPrimaryKey: iptn } = lOptions ?? {};
      const ignoreRule = iptn
        ? (typeof iptn === "boolean" ? iptn : iptn(tableDefn.tableName))
        : false;
      if (!ignoreRule) {
        const pkColumn = tableDefn.domains().find((ap) =>
          c.isTablePrimaryKeyColumnDefn<Any, Context>(ap)
        ) as unknown as (
          | (
            & d.SqlDomain<z.ZodTypeAny, Context, Any>
            & c.TablePrimaryKeyColumnDefn<Any, Context>
          )
          | undefined
        );
        if (!pkColumn) {
          lis.registerLintIssue({
            lintIssue:
              `table '${tableDefn.tableName}' has no primary key column(s)`,
            consequence: l.SqlLintIssueConsequence.WARNING_DDL,
          });
        }
      }
    },
  };
  return rule;
};

export type TableNameConsistencyLintOptions = {
  readonly ignorePluralTableName?: boolean | ((tableName: string) => boolean);
};

/**
 * Lint rule which checks that a given table name is not pluralized (does not
 * end with an 's').
 * @param tableName the table name to check
 * @returns a lint rule which, when executed and is not being ignored, will add
 *          a lintIssue to a given LintIssuesSupplier
 */
export const tableNameConsistencyLintRule = (tableName: string) => {
  const rule: l.SqlLintRule<TableNameConsistencyLintOptions> = {
    lint: (lis, lOptions) => {
      const { ignorePluralTableName: iptn } = lOptions ?? {};
      const ignoreRule = iptn
        ? (typeof iptn === "boolean" ? iptn : iptn(tableName))
        : false;
      if (!ignoreRule && tableName.endsWith("s")) {
        lis.registerLintIssue({
          lintIssue:
            `table name '${tableName}' ends with an 's' (should be singular, not plural)`,
          consequence: l.SqlLintIssueConsequence.CONVENTION_DDL,
        });
      }
    },
  };
  return rule;
};

/**
 * A lint rule which looks at each domain (column) and, if it has any lint
 * issues, will add them to the supplied LintIssuesSupplier
 * @param tableDefn the table whose columns (domains) should be checked
 * @returns a lint rule which, when executed and is not being ignored, will
 *          add each column defnintion lintIssue to a given LintIssuesSupplier
 */
export function tableColumnsLintIssuesRule<Context extends tmpl.SqlEmitContext>(
  tableDefn: t.TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
) {
  const rule: l.SqlLintRule = {
    lint: (lis) => {
      for (const col of tableDefn.domains()) {
        if (l.isSqlLintIssuesSupplier(col)) {
          lis.registerLintIssue(
            ...col.lintIssues.map((li) => ({
              ...li,
              location: () => `table ${tableDefn.tableName} definition`,
            })),
          );
        }
      }
    },
  };
  return rule;
}

// export type FKeyColNameConsistencyLintOptions<
//   Context extends tmpl.SqlEmitContext,
// > = {
//   readonly ignoreFKeyColNameMissing_id?:
//     | boolean
//     | ((
//       col: TableForeignKeyColumnDefn<Any, Any, Context>,
//       tableDefn: TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
//     ) => boolean);
//   readonly ignoreColName_idNotFKey?:
//     | boolean
//     | ((
//       col: d.SqlDomain<Any, Context>,
//       tableDefn: TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
//     ) => boolean);
// };

// /**
//  * A lint rule which looks at each domain (column) and, if it has any lint
//  * issues, will add them to the supplied LintIssuesSupplier
//  * @param tableDefn the table whose columns (domains) should be checked
//  * @returns a lint rule which, when executed and is not being ignored, will
//  *          add each column defnintion lintIssue to a given LintIssuesSupplier
//  */
// export function tableFKeyColNameConsistencyLintRule<
//   Context extends tmpl.SqlEmitContext,
// >(
//   tableDefn: TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
// ) {
//   const rule: l.SqlLintRule<FKeyColNameConsistencyLintOptions<Context>> = {
//     lint: (lis, lOptions) => {
//       for (const col of tableDefn.domains) {
//         if (isTableForeignKeyColumnDefn(col)) {
//           const { ignoreFKeyColNameMissing_id: ifkcnm } = lOptions ?? {};
//           const ignoreRule = ifkcnm
//             ? (typeof ifkcnm === "boolean" ? ifkcnm : ifkcnm(col, tableDefn))
//             : false;
//           if (!ignoreRule) {
//             let suggestion = `end with '_id'`;
//             if (d.isSqlDomain(col.foreignDomain)) {
//               // if the foreign key column name is the same as our column we're usually OK
//               if (col.foreignDomain.identity == col.identity) {
//                 continue;
//               }
//               suggestion =
//                 `should be named "${col.foreignDomain.identity}" or end with '_id'`;
//             }
//             if (!col.identity.endsWith("_id")) {
//               lis.registerLintIssue(
//                 d.domainLintIssue(
//                   `Foreign key column "${col.identity}" in "${tableDefn.tableName}" ${suggestion}`,
//                   { consequence: l.SqlLintIssueConsequence.CONVENTION_DDL },
//                 ),
//               );
//             }
//           }
//         } else {
//           const { ignoreColName_idNotFKey: icnnfk } = lOptions ?? {};
//           const ignoreRule = icnnfk
//             ? (typeof icnnfk === "boolean" ? icnnfk : icnnfk(col, tableDefn))
//             : false;
//           if (
//             !ignoreRule && (!isTablePrimaryKeyColumnDefn(col) &&
//               col.identity.endsWith("_id"))
//           ) {
//             lis.registerLintIssue(
//               d.domainLintIssue(
//                 `Column "${col.identity}" in "${tableDefn.tableName}" ends with '_id' but is neither a primary key nor a foreign key.`,
//                 { consequence: l.SqlLintIssueConsequence.CONVENTION_DDL },
//               ),
//             );
//           }
//         }
//       }
//     },
//   };
//   return rule;
// }

export function tableLintRules<Context extends tmpl.SqlEmitContext>() {
  const rules = {
    tableNameConsistency: tableNameConsistencyLintRule,
    columnLintIssues: tableColumnsLintIssuesRule,
    // fKeyColNameConsistency: tableFKeyColNameConsistencyLintRule,
    // noPrimaryKeyDefined: tableLacksPrimaryKeyLintRule,
    typical: (
      tableDefn:
        & t.TableDefinition<Any, Context>
        & d.SqlDomainsSupplier<Context>,
      ...additionalRules: l.SqlLintRule<Any>[]
    ) => {
      return l.aggregatedSqlLintRules<
        & TableNameConsistencyLintOptions
        // & FKeyColNameConsistencyLintOptions<Context>
        & TableNamePrimaryKeyLintOptions
      >(
        rules.tableNameConsistency(tableDefn.tableName),
        // rules.noPrimaryKeyDefined(tableDefn),
        rules.columnLintIssues(tableDefn),
        // rules.fKeyColNameConsistency(tableDefn),
        ...additionalRules,
      );
    },
  };
  return rules;
}

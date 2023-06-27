#!/usr/bin/env -S deno run --allow-all

import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type EmitContext = SQLa.SqlEmitContext;

export const tcf = SQLa.tableColumnFactory<Any, Any, typ.TypicalDomainQS>();
export const gts = typ.governedTemplateState<
  typ.TypicalDomainQS,
  typ.TypicalDomainsQS,
  EmitContext
>();
export const gm = typ.governedModel<
  typ.TypicalDomainQS,
  typ.TypicalDomainsQS,
  EmitContext
>(
  gts.ddlOptions,
);
export const {
  text,
  textNullable,
  integer,
  date,
  dateNullable,
  dateTime,
  selfRef,
  dateTimeNullable,
} = gm.domains;
export const { textPrimaryKey: textPK, autoIncPrimaryKey: autoIncPK } = gm.keys;

export const lineageSourceType = gm.textPkTable(
  "lineage_source_type",
  {
    lineage_source_type_id: textPK(),
    lineage_source_type: text(),
    ...gm.housekeeping.columns,
  },
);

export const lineageDestinationType = gm.textPkTable(
  "lineage_destination_type",
  {
    lineage_destination_type_id: textPK(),
    lineage_destination_type: text(),
    ...gm.housekeeping.columns,
  },
);

export const lineageTransformType = gm.textPkTable(
  "lineage_transform_type",
  {
    lineage_transform_type_id: textPK(),
    lineage_transform_type: text(),
    ...gm.housekeeping.columns,
  },
);

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allReferenceTables: SQLa.TableDefinition<
  Any,
  EmitContext,
  typ.TypicalDomainQS
>[] = [
  lineageSourceType,
  lineageDestinationType,
  lineageTransformType,
];

export const lineageSource = gm.autoIncPkTable("lineage_source", {
  lineage_source_id: autoIncPK(),
  lineage_source_type_id: lineageSourceType.references.lineage_source_type_id(),
  source_name: text().describe(
    "The name of the data source from which the lineage originates.",
  ),
  description: text().describe(
    "Description or additional information about the data source.",
  ),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing sources of data transformations.",
});

export const lineageDestination = gm.autoIncPkTable("lineage_destination", {
  lineage_destination_id: autoIncPK(),
  lineage_dest_type_id: lineageDestinationType.references
    .lineage_destination_type_id(),
  dest_name: text().describe(
    "The name of the data destination to the lineage target.",
  ),
  description: text().describe(
    "Description or additional information about the data target.",
  ),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing destinations of data transformations.",
});

export const lineageTransform = gm.autoIncPkTable("lineage_transform", {
  lineage_transform_id: autoIncPK().describe(
    "Primary key for the lineage transformation.",
  ),
  lineage_transform_type_id: lineageTransformType.references
    .lineage_transform_type_id(),
  transform_name: text().describe("The name of the data transormation"),
  description: text().describe("Description of the transformation"),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing transformations of data transformations.",
});

export const lineageGraphNode = gm.autoIncPkTable("lineage_graph_node", {
  lineage_graph_node_id: autoIncPK().describe(
    "Primary key for uniquely identifying each node of the lineage graph.",
  ),
  lineage_source_id: lineageSource.references.lineage_source_id().describe(
    "Foreign key referencing the lineage_source_id column in the lineage_source table.",
  ),
  lineage_dest_id: lineageDestination.references.lineage_destination_id()
    .describe(
      "Foreign key referencing the lineage_dest_id column in the lineage_target table.",
    ),
  lineage_transform_id: lineageTransform.references.lineage_transform_id()
    .describe(
      "Foreign key referencing the lineage_transform_id column in the lineage_transform table.",
    ),
  graph_node_name: text(),
  description: text().describe(
    "description or additional information about the node of the lineage graph",
  ),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing a single node of the lineage graph.",
});

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allContentTables: SQLa.TableDefinition<
  Any,
  EmitContext,
  typ.TypicalDomainQS
>[] = [
  lineageSource,
  lineageDestination,
  lineageTransform,
  lineageGraphNode,
];

export function sqlDDL() {
  // NOTE: every time the template is "executed" it will fill out tables, views
  //       in gm.tablesDeclared, etc.
  // deno-fmt-ignore
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance

    -- reference tables
    ${allReferenceTables}

    -- content tables
    -- TODO:SqlObjectComment
    ${allContentTables}

    ${SQLa.typicalSqlQualitySystemContent(
      gts.ddlOptions.sqlQualitySystemState,
    ).sqlObjectsComments}


    --content views
    -- {allContentViews}

    -- seed Data
    -- {allReferenceTables.map(e => e.seedDML).flat()}
    `;
}

if (import.meta.main) {
  const ctx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.postgreSqlDialect(),
  });
  typ.typicalCLI({
    resolve: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
    prepareSQL: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
    prepareDiagram: () => {
      // "executing" the following will fill gm.tablesDeclared but we don't
      // care about the SQL output, just the state management (tablesDeclared)
      sqlDDL().SQL(ctx);
      return gts.pumlERD(ctx).content;
    },
  }).commands.command("driver", typ.sqliteDriverCommand(sqlDDL, ctx))
    .parse(Deno.args);
}

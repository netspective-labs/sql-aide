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

export const classificationLevel = gm.autoIncPkTable(
  "classification_level",
  {
    classification_level_id: autoIncPK().describe(
      "Primary key for uniquely identifying each classification level.",
    ),
    classification_level_name: text().describe(
      "Name or identifier of the classification level (e.g., public, internal, confidential).",
    ),
    classification_level_description: text().describe(
      "Provide additional details or descriptions about the classification level.",
    ),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Defines different levels or categories of data classification, such as public, internal, confidential,etc.",
    },
  },
);

export const sensitivityLevel = gm.autoIncPkTable(
  "sensitivity_level",
  {
    sensitivity_level_id: autoIncPK().describe(
      "Primary key for uniquely identifying each sensitivity level.",
    ),
    sensitivity_level: text().describe(
      "Sensitivity level of the data (e.g., low, medium, high).",
    ),
    sensitivity_description: text().describe(
      "Provide additional details or descriptions about the sensitivity level.",
    ),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Represents the sensitivity level of data, indicating the degree of sensitivity or privacy requirements.",
    },
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
  classificationLevel,
  sensitivityLevel,
];

export const lineageSource = gm.autoIncPkTable("lineage_source", {
  lineage_source_id: autoIncPK().describe(
    "Primary key for uniquely identifying each lineage source.",
  ),
  lineage_source_type_id: lineageSourceType.references.lineage_source_type_id(),
  source_name: text().describe(
    "The name of the data source from which the lineage originates.",
  ),
  description: text().describe(
    "Description or additional information about the data source.",
  ),
  classification_level_id: classificationLevel.references
    .classification_level_id().describe(
      "Foreign key referencing the classification_level_id column in the classification level table",
    ),
  sensitivity_level_id: sensitivityLevel.references
    .sensitivity_level_id().describe(
      "Foreign key referencing the sensitivity_level_id column in the classification level table",
    ),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing sources of data transformations.",
});

export const lineageDestination = gm.autoIncPkTable("lineage_destination", {
  lineage_destination_id: autoIncPK().describe(
    "Primary key for uniquely identifying each lineage destination.",
  ),
  lineage_dest_type_id: lineageDestinationType.references
    .lineage_destination_type_id(),
  dest_name: text().describe(
    "The name of the data destination to the lineage target.",
  ),
  description: text().describe(
    "Description or additional information about the data target.",
  ),
  classification_level_id: classificationLevel.references
    .classification_level_id().describe(
      "Foreign key referencing the classification_level_id column in the classification level table",
    ),
  sensitivity_level_id: sensitivityLevel.references
    .sensitivity_level_id().describe(
      "Foreign key referencing the sensitivity_level_id column in the classification level table",
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
    .lineage_transform_type_id().describe(
      "Primary key for uniquely identifying each lineage transform.",
    ),
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
    "Foreign key referencing the lineage_source_id column in the lineage source table.",
  ),
  lineage_dest_id: lineageDestination.references.lineage_destination_id()
    .describe(
      "Foreign key referencing the lineage_dest_id column in the lineage target table.",
    ),
  lineage_transform_id: lineageTransform.references.lineage_transform_id()
    .describe(
      "Foreign key referencing the lineage_transform_id column in the lineage transform table.",
    ),
  graph_node_name: text(),
  description: text().describe(
    "description or additional information about the node of the lineage graph",
  ),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing a single node of the lineage graph.",
});

export const dataLineage = gm.autoIncPkTable("data_lineage", {
  data_lineage_id: autoIncPK().describe(
    "Primary key for uniquely identifying each lineage entry.",
  ),
  source_table_id: lineageSource.references
    .lineage_source_id().describe(
      "Foreign key referencing the lineage_source_id column in the lineage source table.",
    ),
  lineage_destination_id: lineageDestination.references
    .lineage_destination_id().describe(
      "Foreign key referencing the lineage_dest_id column in the lineage target table.",
    ),
  transformation_id: lineageTransform.references.lineage_transform_id()
    .describe(
      "Foreign key referencing the lineage_transform_id column in the lineage transform table.",
    ),
  lineage_type: text().describe("TODO"), // IS IT REQUIRED ?
  lineage_quality_rating: text().describe(
    "The quality rating of the data lineage entry, indicating the reliability or trustworthiness of the lineage information.",
  ),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Used for trace and understand the origin, transformations, and movement of data / managing data lineage.",
  },
});

// Data Stewardship
// TODO: Racichart

export const steward = gm.autoIncPkTable("steward", {
  steward_id: autoIncPK().describe(
    "Primary key for uniquely identifying each data steward.",
  ),
  steward_name: text().describe(
    "Name of the data steward.",
  ),
  department: text().describe(
    "Department or organizational unit to which the data steward belongs.",
  ),
  email: text().describe(
    "Email address of the data steward.",
  ),
  phone: text().describe(
    "Phone number of the data steward.",
  ),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Stores information about data stewards responsible for data assets.",
  },
});

/*export const asset = gm.autoIncPkTable("asset", {
  asset_id: autoIncPK().describe(
    "Primary key for uniquely identifying each asset.",
  ),
  asset_name: text().describe(
    "Name or title of the asset.",
  ),
  description: text().describe(
    "Additional details or descriptions about the asset",
  ),
  classification: text().describe(
    "Indicates thelassification or sensitivity level of the asset.",
  ), // eg: Public, Internal, Confidential, Restricted)
  sensitivity: text().describe(
    Indicates the sensitivity or security level of the asset.",
  ),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description: "Store information about various assets.",
  },
});
*/
export const stewardAssignment = gm.autoIncPkTable("steward_assignment", {
  steward_assignment_id: autoIncPK().describe(
    "Primary key for uniquely identifying data steward assignment.",
  ),
  steward_id: steward.references
    .steward_id().describe(
      "Foreign key referencing the steward_id column in the steward table.",
    ),
  /*asset_id: asset.references
    .asset_id().describe(
      "Foreign key referencing the asset_id column in the asset table.",
    ),  */
  source_table_id: lineageSource.references
    .lineage_source_id().describe(
      "Foreign key referencing the lineage_source_id column in the lineage source table.",
    ),
  target_table_id: lineageDestination.references
    .lineage_destination_id().describe(
      "Foreign key referencing the lineage_dest_id column in the lineage target table.",
    ),
  start_date: date().describe(
    "Start date of the stewardship assignment.",
  ),
  end_date: date().describe(
    "Eend date of the stewardship assignment.",
  ),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description: "Tracks the assignment of stewards to data assets.",
  },
});

export const qualityIssue = gm.autoIncPkTable(
  "quality_issue",
  {
    quality_issue_id: autoIncPK().describe(
      "Primary key for uniquely identifying each data quality issue",
    ),
    /*table_name: text().describe(
      "Name of the table where the data quality issue occurred",
    ),
    */
    source_table_id: lineageSource.references.lineage_source_id().describe(
      "Foreign key referencing the lineage_source_id column in the lineage source table.",
    ),
    column_name: text().describe(
      "Name of the column associated with the data quality issue",
    ),
    issue_description: text().describe(
      "Capture the description or details of the data quality issue.",
    ),
    reported_date: dateTime().describe(
      "The date when the issue was reported.",
    ),
    resolution_status: text().describe(
      "Status or resolution of the data quality issue.",
    ), // TODO: create an entity and move it to the reference table
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Captures details about data quality issues, such as data anomalies, inconsistencies, or errors.",
    },
  },
);

export const qualityRule = gm.autoIncPkTable(
  "quality_rule",
  {
    quality_rule_id: autoIncPK().describe(
      "Primary key for uniquely identifying each data quality rule",
    ),
    /*table_name: text().describe(
      "A text column indicating the name of the table to which the data quality rule applies.",
    ),
    */
    source_table_id: lineageSource.references.lineage_source_id().describe(
      "Foreign key referencing the lineage_source_id column in the lineage source table.",
    ),
    column_name: text().describe(
      "Name of the column to which the data quality rule applies",
    ),
    rule_description: text().describe(
      "Describe the data quality rule or check.",
    ),
    rule_expression: text().describe(
      "Expression or condition representing the data quality rule.",
    ),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Stores data quality rules or checks that need to be applied to ensure data integrity and accuracy.",
    },
  },
);

export const qualityScore = gm.autoIncPkTable(
  "quality_score",
  {
    quality_score_id: autoIncPK().describe(
      "Primary key for uniquely identifying each data quality score.",
    ),
    /*table_name: text().describe(
      "Name of the table for which the data quality score is calculated.",
    ),
    */
    source_table_id: lineageSource.references.lineage_source_id().describe(
      "Foreign key referencing the lineage_source_id column in the lineage source table.",
    ),
    column_name: text().describe(
      "Specifying the name of the column for which the data quality score is calculated",
    ),
    score: integer().describe(
      "Data quality score or rating.",
    ),
    assessment_date: dateTime().describe(
      "The date when the data quality assessment was performed.",
    ),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Records data quality scores or ratings for tables or columns based on predefined metrics or criteria..",
    },
  },
);

export const privacyPolicy = gm.autoIncPkTable(
  "privacy_policy",
  {
    privacy_policy_id: autoIncPK().describe(
      "Primary key for uniquely identifying each privacy policy.",
    ),
    policy_name: text().describe(
      "Name or identifier of the privacy policy.",
    ),
    policy_description: text().describe(
      "Providing details or descriptions about the privacy policy, including compliance requirements.",
    ),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Describes the privacy policies or regulations applicable to data assets, including compliance requirements.",
    },
  },
);

export const accessControl = gm.autoIncPkTable(
  "access_control",
  {
    access_control_id: autoIncPK().describe(
      "Primary key for uniquely identifying each access control entry.",
    ),
    table_name: text().describe(
      "Name of the table or data asset.",
    ),
    column_name: text().describe(
      "Name of the column or attribute within the table.",
    ),
    user_id: integer().describe(
      "User ID or identifier associated with the access control entry.",
    ),
    permission_type: text().describe(
      "Type of permission or access granted to the user for the specified table or column.",
    ), // TODO: create an entity and move it to the reference table
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Tracks access control permissions, roles, and privileges for tables, columns, or data assets.",
    },
  },
);

export const auditLog = gm.autoIncPkTable(
  "audit_log",
  {
    audit_log_id: autoIncPK().describe(
      "Primary key for uniquely identifying each access control entry.",
    ),
    table_name: text().describe(
      "Name of the table or data asset being accessed or modified.",
    ),
    column_name: text().describe(
      "Indicating the name of the column or attribute within the table.",
    ),
    user_id: integer().describe(
      "User ID or identifier associated with the action performed.",
    ),
    action_type: text().describe(
      "Type of action performed, such as 'read','write,' or 'update'.",
    ), // TODO: create an entity and move it to the reference table
    action_date: dateTime().describe(
      "Indicates the date and time when the action was performed.",
    ),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Logs data access and modifications, including timestamps, users, and actions performed for audit purposes.",
    },
  },
);

export const retentionPolicy = gm.autoIncPkTable(
  "retention_policy",
  {
    retention_policy_id: autoIncPK().describe(
      "Primary key for uniquely identifying each data retention policy.",
    ),
    table_name: text().describe(
      "Name of the table or data asset to which the retention policy applies.",
    ),
    retention_period: integer().describe(
      "Retention period in days, months, or years.",
    ),
    retention_description: dateTime().describe(
      "Additional details or descriptions about the retention policy.",
    ),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Specifies the retention periods for different types of data, indicating how long data should be retained.",
    },
  },
);

export const archivalInfo = gm.autoIncPkTable(
  "archival",
  {
    archival_id: autoIncPK().describe(
      "Primary key for uniquely identifying each archival information entry.",
    ),
    table_name: text().describe(
      "Name of the table or data asset being archived..",
    ),
    archival_location: text().describe(
      "Location or storage destination where the data is archived.",
    ),
    archival_date: dateTime().describe(
      "Date when the archival process took place.",
    ),
    archival_policy: text().describe(
      "archival policy or guidelines followed.",
    ), // TODO: create an entity and move it to the reference table
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Stores information related to data archiving processes, such as archival location, dates, and archival policies.",
    },
  },
);

export const lineageHistory = gm.autoIncPkTable(
  "lineage_history",
  {
    lineage_history_id: autoIncPK().describe(
      "Primary key for uniquely identifying each history entry..",
    ),
    lineage_id: dataLineage.references.data_lineage_id().describe(
      "Foreign key referencing the data_lineage_id column in the data_lineage table.",
    ),
    modification_type: text().describe(
      "type of modification made to the data lineage, such as 'modification', 'addition', or 'deletion'.",
    ),
    modified_by: text().describe(
      "Name or identifier of the user or system responsible for the modification.",
    ),
    modification_date: dateTime().describe(
      "Date and time when the modification was made.",
    ),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Stores information related to data archiving processes, such as archival location, dates, and archival policies.",
    },
  },
);

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
  dataLineage,
  steward,
  stewardAssignment,
  qualityIssue,
  qualityRule,
  qualityScore,
  privacyPolicy,
  accessControl,
  auditLog,
  retentionPolicy,
  archivalInfo,
  lineageHistory,
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


    --content views
    -- {allContentViews}

    -- seed Data
    -- {allReferenceTables.map(e => e.seedDML).flat()}
    `;
}

if (import.meta.main) {
  const ctx = SQLa.typicalSqlEmitContext();

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

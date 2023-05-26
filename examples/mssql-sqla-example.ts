//import * as tp from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.0.12/pattern/typical/mod.ts";
import * as tp from "../pattern/typical/mod.ts";
const { SQLa, ws } = tp;

const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.msSqlServerDialect(),
  sqlNamingStrategy: SQLa.bracketSqlNamingStrategy(),
});
type EmitContext = typeof ctx;

const gts = tp.governedTemplateState<tp.GovernedDomain, EmitContext>();
const gm = tp.governedModel<tp.GovernedDomain, EmitContext>(gts.ddlOptions);
const { text, textNullable, integer, date } = gm.domains;
const { autoIncPrimaryKey: autoIncPK } = gm.keys;

export enum ExecutionContext {
  DEVELOPMENT, // code is text, value is a number
  TEST,
  PRODUCTION,
}
const execCtx = gm.ordinalEnumTable("execution_context", ExecutionContext);

const jobPosition = gm.autoIncPkTable("job_position", {
  job_position_id: autoIncPK(),
  position_title: text(),
  job_category_id: integer(),
  description: textNullable(),
  requirements: textNullable(),
  responsibilities: textNullable(),
  department_id: integer(),
  grade_id: integer(),
  experience_level: textNullable(),
  skills_required: textNullable(),
  location_id: integer(),
  no_of_openings: integer(),
  salary_type_code: integer(),
  start_date: date(),
  end_date: date(),
  search_committee: textNullable(),
  question_answers: textNullable(),
  official_id: integer(),
  status_id: integer(),
  ...gm.housekeeping.columns,
});

const jobGrade = gm.autoIncPkTable("job_grade", {
  job_grade_id: autoIncPK(),
  grade_name: text(),
  description: textNullable(),
  ...gm.housekeeping.columns,
});

function sqlDDL(
  options: {
    destroyFirst?: boolean;
    schemaName?: string;
  } = {},
) {
  const { destroyFirst, schemaName } = options;

  // NOTE: every time the template is "executed" it will fill out tables, views
  //       in dvts.tablesDeclared, etc.
  // deno-fmt-ignore
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    ${
      destroyFirst && schemaName
        ? `drop schema if exists ${schemaName} cascade;`
        : "-- not destroying first (for development)"
    }
    ${
      schemaName
        ? `create schema if not exists ${schemaName};`
        : "-- no schemaName provided"
    }
    ${jobPosition}
    ${jobGrade}
    ${execCtx}
    ${execCtx.seedDML}
     `;
}

tp.typicalCLI({
  resolve: (specifier) =>
    specifier ? import.meta.resolve(specifier) : import.meta.url,
  prepareSQL: (options) => ws.unindentWhitespace(sqlDDL(options).SQL(ctx)),
  prepareDiagram: () => {
    // "executing" the following will fill gm.tablesDeclared but we don't
    // care about the SQL output, just the state management (tablesDeclared)
    sqlDDL().SQL(ctx);
    return gts.pumlERD(ctx).content;
  },
}).commands.parse(Deno.args);

#!/usr/bin/env -S deno run --allow-all

// IMPORTANT: when you use this outside of library use this type of import with pinned versions:
// import * as dvp from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.0.10/pattern/typical/mod.ts";
import * as tp from "../pattern/typical/mod.ts";
const { SQLa, ws } = tp;

const ctx = SQLa.typicalSqlEmitContext({ sqlDialect: SQLa.sqliteDialect() });
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

const jobGrade = gm.autoIncPkTable("job_grade", {
  job_grade_id: autoIncPK(),
  grade_name: text(),
  description: textNullable(),
  ...gm.housekeeping.columns,
});

const jobPosition = gm.autoIncPkTable("job_position", {
  job_position_id: autoIncPK(),
  position_title: text(),
  job_category_id: integer(),
  description: textNullable(),
  requirements: textNullable(),
  responsibilities: textNullable(),
  department_id: integer(),
  grade_id: jobGrade.references.job_grade_id(),
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

export const contentTables = [execCtx, jobGrade, jobPosition];

function sqlDDL() {
  // deno-fmt-ignore
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance

    ${execCtx}
    ${execCtx.seedDML}

    ${jobGrade}

    ${jobPosition}
    `;
}

tp.typicalCLI({
  defaultDialect: "SQLite",
  // auto-discover the module name for the CLI
  resolve: (specifier) =>
    specifier ? import.meta.resolve(specifier) : import.meta.url,
  prepareSQL: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
  prepareDiagram: () => {
    return tp.diaPUML.plantUmlIE(ctx, function* () {
      for (const table of contentTables) {
        if (SQLa.isGraphEntityDefinitionSupplier(table)) {
          yield table.graphEntityDefn();
        }
      }
    }, tp.diaPUML.typicalPlantUmlIeOptions()).content;
  },
}).commands
  .command("driver", tp.sqliteDriverCommand(sqlDDL, ctx))
  .parse(Deno.args);

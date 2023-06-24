#!/usr/bin/env -S deno run --allow-all
// the #! (`shebang`) descriptor allows us to run this script as a binary on Linux

// IMPORTANT: when you use this outside of library use this type of import with pinned versions:
// import * as dvp from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.0.10/pattern/typical/mod.ts";
import * as tp from "../../pattern/typical/mod.ts";
const { SQLa, ws } = tp;
import { zod as z } from "../../deps.ts";

const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.msSqlServerDialect(),
  sqlNamingStrategy: SQLa.bracketSqlNamingStrategy(),
});
type EmitContext = typeof ctx;

const gts = tp.governedTemplateState<
  tp.TypicalDomainQS,
  tp.TypicalDomainsQS,
  EmitContext
>();
const gm = tp.governedModel<
  tp.TypicalDomainQS,
  tp.TypicalDomainsQS,
  EmitContext
>(gts.ddlOptions);
const {
  text,
  textNullable,
  integer,
  integerNullable,
  varChar,
  varCharNullable,
  date,
} = gm.domains;
const { autoIncPrimaryKey: autoIncPK } = gm.keys;

const jobSchema = "dbo";

export enum ExecutionContext {
  DEVELOPMENT, // code is text, value is a number
  TEST,
  PRODUCTION,
}
const execCtx = gm.ordinalEnumTable("execution_context", ExecutionContext);

// export enum JobStatusContext {
//   ACTIVE,
//   DELETED,
// }
// const jobStatusCtx = gm.ordinalEnumTable("job_status", JobStatusContext);

export enum jobStatusContext {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  DELETED = "DELETED",
}

const jobStatusCtx = gm.varCharEnumTable("job_status", jobStatusContext, 100);

// export enum jobPositionStatusContext {
//   Current = "Current",
//   Past = "Past",
//   Future = "Future",
// }

// const jobPositionStatusCtx = gm.textEnumTable(
//   "job_position_status",
//   jobPositionStatusContext,
// );

export enum jobPositionStatusContext {
  Current,
  Past,
  Future,
}

const jobPositionStatusCtx = gm.ordinalEnumTable(
  "job_position_status",
  jobPositionStatusContext,
);

const _jobOfficial = gm.autoIncPkTable("job_official", {
  job_official_id: autoIncPK(),
  official_name: text(),
  official_email: textNullable(),
  status_id: jobStatusCtx.references.code(),
  ...gm.housekeeping.columns,
});

// deno-fmt-ignore
const jobPosition = gm.autoIncPkTable("job_position", {
  job_position_id: autoIncPK(),
  position_title: text(),
  job_category_id: integerNullable(),
  description: textNullable(),
  requirements: textNullable(),
  responsibilities: textNullable(),
  department_id: integer(),
  grade: text(),
  experience_level: textNullable(),
  skills_required: textNullable(),
  location_id: integer(),
  no_of_openings: integer(),
  salary_type_code: integer(),
  start_date: date(),
  end_date: date(),
  search_committee: textNullable(),
  question_answers: textNullable(),
  official: text(),
  official_name: varChar(150),
  official_phone: varCharNullable(20),
  status_id: jobStatusCtx.references.code(),
  position_status_id: jobPositionStatusCtx.references.code(),

  ...gm.housekeeping.columns,
});

// deno-fmt-ignore
const allActiveJobPositionVW = SQLa.safeViewDefinition("vwjobposition", {
  job_position_id: z.string(),
  position_title: z.string(),
  description: z.string(),
  grade: z.string(),
  official: z.string(),
  positionstatuscode: z.number(),
  positionstatus: z.string(),
  start_date: z.date(),
  end_date: z.date(),
  search_committee: z.string(),
  question_answers: z.string(),
})`
SELECT
    job_position_id,
    position_title,
    description,
    grade,
    official,
    positionstatus.code positionstatuscode,
    positionstatus.value positionstatus,
    start_date,
    end_date,
    search_committee,
    question_answers
FROM
    $ {jobSchema}.${jobPosition} AS jobposition
    LEFT JOIN $ {jobSchema}.${jobStatusCtx} AS jobstatus ON jobstatus.code = jobposition.status_id
    LEFT JOIN $ {jobSchema}.${jobPositionStatusCtx} AS positionstatus ON jobposition.position_status_id = positionstatus.code
WHERE (CONVERT(VARCHAR, jobstatus.value) = 'ACTIVE') `;

function sqlDDL() {
  // NOTE: every time the template is "executed" it will fill out tables, views
  //       in dvts.tablesDeclared, etc.
  // deno-fmt-ignore
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
  IF OBJECT_ID(N'${jobSchema}.${execCtx.tableName}', N'U') IS NOT NULL
      drop table ${execCtx.tableName}
    ${execCtx}
    ${execCtx.seedDML}
    ${jobStatusCtx}
    ${jobStatusCtx.seedDML}
    ${jobPositionStatusCtx}
    ${jobPositionStatusCtx.seedDML}
    ${jobPosition}
    GO
    ${allActiveJobPositionVW}
    `;
}

tp.typicalCLI({
  defaultDialect: "Microsoft SQL*Server",
  resolve: (specifier) =>
    specifier ? import.meta.resolve(specifier) : import.meta.url,
  prepareSQL: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
  prepareDiagram: () => {
    // "executing" the following will fill gm.tablesDeclared but we don't
    // care about the SQL output, just the state management (tablesDeclared)
    sqlDDL().SQL(ctx);
    return gts.pumlERD(ctx).content;
  },
}).commands.command(
  "driver",
  // deno-fmt-ignore
  new tp.cli.Command()
    .description("Emit SQL*Server Powershell Driver")
    .option("-d, --dest <file:string>", "Output destination, STDOUT if not supplied")
    .option("--destroy-first", "Include SQL to destroy existing objects first (dangerous but useful for development)")
    .action((options) => {
      const output = tp.powershellDriver(sqlDDL(), ctx);
      if (options.dest) {
        Deno.writeTextFileSync(options.dest, output);
      } else {
        console.log(output);
      }
    }),
).parse(Deno.args);

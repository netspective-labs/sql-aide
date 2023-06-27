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
  integerNullable,
  varChar,
  dateNullable,
} = gm.domains;
const { autoIncPrimaryKey: autoIncPK } = gm.keys;

export const jobSchema = SQLa.sqlSchemaDefn("dbo", {
  isIdempotent: true,
});
export enum jobPositionStatusContext {
  Current = "Current",
  Past = "Past",
  Future = "Future",
  Draft = "Draft",
  Archive = "Archive",
}

const jobPositionStatusCtx = gm.varCharEnumTable(
  "job_position_status",
  jobPositionStatusContext,
  100,
  { sqlNS: jobSchema },
);

const jobPosition = gm.autoIncPkTable(
  "job_position",
  {
    job_position_id: autoIncPK(),
    position_title: text(),
    job_category_id: integerNullable(),
    description: textNullable(),
    requirements: textNullable(),
    responsibilities: textNullable(),
    department_id: integerNullable(),
    grade: textNullable(),
    experience_level: textNullable(),
    skills_required: textNullable(),
    location_id: integerNullable(),
    no_of_openings: integerNullable(),
    salary_type_code: integerNullable(),
    start_date: dateNullable(),
    end_date: dateNullable(),
    search_committee: textNullable(),
    question_answers: textNullable(),
    official: textNullable(),
    posted_date: dateNullable(),
    position_status_code: varChar(100),
    ...gm.housekeeping.columns,
  },
  { sqlNS: jobSchema },
);

const jobPositionStatusVW = SQLa.safeViewDefinition("vw_JobPositionStatus", {
  code: z.number(),
  value: z.string(),
})` SELECT code,value FROM ${jobPositionStatusCtx};
`;

const allActiveJobPositionVW = SQLa.safeViewDefinition(
  "vw_JobPositionCurrent",
  {
    job_position_id: z.string(),
    position_title: z.string(),
    description: z.string(),
    grade: z.string(),
    official: z.string(),
    position_status_code: z.number(),
    position_status: z.string(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    search_committee: z.string(),
    question_answers: z.string(),
    posted_date: z.date().optional(),
    no_of_openings: z.number(),
  },
)`
WITH CTE_JobPosition AS (
  SELECT
      job_position_id,
      position_title,
      description,
      grade,
      official,
      positionstatus.code AS position_status_code,
      CAST(positionstatus.value AS nvarchar(max)) position_status,
      CONVERT(varchar(10), jobposition.start_date, 101) AS start_date,
      CONVERT(varchar(10), jobposition.end_date, 101) AS end_date,
      search_committee,
      question_answers,
      posted_date,
      no_of_openings,
      ROW_NUMBER() OVER (ORDER BY posted_date DESC) AS row_num
      from  ${jobPosition} as jobposition
      left join ${jobPositionStatusCtx} as positionstatus on jobposition. position_status_code= positionstatus.code
  WHERE
      positionstatus.code = 'Current'
)
SELECT
  job_position_id,
  position_title,
  description,
  grade,
  official,
  position_status_code,
  position_status,
  start_date,
  end_date,
  search_committee,
  question_answers,
  posted_date,
  no_of_openings
FROM
  CTE_JobPosition
WHERE
  row_num > 0;`;

const allPastJobPositionVW = SQLa.safeViewDefinition("vw_JobPositionPast", {
  job_position_id: z.string(),
  position_title: z.string(),
  description: z.string(),
  grade: z.string(),
  official: z.string(),
  position_status_code: z.number(),
  position_status: z.string(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  search_committee: z.string(),
  question_answers: z.string(),
  posted_date: z.date().optional(),
  no_of_openings: z.number(),
})`
WITH CTE_JobPosition AS (
  SELECT
      job_position_id,
      position_title,
      description,
      grade,
      official,
      positionstatus.code AS position_status_code,
      CAST(positionstatus.value AS nvarchar(max)) position_status,
      CONVERT(varchar(10), jobposition.start_date, 101) AS start_date,
      CONVERT(varchar(10), jobposition.end_date, 101) AS end_date,
      search_committee,
      question_answers,
      posted_date,
      no_of_openings,
      ROW_NUMBER() OVER (ORDER BY posted_date DESC, job_position_id desc) AS row_num
      from  ${jobPosition} as jobposition
      left join ${jobPositionStatusCtx} as positionstatus on jobposition. position_status_code= positionstatus.code
  WHERE
  positionstatus.code= 'Past'
)
SELECT
  job_position_id,
  position_title,
  description,
  grade,
  official,
  position_status_code,
  position_status,
  start_date,
  end_date,
  search_committee,
  question_answers,
  posted_date,
  no_of_openings
FROM
  CTE_JobPosition
WHERE
  row_num > 0;`;

const allFutureJobPositionVW = SQLa.safeViewDefinition("vw_JobPositionFuture", {
  job_position_id: z.string(),
  position_title: z.string(),
  description: z.string(),
  grade: z.string(),
  official: z.string(),
  position_status_code: z.number(),
  position_status: z.string(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  search_committee: z.string(),
  question_answers: z.string(),
  posted_date: z.date().optional(),
  no_of_openings: z.number(),
})`
WITH CTE_JobPosition AS (
  SELECT
      job_position_id,
      position_title,
      description,
      grade,
      official,
      positionstatus.code AS position_status_code,
      CAST(positionstatus.value AS nvarchar(max)) position_status,
      CONVERT(varchar(10), jobposition.start_date, 101) AS start_date,
      CONVERT(varchar(10), jobposition.end_date, 101) AS end_date,
      search_committee,
      question_answers,
      posted_date,
      ROW_NUMBER() OVER (ORDER BY posted_date DESC, job_position_id desc) AS row_num,
      no_of_openings
      from  ${jobPosition} as jobposition
      left join ${jobPositionStatusCtx} as positionstatus on jobposition. position_status_code= positionstatus.code
  WHERE
  positionstatus.code = 'Future'
)
SELECT
  job_position_id,
  position_title,
  description,
  grade,
  official,
  position_status_code,
  position_status,
  start_date,
  end_date,
  search_committee,
  question_answers,
  posted_date,
  no_of_openings
FROM
  CTE_JobPosition
WHERE
  row_num > 0;`;

const allArchivedJobPositionVW = SQLa.safeViewDefinition(
  "vw_JobPositionArchive",
  {
    job_position_id: z.string(),
    position_title: z.string(),
    description: z.string(),
    grade: z.string(),
    official: z.string(),
    position_status_code: z.number(),
    position_status: z.string(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    search_committee: z.string(),
    question_answers: z.string(),
    created_at: z.date(),
    no_of_openings: z.number(),
  },
)`
WITH CTE_JobPosition AS (
  SELECT
      job_position_id,
      position_title,
      description,
      grade,
      official,
      positionstatus.code AS position_status_code,
      CAST(positionstatus.value AS nvarchar(max)) position_status,
      CONVERT(varchar(10), jobposition.start_date, 101) AS start_date,
      CONVERT(varchar(10), jobposition.end_date, 101) AS end_date,
      search_committee,
      question_answers,
      jobposition.created_at,
      no_of_openings,
      ROW_NUMBER() OVER (ORDER BY jobposition.created_at DESC) AS row_num
      from  ${jobPosition} as jobposition
      left join ${jobPositionStatusCtx} as positionstatus on jobposition. position_status_code= positionstatus.code
  WHERE
  positionstatus.code = 'Archive'
)
SELECT
  job_position_id,
  position_title,
  description,
  grade,
  official,
  position_status_code,
  position_status,
  start_date,
  end_date,
  search_committee,
  question_answers,
  created_at,
  no_of_openings
FROM
  CTE_JobPosition
WHERE
  row_num > 0;`;

const allDraftJobPositionVW = SQLa.safeViewDefinition("vw_JobPositionDraft", {
  job_position_id: z.string(),
  position_title: z.string(),
  description: z.string(),
  grade: z.string(),
  official: z.string(),
  position_status_code: z.number(),
  position_status: z.string(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  search_committee: z.string(),
  question_answers: z.string(),
  created_at: z.date(),
  no_of_openings: z.number(),
})`
WITH CTE_JobPosition AS (
  SELECT
      job_position_id,
      position_title,
      description,
      grade,
      official,
      positionstatus.code AS position_status_code,
      CAST(positionstatus.value AS nvarchar(max)) position_status,
      CONVERT(varchar(10), jobposition.start_date, 101) AS start_date,
      CONVERT(varchar(10), jobposition.end_date, 101) AS end_date,
      search_committee,
      question_answers,
      jobposition.created_at,
      no_of_openings,
      ROW_NUMBER() OVER (ORDER BY jobposition.created_at DESC) AS row_num
      from  ${jobPosition} as jobposition
      left join ${jobPositionStatusCtx} as positionstatus on jobposition. position_status_code= positionstatus.code
  WHERE
  positionstatus.code= 'Draft'
)
SELECT
  job_position_id,
  position_title,
  description,
  grade,
  official,
  position_status_code,
  position_status,
  start_date,
  end_date,
  search_committee,
  question_answers,
  created_at,
  no_of_openings
FROM
  CTE_JobPosition
WHERE
  row_num > 0;`;

const allJobPositionsVW = SQLa.safeViewDefinition("vw_JobPositionAll", {
  job_position_id: z.string(),
  position_title: z.string(),
  description: z.string(),
  grade: z.string(),
  official: z.string(),
  position_status_code: z.number(),
  position_status: z.string(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  search_committee: z.string(),
  question_answers: z.string(),
  posted_date: z.date().optional(),
  no_of_openings: z.number(),
})`
select job_position_id, position_title,
description,
grade,
official,
positionstatus.code position_status_code,
CAST(positionstatus.value AS nvarchar(max)) position_status,
CONVERT(varchar(10), jobposition.start_date, 101) AS start_date,
CONVERT(varchar(10), jobposition.end_date, 101) AS end_date,
search_committee,
question_answers,
posted_date,
no_of_openings
from  ${jobPosition} as jobposition
left join ${jobPositionStatusCtx} as positionstatus on jobposition. position_status_code= positionstatus.code`;

function sqlDDL() {
  // NOTE: every time the template is "executed" it will fill out tables, views
  //       in dvts.tablesDeclared, etc.
  // deno-fmt-ignore
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`

    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'${jobSchema.sqlNamespace}.proc_Insert_JobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE ${jobSchema.sqlNamespace}.proc_Insert_JobPositions;

    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'${jobSchema.sqlNamespace}.proc_Update_JobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE ${jobSchema.sqlNamespace}.proc_Update_JobPositions;

    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'${jobSchema.sqlNamespace}.proc_Delete_JobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE ${jobSchema.sqlNamespace}.proc_Delete_JobPositions;



    IF OBJECT_ID(N'${jobSchema.sqlNamespace}.${jobPosition.tableName}', N'U') IS NOT NULL
    drop table ${jobPosition.tableName};

    IF OBJECT_ID(N'${jobSchema.sqlNamespace}.${jobPositionStatusCtx.tableName}', N'U') IS NOT NULL
    drop table ${jobPositionStatusCtx.tableName};


    ${jobPositionStatusCtx}

    ${jobPositionStatusCtx.seedDML}

    ${jobPosition}

    GO

    ${allActiveJobPositionVW}
    GO
    ${allPastJobPositionVW}
    GO
    ${allFutureJobPositionVW}
    GO
    ${allDraftJobPositionVW}
    GO
    ${allArchivedJobPositionVW}
    GO
    ${allJobPositionsVW}
    GO

    GO

    ${jobPositionStatusVW}

    GO


    ALTER TABLE ${jobPosition.tableName} ADD FOREIGN KEY (position_status_code) REFERENCES ${jobPositionStatusCtx.tableName}(code);

    go

    CREATE PROCEDURE ${jobSchema.sqlNamespace}.[proc_Insert_JobPositions]
        @jsonData NVARCHAR(MAX)
    AS
    BEGIN

    DECLARE @positionTitle NVARCHAR(MAX),
            @postedDate DATETIME2;

    SELECT @positionTitle = JSON_VALUE(@jsonData, '$.position_title');

        INSERT INTO ${jobPosition.tableName} (
            position_title,
            description,
            grade,
            start_date,
            end_date,
            search_committee,
            question_answers,
            official,
            position_status_code,
            posted_date,
            no_of_openings
        )
        SELECT
            position_title,
            description,
            grade,
            start_date,
            end_date,
            search_committee,
            question_answers,
            official,
             position_status_code,
            CASE WHEN position_status_code IN ('Current', 'Past', 'Future') THEN GETDATE() ELSE NULL END AS posted_date,
            no_of_openings
        FROM OPENJSON(@jsonData, '$.jobPositions')
        WITH (
            position_title NVARCHAR(MAX),
            description NVARCHAR(MAX),
            grade NVARCHAR(MAX),
            start_date DATE,
            end_date DATE,
            search_committee NVARCHAR(MAX),
            question_answers NVARCHAR(MAX),
            official NVARCHAR(MAX),
            position_status_code INT,
            no_of_openings INT
        );
    END;
    GO

    CREATE PROCEDURE ${jobSchema.sqlNamespace}.[proc_Update_JobPositions]
        @jsonData NVARCHAR(MAX)
    AS
    BEGIN
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ
    BEGIN TRANSACTION

    DECLARE @UpdatedDetails TABLE (
        job_position_id INT,
        position_title NVARCHAR(MAX),
        job_category_id INT,
        description NVARCHAR(MAX),
        requirements NVARCHAR(MAX),
        responsibilities NVARCHAR(MAX),
        department_id INT,
        grade NVARCHAR(MAX),
        experience_level NVARCHAR(MAX),
        skills_required NVARCHAR(MAX),
        location_id INT,
        no_of_openings INT,
        salary_type_code INT,
        start_date DATE,
        end_date DATE,
        search_committee NVARCHAR(MAX),
        question_answers NVARCHAR(MAX),
        official NVARCHAR(MAX),
        position_status_code INT
    )

    UPDATE jp
    SET jp.position_title = jpdata.position_title,
        jp.job_category_id = jpdata.job_category_id,
        jp.description = jpdata.description,
        jp.requirements = jpdata.requirements,
        jp.responsibilities = jpdata.responsibilities,
        jp.department_id = jpdata.department_id,
        jp.grade = jpdata.grade,
        jp.experience_level = jpdata.experience_level,
        jp.skills_required = jpdata.skills_required,
        jp.location_id = jpdata.location_id,
        jp.no_of_openings = jpdata.no_of_openings,
        jp.salary_type_code = jpdata.salary_type_code,
        jp.start_date = jpdata.start_date,
        jp.end_date = jpdata.end_date,
        jp.search_committee = jpdata.search_committee,
        jp.question_answers = jpdata.question_answers,
        jp.official = jpdata.official,
        jp.position_status_code = jpdata.position_status_code,
        jp.posted_date = CASE
            WHEN jpdata.position_status_code IN ('Current', 'Past', 'Future') AND jp.posted_date IS NULL THEN GETDATE()
            ELSE jp.posted_date
        END
    OUTPUT
        Inserted.job_position_id,
        Inserted.position_title,
        Inserted.job_category_id,
        Inserted.description,
        Inserted.requirements,
        Inserted.responsibilities,
        Inserted.department_id,
        Inserted.grade,
        Inserted.experience_level,
        Inserted.skills_required,
        Inserted.location_id,
        Inserted.no_of_openings,
        Inserted.salary_type_code,
        Inserted.start_date,
        Inserted.end_date,
        Inserted.search_committee,
        Inserted.question_answers,
        Inserted.official,
        Inserted.position_status_code
    INTO @UpdatedDetails
    FROM job_position jp
    JOIN OPENJSON(@jsonData, '$.jobPositions')
        WITH (
            job_position_id INT '$.job_position_id',
            position_title NVARCHAR(MAX),
            job_category_id INT,
            description NVARCHAR(MAX),
            requirements NVARCHAR(MAX),
            responsibilities NVARCHAR(MAX),
            department_id INT,
            grade NVARCHAR(MAX),
            experience_level NVARCHAR(MAX),
            skills_required NVARCHAR(MAX),
            location_id INT,
            no_of_openings INT,
            salary_type_code INT,
            start_date DATE,
            end_date DATE,
            search_committee NVARCHAR(MAX),
            question_answers NVARCHAR(MAX),
            official NVARCHAR(MAX),
            position_status_code INT
        ) jpdata
    ON jp.job_position_id = jpdata.job_position_id;

    SELECT
        ud.job_position_id,
        ud.position_title,
        jp.description,
        jp.grade,
        jp.no_of_openings,
        jp.start_date,
        jp.end_date,
        jp.search_committee,
        jp.question_answers,
        jp.official,
        jp.position_status_code
    FROM
        @UpdatedDetails ud
    JOIN
        job_position jp ON ud.job_position_id = jp.job_position_id;

    COMMIT TRANSACTION
END;

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
})
  .commands.command(
    "driver",
    // deno-fmt-ignore
    new tp.cli.Command()
      .description("Emit SQL*Server Powershell Driver")
      .option(
        "-d, --dest <file:string>",
        "Output destination, STDOUT if not supplied"
      )
      .option(
        "--destroy-first",
        "Include SQL to destroy existing objects first (dangerous but useful for development)"
      )
      .option(
        "--schema-name <schemaName:string>",
        "If destroying or creating a schema, this is the name of the schema"
      )
      .action((options) => {
        const output = tp.powershellDriver(sqlDDL(), ctx);
        if (options.dest) {
          Deno.writeTextFileSync(options.dest, output);
        } else {
          console.log(output);
        }
      }),
  )
  .parse(Deno.args);

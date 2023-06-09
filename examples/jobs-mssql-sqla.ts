#!/usr/bin/env -S deno run --allow-all
// the #! (`shebang`) descriptor allows us to run this script as a binary on Linux

// IMPORTANT: when you use this outside of library use this type of import with pinned versions:
// import * as dvp from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.0.10/pattern/typical/mod.ts";
import * as tp from "../pattern/typical/mod.ts";
const { SQLa, ws } = tp;
import { zod as z } from "../deps.ts";

const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.msSqlServerDialect(),
  sqlNamingStrategy: SQLa.bracketSqlNamingStrategy(),
});
type EmitContext = typeof ctx;

const gts = tp.governedTemplateState<tp.GovernedDomain, EmitContext>();
const gm = tp.governedModel<tp.GovernedDomain, EmitContext>(gts.ddlOptions);
const { text, textNullable, integerNullable, dateNullable } = gm.domains;
const { autoIncPrimaryKey: autoIncPK } = gm.keys;
const jobSchema = "[dbo]";

export enum jobStatusContext {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  DELETED = "DELETED",
}

const jobStatusCtx = gm.textEnumTable("job_status", jobStatusContext);

export enum jobPositionStatusContext {
  Current = "Current",
  Past = "Past",
  Future = "Future",
}

const jobPositionStatusCtx = gm.textEnumTable(
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

const _jobGrade = gm.autoIncPkTable("job_grade", {
  job_grade_id: autoIncPK(),
  grade_name: text(),
  description: textNullable(),
  ...gm.housekeeping.columns,
});

const jobPosition = gm.autoIncPkTable("job_position", {
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
  status_id: jobStatusCtx.references.code(),
  position_status_id: jobPositionStatusCtx.references.code(),
  ...gm.housekeeping.columns,
});

const jobStatusVW = SQLa.safeViewDefinition("vwjobstatus", {
  code: z.number(),
  value: z.string(),
})`
SELECT code,value FROM ${jobSchema}.${jobStatusCtx};
`;

const jobPositionStatusVW = SQLa.safeViewDefinition("vwjobpositionstatus", {
  code: z.number(),
  value: z.string(),
})`
SELECT code,value FROM ${jobSchema}.${jobPositionStatusCtx};
`;

const allActiveJobPositionVW = SQLa.safeViewDefinition("vwjobposition", {
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
})`
select job_position_id, position_title,
description,
grade,
official,
positionstatus.code position_status_code,
positionstatus.value position_status,
start_date,
end_date,
search_committee,
question_answers
from  ${jobSchema}.${jobPosition} as jobposition
left join ${jobSchema}.${jobStatusCtx} as jobstatus on jobstatus.code=jobposition.status_id
left join ${jobSchema}.${jobPositionStatusCtx} as positionstatus on jobposition.position_status_id= positionstatus.code
where (CONVERT(VARCHAR, jobstatus.value) = 'ACTIVE') and  (CONVERT(VARCHAR, positionstatus.value) ='Current');`;

const allPastJobPositionVW = SQLa.safeViewDefinition("vwpastjobposition", {
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
})`
select job_position_id, position_title,
description,
grade,
official,
positionstatus.code position_status_code,
positionstatus.value position_status,
start_date,
end_date,
search_committee,
question_answers
from  ${jobSchema}.${jobPosition} as jobposition
left join ${jobSchema}.${jobStatusCtx} as jobstatus on jobstatus.code=jobposition.status_id
left join ${jobSchema}.${jobPositionStatusCtx} as positionstatus on jobposition.position_status_id= positionstatus.code
where (CONVERT(VARCHAR, jobstatus.value) = 'ACTIVE') and  (CONVERT(VARCHAR, positionstatus.value) ='Past');`;

const allFutureJobPositionVW = SQLa.safeViewDefinition("vwfuturejobposition", {
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
})`
select job_position_id, position_title,
description,
grade,
official,
positionstatus.code position_status_code,
positionstatus.value position_status,
start_date,
end_date,
search_committee,
question_answers
from  ${jobSchema}.${jobPosition} as jobposition
left join ${jobSchema}.${jobStatusCtx} as jobstatus on jobstatus.code=jobposition.status_id
left join ${jobSchema}.${jobPositionStatusCtx} as positionstatus on jobposition.position_status_id= positionstatus.code
where (CONVERT(VARCHAR, jobstatus.value) = 'ACTIVE') and  (CONVERT(VARCHAR, positionstatus.value) ='Future');`;

const allDeletedJobPositionVW = SQLa.safeViewDefinition(
  "vwjobpositiondeleted",
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
  },
)`
select job_position_id, position_title,
description,
grade,
official,
positionstatus.code position_status_code,
positionstatus.value position_status,
start_date,
end_date,
search_committee,
question_answers
from  ${jobSchema}.${jobPosition} as jobposition
left join ${jobSchema}.${jobStatusCtx} as jobstatus on jobstatus.code=jobposition.status_id
left join ${jobSchema}.${jobPositionStatusCtx} as positionstatus on jobposition.position_status_id= positionstatus.code
where (CONVERT(VARCHAR, jobstatus.value) = 'DELETED')`;

const allDrafterJobPositionVW = SQLa.safeViewDefinition(
  "vwjobpositiondrafted",
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
  },
)`
select job_position_id, position_title,
description,
grade,
official,
positionstatus.code position_status_code,
positionstatus.value position_status,
start_date,
end_date,
search_committee,
question_answers
from  ${jobSchema}.${jobPosition} as jobposition
left join ${jobSchema}.${jobStatusCtx} as jobstatus on jobstatus.code=jobposition.status_id
left join ${jobSchema}.${jobPositionStatusCtx} as positionstatus on jobposition.position_status_id= positionstatus.code
where (CONVERT(VARCHAR, jobstatus.value) = 'DRAFT')`;

function sqlDDL() {
  // NOTE: every time the template is "executed" it will fill out tables, views
  //       in dvts.tablesDeclared, etc.
  // deno-fmt-ignore
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'${jobSchema}.InsertJobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE ${jobSchema}.InsertJobPositions;

    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'${jobSchema}.UpdateJobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE ${jobSchema}.UpdateJobPositions;

    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'${jobSchema}.DeleteJobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE ${jobSchema}.DeleteJobPositions;

    IF OBJECT_ID(N'${jobSchema}.${jobPosition.tableName}', N'U') IS NOT NULL
    drop table ${jobPosition.tableName};

    IF OBJECT_ID(N'${jobSchema}.${jobPositionStatusCtx.tableName}', N'U') IS NOT NULL
    drop table ${jobPositionStatusCtx.tableName};

    IF OBJECT_ID(N'${jobSchema}.${jobStatusCtx.tableName}', N'U') IS NOT NULL
    drop table ${jobStatusCtx.tableName};

    ${jobStatusCtx}

    ${jobStatusCtx.seedDML}

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
    ${allDrafterJobPositionVW}
    GO
    ${allDeletedJobPositionVW}
    GO

    ${jobStatusVW}

    GO

    ${jobPositionStatusVW}

    GO

    CREATE PROCEDURE ${jobSchema}.[InsertJobPositions]
        @jsonData NVARCHAR(MAX)
    AS
    BEGIN
        INSERT INTO ${jobPosition.tableName} (
            position_title,
            job_category_id,
            description,
            requirements,
            responsibilities,
            department_id,
            grade,
            experience_level,
            skills_required,
            location_id,
            no_of_openings,
            salary_type_code,
            start_date,
            end_date,
            search_committee,
            question_answers,
            official,
            status_id,
            position_status_id
        )
        SELECT
            position_title,
            job_category_id,
            description,
            requirements,
            responsibilities,
            department_id,
            grade,
            experience_level,
            skills_required,
            location_id,
            no_of_openings,
            salary_type_code,
            start_date,
            end_date,
            search_committee,
            question_answers,
            official,
            status_id,
            position_status_id
        FROM OPENJSON(@jsonData, '$.jobPositions')
        WITH (
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
            status_id INT,
            position_status_id INT
        );
    END;
    GO

    CREATE PROCEDURE ${jobSchema}.[UpdateJobPositions]
        @jsonData NVARCHAR(MAX)
    AS
    BEGIN
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
            jp.status_id = jpdata.status_id,
            jp.position_status_id = jpdata.position_status_id
        FROM ${jobPosition.tableName} jp
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
                status_id INT,
                position_status_id INT
            ) jpdata
        ON jp.job_position_id = jpdata.job_position_id;
    END;


    GO
    CREATE PROCEDURE ${jobSchema}.[DeleteJobPositions]
        @jsonData NVARCHAR(MAX)
    AS
    BEGIN
    Declare @intStatusId   int
    Select  @intStatusId=code from ${jobStatusCtx.tableName}  where CONVERT(VARCHAR, value)='DELETED'
    Update jp set status_id=@intStatusId
    from job_position jp
        JOIN OPENJSON(@jsonData, '$.jobPositionIds')
            WITH (jobPositionId INT '$') jpid
        ON jp.job_position_id = jpid.jobPositionId;
    END;
    GO

GO
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
      .action((options) => {
        const output = tp.powershellDriver(sqlDDL(), ctx);
        if (options.dest) {
          Deno.writeTextFileSync(options.dest, output);
        }
      }),
  )
  .parse(Deno.args);

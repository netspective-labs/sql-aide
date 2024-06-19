
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.proc_Insert_JobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE dbo.proc_Insert_JobPositions;

    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.proc_Update_JobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE dbo.proc_Update_JobPositions;

    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.proc_Delete_JobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE dbo.proc_Delete_JobPositions;

    IF OBJECT_ID(N'dbo.job_position', N'U') IS NOT NULL
    drop table job_position;

    IF OBJECT_ID(N'dbo.job_position_status', N'U') IS NOT NULL
    drop table job_position_status;


    CREATE TABLE [dbo].[job_position_status] (
    [code] NVARCHAR(100) PRIMARY KEY NOT NULL,
    [value] TEXT NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE()
);

    INSERT INTO [dbo].[job_position_status] ([code], [value]) VALUES ('Current', 'Current');
INSERT INTO [dbo].[job_position_status] ([code], [value]) VALUES ('Past', 'Past');
INSERT INTO [dbo].[job_position_status] ([code], [value]) VALUES ('Future', 'Future');
INSERT INTO [dbo].[job_position_status] ([code], [value]) VALUES ('Draft', 'Draft');
INSERT INTO [dbo].[job_position_status] ([code], [value]) VALUES ('Archive', 'Archive');

    CREATE TABLE [dbo].[job_position] (
    [job_position_id] INTEGER IDENTITY(1,1) PRIMARY KEY,
    [position_title] NVARCHAR(MAX) NOT NULL,
    [job_category_id] INTEGER,
    [description] NVARCHAR(MAX),
    [requirements] NVARCHAR(MAX),
    [responsibilities] NVARCHAR(MAX),
    [department_id] INTEGER,
    [grade] NVARCHAR(MAX),
    [experience_level] NVARCHAR(MAX),
    [skills_required] NVARCHAR(MAX),
    [location_id] INTEGER,
    [no_of_openings] INTEGER,
    [salary_type_code] INTEGER,
    [start_date] DATE,
    [end_date] DATE,
    [search_committee] NVARCHAR(MAX),
    [question_answers] NVARCHAR(MAX),
    [official] NVARCHAR(MAX),
    [posted_date] DATE,
    [position_status_code] NVARCHAR(100) NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE(),
    [created_by] TEXT DEFAULT 'UNKNOWN',
    [updated_at] DATETIME2,
    [updated_by] TEXT,
    [deleted_at] DATETIME2,
    [deleted_by] TEXT,
    [activity_log] TEXT
);

    GO

    CREATE OR ALTER VIEW [dbo].[vw_JobPositionCurrent]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers], [posted_date], [no_of_openings]) AS
    
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
          from  [dbo].[job_position] as jobposition
          left join [dbo].[job_position_status] as positionstatus on jobposition. position_status_code= positionstatus.code
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
      row_num > 0;
    GO
    CREATE OR ALTER VIEW [dbo].[vw_JobPositionPast]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers], [posted_date], [no_of_openings]) AS
    
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
          from  [dbo].[job_position] as jobposition
          left join [dbo].[job_position_status] as positionstatus on jobposition. position_status_code= positionstatus.code
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
      row_num > 0;
    GO
    CREATE OR ALTER VIEW [dbo].[vw_JobPositionFuture]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers], [posted_date], [no_of_openings]) AS
    
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
          from  [dbo].[job_position] as jobposition
          left join [dbo].[job_position_status] as positionstatus on jobposition. position_status_code= positionstatus.code
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
      row_num > 0;
    GO
    CREATE OR ALTER VIEW [dbo].[vw_JobPositionDraft]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers], [created_at], [no_of_openings]) AS
    
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
          from  [dbo].[job_position] as jobposition
          left join [dbo].[job_position_status] as positionstatus on jobposition. position_status_code= positionstatus.code
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
      row_num > 0;
    GO
    CREATE OR ALTER VIEW [dbo].[vw_JobPositionArchive]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers], [created_at], [no_of_openings]) AS
    
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
          from  [dbo].[job_position] as jobposition
          left join [dbo].[job_position_status] as positionstatus on jobposition. position_status_code= positionstatus.code
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
      row_num > 0;
    GO
    CREATE OR ALTER VIEW [dbo].[vw_JobPositionAll]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers], [posted_date], [no_of_openings]) AS
    
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
    from  [dbo].[job_position] as jobposition
    left join [dbo].[job_position_status] as positionstatus on jobposition. position_status_code= positionstatus.code;
    GO

    GO

    CREATE OR ALTER VIEW [dbo].[vw_JobPositionStatus]([code], [value]) AS
    SELECT code,value FROM [dbo].[job_position_status];
    ;

    GO

    ALTER TABLE job_position ADD FOREIGN KEY (position_status_code) REFERENCES job_position_status(code);
    go

    CREATE PROCEDURE dbo.[proc_Insert_JobPositions]
        @jsonData NVARCHAR(MAX)
    AS
    BEGIN

    DECLARE @positionTitle NVARCHAR(MAX),
            @postedDate DATETIME2;

    SELECT @positionTitle = JSON_VALUE(@jsonData, '$.position_title');

        INSERT INTO job_position (
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

    CREATE PROCEDURE dbo.[proc_Update_JobPositions]
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

    
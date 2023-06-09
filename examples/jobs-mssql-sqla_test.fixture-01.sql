    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].InsertJobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE [dbo].InsertJobPositions;

    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].UpdateJobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE [dbo].UpdateJobPositions;

    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].DeleteJobPositions') AND type IN (N'P', N'PC'))
    drop PROCEDURE [dbo].DeleteJobPositions;

    IF OBJECT_ID(N'[dbo].job_position', N'U') IS NOT NULL
    drop table job_position;

    IF OBJECT_ID(N'[dbo].job_position_status', N'U') IS NOT NULL
    drop table job_position_status;

    IF OBJECT_ID(N'[dbo].job_status', N'U') IS NOT NULL
    drop table job_status;

    CREATE TABLE [job_status] (
    [code] NVARCHAR(450) PRIMARY KEY NOT NULL,
    [value] NVARCHAR(450) NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE()
);

    INSERT INTO [job_status] ([code], [value]) VALUES ('ACTIVE', 'ACTIVE');
INSERT INTO [job_status] ([code], [value]) VALUES ('DRAFT', 'DRAFT');
INSERT INTO [job_status] ([code], [value]) VALUES ('DELETED', 'DELETED');

    CREATE TABLE [job_position_status] (
    [code] NVARCHAR(450) PRIMARY KEY NOT NULL,
    [value] NVARCHAR(450) NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE()
);

    INSERT INTO [job_position_status] ([code], [value]) VALUES ('Current', 'Current');
INSERT INTO [job_position_status] ([code], [value]) VALUES ('Past', 'Past');
INSERT INTO [job_position_status] ([code], [value]) VALUES ('Future', 'Future');

    CREATE TABLE [job_position] (
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
    [status_id] NVARCHAR(450) NOT NULL,
    [position_status_id] NVARCHAR(450) NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE(),
    [created_by] TEXT DEFAULT 'UNKNOWN',
    FOREIGN KEY([status_id]) REFERENCES [job_status]([code]),
    FOREIGN KEY([position_status_id]) REFERENCES [job_position_status]([code])
);

    GO

    CREATE OR ALTER VIEW [vwjobposition]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers]) AS
    
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
    from  [dbo].[job_position] as jobposition
    left join [dbo].[job_status] as jobstatus on jobstatus.code=jobposition.status_id
    left join [dbo].[job_position_status] as positionstatus on jobposition.position_status_id= positionstatus.code
    where (CONVERT(VARCHAR, jobstatus.value) = 'ACTIVE') and  (CONVERT(VARCHAR, positionstatus.value) ='Current');
    GO
    CREATE OR ALTER VIEW [vwpastjobposition]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers]) AS
    
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
    from  [dbo].[job_position] as jobposition
    left join [dbo].[job_status] as jobstatus on jobstatus.code=jobposition.status_id
    left join [dbo].[job_position_status] as positionstatus on jobposition.position_status_id= positionstatus.code
    where (CONVERT(VARCHAR, jobstatus.value) = 'ACTIVE') and  (CONVERT(VARCHAR, positionstatus.value) ='Past');
    GO
    CREATE OR ALTER VIEW [vwfuturejobposition]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers]) AS
    
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
    from  [dbo].[job_position] as jobposition
    left join [dbo].[job_status] as jobstatus on jobstatus.code=jobposition.status_id
    left join [dbo].[job_position_status] as positionstatus on jobposition.position_status_id= positionstatus.code
    where (CONVERT(VARCHAR, jobstatus.value) = 'ACTIVE') and  (CONVERT(VARCHAR, positionstatus.value) ='Future');
    GO
    CREATE OR ALTER VIEW [vwjobpositiondrafted]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers]) AS
    
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
    from  [dbo].[job_position] as jobposition
    left join [dbo].[job_status] as jobstatus on jobstatus.code=jobposition.status_id
    left join [dbo].[job_position_status] as positionstatus on jobposition.position_status_id= positionstatus.code
    where (CONVERT(VARCHAR, jobstatus.value) = 'DRAFT');
    GO
    CREATE OR ALTER VIEW [vwjobpositiondeleted]([job_position_id], [position_title], [description], [grade], [official], [position_status_code], [position_status], [start_date], [end_date], [search_committee], [question_answers]) AS
    
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
    from  [dbo].[job_position] as jobposition
    left join [dbo].[job_status] as jobstatus on jobstatus.code=jobposition.status_id
    left join [dbo].[job_position_status] as positionstatus on jobposition.position_status_id= positionstatus.code
    where (CONVERT(VARCHAR, jobstatus.value) = 'DELETED');
    GO

    CREATE OR ALTER VIEW [vwjobstatus]([code], [value]) AS
    
    SELECT code,value FROM [dbo].[job_status];
    ;

    GO

    CREATE OR ALTER VIEW [vwjobpositionstatus]([code], [value]) AS
    
    SELECT code,value FROM [dbo].[job_position_status];
    ;

    GO

    CREATE PROCEDURE [dbo].[InsertJobPositions]
        @jsonData NVARCHAR(MAX)
    AS
    BEGIN
        INSERT INTO job_position (
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

    CREATE PROCEDURE [dbo].[UpdateJobPositions]
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
                status_id INT,
                position_status_id INT
            ) jpdata
        ON jp.job_position_id = jpdata.job_position_id;
    END;


    GO
    CREATE PROCEDURE [dbo].[DeleteJobPositions]
        @jsonData NVARCHAR(MAX)
    AS
    BEGIN
    Declare @intStatusId   int
    Select  @intStatusId=code from job_status  where CONVERT(VARCHAR, value)='DELETED'
    Update jp set status_id=@intStatusId
    from job_position jp
        JOIN OPENJSON(@jsonData, '$.jobPositionIds')
            WITH (jobPositionId INT '$') jpid
        ON jp.job_position_id = jpid.jobPositionId;
    END;
    GO

GO
    
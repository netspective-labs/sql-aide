IF OBJECT_ID(N'dbo.execution_context', N'U') IS NOT NULL
    drop table execution_context
  CREATE TABLE [execution_context] (
    [code] INTEGER PRIMARY KEY NOT NULL,
    [value] TEXT NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE()
);
  INSERT INTO [execution_context] ([code], [value]) VALUES (0, 'DEVELOPMENT');
INSERT INTO [execution_context] ([code], [value]) VALUES (1, 'TEST');
INSERT INTO [execution_context] ([code], [value]) VALUES (2, 'PRODUCTION');
  CREATE TABLE [job_status] (
    [code] NVARCHAR(100) PRIMARY KEY NOT NULL,
    [value] TEXT NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE()
);
  INSERT INTO [job_status] ([code], [value]) VALUES ('ACTIVE', 'ACTIVE');
INSERT INTO [job_status] ([code], [value]) VALUES ('DRAFT', 'DRAFT');
INSERT INTO [job_status] ([code], [value]) VALUES ('DELETED', 'DELETED');
  CREATE TABLE [job_position_status] (
    [code] INTEGER PRIMARY KEY NOT NULL,
    [value] TEXT NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE()
);
  INSERT INTO [job_position_status] ([code], [value]) VALUES (0, 'Current');
INSERT INTO [job_position_status] ([code], [value]) VALUES (1, 'Past');
INSERT INTO [job_position_status] ([code], [value]) VALUES (2, 'Future');
  CREATE TABLE [job_position] (
    [job_position_id] INTEGER IDENTITY(1,1) PRIMARY KEY,
    [position_title] NVARCHAR(MAX) NOT NULL,
    [job_category_id] INTEGER,
    [description] NVARCHAR(MAX),
    [requirements] NVARCHAR(MAX),
    [responsibilities] NVARCHAR(MAX),
    [department_id] INTEGER NOT NULL,
    [grade] NVARCHAR(MAX) NOT NULL,
    [experience_level] NVARCHAR(MAX),
    [skills_required] NVARCHAR(MAX),
    [location_id] INTEGER NOT NULL,
    [no_of_openings] INTEGER NOT NULL,
    [salary_type_code] INTEGER NOT NULL,
    [start_date] DATE NOT NULL,
    [end_date] DATE NOT NULL,
    [search_committee] NVARCHAR(MAX),
    [question_answers] NVARCHAR(MAX),
    [official] NVARCHAR(MAX) NOT NULL,
    [official_name] NVARCHAR(150) NOT NULL,
    [official_phone] NVARCHAR(20),
    [status_id] TEXT NOT NULL,
    [position_status_id] INTEGER NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE(),
    [created_by] TEXT DEFAULT 'UNKNOWN',
    [updated_at] DATETIME2,
    [updated_by] TEXT,
    [deleted_at] DATETIME2,
    [deleted_by] TEXT,
    [activity_log] TEXT,
    FOREIGN KEY([status_id]) REFERENCES [job_status]([code]),
    FOREIGN KEY([position_status_id]) REFERENCES [job_position_status]([code])
);
  GO
  CREATE OR ALTER VIEW [vwjobposition]([job_position_id], [position_title], [description], [grade], [official], [positionstatuscode], [positionstatus], [start_date], [end_date], [search_committee], [question_answers]) AS
    
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
        $ {jobSchema}.[job_position] AS jobposition
        LEFT JOIN $ {jobSchema}.[job_status] AS jobstatus ON jobstatus.code = jobposition.status_id
        LEFT JOIN $ {jobSchema}.[job_position_status] AS positionstatus ON jobposition.position_status_id = positionstatus.code
    WHERE (CONVERT(VARCHAR, jobstatus.value) = 'ACTIVE') ;
  
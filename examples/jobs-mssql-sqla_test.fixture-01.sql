CREATE TABLE [execution_context] (
    [code] INTEGER PRIMARY KEY NOT NULL,
    [value] TEXT NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE()
);
INSERT INTO [execution_context] ([code], [value]) VALUES (0, 'DEVELOPMENT');
INSERT INTO [execution_context] ([code], [value]) VALUES (1, 'TEST');
INSERT INTO [execution_context] ([code], [value]) VALUES (2, 'PRODUCTION');
CREATE TABLE [job_grade] (
    [job_grade_id] INTEGER IDENTITY(1,1) PRIMARY KEY,
    [grade_name] TEXT NOT NULL,
    [description] TEXT,
    [created_at] DATETIME2 DEFAULT GETDATE(),
    [created_by] TEXT DEFAULT 'UNKNOWN'
);
CREATE TABLE [job_position] (
    [job_position_id] INTEGER IDENTITY(1,1) PRIMARY KEY,
    [position_title] TEXT NOT NULL,
    [job_category_id] INTEGER NOT NULL,
    [description] TEXT,
    [requirements] TEXT,
    [responsibilities] TEXT,
    [department_id] INTEGER NOT NULL,
    [grade_id] INTEGER NOT NULL,
    [experience_level] TEXT,
    [skills_required] TEXT,
    [location_id] INTEGER NOT NULL,
    [no_of_openings] INTEGER NOT NULL,
    [salary_type_code] INTEGER NOT NULL,
    [start_date] DATE NOT NULL,
    [end_date] DATE NOT NULL,
    [search_committee] TEXT,
    [question_answers] TEXT,
    [official_id] INTEGER NOT NULL,
    [status_id] INTEGER NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE(),
    [created_by] TEXT DEFAULT 'UNKNOWN'
);

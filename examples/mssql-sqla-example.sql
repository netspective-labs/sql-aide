-- not destroying first (for development)
-- no schemaName provided
CREATE TABLE[job_position](
[job_position_id] integer IDENTITY (1, 1) NOT NULL,
[position_title] text NOT NULL,
[job_category_id] integer NOT NULL,
[description] text,
[requirements] text,
[responsibilities] text,
[department_id] integer NOT NULL,
[grade_id] integer NOT NULL,
[experience_level] text,
[skills_required] text,
[location_id] integer NOT NULL,
[no_of_openings] integer NOT NULL,
[salary_type_code] integer NOT NULL,
[start_date] date NOT NULL,
[end_date] date NOT NULL,
[search_committee] text,
[question_answers] text,
[official_id] integer NOT NULL,
[status_id] integer NOT NULL,
[created_at] DATETIME2 DEFAULT GETDATE(),
[created_by] text DEFAULT 'UNKNOWN'
);

CREATE TABLE[job_grade](
[job_grade_id] integer IDENTITY (1, 1) NOT NULL,
[grade_name] text NOT NULL,
[description] text,
[created_at] DATETIME2 DEFAULT GETDATE(),
[created_by] text DEFAULT 'UNKNOWN'
);

CREATE TABLE[execution_context](
[code] integer PRIMARY KEY NOT NULL,
[value] text NOT NULL,
[created_at] DATETIME2 DEFAULT GETDATE()
);

INSERT INTO[execution_context]([code],[value])
    VALUES (0, 'DEVELOPMENT');

INSERT INTO[execution_context]([code],[value])
    VALUES (1, 'TEST');

INSERT INTO[execution_context]([code],[value])
    VALUES (2, 'PRODUCTION');


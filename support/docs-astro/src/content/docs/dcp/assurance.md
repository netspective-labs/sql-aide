---
title: Assurance
---

# Assurance as Code _in the Database_

All code in PostgreSQL should be tested, or _assured_, with pgTAP code. All
_Assurance Engineering Cases_ (AECs) should be written code-first, not
human-first (what we call _Assurance as Code_). If Assurance is done within the
database then tools like
[PostgreSQL Anonymizer](https://gitlab.com/dalibo/postgresql_anonymizer) should
be used to help build test-first databases from production data when appropriate
(see
[this PDF](https://dalibo.gitlab.io/postgresql_anonymizer/how-to.handout.pdf)
for further elaboration).

## Chaos _in the Database_

Because our responses to bugs in the database which might lead to database
crashes is only as good as the number of times we see such crashes, we should
use tools like [pg_crash](https://github.com/cybertec-postgresql/pg_crash), a
"Chaos Monkey" Extension for PostgreSQL databases. Per their repo "pg_crash is
an extension to PostgreSQL, which allows you to periodically or randomly crash
your database infrastructure by sending kill (or other) signals to your DB
processes and make them fail. It is ideal for HA and failover testing."

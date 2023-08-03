---
title: Experimentation
sidebar:
  order: 10
---

# Friendlier and Safer Experimentation

Promote the use of
[Database Lab Engine (DLE)](https://gitlab.com/postgres-ai/database-lab) to
"provision independent non-production environments with multi-terabyte
PostgreSQL databases in a few seconds." Every developer should be able to have
their own easy to create and teardown development instances for experimentation
purposes and to make sure scripts are idempotent and repeatable. If database
cannot be easily torn down and recreated in development and quality assurance
environments, scripting is harder.

Part of the DLE is "Joe", which should be used by engineering and QA teams:

> “Joe Bot”, a virtual DBA for SQL optimization, is a revolutionary new way to
> troubleshoot and optimize PostgreSQL query performance. Instead of running
> EXPLAIN or EXPLAIN (ANALYZE, BUFFERS) directly in production, users send
> queries for troubleshooting to Joe Bot. Joe Bot uses the Database Lab Engine
> (DLE) to:

> - Generate a fresh thin clone
> - Execute the query on the clone
> - Return the resulting execution plan to the user
> - The returned plan is identical to production in terms of structure and data
  > volumes – this is achieved thanks to two factors: thin clones have the same
  > data and statistics as production (at a specified point in time), and the
  > PostgreSQL planner configuration on clones matches the production
  > configuration.

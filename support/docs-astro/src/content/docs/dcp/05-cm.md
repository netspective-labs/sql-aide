---
title: Change Management
---

# Deliberate and Disciplined Change Management _in the Database_

In PgDCP PostgreSQL is not treated as a "bit bucket" where you just store data
for an application. It's the center and most important part of our services'
universe and requires a deliberate, disciplined, database-first change
management approach. While there are many database migrations tools like
LiquiBase, Flyway, and Sqitch, they all assume that the problem should be solved
in a database-independent manner outside of PostgreSQL. Since the PgDCP approach
is to double-down on PostgreSQL and not worry about database portability, we
want to perform PosgreSQL-first database change management.

First review Martin Fowler's
[Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)
article and then see tools like:

- [Zero\-downtime schema migrations in Postgres using views](https://fabianlindfors.se/blog/schema-migrations-in-postgres/)
- [postgresql\-dbpatch](https://github.com/linz/postgresql-dbpatch), which
  support conducting database changes and deploying them in a robust and
  automated way through the database instead of external tools
- [Metagration](https://github.com/michelp/metagration), a PostgreSQL migration
  tool written in PostgreSQL
- [Konfigraf](https://github.com/PaulHatch/konfigraf), a Postgres extension that
  allows you to store and manipulate data in Git repositories stored in tables
  within the database. This is designed to be used for storage of configuration
  data for applications and services.

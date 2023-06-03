---
title: Information Assurance and Security _in the Database_
---

# Information Assurance and Security _in the Database_

PgDCP requires _database-first_ security, which means PostgreSQL schemas, users,
roles, permissions, and row-level security (RLS) should drive all data security
requirements. Role-based access control (RBAC) and attribute based access
control (ABAC) should be implemented in PostgreSQL stored routines. If
necessary, [ldap2pg](https://github.com/dalibo/ldap2pg) can be used to
synchronize roles with LDAP.

Because all our API functionality (except for serving the endpoints) will also
be _in the database_ we want to ensure that we secure views, stored procedures,
and stored functions as if they were the API endpoints.
[OWASP API Security Project](https://owasp.org/www-project-api-security/)
provides some great advice.

## Zero Trust SQL (ztSQL) for Zero Trust Data Access (ZTDA)

Zero Trust is a generally accepted cybersecurity approach that eliminates
implicit trust in favor of continuously validating each stage of digital
interactions. PgDCP encourages the same “never trust, always verify,” with _Zero
Trust SQL_ (`ztSQL`). `ztSQL` is designed to protect database environments and
enable faster development by allowing anyone to run any SQL but leveages
row-level security, attribute-based- access-control, role-based access control,
and data segmentation within the database. Granular, “least access” policies
should be implemented within the database so that _Zero Trust Data Access_
(`ZTDA`) is possible.

## Securing Access _to the Database_

If all access management is _in the database_, then securing access _to the
database_ is paramount. To that end, see:

- [Securing Databases with Dynamic Credentials and HashiCorp
  Vault](https://github.com/sql2/PostgreSQL_with_Dynamic_Credentials)
- [Using Vault to manage dynamic credentials of a
  Postgres](https://github.com/florx/secrets-are-hard-demo)

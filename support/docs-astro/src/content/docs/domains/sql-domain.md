---
title: SqlDomain Instances
---


The mapping of Zod types to SQL Domain instances is handled by
`zodTypeSqlDomainFactory` in `domain/domain.ts`. If you want to add SQL
generation of Zod types, add a new handler in `zodTypeSqlDomainFactory`.

This is the current status of what's handled (and unit tested):

- [x] Zod scalars (`string`, `number`, etc.) transparently map to SQL domains
- [x] Text
- [x] Number
- [x] Date
- [x] DateTime
- [x] BigInt
- [x] Constrained values using ZodEnum
- [ ] VARCHAR(x)
- [ ] JSON
- [ ] JSONB
- [ ] full-text search
  - [ ] PostgreSQL `tsvector` with `GIN` index
  - [ ] PostgreSQL `tsquery`
- [ ] Symmetric encrypted text (for transactional data) with automatic
      `sensitive` labeling. See https://github.com/FiloSottile/age et. al but
      use built-in database capabilities through SQL whenever possible
- [ ] Asymmetric encrypted text (for passwords) with automatic `sensitive`
      labeling

## Domain Capabilities

- [x] identity from Zod object declaration
- [ ] W3C [Decentralized Identifiers](https://www.w3.org/TR/did-core/) (DIDs)
- [x] Zod Typescript type
- [x] Zod Typescript default values
- [x] Zod descriptions
- [x] SQL type
- [x] SQL default values
- [ ] SQL size
- [ ] Zanzibar ([Permify](https://github.com/Permify/permify) style) ACLs
      definition at domain level with enforcement in SQL
- [ ] domain documentation for goverance ([DataHub](https://datahubproject.io/)
      style ERD documentation)
- [ ] type-safe domain labels/tags for governance
      ([DataHub](https://datahubproject.io/) style meta data)
  - [ ] scoped labels for additional governance (e.g. subject areas, PII, PHI,
        etc. grouping)
  - [ ] label sensitive ("secrets") columns so separate meta data is not
        required
  - [ ] label identity (PII, PHI) columns so separate meta data is not required
  - [ ] label validation and other policy
  - [ ] information model labels in case a domain is defined in regulatory or
        external standards (e.g. X12, HL7, FHIR, etc.)
- [x] SQL reference (for foreign key type mirroring where one columns knows
      another column's type automatically)
- [x] Data storage computed values using SQL (e.g. for defaults)
- [ ] Env Var and other dynamic server-side default values
- [ ] `lintIgnore(domain)` wrapper functions to skip certain lint warnings (like
      naming conventions for fkey columns ending in `_id`)
- [ ] User agent computed values for _business logic_ (similar to NEFS Axiom)
- [ ] User agent computed values for _presentation_ (similar to NEFS Axiom)
- [ ] synthetic data generation patterns (e.g. reg ex, functions, etc. that can
      auto-generate synthetic data)
- [ ] arrays of domains (e.g. Text[], Integer[], etc.), like in
      ../models/gitlab.ts
- [ ] JSON Schema properties contributions (each domain can contribute to a JSON
      schema collection)
- [ ] Delimited text (e.g. CSV) schema properties contributions (each domain can
      contribute to the definition of tabular data structure)
- [ ] [Invisible XML](https://invisiblexml.org/) schema properties contributions
- [ ] SQL constraints at storage layer
- [ ] TS/JS constraints for user agent business logic and presentation layers

### Multi-domain Capabilities

When two or more domains need to be coordinated, they are called multi-domains.

- [ ] Multi-domain computed properties

## Maintenance

When adding new ZodType instances you need to update two functions because each
introspects the type and wraps zodType._def in SQL-friendly props:

- `za.clonedZodType(zodType)`
- `sqlDomain(zodType)`

## Cross-platform DB Types to add

These should be setup as pre-defined so each governed schema does not need to
recreate (in `sqlType` use the dialect to generate DB-specific variations):

- array
- bigint
- bigserial
- blob
- boolean
- char
- cidr
- date
- double-precision
- enum
- inet
- integer
- interval
- jsonb
- json
- macaddr8
- macaddr
- numeric
- real
- serial
- smallint
- smallserial
- text
- timestamp
- time
- uuid
- varchar

## TODO:

- consider creating new, native, Zod instances instead of wrapping Zod
  https://github.com/jaylmiller/zodsql/blob/main/src/column.ts
- consider monkey-patching Zod instances
  https://github.com/IvanovES/zod-metadata/blob/main/src/index.ts

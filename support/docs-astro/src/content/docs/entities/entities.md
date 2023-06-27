---
title: Entities
description: ""
---

<!-- # Groups of SQL Domains are Entities -->

An SQLa _entity_ is a concrete instance of a group of domain instances such as
_attributes_ or _properties_. An _entity_ is usally a _table_ in SQL but might
also be represented as a _view_ or a _stored function_.

### Entities

- [x] Table in `render/ddl/table/mod.ts`
- [x] Enum Table in `pattern/enum-table.ts` (text key, numeric values, automatic
      seeds)
- [x] Enum Table in `pattern/enum-table.ts` (type-safe text key, text values,
      automatic seeds)
- [x] Data Vault 2.0 Tables in `pattern/data-vault.ts` (build on _Immutable
      Table_ patterns)
- [ ] Immutable Table (see _Data-Oriented Programming_ patterns)
- [ ] Association Table (`M:M` relationship between two entities)
- [ ] Unified Star Schema (USS) "presentation layer" measures, bridges, etc.

#### Entities (Table) Capabilities

- [x] identity
- [x] columns ("attributes") declared as domains
- [x] primary key(s)
- [x] foreign key references (outbound)
- [ ] columns referenced as foreign keys (inbound, aggregations, to define 1:M,
      1:1, M:1 "links")
- [ ] Zanzibar ([Permify](https://github.com/Permify/permify) style) ACLs
      definition in entities and enforcement in SQL
- [ ] table labels/tags for grouping of tables like domain labels group columns
  - [ ] rollup sensitive-labeled columns and auto-label tables as sensitive
  - [ ] rollup identity-labeled (PII, PHI) columns and auto-label tables as
        PII/PHI
- [ ] JSON Schema (from Zod)
- [ ] [Invisible XML](https://invisiblexml.org/) schema
- [ ] [CSV Schema](http://digital-preservation.github.io/csv-schema/csv-schema-1.1.html),
      [examples](https://github.com/digital-preservation/csv-schema/tree/master/example-schemas)

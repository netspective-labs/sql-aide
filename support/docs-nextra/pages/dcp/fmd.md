---
title: Fear the Movement of Data
---

# Fear the Movement of Data! (FMD!)

The more we move data from one system to another (e.g. traditional ETL or it's
cooler cousin ELTs), the more likely we are to run into scalability problems.
Almost all modern databases are pretty good at querying and are able to do
optimizations to improve querying either using vertical scaling or, in advanced
cases, using horizontal scaling. However, no databases are good at moving data
at scale. The reason we should fear the movement of data is that moving data
from one system into another or vice-versa is almost always the most
time-consuming part of data computing stacks.

Whenever dealing with data at scale, bring "_compute_ to data" rather that
"_moving data_ to the compute clusters". PgDCP as an approach tries to use FDWs
to leave data in their original locations when possible and only move the
specific data when it cannot be processed in its original location. If it cannot
eliminate data movement from source systems, PgDCP tries to reduce data movement
to only a single data move into the PgDCP environment and then uses schemas,
views, materialized views, etc. to transform data _virtually_ instead of
_physically_.

Even when applying Unified Star Schemas (USS), Dimensional Modeling, Dault Vault
2.0, or other techniques we try to use late-binding rather than early-binding
when possible.

---
title: Architecture
---
<!-- import { Callout } from 'nextra/components' -->

<!--  # Architecture and Strategy -->

In order to allow the most flexiblity, prefer composition through functions
rather than inheritance through classes.

The main SQLa rendering library should not have any opinions about how to
organize or model relational entities or attributions. That should be left to
consumers of SQLa. The `$RF_HOME/sql/models` module provides a `typical.ts`
which is an opinionated strategy for governing "typical" or "standard"
relational entities and attributes based on "best practices".

![Architecture](/src/assets/architecture.drawio.svg)

<Callout>
    Review
    [Higher\-Order TypeScript \(HOTScript\)](https://github.com/gvergnaud/hotscript)
    to "transform types in any way you want using functions you already know." This
    can allow us to have Drizzle ORM-like capabilities in the core SQLa renderers as
    well as enhance type-safety of existing Zod schemas.
</Callout>


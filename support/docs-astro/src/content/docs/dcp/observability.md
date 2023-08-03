---
title: Observability
sidebar:
  order: 7
---

# Integrated Observability for Health, Metrics and Traceability _in the Database_

Observability of the database is important for forensics and quality assurance.
Try to use
[simplified auditing based on SQL logging and FDWs to import
logs](https://mydbanotebook.org/post/auditing/) instead of writing brittle
custom triggers on each table/object. Separate observability into DDL changes,
which can be alerted upon, as well as DML change logs which can be used for
forensics. Wrap the observability of logs into a metrics table that can be
scraped by Prometheus and used for alerting (e.g. whenever DDL changes occur,
send alerts to anyone who needs to be informed).

Especially important is to integrate OpenTelemetry trace IDs into each DDL and
DML statement so that end to end traceability becomes native to the database.
Being able to track context and propogation of SQL through service layers will
be critical to maintain high quality and reliability.

See
[semantic conventions for database client
calls](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/semantic_conventions/database.md)
for how to provide traceability for database client calls and integrate
[W3C's Trace Context](https://www.w3.org/TR/trace-context/).

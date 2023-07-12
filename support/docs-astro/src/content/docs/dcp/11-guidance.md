---
title: General Guidance
---

# Primary Keys vs. Surrogate Keys for external consumption

Good security practice for modern apps that will allow record IDs to be shared
externally is to either have UUID or shortkey (see below) non-serial primary
keys. If you use a `serial` type primary key, never send the PK out for external
consumption - always use surrogate keys via
[uuid\-ossp](https://www.postgresql.org/docs/13/uuid-ossp.html) or similar. If
you use a serial PK and share the ID externally then it will be possible for
external users to "guess" IDs since the PKs would adjacent numerically.

# Real-time Information via PostgreSQL Notify

[Postgres Notify for Real Time
Dashboards](https://blog.arctype.com/postgres-notify-for-real-time-dashboards/)
provides a great description of how to "push" updates to clients.

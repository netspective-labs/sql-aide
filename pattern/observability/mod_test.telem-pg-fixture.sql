CREATE TABLE IF NOT EXISTS "span" (
    "span_id" SERIAL PRIMARY KEY,
    "trace_id" TEXT NOT NULL,
    "parent_span_id" INTEGER,
    "name" TEXT NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    FOREIGN KEY("parent_span_id") REFERENCES "span"("span_id")
);

CREATE TABLE IF NOT EXISTS "span_attribute" (
    "span_attribute_id" SERIAL PRIMARY KEY,
    "span_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    FOREIGN KEY("span_id") REFERENCES "span"("span_id")
);

CREATE TABLE IF NOT EXISTS "span_event" (
    "span_event_id" SERIAL PRIMARY KEY,
    "span_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    FOREIGN KEY("span_id") REFERENCES "span"("span_id")
);

CREATE TABLE IF NOT EXISTS "span_link" (
    "span_link_id" SERIAL PRIMARY KEY,
    "span_id" INTEGER NOT NULL,
    "linked_span_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    FOREIGN KEY("span_id") REFERENCES "span"("span_id"),
    FOREIGN KEY("linked_span_id") REFERENCES "span"("span_id")
);

CREATE TABLE IF NOT EXISTS "span_baggage" (
    "span_baggage_id" SERIAL PRIMARY KEY,
    "span_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    FOREIGN KEY("span_id") REFERENCES "span"("span_id")
);
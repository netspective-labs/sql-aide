// deno-lint-ignore-file

import { zod as z } from "../../deps.ts";

const uuidSchema = z.string().uuid();

// Define schemas for each table

// span
const spanSchema = z.object({
  span_id: uuidSchema,
  trace_id: uuidSchema,
  parent_span_id: uuidSchema.nullable(),
  name: z.string(),
  start_time: z.date(),
  end_time: z.date().nullable(),
  status: z.number().default(0),
  kind: z.number().default(0),
  span_kind: z.string().nullable(),
  trace_state: z.string().nullable(),
  resource: z.string().nullable(),
});

// attribute
const attributeSchema = z.object({
  id: z.number(),
  span_id: uuidSchema,
  key: z.string(),
  value: z.string(),
});

// event
const eventSchema = z.object({
  id: z.number(),
  span_id: uuidSchema,
  name: z.string(),
  timestamp: z.date(),
});

// link
const linkSchema = z.object({
  id: z.number(),
  span_id: uuidSchema,
  linked_span_id: uuidSchema,
});

// baggage
const baggageSchema = z.object({
  id: z.number(),
  span_id: uuidSchema,
  key: z.string(),
  value: z.string(),
});

// metric
const metricSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  unit: z.string().nullable(),
});

// metric_label
const metricLabelSchema = z.object({
  id: z.number(),
  metric_id: z.number(),
  label_key: z.string(),
  label_value: z.string(),
});

// metric_value
const metricValueSchema = z.object({
  id: z.number(),
  metric_label_id: z.number(),
  timestamp: z.date(),
  value: z.number(),
});

// histogram_bucket
const histogramBucketSchema = z.object({
  id: z.number(),
  metric_label_id: z.number(),
  upper_bound: z.number(),
  bucket_value: z.number(),
});

// summary_quantile
const summaryQuantileSchema = z.object({
  id: z.number(),
  metric_label_id: z.number(),
  quantile: z.number(),
  quantile_value: z.number(),
});

// telemetry_type
const telemetryTypeSchema = z.object({
  span_id: uuidSchema,
  trace_id: uuidSchema,
  parent_span_id: uuidSchema.nullable(),
  name: z.string(),
  start_time: z.date(),
  end_time: z.date().nullable(),
  status: z.number(),
  kind: z.number(),
  span_kind: z.string().nullable(),
  trace_state: z.string().nullable(),
  resource: z.string().nullable(),
  attributes: z.array(attributeSchema),
  events: z.array(eventSchema),
  links: z.array(linkSchema),
  baggage_items: z.array(baggageSchema),
  metrics: z.array(metricSchema),
});

// CREATE OR REPLACE PROCEDURE insert_telemetry_data(_telemetry telemetry_type)
// LANGUAGE plpgsql
// AS $$
// DECLARE
//   inserted_span_id UUID;
// BEGIN
//   -- Insert into span table
//   INSERT INTO span(span_id, trace_id, parent_span_id, name, start_time, end_time, status, kind, span_kind, trace_state, resource)
//   VALUES (_telemetry.span_id, _telemetry.trace_id, _telemetry.parent_span_id, _telemetry.name, _telemetry.start_time, _telemetry.end_time, _telemetry.status, _telemetry.kind, _telemetry.span_kind, _telemetry.trace_state, _telemetry.resource)
//   RETURNING span_id INTO inserted_span_id;

//   -- Insert into attribute table
//   FOREACH item IN ARRAY _telemetry.attributes
//   LOOP
//     INSERT INTO attribute(span_id, key, value)
//     VALUES (inserted_span_id, item.key, item.value);
//   END LOOP;

//   -- Insert into event table
//   FOREACH item IN ARRAY _telemetry.events
//   LOOP
//     INSERT INTO event(span_id, name, timestamp)
//     VALUES (inserted_span_id, item.name, item.timestamp);
//   END LOOP;

//   -- Insert into link table
//   FOREACH item IN ARRAY _telemetry.links
//   LOOP
//     INSERT INTO link(span_id, linked_span_id)
//     VALUES (inserted_span_id, item.linked_span_id);
//   END LOOP;

//   -- Insert into baggage table
//   FOREACH item IN ARRAY _telemetry.baggage_items
//   LOOP
//     INSERT INTO baggage(span_id, key, value)
//     VALUES (inserted_span_id, item.key, item.value);
//   END LOOP;

//   -- Insert into metric table
//   FOREACH item IN ARRAY _telemetry.metrics
//   LOOP
//     INSERT INTO metric(span_id, name, value, timestamp)
//     VALUES (inserted_span_id, item.name, item.value, item.timestamp);
//   END LOOP;
// END;
// $$;

// CALL insert_telemetry_data(row(
//     'span_id_value',
//     'trace_id_value',
//     'parent_span_id_value',
//     'name_value',
//     'start_time_value',
//     'end_time_value',
//     1,
//     0,
//     'span_kind_value',
//     'trace_state_value',
//     'resource_value',
//     ARRAY[('key1', 'value1'), ('key2', 'value2')]::attribute[],
//     ARRAY[('name1', 'timestamp1'), ('name2', 'timestamp2')]::event[],
//     ARRAY[('linked_span_id1'), ('linked_span_id2')]::link[],
//     ARRAY[('key1', 'value1'), ('key2', 'value2')]::baggage[],
//     ARRAY[('name1', 1.0, 'timestamp1'), ('name2', 2.0, 'timestamp2')]::metric[]
//   )::telemetry_type);

// error example
// CALL insert_telemetry_data(row(
//     'span_id_value',
//     'trace_id_value',
//     'parent_span_id_value',
//     'process_request',  -- name of the operation
//     'start_time_value',
//     'end_time_value',
//     1,  -- status indicating there was an error
//     0,
//     'INTERNAL',  -- span kind
//     'trace_state_value',
//     'resource_value',
//     ARRAY[('key1', 'value1'), ('key2', 'value2')]::attribute[],
//     ARRAY[('exception', 'timestamp_error', 'error message', 'error type', 'stack trace')]::event[],
//     NULL::link[],
//     ARRAY[('key1', 'value1'), ('key2', 'value2')]::baggage[],
//     ARRAY[('name1', 1.0, 'timestamp1'), ('name2', 2.0, 'timestamp2')]::metric[]
//   )::telemetry_type);

// CREATE OR REPLACE PROCEDURE insert_metric_value(metric_name_param TEXT, label_key_param TEXT, label_value_param TEXT, timestamp_param TIMESTAMP, value_param DOUBLE PRECISION)
// LANGUAGE plpgsql
// AS $$
// DECLARE
//   partition_name TEXT;
//   partition_start TIMESTAMP;
//   partition_end TIMESTAMP;
//   metric_id_param INT;
//   metric_label_id_param INT;
// BEGIN
//   partition_name := 'metric_value_' || to_char(timestamp_param, 'YYYY_MM');
//   partition_start := date_trunc('month', timestamp_param);
//   partition_end := partition_start + INTERVAL '1 month';

//   SELECT id INTO metric_id_param FROM metric WHERE name = metric_name_param;

//   IF metric_id_param IS NULL THEN
//     RAISE EXCEPTION 'Metric % does not exist.', metric_name_param;
//   END IF;

//   SELECT id INTO metric_label_id_param FROM metric_label WHERE metric_id = metric_id_param AND label_key = label_key_param AND label_value = label_value_param;

//   IF metric_label_id_param IS NULL THEN
//     INSERT INTO metric_label (metric_id, label_key, label_value) VALUES (metric_id_param, label_key_param, label_value_param)
//     RETURNING id INTO metric_label_id_param;
//   END IF;

//   BEGIN
//     EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF metric_value FOR VALUES FROM (%L) TO (%L);', partition_name, partition_start, partition_end);
//   EXCEPTION WHEN duplicate_table THEN
//     -- Do nothing, the partition already exists
//   END;

//   EXECUTE format('INSERT INTO %I (metric_label_id, timestamp, value) VALUES ($1, $2, $3);', partition_name) USING metric_label_id_param, timestamp_param, value_param;
// END;
// $$;

// CALL insert_metric_value('http_requests_total', 'method', 'GET', '2023-05-27 10:00:00', 5000);

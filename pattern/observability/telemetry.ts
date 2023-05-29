import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/typical.ts";
import * as govn from "./governance.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Telemetry models governer builders object for observability models.
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building models)
 */
export function telemetryGovn<Context extends SQLa.SqlEmitContext>(
  ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const og = govn.observabilityGovn(ddlOptions);
  const { table, keys, names, domains, housekeeping } = og;

  // TODO: decide whether og.service.service_id should be used (when single instance multi-tenant is used)

  const span_id = keys.autoIncPrimaryKey();
  const span = table(names.tableName("span"), {
    span_id,
    trace_id: domains.uuid(),
    parent_span_id: domains.selfRef(span_id).optional(),
    name: domains.text(),
    start_time: domains.dateTime(),
    end_time: domains.dateTimeNullable(),
    ...housekeeping.columns,
  });

  const spanAttribute = table(names.tableName("span_attribute"), {
    span_attribute_id: keys.autoIncPrimaryKey(),
    span_id: span.references.span_id(),
    key: domains.text(),
    value: domains.text(),
    ...housekeeping.columns,
  });

  const spanEvent = table(names.tableName("span_event"), {
    span_event_id: keys.autoIncPrimaryKey(),
    span_id: span.references.span_id(),
    name: domains.text(),
    timestamp: domains.dateTime(),
    ...housekeeping.columns,
  });

  const spanLink = table(names.tableName("span_link"), {
    span_link_id: keys.autoIncPrimaryKey(),
    span_id: span.references.span_id(),
    linked_span_id: span.references.span_id(),
    ...housekeeping.columns,
  });

  const spanBaggage = table(names.tableName("span_baggage"), {
    span_baggage_id: keys.autoIncPrimaryKey(),
    span_id: span.references.span_id(),
    key: domains.text(),
    value: domains.text(),
    ...housekeeping.columns,
  });

  const allSpanObjects = SQLa.SQL<Context>(ddlOptions)`
    ${span}

    ${spanAttribute}

    ${spanEvent}

    ${spanLink}

    ${spanBaggage}`;

  return {
    og,
    span,
    spanAttribute,
    spanEvent,
    spanLink,
    spanBaggage,
    allSpanObjects,
  };
}

/**
 * Typical schema emitter for telemetry models.
 * @returns a single object with helper functions as properties (for executing SQL templates)
 */
export function telemetryTemplateState<Context extends SQLa.SqlEmitContext>() {
  const gts = typ.governedTemplateState<
    govn.ObservabilityDomainGovn,
    Context
  >();
  return {
    ...gts,
    ...telemetryGovn<Context>(gts.ddlOptions),
  };
}

// // telemetry_type
// const telemetryTypeSchema = z.object({
//   span_id: uuidSchema,
//   trace_id: uuidSchema,
//   parent_span_id: uuidSchema.nullable(),
//   name: z.string(),
//   start_time: z.date(),
//   end_time: z.date().nullable(),
//   status: z.number(),
//   kind: z.number(),
//   span_kind: z.string().nullable(),
//   trace_state: z.string().nullable(),
//   resource: z.string().nullable(),
//   attributes: z.array(attributeSchema),
//   events: z.array(eventSchema),
//   links: z.array(linkSchema),
//   baggage_items: z.array(baggageSchema),
//   metrics: z.array(metricSchema),
// });

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

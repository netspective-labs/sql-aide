import * as SQLa from "../../render/mod.ts";
import * as pgSQLa from "../../render/dialect/pg/mod.ts";
import * as typ from "../typical/typical.ts";
import * as govn from "./governance.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Metrics models governer builders object for observability models.
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building models)
 */
export function metricsGovn<Context extends SQLa.SqlEmitContext>(
  ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const og = govn.observabilityGovn(ddlOptions);
  const { table, keys, names, domains, housekeeping } = og;

  // TODO: decide whether og.service.service_id should be used (when single instance multi-tenant is used)

  const metric = table(names.tableName("metric"), {
    metric_id: keys.autoIncPrimaryKey(),
    name: domains.text(),
    description: domains.textNullable(),
    type: domains.text(),
    unit: domains.textNullable(),
    ...housekeeping.columns,
  });

  const metricLabel = table(names.tableName("metric_label"), {
    metric_label_id: keys.autoIncPrimaryKey(),
    metric_id: metric.references.metric_id(),
    label_key: domains.text(),
    label_value: domains.text(),
    ...housekeeping.columns,
  });

  const metricValue = SQLa.tableDefinition(
    "metric_value",
    {
      metric_value_id: domains.serial(), //
      metric_label_id: metricLabel.references.metric_label_id(),
      timestamp: domains.dateTime(),
      value: domains.float(),
      ...housekeeping.columns,
    },
    {
      sqlPartial: (destination) => {
        if (destination == "after all column definitions") {
          return [
            {
              SQL: () =>
                `CONSTRAINT metric_value_pkey PRIMARY KEY (metric_value_id, timestamp)`,
            },
          ];
        }
        if (destination == "after table definition") {
          return [
            {
              SQL: () => `PARTITION BY RANGE ("timestamp")`,
            },
          ];
        }
      },
    },
  );

  const histogramBucket = table(names.tableName("metric_histogram_bucket"), {
    metric_histogram_bucket_id: keys.autoIncPrimaryKey(),
    metric_label_id: metricLabel.references.metric_label_id(),
    upper_bound: domains.float(),
    bucket_value: domains.float(),
    ...housekeeping.columns,
  });

  const summaryQuantile = table(names.tableName("metric_summary_quantile"), {
    metric_summary_quantile_id: keys.autoIncPrimaryKey(),
    metric_label_id: metricLabel.references.metric_label_id(),
    quantile: domains.float(),
    quantile_value: domains.float(),
    ...housekeeping.columns,
  });

  const allMetricsObjects = SQLa.SQL<Context>(ddlOptions)`
    ${metric}

    ${metricLabel}

    ${metricValue}

    ${histogramBucket}

    ${summaryQuantile}`;

  return {
    og,
    metric,
    metricLabel,
    metricValue,
    histogramBucket,
    summaryQuantile,
    allMetricsObjects,
  };
}

/**
 * Typical schema emitter for telemetry models.
 * @returns a single object with helper functions as properties (for executing SQL templates)
 */
export function metricsTemplateState<
  Context extends SQLa.SqlEmitContext,
  DomainQS extends govn.ObservabilityDomainQS,
  DomainsQS extends govn.ObservabilityDomainsQS,
>() {
  const gts = typ.governedTemplateState<
    DomainQS,
    DomainsQS,
    Context
  >();
  return {
    ...gts,
    ...metricsGovn<Context>(gts.ddlOptions),
  };
}

export function metricsPlPgSqlRoutines(ess: SQLa.EmbeddedSqlSupplier) {
  const d = govn.observabilityDomains();
  // we setup srb with our "arguments shape" separately so that we can access
  // the argument names and types with type-safety
  const srb = pgSQLa.storedRoutineBuilder("insert_metric_value", {
    metric_name_param: d.text(),
    value_param: d.bigFloat(),
    label_key_param: d.text(),
    label_value_param: d.text(),
    timestamp_param: d.dateTime(),
    created_by_param: d.text(),
  });
  // destructuring argsSD.sdSchema { argsSD: { sdSchema: a } } is a convenient
  // way of getting all the arguments into `a`
  const { argsSD: { sdSchema: a } } = srb;
  const insertMetricValueSP = pgSQLa.storedProcedure(
    srb.routineName,
    srb.argsDefn,
    (name, args) => pgSQLa.typedPlPgSqlBody(name, args, ess),
  )`
  DECLARE
    partition_name TEXT;
    partition_start TIMESTAMPTZ;
    partition_end TIMESTAMPTZ;
    metric_id_selected INT;
    metric_label_id_selected INT;
  BEGIN
    partition_name := 'metric_value_' || to_char(${a.timestamp_param}, 'YYYY_MM');
    partition_start := date_trunc('month', ${a.timestamp_param});
    partition_end := partition_start + INTERVAL '1 month';

    SELECT metric_id INTO metric_id_selected FROM metric WHERE name = ${a.metric_name_param};

    IF metric_id_selected IS NULL THEN
      RAISE EXCEPTION 'Metric % does not exist.', ${a.metric_name_param};
    END IF;

    SELECT metric_id INTO metric_label_id_selected FROM metric_label WHERE metric_id = metric_id_selected AND label_key = ${a.label_key_param} AND label_value = ${a.label_value_param};

    IF metric_label_id_selected IS NULL THEN
      INSERT INTO metric_label (metric_id, label_key, label_value, created_at, created_by) VALUES (metric_id_selected, ${a.label_key_param}, ${a.label_value_param}, ${a.timestamp_param}, ${a.created_by_param})
      RETURNING metric_id INTO metric_label_id_selected;
    END IF;

    BEGIN
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF metric_value FOR VALUES FROM (%L) TO (%L);', partition_name, partition_start, partition_end);
    EXCEPTION WHEN duplicate_table THEN
      -- Do nothing, the partition already exists
    END;
    EXECUTE format('INSERT INTO %I (metric_label_id, timestamp, value, created_at, created_by) VALUES ($1, $2, $3, $4, $5);', partition_name) USING metric_label_id_selected, ${a.timestamp_param}, ${a.value_param}, ${a.timestamp_param}, ${a.created_by_param};
  END;`;

  return {
    insertMetricValueSP,
  };
}

// CALL insert_metric_value('http_requests_total', 'method', 'GET', '2023-05-27 10:00:00', 5000);

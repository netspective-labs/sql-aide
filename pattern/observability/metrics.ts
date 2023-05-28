import * as SQLa from "../../render/mod.ts";
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

  const metricValue = table(names.tableName("metric_value"), {
    metric_value_id: keys.autoIncPrimaryKey(),
    metric_label_id: metricLabel.references.metric_label_id(),
    timestamp: domains.dateTime(),
    value: domains.float(),
    ...housekeeping.columns,
  });

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
export function metricsTemplateState<Context extends SQLa.SqlEmitContext>() {
  const gts = typ.governedTemplateState<
    govn.ObservabilityDomainGovn,
    Context
  >();
  return {
    ...gts,
    ...metricsGovn<Context>(gts.ddlOptions),
  };
}

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

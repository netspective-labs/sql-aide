CREATE TABLE IF NOT EXISTS "metric" (
    "metric_id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "unit" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "metric_label" (
    "metric_label_id" SERIAL PRIMARY KEY,
    "metric_id" INTEGER NOT NULL,
    "label_key" TEXT NOT NULL,
    "label_value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    FOREIGN KEY("metric_id") REFERENCES "metric"("metric_id")
);

CREATE TABLE "metric_value" (
    "metric_value_id" SERIAL,
    "metric_label_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "value" FLOAT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    FOREIGN KEY("metric_label_id") REFERENCES "metric_label"("metric_label_id"),
    CONSTRAINT metric_value_pkey PRIMARY KEY (metric_value_id, timestamp)
)PARTITION BY RANGE ("timestamp");

CREATE TABLE IF NOT EXISTS "metric_histogram_bucket" (
    "metric_histogram_bucket_id" SERIAL PRIMARY KEY,
    "metric_label_id" INTEGER NOT NULL,
    "upper_bound" FLOAT NOT NULL,
    "bucket_value" FLOAT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    FOREIGN KEY("metric_label_id") REFERENCES "metric_label"("metric_label_id")
);

CREATE TABLE IF NOT EXISTS "metric_summary_quantile" (
    "metric_summary_quantile_id" SERIAL PRIMARY KEY,
    "metric_label_id" INTEGER NOT NULL,
    "quantile" FLOAT NOT NULL,
    "quantile_value" FLOAT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    FOREIGN KEY("metric_label_id") REFERENCES "metric_label"("metric_label_id")
);

CREATE OR REPLACE PROCEDURE "insert_metric_value"("metric_name_param" TEXT, "value_param" DOUBLE PRECISION, "label_key_param" TEXT, "label_value_param" TEXT, "timestamp_param" TIMESTAMP, "created_by_param" TEXT) AS $$
BEGIN
  DECLARE
    partition_name TEXT;
    partition_start TIMESTAMP;
    partition_end TIMESTAMP;
    metric_id_selected INT;
    metric_label_id_selected INT;
  BEGIN
    partition_name := 'metric_value_' || to_char("timestamp_param", 'YYYY_MM');
    partition_start := date_trunc('month', "timestamp_param");
    partition_end := partition_start + INTERVAL '1 month';
  
    SELECT metric_id INTO metric_id_selected FROM metric WHERE name = "metric_name_param";
  
    IF metric_id_selected IS NULL THEN
      RAISE EXCEPTION 'Metric % does not exist.', "metric_name_param";
    END IF;
  
    SELECT metric_id INTO metric_label_id_selected FROM metric_label WHERE metric_id = metric_id_selected AND label_key = "label_key_param" AND label_value = "label_value_param";
  
    IF metric_label_id_selected IS NULL THEN
      INSERT INTO metric_label (metric_id, label_key, label_value, created_at, created_by) VALUES (metric_id_selected, "label_key_param", "label_value_param", "timestamp_param", "created_by_param")
      RETURNING metric_id INTO metric_label_id_selected;
    END IF;
  
    BEGIN
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF metric_value FOR VALUES FROM (%L) TO (%L);', partition_name, partition_start, partition_end);
    EXCEPTION WHEN duplicate_table THEN
      -- Do nothing, the partition already exists
    END;
    EXECUTE format('INSERT INTO %I (metric_label_id, timestamp, value, created_at, created_by) VALUES ($1, $2, $3, $4, $5);', partition_name) USING metric_label_id_selected, "timestamp_param", "value_param", "timestamp_param", "created_by_param";
  END;
END;
$$ LANGUAGE PLPGSQL;
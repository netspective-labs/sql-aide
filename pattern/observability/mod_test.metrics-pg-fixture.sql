CREATE TABLE IF NOT EXISTS "metric" (
    "metric_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "unit" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "metric_label" (
    "metric_label_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "metric_id" INTEGER NOT NULL,
    "label_key" TEXT NOT NULL,
    "label_value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    FOREIGN KEY("metric_id") REFERENCES "metric"("metric_id")
);

CREATE TABLE IF NOT EXISTS "metric_value" (
    "metric_value_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "metric_label_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "value" FLOAT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    FOREIGN KEY("metric_label_id") REFERENCES "metric_label"("metric_label_id")
);

CREATE TABLE IF NOT EXISTS "metric_histogram_bucket" (
    "metric_histogram_bucket_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "metric_label_id" INTEGER NOT NULL,
    "upper_bound" FLOAT NOT NULL,
    "bucket_value" FLOAT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    FOREIGN KEY("metric_label_id") REFERENCES "metric_label"("metric_label_id")
);

CREATE TABLE IF NOT EXISTS "metric_summary_quantile" (
    "metric_summary_quantile_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "metric_label_id" INTEGER NOT NULL,
    "quantile" FLOAT NOT NULL,
    "quantile_value" FLOAT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    FOREIGN KEY("metric_label_id") REFERENCES "metric_label"("metric_label_id")
);
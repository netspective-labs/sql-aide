-- not destroying first (for development)

-- no schemaName provided
    SET search_path TO stateful_service_nf_rdv_miniflux;
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE "algorithm" (
    "algorithm_name" TEXT NOT NULL,
    "algorithm_id" TEXT PRIMARY KEY NOT NULL
);
    CREATE TABLE IF NOT EXISTS "hub_content" (
    "hub_content_id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL
);
    CREATE TABLE IF NOT EXISTS "hub_classification" (
    "hub_classification_id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL
);
    CREATE TABLE IF NOT EXISTS "hub_job" (
    "hub_job_id" TEXT PRIMARY KEY NOT NULL,
    "hub_job_name" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL
);
    CREATE TABLE IF NOT EXISTS "sat_content_content_attribute" (
    "hub_content_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "sat_content_content_attribute_id" TEXT PRIMARY KEY NOT NULL,
    FOREIGN KEY("hub_content_id") REFERENCES "hub_content"("hub_content_id")
);
    CREATE TABLE IF NOT EXISTS "sat_classification_classification_attribute" (
    "hub_classification_id" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "sat_classification_classification_attribute_id" TEXT PRIMARY KEY NOT NULL,
    FOREIGN KEY("hub_classification_id") REFERENCES "hub_classification"("hub_classification_id")
);
    CREATE TABLE IF NOT EXISTS "sat_job_job_detail" (
    "run_date_time" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "hub_job_id" TEXT NOT NULL,
    "sat_job_job_detail_id" TEXT PRIMARY KEY NOT NULL,
    FOREIGN KEY("hub_job_id") REFERENCES "hub_job"("hub_job_id")
);
    CREATE TABLE IF NOT EXISTS "link_classified_content" (
    "hub_content_id" TEXT NOT NULL,
    "hub_classification_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "link_classified_content_id" TEXT PRIMARY KEY NOT NULL,
    FOREIGN KEY("hub_content_id") REFERENCES "hub_content"("hub_content_id"),
    FOREIGN KEY("hub_classification_id") REFERENCES "hub_classification"("hub_classification_id")
);
    CREATE TABLE IF NOT EXISTS "link_classified_content_job" (
    "hub_content_id" TEXT NOT NULL,
    "hub_classification_id" TEXT NOT NULL,
    "hub_job_id" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "link_classified_content_job_id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    FOREIGN KEY("hub_content_id") REFERENCES "hub_content"("hub_content_id"),
    FOREIGN KEY("hub_classification_id") REFERENCES "hub_classification"("hub_classification_id"),
    FOREIGN KEY("hub_job_id") REFERENCES "hub_job"("hub_job_id"),
    FOREIGN KEY("algorithm") REFERENCES "algorithm"("algorithm_id")
);
    CREATE TABLE IF NOT EXISTS "sat_classified_content_classified_content_algorithm" (
    "algorithm" TEXT NOT NULL,
    "scores" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "link_classified_content_id" TEXT NOT NULL,
    "sat_classified_content_classified_content_algorithm_id" TEXT PRIMARY KEY NOT NULL,
    FOREIGN KEY("algorithm") REFERENCES "algorithm"("algorithm_id"),
    FOREIGN KEY("link_classified_content_id") REFERENCES "link_classified_content"("link_classified_content_id")
);
    CREATE TABLE IF NOT EXISTS "sat_classified_content_classified_general_topics" (
    "algorithm" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "link_classified_content_id" TEXT NOT NULL,
    "sat_classified_content_classified_general_topics_id" TEXT PRIMARY KEY NOT NULL,
    FOREIGN KEY("algorithm") REFERENCES "algorithm"("algorithm_id"),
    FOREIGN KEY("link_classified_content_id") REFERENCES "link_classified_content"("link_classified_content_id")
);
    DROP VIEW IF EXISTS "results_view_all_topics";
CREATE VIEW "results_view_all_topics" AS
    SELECT sc.content,
        sc.content_type,
        a.algorithm_id,
        string_agg(scc_classification.classification, ', '::text) AS classification
       FROM stateful_service_nf_rdv_miniflux.link_classified_content l
         JOIN stateful_service_nf_rdv_miniflux.hub_content hc ON l.hub_content_id = hc.hub_content_id
         JOIN stateful_service_nf_rdv_miniflux.hub_classification hcl ON l.hub_classification_id = hcl.hub_classification_id
         JOIN stateful_service_nf_rdv_miniflux.sat_classified_content_classified_content_algorithm sacca ON l.link_classified_content_id = sacca.link_classified_content_id
         JOIN stateful_service_nf_rdv_miniflux.sat_content_content_attribute sc ON hc.hub_content_id = sc.hub_content_id
         JOIN stateful_service_nf_rdv_miniflux.sat_classification_classification_attribute scc ON hcl.hub_classification_id = scc.hub_classification_id
         JOIN stateful_service_nf_rdv_miniflux.algorithm a ON sacca.algorithm = a.algorithm_id
         JOIN LATERAL ( SELECT json_array_elements_text(scc.classification::json) AS classification) scc_classification ON true
      GROUP BY sc.content, sc.content_type, a.algorithm_id;
    DROP VIEW IF EXISTS "results_view_general_topics";
CREATE VIEW "results_view_general_topics" AS
    SELECT sc.content,
        a.algorithm_id,
        string_agg(scc_classification.classification, ', '::text) AS classification
       FROM stateful_service_nf_rdv_miniflux.link_classified_content l
         JOIN stateful_service_nf_rdv_miniflux.hub_content hc ON l.hub_content_id = hc.hub_content_id
         JOIN stateful_service_nf_rdv_miniflux.hub_classification hcl ON l.hub_classification_id = hcl.hub_classification_id
         JOIN stateful_service_nf_rdv_miniflux.sat_classified_content_classified_general_topics sccg ON l.link_classified_content_id = sccg.link_classified_content_id
         JOIN stateful_service_nf_rdv_miniflux.sat_content_content_attribute sc ON hc.hub_content_id = sc.hub_content_id
         JOIN stateful_service_nf_rdv_miniflux.sat_classification_classification_attribute scc ON hcl.hub_classification_id = scc.hub_classification_id
         JOIN stateful_service_nf_rdv_miniflux.algorithm a ON sccg.algorithm = a.algorithm_id
         JOIN LATERAL ( SELECT json_array_elements_text(scc.classification::json) AS classification) scc_classification ON true
      GROUP BY sc.content, sc.content_type, a.algorithm_id;
    CREATE PROCEDURE "upsert_algorithm"("algorithm_id" TEXT, "algorithm_name" TEXT) AS $$
BEGIN
  BEGIN
    UPDATE stateful_service_nf_rdv_miniflux.algorithm SET "algorithm_id" = $1,"algorithm_name" = $2 WHERE algorithm."algorithm_id" = $1;
    IF NOT FOUND THEN
        INSERT INTO stateful_service_nf_rdv_miniflux.algorithm ("algorithm_id","algorithm_name") VALUES ($1,$2);
    END IF;
  END;
END;
$$ LANGUAGE PLPGSQL;
    CREATE FUNCTION "sf_all_predictions_result_upsert"() RETURNS void AS $$

BEGIN
CREATE TEMPORARY TABLE temp_table as
SELECT feed_title AS content, related_topic_with_title AS classification, model_name as model_name ,prediction_score_title as scores,
md5(feed_title::text || model_name::text)::text as hub_content_id,md5(feed_title::text || model_name::text)::text as sat_content_content_attribute_id,md5(feed_title::text || model_name::text)::text as hub_classification_id,md5(feed_title::text || model_name::text)::text as sat_classification_classification_attribute_id,md5(feed_title::text || model_name::text)::text as link_classified_content_id,md5(feed_title::text || model_name::text)::text as sat_classified_content_classified_content_algorithm_id,
'feed_title' as content_type FROM stateful_service_nf_rdv_miniflux.langchain_predictions
UNION all SELECT  feed_content AS content, related_topic_with_content AS classification,model_name as model_name,prediction_score_content as scores,
md5(feed_content::text || model_name::text)::text as hub_content_id,md5(feed_content::text || model_name::text)::text as sat_content_content_attribute_id,md5(feed_content::text || model_name::text)::text as hub_classification_id,md5(feed_content::text || model_name::text)::text as sat_classification_classification_attribute_id,md5(feed_content::text || model_name::text)::text as link_classified_content_id,md5(feed_content::text || model_name::text)::text as sat_classified_content_classified_content_algorithm_id,'feed_content' as content_type
FROM stateful_service_nf_rdv_miniflux.langchain_predictions
UNION ALL SELECT feed_title_and_content AS content, related_topic_with_title_and_content AS classification, model_name as model_name,prediction_score_title_content as scores,
md5(feed_title_and_content::text || model_name::text)::text as hub_content_id,md5(feed_title_and_content::text || model_name::text)::text as sat_content_content_attribute_id,md5(feed_title_and_content::text || model_name::text)::text as hub_classification_id,md5(feed_title_and_content::text || model_name::text)::text as sat_classification_classification_attribute_id,md5(feed_title_and_content::text || model_name::text)::text as link_classified_content_id,md5(feed_title_and_content::text || model_name::text)::text as sat_classified_content_classified_content_algorithm_id,'feed_title_and_content' as content_type
FROM stateful_service_nf_rdv_miniflux.langchain_predictions;

INSERT INTO stateful_service_nf_rdv_miniflux.hub_content (hub_content_id, created_at, created_by, provenance)
select hub_content_id, current_timestamp, current_user,'test_source' from temp_table
ON CONFLICT (hub_content_id) DO update set created_at = EXCLUDED.created_at, created_by = EXCLUDED.created_by, provenance = EXCLUDED.provenance;

INSERT INTO stateful_service_nf_rdv_miniflux.sat_content_content_attribute (hub_content_id, sat_content_content_attribute_id, content, content_type, created_at, created_by, provenance)
select hub_content_id,sat_content_content_attribute_id,content,content_type,current_timestamp,current_user,'test_source' from temp_table
ON CONFLICT (sat_content_content_attribute_id) DO update set sat_content_content_attribute_id = EXCLUDED.sat_content_content_attribute_id,content = EXCLUDED.content,content_type = EXCLUDED.content_type,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO stateful_service_nf_rdv_miniflux.hub_classification (hub_classification_id, created_at, created_by, provenance)
select hub_classification_id,current_timestamp,current_user,'test_source' from temp_table
ON CONFLICT (hub_classification_id) DO update set created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO stateful_service_nf_rdv_miniflux.sat_classification_classification_attribute (hub_classification_id, sat_classification_classification_attribute_id, classification, created_at, created_by, provenance)
select hub_classification_id,sat_classification_classification_attribute_id,classification,current_timestamp,current_user,'test_source' from temp_table
ON CONFLICT (sat_classification_classification_attribute_id) DO update set classification = EXCLUDED.classification,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO stateful_service_nf_rdv_miniflux.link_classified_content (link_classified_content_id, hub_content_id, hub_classification_id, created_at, created_by, provenance)
select link_classified_content_id,hub_content_id,hub_classification_id,current_timestamp,current_user,'test_source' from temp_table
ON CONFLICT (link_classified_content_id) DO update set hub_content_id = EXCLUDED.hub_content_id,hub_classification_id = EXCLUDED.hub_classification_id,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO stateful_service_nf_rdv_miniflux.sat_classified_content_classified_content_algorithm (sat_classified_content_classified_content_algorithm_id, link_classified_content_id, algorithm, scores, created_at, created_by, provenance)
select sat_classified_content_classified_content_algorithm_id,link_classified_content_id,model_name,scores,current_timestamp,current_user,'test_source'from temp_table
ON CONFLICT (sat_classified_content_classified_content_algorithm_id) DO update set algorithm = EXCLUDED.algorithm,scores = EXCLUDED.scores,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

DROP TABLE IF EXISTS temp_table;
END;
$$ LANGUAGE PLPGSQL;
    CREATE FUNCTION "sf_general_predictions_result_upsert"() RETURNS void AS $$

 BEGIN
 CREATE TEMPORARY TABLE temp_table as
 SELECT feed_title AS content, related_topic_with_title AS classification, model_name as model_name ,
  md5(feed_title::text || model_name::text)::text as hub_content_id,
  md5(feed_title::text || model_name::text)::text as sat_content_content_attribute_id,
  md5(feed_title::text || model_name::text)::text as hub_classification_id,
  md5(feed_title::text || model_name::text)::text as sat_classification_classification_attribute_id,
  md5(feed_title::text || model_name::text)::text as link_classified_content_id,
  md5(feed_title::text || model_name::text)::text as sat_classified_content_classified_general_topics_id,  'feed_title' as content_type
 FROM stateful_service_nf_rdv_miniflux.general_predictions;


INSERT INTO stateful_service_nf_rdv_miniflux.hub_content (hub_content_id, created_at, created_by, provenance)
select hub_content_id, current_timestamp, current_user,'general' from temp_table
ON CONFLICT (hub_content_id) DO update set created_at = EXCLUDED.created_at, created_by = EXCLUDED.created_by, provenance = EXCLUDED.provenance;


INSERT INTO stateful_service_nf_rdv_miniflux.sat_content_content_attribute (hub_content_id, sat_content_content_attribute_id, content, content_type, created_at, created_by, provenance)
select hub_content_id,sat_content_content_attribute_id,content,content_type,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (sat_content_content_attribute_id) DO update set sat_content_content_attribute_id = EXCLUDED.sat_content_content_attribute_id,content = EXCLUDED.content,content_type = EXCLUDED.content_type,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;


INSERT INTO stateful_service_nf_rdv_miniflux.hub_classification (hub_classification_id, created_at, created_by, provenance)
select hub_classification_id,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (hub_classification_id) DO update set created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO stateful_service_nf_rdv_miniflux.sat_classification_classification_attribute (hub_classification_id, sat_classification_classification_attribute_id, classification, created_at, created_by, provenance)
select hub_classification_id,sat_classification_classification_attribute_id,classification,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (sat_classification_classification_attribute_id) DO update set classification = EXCLUDED.classification,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;


INSERT INTO stateful_service_nf_rdv_miniflux.link_classified_content (link_classified_content_id, hub_content_id, hub_classification_id, created_at, created_by, provenance)
select link_classified_content_id,hub_content_id,hub_classification_id,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (link_classified_content_id) DO update set hub_content_id = EXCLUDED.hub_content_id,hub_classification_id = EXCLUDED.hub_classification_id,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;


INSERT INTO stateful_service_nf_rdv_miniflux.sat_classified_content_classified_general_topics (sat_classified_content_classified_general_topics_id, link_classified_content_id, algorithm,created_at, created_by, provenance)
select sat_classified_content_classified_general_topics_id,link_classified_content_id,model_name,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (sat_classified_content_classified_general_topics_id) DO update set algorithm = EXCLUDED.algorithm,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;
 DROP TABLE IF EXISTS temp_table;
END;
$$ LANGUAGE PLPGSQL;
    
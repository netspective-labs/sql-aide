-- not destroying first (for development)
-- no schemaName provided
    SET search_path TO openai_general_prediction;
    CREATE EXTENSION IF NOT EXISTS http;
    LOAD 'http';
    CREATE TABLE "settings" (
    "general_predictions_id" SERIAL PRIMARY KEY,
    "openai_api_key" TEXT NOT NULL,
    "name" TEXT NOT NULL
);
    CREATE TABLE IF NOT EXISTS "general_predictions" (
    "general_predictions_id" SERIAL PRIMARY KEY,
    "feed_title" TEXT,
    "model_name" TEXT,
    "related_topic_with_title" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT DEFAULT 'UNKNOWN',
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT,
    "activity_log" JSONB,
    UNIQUE("feed_title", "model_name")
);
    CREATE FUNCTION "sf_gen_predictions_result"() RETURNS void AS $$
DECLARE
 OPENAI_API_KEY text;
 feed_row record;
 response json;
 feed_title_without_html text;
BEGIN
 SELECT openai_general_prediction.settings.openai_api_key::text INTO OPENAI_API_KEY
 FROM openai_general_prediction.settings
 WHERE name = 'default';

 FOR feed_row IN (select title from fdw_stateful_service_miniflux.entries ORDER BY created_at DESC LIMIT 20 OFFSET 650) LOOP
   SELECT regexp_replace(feed_row.title, '<[^>]+>', '', 'g') INTO feed_title_without_html;
   SELECT json_agg(trim(choice)) into response
   FROM http (('POST',
     'https://api.openai.com/v1/engines/text-davinci-003/completions',
     ARRAY[http_header ('Authorization',
     'Bearer ' ||  OPENAI_API_KEY )],
     'application/json',
     jsonb_build_object('prompt','Please provide a list of related topics for the following content in descending order of relevance. No need for newlines. Separate the topics with commas.' || feed_title_without_html,
         'temperature',0.8,
         'max_tokens', 1000
         )::text
     )) CROSS JOIN LATERAL unnest(string_to_array(SUBSTRING((content::json->'choices'->0->>'text') FROM 2), ',')) AS choice;
   INSERT INTO openai_general_prediction.general_predictions(feed_title, model_name, related_topic_with_title, created_at, created_by) VALUES(feed_title_without_html, 'OpenAI', response, CURRENT_TIMESTAMP, CURRENT_USER) ON CONFLICT (feed_title,model_name) DO NOTHING;
 END LOOP;
 UPDATE openai_general_prediction.general_predictions SET related_topic_with_title = replace(replace(related_topic_with_title::json::text, '\n', ''), ':', '')::json;
END;
$$ LANGUAGE PLPGSQL;
    SELECT openai_general_prediction.sf_gen_predictions_result();
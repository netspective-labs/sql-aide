// -- Creating the tables

// CREATE TABLE service (
//     service_id SERIAL PRIMARY KEY,
//     service_name VARCHAR(255)
//     -- other fields...
// );

// CREATE TABLE party (
//     party_id SERIAL PRIMARY KEY,
//     party_type VARCHAR(255),
//     party_name VARCHAR(255)
//     -- other fields...
// );

// CREATE TABLE feature (
//     feature_id SERIAL PRIMARY KEY,
//     feature_name VARCHAR(255),
//     feature_description VARCHAR(255),
//     default_value VARCHAR(255)
// );

// CREATE TABLE toggle (
//     toggle_id SERIAL PRIMARY KEY,
//     toggle_name VARCHAR(255),
//     toggle_state BOOLEAN
// );

// CREATE TABLE service_feature (
//     service_id INT REFERENCES service(service_id),
//     feature_id INT REFERENCES feature(feature_id),
//     PRIMARY KEY (service_id, feature_id)
// );

// CREATE TABLE service_toggle (
//     service_id INT REFERENCES service(service_id),
//     toggle_id INT REFERENCES toggle(toggle_id),
//     PRIMARY KEY (service_id, toggle_id)
// );

// CREATE TABLE config_setting (
//     setting_id SERIAL PRIMARY KEY,
//     service_id INT REFERENCES service(service_id),
//     party_id INT REFERENCES party(party_id),
//     key VARCHAR(255),
//     value TEXT,
//     UNIQUE(service_id, key, party_id)
// );

// CREATE TABLE party_service (
//     party_id INT REFERENCES party(party_id),
//     service_id INT REFERENCES service(service_id),
//     PRIMARY KEY (party_id, service_id)
// );

// This stored procedure get_party_service_config takes a party_id and a service_name as arguments and returns a table that includes all features for that service with their default values, and also returns any configuration settings that have been specifically set for that party. If a configuration setting has not been specifically set for that party, the default value for the feature is returned instead.
// This stored procedure will need to be called with the appropriate party_id and service_name parameters. For example:
// SELECT * FROM get_party_service_config(1, 'Service1');

// CREATE OR REPLACE FUNCTION get_party_service_config(party_id_param INT, service_name_param VARCHAR(255))
// RETURNS TABLE(service_name VARCHAR(255), feature_name VARCHAR(255), feature_description VARCHAR(255), default_value VARCHAR(255), setting_key VARCHAR(255), setting_value TEXT) AS $$
// BEGIN
//     RETURN QUERY
//     SELECT
//         s.service_name,
//         f.feature_name,
//         f.feature_description,
//         f.default_value,
//         cs.key AS setting_key,
//         COALESCE(cs.value, f.default_value) AS setting_value
//     FROM
//         service s
//     JOIN
//         service_feature sf ON sf.service_id = s.service_id
//     JOIN
//         feature f ON f.feature_id = sf.feature_id
//     LEFT JOIN
//         config_setting cs ON cs.service_id = s.service_id AND cs.party_id = party_id_param
//     WHERE
//         s.service_name = service_name_param AND
//         (cs.party_id IS NULL OR cs.party_id = party_id_param);
// END; $$ LANGUAGE plpgsql;

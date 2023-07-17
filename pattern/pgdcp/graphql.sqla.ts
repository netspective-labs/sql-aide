#!/usr/bin/env -S deno run --allow-all

import { persistContent as pc, pgSQLa, SQLa, zod as z } from "./deps.ts";
import * as pgdcp from "./pgdcp.ts";

export class PgDcpGraphql {
  protected constructor() {}

  readonly state = pgdcp.pgDcpState(import.meta, {
    subjectArea: "graphql",
    schemas: ["dcp_extensions", "dcp_lib", "dcp_assurance"],
  });
  readonly ctx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.postgreSqlDialect(),
  });

  content() {
    const { ec, lc, schemas } = this.state;
    const plpython3u = ec.extnDefns.plpython3u;
    const [aQR] = ec.schemaQualifier("dcp_assurance");
    const [lQR] = ec.schemaQualifier("dcp_lib");

    const httpClientGraphqlAnonymousQueryResult = pgSQLa.storedFunction(
      "http_client_graphql_anonymous_query_result",
      {
        endpoint_url: z.string(),
        query: z.string(),
      },
      "JSON",
      (name, args) =>
        pgSQLa.typedPlSqlBody(
          name,
          args,
          this.ctx,
          pgSQLa.plPythonLanguage(),
        ),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[1],
        headerBodySeparator: "$http_client_graphql_anonymous_query_result$",
      },
    )`
    import urllib.request, json
    req = urllib.request.Request(endpoint_url)
    req.add_header('Content-Type', 'application/json')
    resp = urllib.request.urlopen(req, data=json.dumps({'query': query}).encode())
    return json.dumps(json.loads(resp.read().decode("utf-8")))
    `;

    const httpClientGraphqlAuthnHeaderQueryResult = pgSQLa.storedFunction(
      "http_client_graphql_authn_header_query_result",
      {
        endpoint_url: z.string(),
        auth_token_header_name: z.string(),
        auth_token: z.string(),
        query: z.string(),
      },
      "JSON",
      (name, args) =>
        pgSQLa.typedPlSqlBody(
          name,
          args,
          this.ctx,
          pgSQLa.plPythonLanguage(),
        ),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[1],
        headerBodySeparator: "$http_client_graphql_anonymous_query_result$",
      },
    )`
    import urllib.request, json
    req = urllib.request.Request(endpoint_url)
    req.add_header('Content-Type', 'application/json')
    req.add_header(auth_token_header_name, auth_token)
    resp = urllib.request.urlopen(req, data=json.dumps({'query': query}).encode())
    return json.dumps(json.loads(resp.read().decode("utf-8")))
    `;

    const testHttpClientGraphql = pgSQLa.storedFunction(
      "test_http_client_graphql",
      {},
      "SETOF TEXT",
      (name, args) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[2],
        headerBodySeparator: "$test_postgraphile$",
      },
    )`
    RETURN NEXT ${aQR(`hasFunction`)}("dcp_lib", ${
      lQR(`http_client_graphql_anonymous_query_result`)
    });
    RETURN NEXT ${aQR(`hasFunction`)}("dcp_lib", ${
      lQR(`http_client_graphql_authn_header_query_result`)
    });
    RETURN NEXT ${aQR(`hasExtension`)}("dcp_extension", ${lQR(`plpython3u`)});
    `;

    const psqlText = ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${plpython3u}

      ${httpClientGraphqlAnonymousQueryResult}

      ${httpClientGraphqlAuthnHeaderQueryResult}

      ${lc.destroyIdempotent()`
        DROP FUNCTION IF EXISTS ${aQR("test_http_client_graphql")}();
        DROP FUNCTION IF EXISTS ${
      lQR("http_client_graphql_anonymous_query_result")
    }();
        DROP FUNCTION IF EXISTS ${
      lQR("http_client_graphql_authn_header_query_result")
    }();
        `}

      ${testHttpClientGraphql}

      `;

    const provenance: pgdcp.SqlFilePersistProvenance = {
      confidentiality: "non-sensitive",
      source: import.meta.url,
    };
    const persistableSQL:
      & pgdcp.SqlFilePersistProvenance
      & pc.PersistableContent<pgdcp.SqlFilePersistProvenance> = {
        ...provenance,
        basename: () => ec.psqlBasename(),
        // deno-lint-ignore require-await
        content: async () => {
          return {
            provenance,
            text: psqlText.SQL(ec.sqlEmitContext()),
          };
        },
      };

    return {
      psqlText,
      provenance,
      persistableSQL,
    };
  }

  static init() {
    return new PgDcpGraphql();
  }
}

if (import.meta.main) {
  const graphql = PgDcpGraphql.init();
  const content = graphql.content();
  console.log(content.psqlText.SQL(graphql.state.ec.sqlEmitContext()));
}

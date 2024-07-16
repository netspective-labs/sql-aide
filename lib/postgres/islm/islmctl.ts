#!/usr/bin/env -S deno run --allow-all
import {
  ConsoleHandler,
  FileHandler,
  getLogger,
  setup,
} from "https://deno.land/std@0.224.0/log/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import * as dax from "https://deno.land/x/dax@0.39.2/mod.ts";
import * as pgpass from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.13.27/lib/postgres/pgpass/pgpass-parse.ts";

const $ = dax.build$({
  commandBuilder: new dax.CommandBuilder().noThrow(),
});

const exists = async (target: string | URL) =>
  await Deno.stat(target).then(() => true).catch(() => false);

const { conns: pgConns, issues: pgConnIssues } = await pgpass.parse(
  path.join(`${Deno.env.get("HOME")}`, ".pgpass"),
);
if (pgConnIssues.length > 0) {
  console.error("unexpected .pgpass issues", pgConnIssues);
}

const pgpassPsqlArgs = (
  connId: string,
  defaultValue = () => `-h unknown-conn-id-${connId}`,
) => {
  const conn = pgConns.find((conn) => conn.connDescr.id == connId);
  return conn
    ? `-h ${conn.host} -p ${conn.port} -d ${conn.database} -U ${conn.username}`
    : defaultValue();
};

const setupLogger = (options: { readonly logResults?: string }) => {
  if (options.logResults) {
    setup({
      handlers: {
        file: new FileHandler("DEBUG", { filename: options.logResults }),
      },
      loggers: { default: { level: "DEBUG", handlers: ["file"] } },
    });
  } else {
    setup({
      handlers: { console: new ConsoleHandler("DEBUG", {}) },
      loggers: { default: { level: "DEBUG", handlers: ["console"] } },
    });
  }
  return getLogger();
};

const postreSqlClientMinMessagesLevels = [
  "panic",
  "fatal",
  "error",
  "warning",
  "notice",
  "log",
  "debug1",
  "debug2",
  "debug3",
  "debug4",
  "debug5",
] as const;
const postreSqlClientMinMessagesLevelCliffyEnum = new EnumType(
  postreSqlClientMinMessagesLevels,
);

type PostreSqlClientMinMessagesLevel =
  typeof postreSqlClientMinMessagesLevels[number];

const postgreSqlClientMinMessagesSql = (
  level: PostreSqlClientMinMessagesLevel,
) => `SET client_min_messages TO ${level};`;

// TODO: add a `doctor` command to check for dependencies like `psql`, etc.
// TODO: in `doctor`, if you get this error: `java.lang.RuntimeException: Fontconfig head is null, check your fonts or fonts configuration` this is required:
//       sudo apt update && sudo apt install fontconfig fonts-dejavu

const cleanableTargetHome = "./target/islm";
const cleanableTarget = (relative: string) =>
  path.join(cleanableTargetHome, relative);

// deno-fmt-ignore
export const CLI = new Command()
  .name("UDI ISLM Control Plane")
  .version("0.1.0")
  .description("Universal Data Infrastructure (UDI) Information Schema Lifecycle (ISLM) Orchestration")
  .command("clean", `Remove contents of ${cleanableTargetHome}`).action(() => {  
      try {
          Deno.removeSync(cleanableTargetHome, { recursive: true });
          console.log(`rm -rf ${cleanableTargetHome}`);
      } catch (_notFound) {
        console.log(`${cleanableTargetHome} does not exist`);
      }
  })
  .command("evolve", new Command()
    .description("ISLM Schema Evoluation Handler")    
    .command("up", "Use psql to load migration scripts into the database")
      .option("-s, --src <path:string>", "Source location for artifacts", { required: true, default: path.fromFileUrl(import.meta.resolve("./")) })
      .option("-t, --target <path:string>", "Target location for generated artifacts", { required: true, default: cleanableTarget("/evolve") })
      .option("--destroy-fname <file-name:string>", "Filename of the generated destroy script in target", { default: "islm-infrastructure-destroy.psql" })
      .option("--driver-fname <file-name:string>", "Filename of the generated construct script in target", { default: "islm-driver.psql" })
      .option("--psql <path:string>", "`psql` command", { required: true, default: "psql" })
      .option("--destroy-first", "Destroy objects before migration")
      .option("--log-results <path:string>", "Store `psql` results in this log file", { default: `./islmctl-migrate-${new Date().toISOString()}.log` })
      .option("-c, --conn-id <id:string>", "pgpass connection ID to use for psql", { required: true, default: "UDI_PRIME_DESTROYABLE_DEVL" })
      .type("pg-client-min-messages-level", postreSqlClientMinMessagesLevelCliffyEnum)
      .option("-l, --psql-log-level <level:pg-client-min-messages-level>", "psql `client_min_messages` level.", {
        default: "warning",
      })
      .action(async (options) => {
        let psqlErrors = 0;
        const logger = setupLogger(options);
        const psqlCreds = pgpassPsqlArgs(options.connId);
        if(options.destroyFirst) {
            if(options.connId.indexOf("DESTROYABLE") == -1) {
                console.warn(`Skipping --destroy-first because --conn-id "${options.connId}" does not contain the word DESTROYABLE in the connection identifier.`);
                console.warn(`  --destroy-first is dangerous so be sure to name your identifier properly so you do not accidentally run in a non-sandbox database.`);
                Deno.exit(-1);
            }
            const psqlContentFName = `${options.src}${options.destroyFname}`;
            if(!(await exists(psqlContentFName))) {
              console.warn(`${psqlContentFName} does not exist.`);
            } else {
              const psqlResults = await $.raw`${options.psql} ${psqlCreds} -c "${postgreSqlClientMinMessagesSql(options.psqlLogLevel)}" -f ${psqlContentFName}`.captureCombined();
              logger.debug(`-- DESTROYING FIRST WITH ${options.destroyFname} at ${new Date()}\n${postgreSqlClientMinMessagesSql(options.psqlLogLevel)}\n`);
              logger.debug(psqlResults.combined);
              if(psqlResults.code != 0) {
                logger.debug(`ERROR non-zero error code ${options.psql} ${psqlResults.code}`);
                psqlErrors++;
              }
              logger.debug(`-- END ${options.destroyFname} at ${new Date()}\n\n`);  
            }
        }
        const psqlContentFName = `${options.src}${options.driverFname}`;
        if(!(await exists(psqlContentFName))) {
          console.warn(`${psqlContentFName} does not exist.`);
          Deno.exit(-1);
        }
        const psqlResults = await $.raw`${options.psql} ${psqlCreds} -c "${postgreSqlClientMinMessagesSql(options.psqlLogLevel)}" -f ${psqlContentFName}`.captureCombined();
        logger.debug(`-- BEGIN ${options.driverFname} at ${new Date()}\n${postgreSqlClientMinMessagesSql(options.psqlLogLevel)}\n`);
        logger.debug(psqlResults.combined);
        if(psqlResults.code != 0) {
          logger.debug(`ERROR non-zero error code ${options.psql} ${psqlResults.code}`);
          psqlErrors++;
        }
        logger.debug(`-- END ${options.driverFname} at ${new Date()}\n\n`);
        console.log("Migration complete, results logged in", options.logResults);
        if(psqlErrors) {
          console.error(`WARNING: ${psqlErrors} ${options.psql} error(s) occurred, see log file ${options.logResults}`);
        }
      })
    .command("candidates", "Use psql to check for migration candidates (stored procedures)")
      .option("--psql <path:string>", "`psql` command", { required: true, default: "psql" })
      .option("-c, --conn-id <id:string>", "pgpass connection ID to use for psql", { required: true, default: "UDI_PRIME_DESTROYABLE_DEVL" })
      .action(async (options) => {
        const psqlCreds = pgpassPsqlArgs(options.connId);
        console.log((await $.raw`${options.psql} ${psqlCreds} -c "SELECT * FROM info_schema_lifecycle.migration_routine_candidate();"`.captureCombined().lines()).join("\n"));
      })
    .command("state", "Use psql to get the migration state for each candidate routine")
      .option("--psql <path:string>", "`psql` command", { required: true, default: "psql" })
      .option("-c, --conn-id <id:string>", "pgpass connection ID to use for psql", { required: true, default: "UDI_PRIME_DESTROYABLE_DEVL" })
      .action(async (options) => {
        const psqlCreds = pgpassPsqlArgs(options.connId);
        console.log((await $.raw`${options.psql} ${psqlCreds} -c "SELECT * FROM info_schema_lifecycle.migration_routine_state();"`.captureCombined().lines()).join("\n"));
      })
    .command("script", "Use psql to generate migration scripts based on current state")
      .option("--psql <path:string>", "`psql` command", { required: true, default: "psql" })
      .option("-c, --conn-id <id:string>", "pgpass connection ID to use for psql", { required: true, default: "UDI_PRIME_DESTROYABLE_DEVL" })
      .action(async (options) => {
        const psqlCreds = pgpassPsqlArgs(options.connId);
        console.log((await $.raw`${options.psql} ${psqlCreds} -q -t -A -P border=0 -X -c "SELECT * FROM info_schema_lifecycle.islm_migration_script();"`.captureCombined().lines()).join("\n"));
      })
    .command("migrate", "Use psql to generate migration scripts based on current state")
      .option("--psql <path:string>", "`psql` command", { required: true, default: "psql" })
      .option("-c, --conn-id <id:string>", "pgpass connection ID to use for psql", { required: true, default: "UDI_PRIME_DESTROYABLE_DEVL" })
      .action(async (options) => {
        const psqlCreds = pgpassPsqlArgs(options.connId);
        console.log((await $.raw`${options.psql} ${psqlCreds} -q -t -A -P border=0 -X -c "CALL info_schema_lifecycle.execute_migration_script();"`.captureCombined().lines()).join("\n"));
      })
    .command("test", "Use psql to execute test scripts for ISLM infrastructure")
      .option("-s, --src <path:string>", "Source location for artifacts", { required: true, default: path.fromFileUrl(import.meta.resolve("./")) })
      .option("-t, --target <path:string>", "Target location for generated artifacts", { required: true, default: cleanableTarget("/evolve") })
      .option("--psql <path:string>", "`psql` command", { required: true, default: "psql" })
      .option("--suite-fname <file-name:string>", "Filename of the generated test suite script in target", { default: "islm-infrastructure-test.psql" })
      .option("--log-results <path:string>", "Store `psql` results in this log file", { default: `./islmctl-test-${new Date().toISOString()}.log` })
      .option("-c, --conn-id <id:string>", "pgpass connection ID to use for psql", { required: true, default: "UDI_PRIME_DESTROYABLE_DEVL" })
      .type("pg-client-min-messages-level", postreSqlClientMinMessagesLevelCliffyEnum)
      .option("-l, --psql-log-level <level:pg-client-min-messages-level>", "psql `client_min_messages` level.", {
        default: "log",
      })
      .action(async (options) => {
        let psqlErrors = 0;
        const logger = setupLogger(options);
        const psqlCreds = pgpassPsqlArgs(options.connId);
        const psqlContentFName = `${options.src}${options.suiteFname}`;
        if(!(await exists(psqlContentFName))) {
          console.warn(`${psqlContentFName} does not exist.`);
          Deno.exit(-1);
        }
        const psqlResults = await $.raw`${options.psql} ${psqlCreds} -c "${postgreSqlClientMinMessagesSql(options.psqlLogLevel)}" -f ${psqlContentFName}`.captureCombined();
        logger.debug(`-- BEGIN ${options.suiteFname} at ${new Date()}\n${postgreSqlClientMinMessagesSql(options.psqlLogLevel)}\n`);
        logger.debug(psqlResults.combined);
        logger.debug(`-- END ${options.suiteFname} at ${new Date()}\n\n`);
        if(psqlResults.code != 0) {
          logger.debug(`ERROR non-zero error code ${options.psql} ${psqlResults.code}`);
          psqlErrors++;
        }
        await Deno.readTextFile(options.logResults)
          .then(data => data.split('\n')
              .map(line => line.replace(/.*ASSERT: /, ''))
              .filter(line => !line.startsWith('LOCATION:  exec_stmt_raise'))
              .join('\n'))
          .then(modifiedData => Deno.writeTextFile(options.logResults, modifiedData));
        console.log("Test complete, results logged in", options.logResults);
        if(psqlErrors) {
          console.error(`WARNING: ${psqlErrors} ${options.psql} error(s) occurred, see log file ${options.logResults}`);
        }
      })
    .command("omnibus-fresh", "Freshen the given connection ID by dropping and recreating the schema")
      .option("-c, --conn-id <id:string>", "pgpass connection ID to use for psql", { required: true, default: "UDI_PRIME_DESTROYABLE_DEVL" })
      .action(async (options) => {
        await CLI.parse(["evolve", "up", "--destroy-first", "--conn-id", options.connId]);
        await CLI.parse(["evolve", "test", "--conn-id", options.connId]);
      })
    );

await CLI.parse(Deno.args);

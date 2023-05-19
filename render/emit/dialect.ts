import * as safety from "../../lib/universal/safety.ts";

export interface SqlDialect {
  readonly identity: (purpose: "presentation" | "state") => string;
}

export interface AnsiSqlDialect extends SqlDialect {
  readonly isAnsiDialect: true;
}

export const isAnsiSqlDialect = safety.typeGuard<AnsiSqlDialect>(
  "isAnsiDialect",
);

export const ansiSqlDialect = (): AnsiSqlDialect => {
  return {
    identity: () => "ANSI",
    isAnsiDialect: true,
  };
};

export interface SqliteDialect extends AnsiSqlDialect {
  readonly isSqliteDialect: true;
}

export const isSqliteDialect = safety.typeGuard<SqliteDialect>(
  "isSqliteDialect",
);

export const sqliteDialect = (): SqliteDialect => {
  return {
    identity: () => "SQLite",
    isAnsiDialect: true,
    isSqliteDialect: true,
  };
};

export interface PostgreSqlDialect extends AnsiSqlDialect {
  readonly isPostgreSqlDialect: true;
}

export const isPostgreSqlDialect = safety.typeGuard<PostgreSqlDialect>(
  "isPostgreSqlDialect",
);

export const postgreSqlDialect = (): PostgreSqlDialect => {
  return {
    identity: () => "PostgreSQL",
    isAnsiDialect: true,
    isPostgreSqlDialect: true,
  };
};

export interface MsSqlServerDialect extends AnsiSqlDialect {
  readonly isMsSqlServerDialect: true;
}

export const isMsSqlServerDialect = safety.typeGuard<MsSqlServerDialect>(
  "isMsSqlServerDialect",
);

export const msSqlServerDialect = (): MsSqlServerDialect => {
  return {
    identity: () => "Microsoft SQL*Server",
    isAnsiDialect: true,
    isMsSqlServerDialect: true,
  };
};

export function dialectState(dialect: SqlDialect) {
  return {
    identity: dialect.identity("state"),
    isAnsiSqlDialect: isAnsiSqlDialect(dialect),
    isSqliteDialect: isSqliteDialect(dialect),
    isPostgreSqlDialect: isPostgreSqlDialect(dialect),
    isMsSqlServerDialect: isMsSqlServerDialect(dialect),
  };
}

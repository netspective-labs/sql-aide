// import * as nsp from "npm:node-sql-parser";

// // deno-lint-ignore no-explicit-any
// type Any = any;

// export type KeySpacePart = Uint8Array | string | number | bigint | boolean;
// export type KeySpace = KeySpacePart[];
// export type Entity<Schema> = Map<KeySpace, Schema>;
// export type Entities<Identity, E extends Entity<Any>> = Map<Identity, E>;

// const parser = new nsp.default.Parser();
// const ast = parser.astify(
//   `SELECT a, "user.x.y.z", "b.c" as "c", d FROM user where \`b.c\` = 1`,
//   { database: "PostgreSQL" },
// );
// console.log(ast);
// console.log(parser.sqlify(ast));

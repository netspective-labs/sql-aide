import * as nsp from "npm:node-sql-parser";

const parser = new nsp.default.Parser();
const _ast = parser.parse(
  `SELECT a, "b.c" as "c", d FROM user where "b.c" = 1`,
);
//console.log(ast);

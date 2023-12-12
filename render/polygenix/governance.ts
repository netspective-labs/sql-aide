import * as emit from "../emit/mod.ts";

export const snakeToCamelCase = (str: string) =>
  str.replace(/(_\w)/g, (m) => m[1].toUpperCase());

export const snakeToPascalCase = (str: string) =>
  str.replace(/(^|_)\w/g, (m) => m[m.length - 1].toUpperCase());

export const snakeToConstantCase = (str: string) => str.toUpperCase();

export interface PolygenTypeSupplier {
  readonly type: emit.PolygenCellText;
  readonly remarks?: string;
}

export interface PolygenTypeStrategy {
  readonly type: (abstractType: string) => PolygenTypeSupplier;
}

export interface PolygenNamingStrategy {
  readonly entityName: (sqlIdentifier: string) => string;
  readonly entityAttrName: (sqlIdentifier: string) => string;
}

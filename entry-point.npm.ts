export * from "./pattern/data-vault.ts";
export * from "./pattern/enum-table.ts";
export * from "./render/mod.ts";

// Default export
import * as dataVault from "./pattern/data-vault.ts";
import * as enumTable from "./pattern/enum-table.ts";
import * as render from "./render/mod.ts";

const defaultExport = {
  ...dataVault,
  ...enumTable,
  ...render,
};

export default defaultExport;

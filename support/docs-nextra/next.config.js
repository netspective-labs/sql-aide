const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.jsx",
});
const isProd = process.env.NODE_ENV === "production";
module.exports = withNextra({
  // output: "export",
  trailingSlash: true,
  basePath: isProd ? "/sql-aide" : undefined,
  assetPrefix: isProd ? "/sql-aide" : undefined,
  // distDir: "../dist",
  images: {
    unoptimized: true,
  },
});

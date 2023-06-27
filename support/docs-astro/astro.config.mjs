import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  // routes: [
  //   {
  //     path: "/sql-aide",
  //     component: "src/pages/index.astro",
  //   },
  // ],
  integrations: [
    starlight({
      title: "SQL Aide (SQLa) Documentation",
      social: {
        github: "https://github.com/withastro/starlight",
      },
      sidebar: [
        { label: "Welcome", link: "/" },
        { label: "Installation", link: "/installation" },
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Data Compute Platform",
          autogenerate: { directory: "dcp" },
        },
        {
          label: "Architecture",
          autogenerate: { directory: "architecture" },
        },
        {
          label: "Domains",
          autogenerate: { directory: "domains" },
        },
        {
          label: "Entities",
          autogenerate: { directory: "entities" },
        },
        {
          label: "Contributors",
          autogenerate: { directory: "contributors" },
        },
        {
          label: "SQL Templates",
          autogenerate: { directory: "emit" },
        },
        { label: "Roadmap", link: "/roadmap" },
      ],
      // themeConfig: {
      //   layout: "./layout.astro",
      // },
    }),
  ],
});

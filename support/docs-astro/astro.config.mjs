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
          collapsed: true,
          autogenerate: { directory: "getting-started", collapsed: true },
        },
        {
          label: "Data Compute Platform",
          collapsed: true,
          autogenerate: { directory: "dcp", collapsed: true },
        },
        {
          label: "Architecture",
          collapsed: true,
          autogenerate: { directory: "architecture", collapsed: true },
        },
        {
          label: "Domains",
          collapsed: true,
          autogenerate: { directory: "domains", collapsed: true },
        },
        {
          label: "Entities",
          collapsed: true,
          autogenerate: { directory: "entities", collapsed: true },
        },
        {
          label: "SQL Templates",
          collapsed: true,
          autogenerate: { directory: "emit", collapsed: true },
        },
        { label: "Roadmap", link: "/roadmap" },
        {
          label: "Contributors",
          collapsed: true,
          autogenerate: { directory: "contributors", collapsed: true },
        },
      ],
      // themeConfig: {
      //   layout: "./layout.astro",
      // },
    }),
  ],
});

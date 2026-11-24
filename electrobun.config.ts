import type { ElectrobunConfig } from "electrobun/bun";

const config: ElectrobunConfig = {
  app: {
    name: "RefMind",
    identifier: "com.refmind.desktop",
    version: "1.0.0",
    description:
      "Visual reference & intelligent site manager for mymind with keyword search, auto-categorization, and similar site recommendations.",
  },
  build: {
    mainProcess: "bun",
    bun: {
      entrypoint: "src/bun/index.ts",
    },
    copy: {
      "dist/index.html": "views/mainview/index.html",
      "dist/assets": "views/mainview/assets",
    },
    mac: {
      bundleCEF: false,
    },
  },
};

export default config;

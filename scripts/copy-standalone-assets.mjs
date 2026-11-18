import { cpSync, existsSync } from "node:fs";

cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
cpSync("public", ".next/standalone/public", { recursive: true });
if (existsSync("node_modules/@swc/helpers/esm")) {
  cpSync("node_modules/@swc/helpers/esm", ".next/standalone/node_modules/@swc/helpers/esm", { recursive: true });
}

import { cpSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src", "wireframe");
const dist = join(root, "dist");

mkdirSync(dist, { recursive: true });
cpSync(src, dist, { recursive: true });

console.log("Build complete: src/wireframe → dist/");

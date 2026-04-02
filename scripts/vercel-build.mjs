import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

execSync("npm run build --workspace=client", { stdio: "inherit" });

const sourceNextDir = resolve("client", ".next");
const rootNextDir = resolve(".next");

if (!existsSync(sourceNextDir)) {
  throw new Error(`Expected Next output at ${sourceNextDir}, but it was not found.`);
}

if (existsSync(rootNextDir)) {
  rmSync(rootNextDir, { recursive: true, force: true });
}

cpSync(sourceNextDir, rootNextDir, { recursive: true });
console.log("Synced client/.next to root .next for Vercel deployment.");

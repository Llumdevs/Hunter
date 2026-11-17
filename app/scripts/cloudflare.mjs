import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const [command, ...args] = process.argv.slice(2);
if (!["build", "preview", "deploy"].includes(command)) throw new Error("Comando Cloudflare no válido");
const cli = fileURLToPath(new URL("../node_modules/@opennextjs/cloudflare/dist/cli/index.js", import.meta.url));
const result = spawnSync(process.execPath, [cli, command, ...args], {
  stdio: "inherit", env: { ...process.env, HUNTER_CLOUDFLARE: "1" },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);

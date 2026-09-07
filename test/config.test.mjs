import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

for (const name of ["FACILITATOR_URL", "PAY_TO"]) {
  for (const value of [undefined, "", "   "]) {
    test(`startup rejects ${name}=${JSON.stringify(value)}`, () => {
      const env = {
        ...process.env,
        FACILITATOR_URL: "http://127.0.0.1:1",
        PAY_TO: "0x1111111111111111111111111111111111111111",
        PORT: "0",
        DOTENV_CONFIG_PATH: process.platform === "win32" ? "NUL" : "/dev/null",
        [name]: value,
      };
      if (value === undefined) delete env[name];
      const result = spawnSync(process.execPath, ["next.config.mjs"], {
        env,
        encoding: "utf8",
        timeout: 3000,
      });
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, new RegExp(`${name} is required`));
    });
  }
}

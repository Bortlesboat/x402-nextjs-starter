import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const recipient = "0x1111111111111111111111111111111111111111";

test("free requests succeed and unpaid premium requests return configured requirements", { timeout: 180000 }, async () => {
  const requests = [];
  const facilitator = createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    if (req.method !== "GET" || req.url !== "/supported") {
      res.writeHead(404).end();
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      kinds: [{ x402Version: 2, scheme: "exact", network: "eip155:8453" }],
      extensions: [],
      signers: {},
    }));
  });
  facilitator.listen(0, "127.0.0.1");
  await once(facilitator, "listening");
  let child;
  let exited;
  let output = "";
  try {
    const reservation = createServer();
    reservation.listen(0, "127.0.0.1");
    await once(reservation, "listening");
    const port = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    const env = {
      ...process.env,
      FACILITATOR_URL: ` http://127.0.0.1:${facilitator.address().port} `,
      PAY_TO: ` ${recipient} `,
      PRICE: "$0.001",
      NETWORK: "eip155:8453",
      PORT: String(port),
      NEXT_TELEMETRY_DISABLED: "1",
    };
    const build = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
      env, stdio: ["ignore", "pipe", "pipe"],
    });
    let buildOutput = "";
    build.stdout.on("data", chunk => { buildOutput += chunk; });
    build.stderr.on("data", chunk => { buildOutput += chunk; });
    const buildTimeout = setTimeout(() => build.kill(), 120000);
    const [buildCode] = await once(build, "exit");
    clearTimeout(buildTimeout);
    assert.equal(buildCode, 0, buildOutput);
    child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
    exited = once(child, "exit");
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    const base = `http://127.0.0.1:${port}`;
    let hello;
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) assert.fail(output);
      try {
        hello = await fetch(`${base}/api/hello`, { signal: AbortSignal.timeout(1000) });
        if (hello.ok) break;
        await hello.text();
      } catch { /* Wait for the local server to listen. */ }
      await delay(100);
    }
    assert.equal(hello?.status, 200, output);
    assert.equal((await hello.json()).message, "Hello from x402!");

    const premium = await fetch(`${base}/api/premium`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(premium.status, 402, output);
    const encoded = premium.headers.get("PAYMENT-REQUIRED");
    assert.ok(encoded, "The v2 payment requirements header must be present");
    const requirements = JSON.parse(Buffer.from(encoded, "base64").toString());
    assert.equal(requirements.x402Version, 2);
    assert.equal(requirements.accepts[0].payTo, recipient);
    assert.equal(requirements.accepts[0].network, "eip155:8453");
    assert.equal(requirements.accepts[0].amount, "1000");
    assert.equal(requirements.accepts[0].scheme, "exact");
    assert.doesNotMatch(await premium.text(), /premium data|unlocked|The answer is 42/i);
    assert.ok(requests.length > 0, "The SDK must query the local facilitator");
    assert.ok(requests.every(request => request === "GET /supported"), requests.join(", "));
  } finally {
    if (child && child.exitCode === null) child.kill();
    if (exited) await exited;
    facilitator.closeAllConnections();
    await new Promise(resolve => facilitator.close(resolve));
  }
});

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { DemoRepository } from "../src/lib/adapters/demo-store";

test("demo transactions serialize separate Node processes on the same local disk", { timeout: 30000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "aeroroute-processes-"));
  const path = join(directory, "store.json");
  const modulePath = require.resolve("../src/lib/adapters/demo-store");
  const code = `const {DemoRepository}=require(process.argv[2]);new DemoRepository(process.argv[1]).transaction(async tx=>{const value=await tx.get('counter','one')||{count:0};await new Promise(r=>setTimeout(r,100));await tx.set('counter','one',{count:value.count+1});}).catch(e=>{console.error(e);process.exitCode=1;});`;
  try {
    await Promise.all(Array.from({ length: 4 }, () => new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, ["-e", code, path, modulePath]);
      let stderr = "";
      child.stderr.on("data", chunk => { stderr += chunk; });
      child.on("error", reject);
      child.on("exit", status => { if (status === 0) resolve(); else reject(new Error(stderr || `Worker exited ${status}`)); });
    })));
    assert.deepEqual(await new DemoRepository(path).get("counter", "one"), { count: 4 });
  } finally { await rm(directory, { recursive: true, force: true }); }
});

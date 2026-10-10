import assert from "node:assert/strict";
import { test } from "node:test";
import { checkOrigin } from "../src/lib/http";

test("same-origin guard handles Next internal localhost URLs and rejects foreign/missing origins", () => {
  const internal = "http://localhost:5180/api/orders";
  const original = process.env.AEROROUTE_APP_ORIGIN;
  delete process.env.AEROROUTE_APP_ORIGIN;
  try {
    checkOrigin(new Request(internal, { headers: { Host: "127.0.0.1:5180", Origin: "http://127.0.0.1:5180" } }));
    for (const origin of ["https://attacker.invalid", "null", "http://127.0.0.1:9999"]) {
      assert.throws(() => checkOrigin(new Request(internal, { headers: { Host: "127.0.0.1:5180", Origin: origin } })), { status: 403 });
    }
    assert.throws(() => checkOrigin(new Request(internal)), { status: 403 });
    process.env.AEROROUTE_APP_ORIGIN = "https://aeroroute.example";
    checkOrigin(new Request(internal, { headers: { Host: "localhost:5180", Origin: "https://aeroroute.example" } }));
    assert.throws(() => checkOrigin(new Request(internal, { headers: { Host: "attacker.invalid", Origin: "https://attacker.invalid" } })), { status: 403 });
  } finally {
    if (original === undefined) delete process.env.AEROROUTE_APP_ORIGIN;
    else process.env.AEROROUTE_APP_ORIGIN = original;
  }
});

import { describe, test } from "node:test";
import assert from "node:assert";
import {
  signSession,
  verifySession,
  constantTimeEqual,
  SESSION_TTL_MS,
} from "./session";

describe("admin session cookie", () => {
  test("round-trip: signed session verifies", async () => {
    const token = await signSession("correct horse");
    assert.equal(await verifySession("correct horse", token), true);
  });

  test("wrong password fails", async () => {
    const token = await signSession("correct horse");
    assert.equal(await verifySession("wrong horse", token), false);
  });

  test("expired session fails", async () => {
    const token = await signSession("correct horse", Date.now() - 2 * SESSION_TTL_MS);
    assert.equal(await verifySession("correct horse", token), false);
  });

  test("malformed tokens fail", async () => {
    for (const bad of ["", "abc", "123.", ".", "notanumber.deadbeef"]) {
      assert.equal(
        await verifySession("correct horse", bad),
        false,
        `expected failure for ${JSON.stringify(bad)}`,
      );
    }
  });

  test("future expiry with wrong mac fails", async () => {
    const token = await signSession("correct horse");
    const expiresAt = token.split(".")[0];
    assert.equal(
      await verifySession("correct horse", `${expiresAt}.${"0".repeat(64)}`),
      false,
    );
  });

  test("constantTimeEqual", async () => {
    assert.equal(await constantTimeEqual("a", "a"), true);
    assert.equal(await constantTimeEqual("a", "b"), false);
    assert.equal(await constantTimeEqual("a", "aa"), false);
  });
});

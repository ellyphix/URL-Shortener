import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { createRateLimiter } from "../src/lib/rate-limit.ts";
import { createWithUniqueCode, generateCode } from "../src/lib/short-code.ts";
import { normalizeUrl } from "../src/lib/url-validation.ts";

test("accepts HTTP and HTTPS without fetching destinations", () => {
  assert.equal(normalizeUrl("http://example.com/path"), "http://example.com/path");
  assert.equal(normalizeUrl("https://example.com/path"), "https://example.com/path");
});

test("rejects invalid schemes, malformed URLs, credentials, and long URLs", () => {
  const rejected = [
    "not-a-url", "javascript:alert(1)", "data:text/html,hello",
    "file:///etc/passwd", "ftp://example.com", "mailto:test@example.com",
    "tel:123", "http:example.com", "https://user:password@example.com",
    `https://example.com/${"a".repeat(2200)}`,
  ];
  for (const value of rejected) assert.equal(normalizeUrl(value), null, value.slice(0, 30));
});

test("codes are seven alphanumeric characters", () => {
  for (let i = 0; i < 1000; i++) {
    assert.match(generateCode(), /^[a-zA-Z0-9]{7}$/);
  }
});

test("retries a database unique-constraint collision", async () => {
  const tried = [];
  const duplicate = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    { code: "P2002", clientVersion: "6.19.3" },
  );
  const codes = ["aB72xQ1", "9Kx31Lm"];
  const result = await createWithUniqueCode(
    async (code) => {
      tried.push(code);
      if (tried.length === 1) throw duplicate;
      return { shortCode: code };
    },
    () => codes.shift(),
  );
  assert.deepEqual(tried, ["aB72xQ1", "9Kx31Lm"]);
  assert.equal(result.shortCode, "9Kx31Lm");
});

test("does not retry errors other than a collision", async () => {
  let calls = 0;
  await assert.rejects(
    createWithUniqueCode(async () => {
      calls++;
      throw new Error("database unavailable");
    }),
    /database unavailable/,
  );
  assert.equal(calls, 1);
});

test("ten requests per IP are allowed; the eleventh is blocked until the hour resets", () => {
  const allow = createRateLimiter(10, 60 * 60 * 1000);
  for (let i = 0; i < 10; i++) assert.equal(allow("ip-a", 1000 + i), true);
  assert.equal(allow("ip-a", 1010), false);
  assert.equal(allow("ip-b", 1010), true);
  assert.equal(allow("ip-a", 3_600_999), false);
  assert.equal(allow("ip-a", 3_601_000), true);
});
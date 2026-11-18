const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "CommonJS",
  moduleResolution: "Node",
});
require("ts-node/register/transpile-only");

const { isDatabaseId } = require("../src/lib/database-id.ts");

describe("isDatabaseId", () => {
  it("accepts existing Mongo ObjectIds and Prisma string IDs", () => {
    assert.equal(isDatabaseId("507f1f77bcf86cd799439011"), true);
    assert.equal(isDatabaseId("cm8abc1230000xyz987654321"), true);
  });

  it("rejects empty, non-string, oversized, and unsafe identifiers", () => {
    assert.equal(isDatabaseId(""), false);
    assert.equal(isDatabaseId(null), false);
    assert.equal(isDatabaseId("x".repeat(65)), false);
    assert.equal(isDatabaseId("id/with/slash"), false);
  });
});

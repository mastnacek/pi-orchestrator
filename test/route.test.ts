import test from "node:test";
import assert from "node:assert/strict";
import { findUmaBinary } from "../src/shared/uma_client.ts";

test("findUmaBinary finds uma executable or resolves to binary name", () => {
  const bin = findUmaBinary();
  assert.ok(bin.length > 0);
  assert.ok(bin.toLowerCase().includes("uma"));
});

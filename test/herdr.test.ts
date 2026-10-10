import test from "node:test";
import assert from "node:assert/strict";
import { currentPaneId, isHerdrActive, promptAgent } from "../src/shared/herdr_client.ts";

test("herdr detection reads environment variables", () => {
  const origEnv = process.env.HERDR_ENV;
  const origPane = process.env.HERDR_PANE_ID;

  try {
    process.env.HERDR_ENV = "1";
    process.env.HERDR_PANE_ID = "pane_123";

    assert.equal(isHerdrActive(), true);
    assert.equal(currentPaneId(), "pane_123");
  } finally {
    process.env.HERDR_ENV = origEnv;
    process.env.HERDR_PANE_ID = origPane;
  }
});

test("promptAgent forbids self-delegation (recursion guard)", async () => {
  const origPane = process.env.HERDR_PANE_ID;
  try {
    process.env.HERDR_PANE_ID = "test_self_pane";

    await assert.rejects(
      async () => {
        await promptAgent("test_self_pane", "do something");
      },
      /Recursion prevented/
    );
  } finally {
    process.env.HERDR_PANE_ID = origPane;
  }
});

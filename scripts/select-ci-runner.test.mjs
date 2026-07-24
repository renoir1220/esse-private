import assert from "node:assert/strict";
import test from "node:test";
import { selectRunner } from "./select-ci-runner.mjs";

const defaults = {
  runnerLabel: "esse-private-windows-x64",
  selfHostedRunsOn: ["self-hosted", "esse-private-windows-x64"],
  hostedRunsOn: "windows-latest"
};

test("explicit self mode does not depend on runner discovery", () => {
  assert.deepEqual(
    selectRunner({ ...defaults, mode: "self" }),
    {
      runsOn: ["self-hosted", "esse-private-windows-x64"],
      selection: "self",
      reason: "self-hosted runner was explicitly requested"
    }
  );
});

test("explicit hosted mode does not depend on runner discovery", () => {
  assert.deepEqual(
    selectRunner({ ...defaults, mode: "hosted" }),
    {
      runsOn: "windows-latest",
      selection: "hosted",
      reason: "GitHub-hosted runner was explicitly requested"
    }
  );
});

test("auto mode selects an online runner with the required label", () => {
  const result = selectRunner({
    ...defaults,
    mode: "auto",
    runners: [
      {
        name: "windows-runner",
        status: "online",
        busy: false,
        labels: [{ name: "esse-private-windows-x64" }]
      }
    ]
  });

  assert.equal(result.selection, "self");
  assert.deepEqual(result.runsOn, defaults.selfHostedRunsOn);
});

test("auto mode keeps an online busy runner instead of spending hosted minutes", () => {
  const result = selectRunner({
    ...defaults,
    mode: "auto",
    runners: [
      {
        name: "windows-runner",
        status: "online",
        busy: true,
        labels: [{ name: "esse-private-windows-x64" }]
      }
    ]
  });

  assert.equal(result.selection, "self");
  assert.match(result.reason, /busy/);
});

test("auto mode falls back when the required runner is offline", () => {
  const result = selectRunner({
    ...defaults,
    mode: "auto",
    runners: [
      {
        name: "windows-runner",
        status: "offline",
        busy: false,
        labels: [{ name: "esse-private-windows-x64" }]
      }
    ]
  });

  assert.equal(result.selection, "hosted");
  assert.equal(result.runsOn, "windows-latest");
});

test("invalid mode is rejected", () => {
  assert.throws(
    () => selectRunner({ ...defaults, mode: "unexpected" }),
    /Unsupported runner mode/
  );
});

import { appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const VALID_MODES = new Set(["auto", "self", "hosted"]);

export function selectRunner({
  mode,
  runners = [],
  runnerLabel,
  selfHostedRunsOn,
  hostedRunsOn
}) {
  if (!VALID_MODES.has(mode)) {
    throw new Error(`Unsupported runner mode: ${mode}`);
  }

  if (mode === "self") {
    return {
      runsOn: selfHostedRunsOn,
      selection: "self",
      reason: "self-hosted runner was explicitly requested"
    };
  }

  if (mode === "hosted") {
    return {
      runsOn: hostedRunsOn,
      selection: "hosted",
      reason: "GitHub-hosted runner was explicitly requested"
    };
  }

  const runner = runners.find(
    (candidate) =>
      candidate.status === "online" &&
      candidate.labels?.some((label) => label.name === runnerLabel)
  );

  if (runner) {
    return {
      runsOn: selfHostedRunsOn,
      selection: "self",
      reason: `${runner.name} is online${runner.busy ? " and busy; the job will queue locally" : ""}`
    };
  }

  return {
    runsOn: hostedRunsOn,
    selection: "hosted",
    reason: `no online self-hosted runner has label ${runnerLabel}`
  };
}

async function listRepositoryRunners({ apiUrl, repository, token }) {
  if (!token) {
    throw new Error("runner routing token is unavailable");
  }

  const response = await fetch(
    `${apiUrl}/repos/${repository}/actions/runners?per_page=100`,
    {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2026-03-10"
      }
    }
  );

  if (!response.ok) {
    const requestId = response.headers.get("x-github-request-id");
    throw new Error(
      `runner status request failed with HTTP ${response.status}${requestId ? ` (${requestId})` : ""}`
    );
  }

  const payload = await response.json();
  return payload.runners ?? [];
}

function parseJsonEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return JSON.parse(value);
}

async function main() {
  const mode = process.env.RUNNER_MODE || "auto";
  const runnerLabel = process.env.RUNNER_LABEL;
  const outputPrefix = process.env.OUTPUT_PREFIX;
  const outputFile = process.env.GITHUB_OUTPUT;
  const selfHostedRunsOn = parseJsonEnvironment("SELF_HOSTED_RUNS_ON_JSON");
  const hostedRunsOn = parseJsonEnvironment("HOSTED_RUNS_ON_JSON");

  if (!runnerLabel || !outputPrefix || !outputFile) {
    throw new Error("RUNNER_LABEL, OUTPUT_PREFIX, and GITHUB_OUTPUT are required");
  }

  let runners = [];
  let routingError = null;
  if (mode === "auto") {
    try {
      runners = await listRepositoryRunners({
        apiUrl: process.env.GITHUB_API_URL || "https://api.github.com",
        repository: process.env.GITHUB_REPOSITORY,
        token: process.env.RUNNER_ROUTER_TOKEN
      });
    } catch (error) {
      routingError = error;
    }
  }

  const result = routingError
    ? {
        runsOn: hostedRunsOn,
        selection: "hosted",
        reason: `${routingError.message}; using GitHub-hosted fallback`
      }
    : selectRunner({
        mode,
        runners,
        runnerLabel,
        selfHostedRunsOn,
        hostedRunsOn
      });

  if (routingError) {
    console.log(`::warning::${result.reason}`);
  }

  const lines = [
    `${outputPrefix}_runs_on=${JSON.stringify(result.runsOn)}`,
    `${outputPrefix}_selection=${result.selection}`,
    `${outputPrefix}_reason=${result.reason}`
  ];
  await appendFile(outputFile, `${lines.join("\n")}\n`, "utf8");
  console.log(`${outputPrefix}: ${result.selection} (${result.reason})`);
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

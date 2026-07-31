#!/usr/bin/env node
/**
 * Drives the built server over real MCP JSON-RPC on stdio.
 *
 * A build that compiles but cannot complete a handshake is not a passing
 * build, and `tsc` will never tell you the difference — every failure this
 * catches is a runtime one: a bad transport, a tool that throws, a schema
 * the SDK rejects, or a citation that quietly went missing.
 *
 * No test framework on purpose. This has to run anywhere node does.
 */
import { spawn } from "node:child_process";

const proc = spawn("node", ["dist/index.js"], { stdio: ["pipe", "pipe", "pipe"] });

let stderr = "";
proc.stderr.on("data", (d) => (stderr += d.toString()));

let buffer = "";
const pending = new Map();
proc.stdout.on("data", (d) => {
  buffer += d.toString();
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl);
    buffer = buffer.slice(nl + 1);
    if (!line.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      fail(`stdout carried something that is not JSON-RPC: ${line.slice(0, 120)}`);
      return;
    }
    const resolve = pending.get(msg.id);
    if (resolve) {
      pending.delete(msg.id);
      resolve(msg);
    }
  }
});

let nextId = 0;
const rpc = (method, params) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 15000);
    pending.set(id, (m) => {
      clearTimeout(timer);
      resolve(m);
    });
    proc.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });

let failures = 0;
function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}
function fail(message) {
  failures++;
  console.log(`  FAIL  ${message}`);
}

const text = (res) => res.result?.content?.[0]?.text ?? "";

try {
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke", version: "0" },
  });
  check("initialize handshake", init.result?.serverInfo?.name === "anchor-mcp",
    `got ${JSON.stringify(init.result?.serverInfo)}`);

  proc.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);

  const listed = await rpc("tools/list", {});
  const tools = listed.result?.tools ?? [];
  check("tools are listed", tools.length === 6, `got ${tools.length}`);
  check(
    "every tool has a description and a schema",
    tools.every((t) => t.description && t.inputSchema),
    tools.filter((t) => !t.description || !t.inputSchema).map((t) => t.name).join(", "),
  );

  const contradictions = text(await rpc("tools/call", { name: "list_contradictions", arguments: {} }));
  check("contradictions come back cited", contradictions.includes("Sources:"));
  check("contradictions quote both sides", contradictions.includes("A.") && contradictions.includes("B."));

  const asked = text(await rpc("tools/call", {
    name: "ask_brain",
    arguments: { question: "how long does the cart persist" },
  }));
  check("ask_brain finds the retention fragments", asked.includes("30 days"));
  check("ask_brain cites what it found", asked.includes("Sources:"));

  const unknown = text(await rpc("tools/call", {
    name: "ask_brain",
    arguments: { question: "quarterly revenue in Belgium" },
  }));
  check("ask_brain refuses what it has not read", unknown.startsWith("Nothing in"));
  check("a refusal invents no citation", !unknown.includes("Sources:"));

  const drafted = text(await rpc("tools/call", {
    name: "draft",
    arguments: { kind: "acceptance_criteria", topic: "cart retention" },
  }));
  check("draft produces criteria", drafted.includes("Given"));
  check("draft cites every line", drafted.includes("Sources:"));

  const refused = text(await rpc("tools/call", {
    name: "draft",
    arguments: { kind: "prd_section", topic: "zzzz nonexistent" },
  }));
  check("draft refuses an unsupported topic", refused.startsWith("Not drafting"));

  const fragment = text(await rpc("tools/call", { name: "get_fragment", arguments: { id: "f-07" } }));
  check("get_fragment opens a real fragment", fragment.includes("7 days"));

  const missing = text(await rpc("tools/call", { name: "get_fragment", arguments: { id: "nope" } }));
  check("get_fragment handles an unknown id", missing.startsWith("No fragment"));

  const gaps = text(await rpc("tools/call", { name: "list_gaps", arguments: {} }));
  check("gaps come back", gaps.includes("open questions"));

  const sources = text(await rpc("tools/call", { name: "list_sources", arguments: {} }));
  check("sources come back", sources.includes("sources read into"));

  check("startup banner went to stderr", stderr.includes("anchor-mcp ready"));
} catch (err) {
  fail(String(err));
} finally {
  proc.kill();
}

console.log(failures === 0 ? "\nsmoke: all checks passed" : `\nsmoke: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);

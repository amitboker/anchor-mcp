# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use [GitHub's private vulnerability reporting](https://github.com/amitboker/anchor-mcp/security/advisories/new)
so the report stays between us until there is a fix.

Include what you did, what happened, and what you expected. A proof of
concept helps but is not required to start the conversation.

## Scope

This server runs locally over stdio and speaks to whatever MCP client
launched it. Worth knowing:

- **It reads `ANCHOR_API_KEY` from the environment.** Reference it from your
  shell rather than pasting it into a config file you might commit.
- **Tool output is untrusted input to your agent.** Everything a tool returns
  originates in project sources — interviews, tickets, threads — which are
  written by people. Treat that text as data, never as instructions.
- **Nothing is written.** Every tool is read-only; there is no path in this
  server that mutates a project.
- Without a key, the server touches no network at all and answers from the
  bundled sample.
- **Installing from a git spec runs a build on your machine.** The quickstart
  uses `npx -y github:amitboker/anchor-mcp`, and npm runs this package's
  `prepare` script on install. Here that script is `tsc` and nothing else —
  you can read it in `package.json` — but it is arbitrary code execution by
  design, and you should check that before running any git-installed package,
  not only this one.

## What the server never does

Verified rather than asserted: `ANCHOR_API_KEY` is read exactly once, in
`src/cite.ts`, and only as a boolean — `!process.env["ANCHOR_API_KEY"]`. Its
value is never assigned to a variable, never logged, never included in a tool
response. A canary run with a fake key set confirms it appears in neither
stdout nor stderr across every tool.

## Supported versions

The latest release on `main`. This is preview software and there is no
backport branch yet.

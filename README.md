<img src="https://raw.githubusercontent.com/amitboker/anchor-mcp/main/.github/assets/banner.jpg" alt="Anchor MCP — ask your product's own history, get answers that cite their sources." width="100%">

[![CI](https://github.com/amitboker/anchor-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/amitboker/anchor-mcp/actions/workflows/ci.yml)
[![MCP](https://img.shields.io/badge/MCP-server-0d0d12)](https://modelcontextprotocol.io)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-0d0d12)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-0d0d12)](./LICENSE)

Anchor reads a team's interviews, tickets and docs and builds a model of the
product — the decisions, the contradictions, and everything nobody has
answered. This is that model, exposed to your agent over the Model Context
Protocol.

Six tools. All six return the fragments an answer came from, because an
answer you cannot check is a guess with better formatting.

---

## Quickstart

Runs with no account, no key and no network, against a bundled sample
project. Pick your client:

**Claude Code**

```bash
claude mcp add anchor -- npx -y github:amitboker/anchor-mcp
```

**Claude Desktop** — `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "anchor": {
      "command": "npx",
      "args": ["-y", "github:amitboker/anchor-mcp"]
    }
  }
}
```

**Cursor** — `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "anchor": {
      "command": "npx",
      "args": ["-y", "github:amitboker/anchor-mcp"]
    }
  }
}
```

**VS Code**

```bash
code --add-mcp '{"name":"anchor","command":"npx","args":["-y","github:amitboker/anchor-mcp"]}'
```

Restart the client afterwards — all of them read MCP config at boot.

> Not on npm yet, so the specs above install from this repository. `npx`
> builds it on first run, which takes a few seconds once and is cached
> after that.

---

## Tools

| Tool                  | What it does                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `ask_brain`           | Ask a question about the product. Returns the fragments that bear on it, each with its source. |
| `list_contradictions` | Statements that cannot both be true, both sides quoted, and the question that resolves each.   |
| `list_gaps`           | Questions no source answers, who can answer them, and what they block.                          |
| `list_sources`        | Everything the brain has read, and how many fragments came out of each.                         |
| `get_fragment`        | Open one fragment by id — full text and where it sits in its source.                            |
| `draft`               | A PRD section, user stories or acceptance criteria, every line traced to a fragment.            |

### What comes back

```
$ list_contradictions

3 contradictions in checkout-redesign.

## Cart retention window  (c-01)

A. The cart persists for 30 days on an unauthenticated session.
   — prd-checkout-v3 · §3.1 (PRD — Checkout redesign, v3)

B. Unauthenticated carts must expire within 7 days.
   — sec-review-q2 · Findings, item 4 (Security review — payments surface)

→ Does guest checkout keep a 30-day cart and require an identity, or drop
  to a 7-day window and stay anonymous?
```

Two documents, four months apart, in two different tools. Neither author was
wrong. Nobody was going to notice.

### Two things it will not do

It does not answer what it has not read:

```
$ ask_brain "quarterly revenue in Belgium"

Nothing in checkout-redesign answers that.
```

And it does not draft without sources:

```
$ draft --kind prd_section --topic "offline sync"

Not drafting "offline sync" — nothing in checkout-redesign supports it.
```

Both are the product working. A tool that fills a gap it cannot see the
bottom of is the failure mode this exists to remove.

---

## Sample data, and real projects

Out of the box the server runs on a bundled fixture — a `checkout-redesign`
project with six sources and ten fragments. Every source, quote and person in
it is invented, and every response says so in its footer.

Set `ANCHOR_API_KEY` and the same six tools read a real Project Brain
instead. The output shape does not change; only the data does.

```json
{
  "mcpServers": {
    "anchor": {
      "command": "npx",
      "args": ["-y", "github:amitboker/anchor-mcp"],
      "env": { "ANCHOR_API_KEY": "${ANCHOR_API_KEY}" }
    }
  }
}
```

Reference the variable from your shell rather than pasting a key into a file
you might commit.

> **Status: preview.** The tool surface is stable enough to build against.
> The hosted API behind `ANCHOR_API_KEY` is not open yet — until it is, every
> answer comes from the sample project.

---

## Development

```bash
npm install
npm run build
npm run inspect
```

`npm run inspect` opens the [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
against your local build, which is the fastest way to see a tool's real
output while changing it.

```
src/
  index.ts    server + tool registration
  tools.ts    tool bodies, callable without a transport
  brain.ts    the sample project
  cite.ts     citation formatting
```

One rule worth knowing before you add a tool: every response goes through
`answer()` in `cite.ts`, and its `cites` argument is a non-empty tuple. An
uncited answer is a type error rather than a matter of discipline — which is
the only way a rule like that survives a deadline.

Logging goes to **stderr, never stdout**. stdout is the JSON-RPC transport,
and one stray `console.log` on it corrupts the stream and takes the session
with it.

---

## Links

- [Anchor](https://cortex-discovery.vercel.app) — the product
- [Model Context Protocol](https://modelcontextprotocol.io) — the spec
- [Security policy](./SECURITY.md) · [Contributing](./CONTRIBUTING.md)

## License

MIT — see [LICENSE](./LICENSE).

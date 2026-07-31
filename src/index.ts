#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { PROJECT } from "./brain.js";
import {
  askBrain,
  draft,
  getFragment,
  listContradictions,
  listGaps,
  listSources,
  summary,
} from "./tools.js";

/**
 * Anchor MCP — the Project Brain, over stdio.
 *
 * Five tools, and the shape of all five is the same: a question in, an
 * answer out, and the sources it came from attached. That is not a feature
 * of this server, it is the product's one claim, so `src/cite.ts` makes an
 * uncited answer a type error rather than a matter of discipline.
 *
 * Runs with no account and no network against a bundled sample project.
 * Set ANCHOR_API_KEY to point the same tools at a real one.
 */

const server = new McpServer({
  name: "anchor-mcp",
  version: "0.1.0",
});

server.registerTool(
  "ask_brain",
  {
    title: "Ask the Project Brain",
    description:
      "Ask a question about the product's own history — decisions, constraints, what customers said — and get the fragments that bear on it, each with the source it came from. Returns 'nothing answers that' rather than guessing when the brain has not read it.",
    inputSchema: {
      question: z.string().min(3).describe("A question about the product, in plain language."),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum fragments to return. Default 5."),
    },
  },
  async ({ question, limit }) => ({
    content: [{ type: "text", text: askBrain(question, limit ?? 5) }],
  }),
);

server.registerTool(
  "list_contradictions",
  {
    title: "List contradictions",
    description:
      "Statements in the project's sources that cannot both be true, with both sides quoted and the question somebody has to answer to resolve each one. This is usually the highest-value call: contradictions are what a person cannot hold in their head across six tools.",
    inputSchema: {},
  },
  async () => ({ content: [{ type: "text", text: listContradictions() }] }),
);

server.registerTool(
  "list_gaps",
  {
    title: "List open questions",
    description:
      "Questions no source answers, with the role that can answer each and what it blocks. Deliberately returns no citations — there is nothing to cite, which is the point.",
    inputSchema: {},
  },
  async () => ({ content: [{ type: "text", text: listGaps() }] }),
);

server.registerTool(
  "list_sources",
  {
    title: "List sources",
    description:
      "Everything the brain has read for this project — interviews, PRDs, tickets, threads, docs — with how many fragments came out of each. Use it to see what an answer could possibly be based on before you trust one.",
    inputSchema: {},
  },
  async () => ({ content: [{ type: "text", text: listSources() }] }),
);

server.registerTool(
  "get_fragment",
  {
    title: "Get a source fragment",
    description:
      "Fetch one fragment by id with its full text and where it sits in its source. Every other tool cites fragment ids; this is how you open one.",
    inputSchema: {
      id: z.string().describe("A fragment id, e.g. f-04."),
    },
  },
  async ({ id }) => ({ content: [{ type: "text", text: getFragment(id) }] }),
);

server.registerTool(
  "draft",
  {
    title: "Draft from sources",
    description:
      "Draft a PRD section, user stories or acceptance criteria for a topic, with every line traced to the fragment behind it and the open questions listed underneath. Refuses to draft when no source supports the topic.",
    inputSchema: {
      kind: z
        .enum(["prd_section", "user_stories", "acceptance_criteria"])
        .describe("What to produce."),
      topic: z.string().min(3).describe("The topic to draft, e.g. 'cart retention'."),
    },
  },
  async ({ kind, topic }) => ({
    content: [{ type: "text", text: draft(kind, topic) }],
  }),
);

async function main() {
  await server.connect(new StdioServerTransport());
  /* stderr, never stdout — stdout is the transport, and a stray log line on
     it corrupts the JSON-RPC stream and takes the whole session with it. */
  process.stderr.write(`anchor-mcp ready · ${summary()}\n`);
}

main().catch((err) => {
  process.stderr.write(`anchor-mcp failed to start: ${String(err)}\n`);
  process.exit(1);
});

export { PROJECT };

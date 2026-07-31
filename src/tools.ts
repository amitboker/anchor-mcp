import {
  CONTRADICTIONS,
  FRAGMENTS,
  GAPS,
  PROJECT,
  SOURCES,
  fragmentById,
  sourceById,
} from "./brain.js";
import { answer, fragmentLine, quote, ref } from "./cite.js";

/**
 * Tool bodies, kept out of the server wiring so they are ordinary functions
 * you can call from a test or a script without standing up a transport.
 */

/** Naive scoring: every query term that appears earns a point, and a hit in
 *  the source title is worth less than a hit in the text. Good enough to be
 *  useful over a fixture, and honest about being a placeholder for the real
 *  retrieval that runs behind the API. */
function search(query: string, limit: number) {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);

  return FRAGMENTS.map((f) => {
    const hay = f.text.toLowerCase();
    const title = (sourceById(f.sourceId)?.title ?? "").toLowerCase();
    const score = terms.reduce(
      (n, t) => n + (hay.includes(t) ? 2 : 0) + (title.includes(t) ? 1 : 0),
      0,
    );
    return { f, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.f);
}

export function askBrain(question: string, limit = 5): string {
  const hits = search(question, limit);

  if (hits.length === 0) {
    return [
      `Nothing in ${PROJECT} answers that.`,
      "",
      "That is a real result, not an error — the brain reports what it does not",
      "have rather than filling the gap. Try `list_gaps` to see what is already",
      "known to be unanswered, or `list_sources` for what has been read.",
    ].join("\n");
  }

  const first = hits[0]!;
  const rest = hits.slice(1);

  return answer(
    [
      `${hits.length} fragment${hits.length === 1 ? "" : "s"} in ${PROJECT} bear on that:`,
      "",
      hits.map(fragmentLine).join("\n\n"),
    ].join("\n"),
    [first.id, ...rest.map((f) => f.id)],
  );
}

export function listContradictions(): string {
  const body = CONTRADICTIONS.map((c) => {
    const [a, b] = c.sides;
    return [
      `## ${c.topic}  (${c.id})`,
      "",
      `A. ${a.claim}`,
      `   ${quote(a.fragmentId).split("\n")[1]!.trim()}`,
      "",
      `B. ${b.claim}`,
      `   ${quote(b.fragmentId).split("\n")[1]!.trim()}`,
      "",
      `→ ${c.question}`,
    ].join("\n");
  }).join("\n\n---\n\n");

  const cites = CONTRADICTIONS.flatMap((c) => c.sides.map((s) => s.fragmentId));
  return answer(
    `${CONTRADICTIONS.length} contradictions in ${PROJECT}.\n\n${body}`,
    cites as [string, ...string[]],
  );
}

export function listGaps(): string {
  const body = GAPS.map(
    (g) => `[${g.id}] ${g.question}\n  owner: ${g.owner}\n  blocks: ${g.blocks}`,
  ).join("\n\n");

  return [
    `${GAPS.length} open questions in ${PROJECT}.`,
    "",
    body,
    "",
    "These are unanswered by every source that has been read. They carry no",
    "citations because there is nothing to cite — that is the point of them.",
  ].join("\n");
}

export function listSources(): string {
  const body = SOURCES.map((s) => {
    const n = FRAGMENTS.filter((f) => f.sourceId === s.id).length;
    return `${s.id.padEnd(18)} ${s.kind.padEnd(11)} ${s.date}  ${n} fragment${n === 1 ? "" : "s"}\n  ${s.title}`;
  }).join("\n\n");

  return `${SOURCES.length} sources read into ${PROJECT}.\n\n${body}`;
}

export function getFragment(id: string): string {
  const f = fragmentById(id);
  if (!f) {
    const known = FRAGMENTS.map((x) => x.id).join(", ");
    return `No fragment ${id}. Known ids: ${known}`;
  }
  const s = sourceById(f.sourceId);
  return answer(
    [
      `${f.text}`,
      "",
      `source:   ${s?.title ?? f.sourceId}`,
      `kind:     ${s?.kind ?? "unknown"}`,
      `recorded: ${s?.date ?? "unknown"}`,
      `at:       ${f.at}`,
    ].join("\n"),
    [f.id],
  );
}

export type DraftKind = "prd_section" | "user_stories" | "acceptance_criteria";

export function draft(kind: DraftKind, topic: string): string {
  const hits = search(topic, 4);
  if (hits.length === 0) {
    return [
      `Not drafting "${topic}" — nothing in ${PROJECT} supports it.`,
      "",
      "This is the refusal working as intended. A draft with no sources behind",
      "it is the thing this server exists to avoid; ask about something the",
      "brain has read, or add the source first.",
    ].join("\n");
  }

  const ids = hits.map((h) => h.id) as [string, ...string[]];
  const open = GAPS.slice(0, 2);

  const bodies: Record<DraftKind, string> = {
    prd_section: [
      `### ${topic}`,
      "",
      ...hits.map((h, i) => `${i + 1}. ${h.text}  [${h.id}]`),
      "",
      "**Open before this ships**",
      ...open.map((g) => `- ${g.question} (${g.owner})`),
    ].join("\n"),

    user_stories: hits
      .map(
        (h, i) =>
          `${i + 1}. As a customer, I need ${h.text.replace(/\.$/, "").toLowerCase()}, so the checkout does not lose my intent.  [${h.id}]`,
      )
      .join("\n"),

    acceptance_criteria: hits
      .map((h, i) => `${i + 1}. Given the case in [${h.id}], when it occurs, then: ${h.text}`)
      .join("\n"),
  };

  return answer(bodies[kind], ids);
}

/** Exposed for the server's resource listing and for tests. */
export const summary = () =>
  `${PROJECT}: ${SOURCES.length} sources, ${FRAGMENTS.length} fragments, ` +
  `${CONTRADICTIONS.length} contradictions, ${GAPS.length} open questions.`;

export { ref };

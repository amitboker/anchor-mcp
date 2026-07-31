import { fragmentById, sourceById, type Fragment } from "./brain.js";

/**
 * Citation formatting, in one place.
 *
 * Anchor's whole claim is that an answer arrives with the source it came
 * from, so a tool here that returns prose without citations is not a
 * shortcut — it is the one thing this server must not do. Every tool
 * response goes through `answer()` below, which will not let you omit them.
 */

/** `interview-12 · 12:04` — enough to open the source and find the line. */
export function ref(fragmentId: string): string {
  const f = fragmentById(fragmentId);
  if (!f) return `<unknown fragment ${fragmentId}>`;
  const s = sourceById(f.sourceId);
  return `${f.sourceId} · ${f.at}${s ? ` (${s.title})` : ""}`;
}

export function quote(fragmentId: string): string {
  const f = fragmentById(fragmentId);
  if (!f) return `<unknown fragment ${fragmentId}>`;
  return `“${f.text}”\n  — ${ref(fragmentId)}`;
}

export function fragmentLine(f: Fragment): string {
  return `[${f.id}] ${f.text}\n  — ${ref(f.id)}`;
}

/**
 * Whether the data behind this process is a real project or the bundled
 * sample. Read once at call time rather than at import, so a test can set
 * the variable and see it take effect.
 */
export const isSample = () => !process.env["ANCHOR_API_KEY"];

const SAMPLE_NOTE =
  "Sample project. This server is running on the bundled `checkout-redesign` fixture — " +
  "set ANCHOR_API_KEY to read a real Project Brain. Every citation above points into the sample.";

/**
 * The single exit point for every tool.
 *
 * `cites` is required and must be non-empty. That is deliberate: it makes
 * an uncited answer a type error rather than a judgement call, which is the
 * only way a rule like this survives contact with a deadline.
 */
export function answer(body: string, cites: [string, ...string[]]): string {
  const sources = cites.map((c) => `  • ${ref(c)}`).join("\n");
  return [body.trim(), "", "Sources:", sources, "", `— ${isSample() ? SAMPLE_NOTE : "Live project."}`].join("\n");
}

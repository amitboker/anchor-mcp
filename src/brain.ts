/**
 * A sample Project Brain.
 *
 * ⚠️  This is fixture data. Every source, fragment and person below is
 * invented, and the server says so in the footer of every response it
 * returns. It exists so the tools are exercisable the moment you install
 * them — `npx anchor-mcp` works with no account, no key and no network.
 *
 * When `ANCHOR_API_KEY` is set, the same tools read a real project instead.
 * The shapes below are the contract they read against, so nothing about a
 * tool's output changes when the data becomes real — only the data does.
 */

export type SourceKind =
  | "interview"
  | "transcript"
  | "prd"
  | "ticket"
  | "slack"
  | "doc";

export type Source = {
  id: string;
  kind: SourceKind;
  title: string;
  date: string;
};

export type Fragment = {
  id: string;
  sourceId: string;
  /** Where in the source this sits — a timestamp, a heading, a message. */
  at: string;
  text: string;
};

export type Contradiction = {
  id: string;
  topic: string;
  /** The two statements that cannot both be true. */
  sides: [{ claim: string; fragmentId: string }, { claim: string; fragmentId: string }];
  /** What somebody has to decide to resolve it. */
  question: string;
};

export type Gap = {
  id: string;
  question: string;
  /** The role that can answer it, not a name — names go stale. */
  owner: string;
  blocks: string;
};

export const PROJECT = "checkout-redesign";

export const SOURCES: Source[] = [
  { id: "interview-12", kind: "interview", title: "Customer interview — enterprise buyer", date: "2026-03-04" },
  { id: "interview-19", kind: "interview", title: "Customer interview — SMB, high churn", date: "2026-03-18" },
  { id: "prd-checkout-v3", kind: "prd", title: "PRD — Checkout redesign, v3", date: "2026-03-27" },
  { id: "sec-review-q2", kind: "doc", title: "Security review — payments surface", date: "2026-06-02" },
  { id: "slack-payments", kind: "slack", title: "#payments — cart persistence thread", date: "2026-06-11" },
  { id: "chk-318", kind: "ticket", title: "CHK-318 — Guest checkout, cart retention", date: "2026-09-09" },
];

export const FRAGMENTS: Fragment[] = [
  {
    id: "f-01",
    sourceId: "interview-12",
    at: "12:04",
    text: "We abandon the basket constantly because the session dies overnight. If I price something up on Friday I want it there on Monday.",
  },
  {
    id: "f-02",
    sourceId: "interview-12",
    at: "18:31",
    text: "Making an account before I know the total is the thing that loses us. Let me get to a number first.",
  },
  {
    id: "f-03",
    sourceId: "interview-19",
    at: "07:52",
    text: "Half our failed payments are soft declines. The customer thinks they have been charged twice and calls support.",
  },
  {
    id: "f-04",
    sourceId: "prd-checkout-v3",
    at: "§3.1",
    text: "Guest checkout must persist the cart for 30 days from last interaction.",
  },
  {
    id: "f-05",
    sourceId: "prd-checkout-v3",
    at: "§3.2",
    text: "Payment retry on soft decline, maximum 2 attempts, with a visible reason shown to the customer.",
  },
  {
    id: "f-06",
    sourceId: "prd-checkout-v3",
    at: "§5",
    text: "Offline mode is out of scope for this release.",
  },
  {
    id: "f-07",
    sourceId: "sec-review-q2",
    at: "Findings, item 4",
    text: "Cart contents held against an unauthenticated session must expire within 7 days. Anything longer requires an authenticated identity.",
  },
  {
    id: "f-08",
    sourceId: "slack-payments",
    at: "11 Jun, 14:22",
    text: "Nobody can find where the 30 days came from. It has been in the doc since v1 and the person who wrote it has left.",
  },
  {
    id: "f-09",
    sourceId: "slack-payments",
    at: "11 Jun, 14:41",
    text: "It came out of the March interview — the Friday-to-Monday thing. It was never meant to survive a security review unchanged.",
  },
  {
    id: "f-10",
    sourceId: "chk-318",
    at: "Description",
    text: "Blocked: retention window is contested. Need a decision before the auth work can be sequenced.",
  },
];

export const CONTRADICTIONS: Contradiction[] = [
  {
    id: "c-01",
    topic: "Cart retention window",
    sides: [
      { claim: "The cart persists for 30 days on an unauthenticated session.", fragmentId: "f-04" },
      { claim: "Unauthenticated carts must expire within 7 days.", fragmentId: "f-07" },
    ],
    question:
      "Does guest checkout keep a 30-day cart and require an identity, or drop to a 7-day window and stay anonymous?",
  },
  {
    id: "c-02",
    topic: "Offline mode",
    sides: [
      { claim: "Offline mode is out of scope for this release.", fragmentId: "f-06" },
      { claim: "Customers describe an offline-shaped need — a basket that survives a closed laptop.", fragmentId: "f-01" },
    ],
    question:
      "Is the Friday-to-Monday basket an offline requirement, or is it satisfied by server-side retention alone?",
  },
  {
    id: "c-03",
    topic: "Where the 30 days came from",
    sides: [
      { claim: "The 30-day figure has no recorded origin.", fragmentId: "f-08" },
      { claim: "It came from the March interview and was never re-tested.", fragmentId: "f-09" },
    ],
    question:
      "Is 30 days a researched number or an inherited one? If inherited, it should not outrank the security finding.",
  },
];

export const GAPS: Gap[] = [
  {
    id: "g-01",
    question: "What does the customer see when the second retry fails?",
    owner: "Product, with support input",
    blocks: "Acceptance criteria for §3.2",
  },
  {
    id: "g-02",
    question: "Does an authenticated identity satisfy the security finding, or is 7 days absolute?",
    owner: "Security",
    blocks: "The whole retention decision, and CHK-318 behind it",
  },
  {
    id: "g-03",
    question: "Is a soft decline shown as a failure or as a pending state?",
    owner: "Design",
    blocks: "Copy and the error surface",
  },
  {
    id: "g-04",
    question: "Who owns the retry policy once it ships — payments or checkout?",
    owner: "Engineering leadership",
    blocks: "On-call routing, not the release",
  },
];

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
export const fragmentById = (id: string) => FRAGMENTS.find((f) => f.id === id);

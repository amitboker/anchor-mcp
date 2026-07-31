# Contributing

Thanks for looking. This is a small server and the bar for a change is
correspondingly simple: it should make an answer easier to check.

## Getting set up

```bash
npm install
npm run build
npm run inspect
```

The Inspector is the fastest loop — it shows a tool's real output while you
change it, which is more useful than reading the JSON.

## The one rule

Every tool response goes through `answer()` in `src/cite.ts`, and its
`cites` argument is a non-empty tuple. That is deliberate. Anchor's whole
claim is that an answer arrives with the source it came from, so an uncited
answer is a type error here rather than a matter of anyone's discipline.

If a response genuinely has nothing to cite — `list_gaps` is the honest case,
because a gap is defined by the absence of a source — say so in the body and
skip `answer()`. Do not invent a citation to satisfy the signature.

## Adding a tool

1. Write the body in `src/tools.ts` as an ordinary function. It should be
   callable from a script without standing up a transport.
2. Register it in `src/index.ts` with a description written for a model,
   not for a human skimming a table: say what it returns, and say what it
   does when it cannot answer.
3. Run `npm run typecheck` and drive it once through the Inspector.

## Logging

**stderr, never stdout.** stdout is the JSON-RPC transport. One stray
`console.log` corrupts the stream and takes the session with it.

## Style

- `npm run typecheck` is clean, with `noUnusedLocals` and
  `noUncheckedIndexedAccess` on. Keep it that way.
- Comments explain the decision, not the syntax — why the threshold is what
  it is, what was tried and dropped.
- Plain, declarative copy in tool descriptions. No adjectives a product
  manager would not use out loud.

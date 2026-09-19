# CLAUDE.md — governance for `crypto-bros-tokens`

This file tells any agent (or human) working in this repository how to change design tokens safely. It
applies to every session opened inside `crypto-bros-tokens`, regardless of who or what is driving it.

## Source of truth

`tokens/**/*.json` is the **only** source of truth for this repository. Everything else is derived:

- `dist/` (`tokens.css`, `tokens.ts`, `tokens.js`, `tokens.d.ts`, `tokens.json`) is build output.
- `Sources/CryptoBrosTokens/Generated/Tokens.swift` is build output.

**Never hand-edit generated files.** CI runs `npm run check:dist`, which does a `git diff --exit-code` on
`dist/` and `Sources/**/Generated/` after a fresh build. A hand-edit — or a token change that wasn't
followed by a rebuild — fails the build. If you need a different output shape, change the format code under
`formats/`, not the generated artifact.

## How to add a token

1. Check `tokens/primitive/*.json` first. If the raw value you need already exists as a primitive, **alias
   it** (`"{color.primitive.orange.500}"`) instead of writing a new literal.
2. Add the token under the right semantic category, with:
   - `$type` (inherited from a parent object is fine, but every leaf must resolve to one),
   - `$value`,
   - a `$description` that says **why the token exists and who uses it** (not just what the color looks
     like). Future readers — human or agent — should be able to tell whether it's safe to change or delete.
3. If the token needs a dark-mode value, put it on the same token via
   `"$extensions": { "com.cryptobros.modes": { "dark": <literal-or-alias> } }`. Do not create a second,
   parallel token for the dark value. Tokens with no dark entry are mode-invariant.
4. Run the full local check before committing:
   - `npm run build` (regenerates `dist/` and `Sources/**/Generated/Tokens.swift`)
   - `npm run validate`
   - `npm run check:contrast`
5. Add a line under `## [Unreleased]` in `CHANGELOG.md` describing the change.
6. Commit the token JSON and the regenerated build output **in the same commit**. Never split them across
   commits — a commit that changes `tokens/` without the matching `dist/`/`Generated/` diff is exactly what
   `check:dist` exists to catch.

## Semver policy

- **MAJOR** — removing or renaming a token (any consumer reading the old name breaks).
- **MINOR** — adding a new token, or changing the visible value of an existing one (new capability or a
  visible design change, but nothing breaks structurally).
- **PATCH** — documentation or tooling changes only (no token value or shape changes).

## What does NOT belong in tokens

- **Runtime-derived values** — device corner radius, safe-area insets, anything computed from the host
  environment at runtime. These are not design decisions; they stay in the consumer.
- **Screen choreography** — feed stagger timings, entrance animation presets, and other per-screen sequencing
  values. `motion.duration`, `motion.spring`, etc. are shared primitives; how a specific screen sequences them
  is not.

If you're unsure whether a value is a token or a runtime/choreography detail, ask: "would a second consumer
plausibly want the exact same value?" If the answer is no, it doesn't belong here.

## Consumer-only leftovers

Some values only ever apply to one consumer (e.g. the dashboard's `bgInput`, `warningDark`). These stay local
to that consumer's adapter file, marked with a `// local: not a shared token` comment, until a second
consumer actually needs the same value. Do not promote a single-consumer value into this repository
speculatively.

## Never edit consumer repositories from here

A session opened in `crypto-bros-tokens` must never modify files in `crypto-bros-ios`, `crypto-bros-app`,
`crypto-bros-dashboard`, `crypto-bros-site`, or `crypto-bros-legal`. Each consumer repository bumps its own
pin (SwiftPM version, `package.json` git ref, or jsDelivr URL) independently, in its own repository, in its
own session. This repository's job ends at tagging a release here.

## Two oranges, two meanings

This codebase has two visually similar oranges that must never be conflated:

| Token | Value | Meaning |
|---|---|---|
| `color.accent` | `#F15B24` | Brand/UI accent. Used for buttons, active states, links — anything that is "this app's color." |
| `color.primitive.bitcoin` (aliased as `color.coin.bitcoin`) | `#F7931A` | Bitcoin-the-asset. Used for halving markers, the BTC coin color, the EMA orange, and the Fear & Greed "fear" color. |

If a UI element needs "the brand color," use `color.accent`. If it needs "the color that represents Bitcoin
as an asset" (charts, coin lists, asset-specific indicators), use `color.coin.bitcoin`. Never substitute one
for the other, even though they look similar at a glance — several past bugs in the consumer apps were
exactly this mistake, and part of Day 1's job was fixing accidental uses of the Bitcoin color as a UI accent.

## Language

Everything written into this repository — code, comments, commit messages, documentation, changelog
entries — is in English.

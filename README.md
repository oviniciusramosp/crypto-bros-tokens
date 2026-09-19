# crypto-bros-tokens

`crypto-bros-tokens` is the single source of truth for colors, spacing, radii, typography, and motion shared
across the Crypto Bros products. Five consumers — this iOS app, the Expo Android app, the dashboard, the
website, and the legal page — read from the same token set instead of each defining their own colors,
spacing, and animation values, which previously drifted out of sync (two different "oranges," different
radius scales, different type ramps). Tokens are authored once as DTCG-flavored JSON and built into a Swift
package, a CSS file, a TypeScript module, and a flat JSON file so every consumer can read them in its native
format.

## Consumers

| Consumer | Mechanism | Pin |
|---|---|---|
| iOS (this app) | Xcode → Add Package → `https://github.com/oviniciusramosp/crypto-bros-tokens`, rule **"Up to Next Major"** | `from: "0.1.0"`, later `"1.0.0"` |
| Expo app / dashboard | `npm i github:oviniciusramosp/crypto-bros-tokens#vX.Y.Z` — `dist/` is committed to this repo, so there is no `prepare`/build step on install | bump the `#vX.Y.Z` suffix in `package.json` |
| Site / legal page | Pinned jsDelivr `<link>` to the built CSS: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/oviniciusramosp/crypto-bros-tokens@X.Y.Z/dist/tokens.css">` | exact version in the URL |

Using a plain git URL (instead of an npm registry package) means zero auth to configure anywhere, including
EAS builds.

## Repository structure

```
crypto-bros-tokens/
├─ Package.swift                     # SwiftPM manifest at the repo root
├─ Sources/CryptoBrosTokens/
│  ├─ Generated/Tokens.swift         # GENERATED — CB* enums, do not hand-edit
│  ├─ Support/                       # Dynamic.swift, Fonts.swift, Shapes.swift (hand-written helpers)
│  └─ Resources/Fonts/               # Inter Variable + cryptobros-icons TTFs
├─ tokens/                           # SOURCE OF TRUTH — primitive + semantic token JSON
│  ├─ primitive/                     # color.json, font.json
│  └─ semantic/                      # color.json, color.category.json, color.chart.json, color.coin.json, notion.json
│  spacing.json  radius.json  shadow.json  typography.json  motion.json  opacity.json  zindex.json
├─ formats/                          # Style Dictionary format definitions (swift, css, ts, json-flat)
├─ scripts/                          # build.mjs, validate.mjs, spring.mjs, check-contrast.mjs, ...
├─ dist/                             # GENERATED, committed — tokens.css / tokens.ts / tokens.js / tokens.d.ts / tokens.json
├─ .github/workflows/                # ci.yml, release.yml
└─ config.mjs  package.json  CHANGELOG.md  README.md  CLAUDE.md  LICENSE
```

## Building locally

```bash
npm ci
npm run validate
npm run build
swift build
```

`npm run build` regenerates `dist/` and `Sources/CryptoBrosTokens/Generated/Tokens.swift` from
`tokens/**/*.json`. `swift build` confirms the generated Swift compiles.

## Generated output is committed

`dist/` and `Sources/CryptoBrosTokens/Generated/` are build artifacts, checked into git so that SwiftPM,
jsDelivr, and git-URL npm installs can all read them directly without a build step. They are never
hand-edited: CI runs `npm run check:dist`, which fails the build if the committed output doesn't exactly
match a fresh rebuild from `tokens/`.

## License

MIT — see [LICENSE](./LICENSE).

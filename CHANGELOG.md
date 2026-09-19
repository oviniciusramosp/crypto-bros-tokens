# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-19

### Added

- Initial token set authored as DTCG-flavored JSON under `tokens/`: primitive colors and fonts, and semantic
  color, spacing, radius, typography, motion, opacity, z-index, and shadow tokens. Includes the
  primitive/semantic color trees plus the chart, coin, and Notion palettes.
- `CryptoBrosTokens` Swift package (SwiftPM, iOS 18+) generated from the token set, exposing `CBColor`,
  `CBSpacing`, `CBRadius`, `CBTypography`, `CBMotion`, `CBShadow`, `CBOpacity`, `CBZIndex`, `CBChart`,
  `CBCoin`, and `CBNotion` enums.
- `CBFonts.registerFonts()` to register the bundled fonts at app launch, and
  `RoundedRectangle.cb(_:)` / `View.cbCornerRadius(_:)` shape helpers.
- Bundled fonts: Inter Variable (regular + italic) and the `cryptobros-icons` icon font, shipped as resources
  in `Sources/CryptoBrosTokens/Resources/Fonts/`.

### Notes

- Only the Swift package output ships in this version. CSS, TypeScript, and flat JSON output formats, along
  with the CI/release workflows and the notion/chart/coin token files' full build pipeline, are planned for
  Day 2 (`v0.2.0`) and are not yet part of this release.

[Unreleased]: https://github.com/oviniciusramosp/crypto-bros-tokens/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/oviniciusramosp/crypto-bros-tokens/releases/tag/v0.1.0

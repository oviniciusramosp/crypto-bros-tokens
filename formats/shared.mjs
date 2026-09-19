// Shared helpers used by every custom Style Dictionary format (Swift today; CSS/TS/JSON on Day 2).
//
// SD 5's built-in reference resolution walks the whole token tree — including arbitrary
// `$extensions` data — before formats run, so aliases like `{color.primitive.black}` placed
// under `$extensions["com.cryptobros.modes"].dark` are *usually* already literal strings by the
// time a format sees them. `modeValues()` still calls `resolveReferences` defensively (per the
// plan doc) so this keeps working even if that assumption ever changes; resolving an
// already-resolved literal is a no-op.
import { resolveReferences } from 'style-dictionary/utils';

/**
 * Splits a token into its light/dark pair.
 *
 * `$value` is always the light value (already run through the platform's value transforms).
 * The dark override — if any — lives at `$extensions["com.cryptobros.modes"].dark` and may
 * still be an unresolved alias, so it is resolved against the dictionary here. Tokens without a
 * dark entry are mode-invariant: callers should treat `dark === undefined` as "same as light".
 *
 * @param {import('style-dictionary/types').TransformedToken} token
 * @param {import('style-dictionary/types').Dictionary} dictionary
 * @returns {{ light: unknown, dark: unknown }}
 */
export function modeValues(token, dictionary) {
  const dark = token.$extensions?.['com.cryptobros.modes']?.dark;
  return {
    light: token.$value, // already transformed by the platform
    // `resolveReferences` only knows how to resolve refs inside strings. Composite dark overrides
    // (e.g. a shadow's `{color, offsetX, offsetY, blur}` object) already had any nested `{...}`
    // aliases resolved by Style Dictionary's own resolution pass before formats ever run, so they
    // can be returned as-is here.
    dark:
      dark === undefined || typeof dark !== 'string'
        ? dark
        : resolveReferences(dark, dictionary.unfilteredTokens ?? dictionary.tokens, { usesDtcg: true }),
  };
}

/**
 * Parses a hex (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`) or `rgb()`/`rgba()` color string into
 * `{r,g,b,a}` floats in the 0–1 range, the shape every consumer's dynamic-color helper wants.
 * Returns `null` — never throws — for anything it can't parse so callers can warn and skip a
 * single token instead of crashing the whole build.
 *
 * @param {unknown} value
 * @returns {{ r: number, g: number, b: number, a: number } | null}
 */
export function toRGBA(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();

  let m = /^#([0-9a-f]{3})$/i.exec(v);
  if (m) {
    const [r, g, b] = m[1].split('').map((c) => parseInt(c + c, 16));
    return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
  }

  m = /^#([0-9a-f]{4})$/i.exec(v);
  if (m) {
    const [r, g, b, a] = m[1].split('').map((c) => parseInt(c + c, 16));
    return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
  }

  m = /^#([0-9a-f]{6})$/i.exec(v);
  if (m) {
    const hex = m[1];
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: 1,
    };
  }

  m = /^#([0-9a-f]{8})$/i.exec(v);
  if (m) {
    const hex = m[1];
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }

  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(v);
  if (m) {
    const [, r, g, b, a] = m;
    return {
      r: Number(r) / 255,
      g: Number(g) / 255,
      b: Number(b) / 255,
      a: a === undefined ? 1 : Number(a),
    };
  }

  return null;
}

/**
 * Best-effort numeric coercion for values that may still carry a unit suffix (composite token
 * fields such as `typography.$value.fontSize` or `shadow.$value.x` are never touched by the
 * `dimension/unitless` value transform, since that transform only looks at top-level `$type
 * === 'dimension'` tokens). Returns `null` — never throws — on anything unparsable.
 *
 * @param {unknown} value
 * @returns {number | null}
 */
export function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/**
 * lowerCamel/kebab/snake segment -> UpperCamel, for turning token path segments into Swift
 * enum/type names (e.g. `emaPeriod` -> `EmaPeriod`, `fng` -> `Fng`).
 *
 * @param {string} segment
 * @returns {string}
 */
export function pascalCase(segment) {
  const camel = String(segment).replace(/[-_ ]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
  return camel.length === 0 ? camel : camel.charAt(0).toUpperCase() + camel.slice(1);
}

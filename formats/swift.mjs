// Emits Sources/CryptoBrosTokens/Generated/Tokens.swift from the resolved Style Dictionary.
//
// This walks `dictionary.allTokens` generically (grouping by top-level token-path segment, then
// by `$type`) rather than hardcoding token names, because the exact token set is decided in
// `tokens/**/*.json` by a separate work item and can grow over time. Anything this format
// doesn't understand is skipped with a `stderr` warning instead of crashing the build.
import { modeValues, toRGBA, toNumber, pascalCase } from './shared.mjs';

// Custom $types beyond the DTCG spec ('spring', 'zIndex') are included per the plan doc.
const TYPE_WHITELIST = new Set([
  'color',
  'dimension',
  'duration',
  'number',
  'cubicBezier',
  'shadow',
  'typography',
  'spring',
  'zIndex',
  'fontFamily',
  'fontWeight',
]);

// A conservative set of Swift reserved words/contextual keywords that would otherwise collide
// with a generated identifier (e.g. `motion.press.in`, `motion.press.out`).
const SWIFT_KEYWORDS = new Set([
  'as', 'associatedtype', 'break', 'case', 'catch', 'class', 'continue', 'default', 'defer',
  'deinit', 'do', 'else', 'enum', 'extension', 'fallthrough', 'false', 'fileprivate', 'for',
  'func', 'guard', 'if', 'import', 'in', 'init', 'inout', 'internal', 'is', 'let', 'nil', 'open',
  'operator', 'private', 'protocol', 'public', 'repeat', 'rethrows', 'return', 'self', 'Self',
  'static', 'struct', 'subscript', 'super', 'switch', 'throw', 'throws', 'true', 'try',
  'typealias', 'var', 'where', 'while', 'Any', 'AnyObject', 'Protocol', 'Type', 'associativity',
  'convenience', 'didSet', 'dynamic', 'final', 'get', 'indirect', 'infix', 'lazy', 'left',
  'mutating', 'none', 'nonmutating', 'optional', 'override', 'postfix', 'precedence', 'prefix',
  'required', 'right', 'set', 'unowned', 'weak', 'willSet',
]);

function warn(message) {
  process.stderr.write(`[cb-tokens/swift] warn: ${message}\n`);
}

/** Escapes an identifier so it's always lexically valid Swift, whatever the source JSON key was. */
function protectIdent(raw) {
  let s = String(raw);
  if (/^[0-9]/.test(s)) s = `_${s}`;
  if (SWIFT_KEYWORDS.has(s)) s = `\`${s}\``;
  return s;
}

const safeIdent = protectIdent;
const safeTypeIdent = protectIdent;

/** Formats a number as a Swift literal: integers stay bare, floats trim to `precision` decimals. */
function fmtNum(n, precision = 4) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0';
  if (Number.isInteger(n)) return n === 0 ? '0' : String(n);
  let s = n.toFixed(precision).replace(/0+$/, '').replace(/\.$/, '');
  if (s === '-0') s = '0';
  return s;
}

function fmtRGBA(c) {
  return `(${fmtNum(c.r, 3)}, ${fmtNum(c.g, 3)}, ${fmtNum(c.b, 3)}, ${fmtNum(c.a, 3)})`;
}

function mkNode() {
  return { leaves: [], groups: new Map() };
}

/** Inserts a token into the domain tree at `restPath` (the token's path with the domain prefix stripped). */
function insert(node, restPath, token) {
  if (!restPath || restPath.length === 0) {
    warn(`skipping token '${token.path.join('.')}' — empty path after domain prefix`);
    return;
  }
  if (restPath.length === 1) {
    node.leaves.push({ key: restPath[0], token });
    return;
  }
  const [head, ...tail] = restPath;
  if (!node.groups.has(head)) node.groups.set(head, mkNode());
  insert(node.groups.get(head), tail, token);
}

/** Flattens a whole tree into `{ path, token }` leaves, deepest-first traversal order doesn't matter here. */
function collectLeaves(node, prefix) {
  const out = [];
  for (const { key, token } of node.leaves) out.push({ path: [...prefix, key], token });
  for (const [groupKey, sub] of node.groups) out.push(...collectLeaves(sub, [...prefix, groupKey]));
  return out;
}

function renderColorExpr(token, dictionary) {
  const { light, dark } = modeValues(token, dictionary);
  const l = toRGBA(light);
  if (!l) {
    warn(`skipping color token '${token.path.join('.')}' — unparseable light value ${JSON.stringify(light)}`);
    return null;
  }
  let d = l;
  if (dark !== undefined) {
    const parsedDark = toRGBA(dark);
    if (parsedDark) {
      d = parsedDark;
    } else {
      warn(`token '${token.path.join('.')}' has an unparseable dark value ${JSON.stringify(dark)} — reusing light`);
    }
  }
  return `dyn(${fmtRGBA(l)}, ${fmtRGBA(d)})`;
}

/** Pulls {color,x,y,blur} out of a shadow composite value, tolerant of offsetX/offsetY vs x/y naming. */
function shadowComponents(value) {
  if (!value || typeof value !== 'object') return null;
  const color = toRGBA(value.color);
  if (!color) return null;
  return {
    color,
    x: toNumber(value.offsetX ?? value.x) ?? 0,
    y: toNumber(value.offsetY ?? value.y) ?? 0,
    blur: toNumber(value.blur) ?? 0,
  };
}

function renderShadowExpr(token, dictionary) {
  const { light, dark } = modeValues(token, dictionary);
  const lightComp = shadowComponents(light);
  if (!lightComp) {
    warn(`skipping shadow token '${token.path.join('.')}' — unparseable light value`);
    return null;
  }
  let darkComp = lightComp;
  if (dark !== undefined) {
    // A dark override may only specify a subset of keys (e.g. just `color`); merge onto light first.
    const merged = dark && typeof dark === 'object' ? { ...light, ...dark } : dark;
    const parsed = shadowComponents(merged);
    if (parsed) {
      darkComp = parsed;
    } else {
      warn(`token '${token.path.join('.')}' has an unparseable dark shadow value — reusing light`);
    }
  }
  const l = `.init(color: ${fmtRGBA(lightComp.color)}, x: ${fmtNum(lightComp.x)}, y: ${fmtNum(lightComp.y)}, blur: ${fmtNum(lightComp.blur)})`;
  const d = `.init(color: ${fmtRGBA(darkComp.color)}, x: ${fmtNum(darkComp.x)}, y: ${fmtNum(darkComp.y)}, blur: ${fmtNum(darkComp.blur)})`;
  return `CBShadowStyle(light: ${l}, dark: ${d})`;
}

const FONT_WEIGHT_MAP = {
  100: 'ultraLight', 200: 'thin', 300: 'light', 400: 'regular', 500: 'medium',
  600: 'semibold', 700: 'bold', 800: 'heavy', 900: 'black',
};

function renderTypographyExpr(token) {
  const v = token.$value;
  if (!v || typeof v !== 'object') {
    warn(`skipping typography token '${token.path.join('.')}' — missing composite value`);
    return null;
  }
  const size = toNumber(v.fontSize);
  const lineHeight = toNumber(v.lineHeight);
  const letterSpacing = toNumber(v.letterSpacing) ?? 0;
  if (size == null || lineHeight == null) {
    warn(`skipping typography token '${token.path.join('.')}' — unparseable fontSize/lineHeight`);
    return null;
  }
  const weightNum = Number(v.fontWeight);
  const weightName = FONT_WEIGHT_MAP[weightNum];
  if (!weightName) {
    warn(`typography token '${token.path.join('.')}' has unmapped fontWeight ${v.fontWeight} — defaulting to .regular`);
  }
  const relativeTo = token.$extensions?.['com.cryptobros.ios']?.relativeTo ?? 'body';
  return `CBTextStyle(size: ${fmtNum(size)}, lineHeight: ${fmtNum(lineHeight)}, weight: .${weightName ?? 'regular'}, letterSpacing: ${fmtNum(letterSpacing)}, relativeTo: .${relativeTo})`;
}

/** Renders one `public static let ...` statement for a leaf token, dispatching on its `$type`. */
function renderLeafStatement(token, dictionary, ident, opts = {}) {
  switch (token.$type) {
    case 'color': {
      const expr = renderColorExpr(token, dictionary);
      return expr && `public static let ${ident} = ${expr}`;
    }
    case 'dimension': {
      const n = toNumber(token.$value);
      if (n == null) {
        warn(`skipping dimension token '${token.path.join('.')}' — unparseable value ${JSON.stringify(token.$value)}`);
        return null;
      }
      return `public static let ${ident}: CGFloat = ${fmtNum(n)}`;
    }
    case 'duration': {
      // 'duration/ms' value transform already converted this to a plain millisecond number.
      const ms = toNumber(token.$value);
      if (ms == null) {
        warn(`skipping duration token '${token.path.join('.')}' — unparseable value ${JSON.stringify(token.$value)}`);
        return null;
      }
      return `public static let ${ident}: TimeInterval = ${fmtNum(ms / 1000)}`;
    }
    case 'number': {
      const n = toNumber(token.$value);
      if (n == null) {
        warn(`skipping number token '${token.path.join('.')}' — unparseable value ${JSON.stringify(token.$value)}`);
        return null;
      }
      const annotation = opts.numberType ? `: ${opts.numberType}` : '';
      // Force a decimal point (unless annotated as an integer type) so every `number` token is
      // consistently a Double/CGFloat literal — a bare `1` would otherwise infer as Int and break
      // arithmetic with sibling opacity/scale tokens that do have a fractional value.
      const isIntegerType = opts.numberType === 'Int';
      const literal = !isIntegerType && Number.isInteger(n) ? `${fmtNum(n)}.0` : fmtNum(n);
      return `public static let ${ident}${annotation} = ${literal}`;
    }
    case 'cubicBezier': {
      const arr = Array.isArray(token.$value) ? token.$value : null;
      if (!arr || arr.length !== 4) {
        warn(`skipping cubicBezier token '${token.path.join('.')}' — expected a 4-number array`);
        return null;
      }
      const nums = arr.map((x) => fmtNum(toNumber(x) ?? 0));
      return `public static let ${ident}: (CGFloat, CGFloat, CGFloat, CGFloat) = (${nums.join(', ')})`;
    }
    case 'spring': {
      const v = token.$value;
      if (!v || typeof v !== 'object') {
        warn(`skipping spring token '${token.path.join('.')}' — missing {mass,stiffness,damping} value`);
        return null;
      }
      const mass = fmtNum(toNumber(v.mass) ?? 1);
      const stiffness = fmtNum(toNumber(v.stiffness) ?? 100);
      const damping = fmtNum(toNumber(v.damping) ?? 10);
      return `public static let ${ident} = Animation.interpolatingSpring(mass: ${mass}, stiffness: ${stiffness}, damping: ${damping})`;
    }
    case 'zIndex': {
      const n = toNumber(token.$value);
      if (n == null) {
        warn(`skipping zIndex token '${token.path.join('.')}' — unparseable value ${JSON.stringify(token.$value)}`);
        return null;
      }
      return `public static let ${ident}: Double = ${fmtNum(n)}`;
    }
    case 'shadow': {
      const expr = renderShadowExpr(token, dictionary);
      return expr && `public static let ${ident} = ${expr}`;
    }
    case 'typography': {
      const expr = renderTypographyExpr(token);
      return expr && `public static let ${ident} = ${expr}`;
    }
    case 'fontFamily':
    case 'fontWeight':
      // Primitives only ever referenced from inside composite values (already resolved by SD);
      // nothing standalone to emit.
      return null;
    default:
      warn(`skipping token '${token.path.join('.')}' — unsupported $type '${token.$type}'`);
      return null;
  }
}

/** Recursively renders a domain tree as a (possibly nested) `public enum`. */
function emitEnum(name, node, dictionary, indent = '') {
  const body = [];
  for (const { key, token } of node.leaves) {
    const ident = safeIdent(key);
    // `motion.widgetPressScale` is documented as an explicit CGFloat at the CBMotion root.
    const opts = name === 'CBMotion' && key === 'widgetPressScale' ? { numberType: 'CGFloat' } : {};
    const stmt = renderLeafStatement(token, dictionary, ident, opts);
    if (stmt) body.push(`${indent}    ${stmt}`);
  }
  for (const [groupKey, sub] of node.groups) {
    const childName = safeTypeIdent(pascalCase(groupKey));
    body.push(...emitEnum(childName, sub, dictionary, `${indent}    `));
  }
  return [`${indent}public enum ${name} {`, ...body, `${indent}}`];
}

export function swiftFormat({ dictionary }) {
  const buckets = {
    color: mkNode(),
    category: mkNode(),
    chart: mkNode(),
    coin: mkNode(),
    spacing: mkNode(),
    radius: mkNode(),
    typography: mkNode(),
    motion: mkNode(),
    shadow: mkNode(),
    opacity: mkNode(),
    zindex: mkNode(),
    notion: mkNode(),
  };

  for (const token of dictionary.allTokens ?? []) {
    const path = Array.isArray(token.path) ? token.path : [];
    if (path.length === 0) continue;

    if (!token.$type) {
      warn(`skipping token '${path.join('.')}' — missing $type`);
      continue;
    }
    if (!TYPE_WHITELIST.has(token.$type)) {
      warn(`skipping token '${path.join('.')}' — unsupported $type '${token.$type}'`);
      continue;
    }

    const top = String(path[0]).toLowerCase();
    switch (top) {
      case 'color': {
        const second = path[1];
        if (second === 'primitive') break; // resolution-only, never exposed directly
        if (second === 'category') { insert(buckets.category, path.slice(2), token); break; }
        if (second === 'chart') { insert(buckets.chart, path.slice(2), token); break; }
        if (second === 'coin') { insert(buckets.coin, path.slice(2), token); break; }
        insert(buckets.color, path.slice(1), token);
        break;
      }
      case 'spacing': insert(buckets.spacing, path.slice(1), token); break;
      case 'radius': insert(buckets.radius, path.slice(1), token); break;
      case 'typography': insert(buckets.typography, path.slice(1), token); break;
      case 'motion': insert(buckets.motion, path.slice(1), token); break;
      case 'shadow': insert(buckets.shadow, path.slice(1), token); break;
      case 'opacity': insert(buckets.opacity, path.slice(1), token); break;
      case 'zindex': insert(buckets.zindex, path.slice(1), token); break;
      case 'notion': insert(buckets.notion, path.slice(1), token); break;
      case 'font': break; // referenced only (e.g. typography.fontFamily); no standalone output
      case 'layout': break; // no Swift output shape defined for layout tokens yet
      default:
        warn(`skipping token '${path.join('.')}' — unrecognized top-level group '${path[0]}'`);
    }
  }

  // color.category.* flattens into CBColor as `categoryXxx`, per the plan doc's literal example
  // (`public static let categoryMercado = dyn(...)`), rather than a nested CBColor.Category enum.
  for (const { path: segs, token } of collectLeaves(buckets.category, [])) {
    const ident = 'category' + segs.map(pascalCase).join('');
    buckets.color.leaves.push({ key: ident, token });
  }

  const lines = [
    '// Generated by crypto-bros-tokens — DO NOT EDIT. Source: tokens/*.json',
    'import SwiftUI',
    '',
    ...emitEnum('CBColor', buckets.color, dictionary),
    ...emitEnum('CBSpacing', buckets.spacing, dictionary),
    ...emitEnum('CBRadius', buckets.radius, dictionary),
    ...emitEnum('CBTypography', buckets.typography, dictionary),
    ...emitEnum('CBMotion', buckets.motion, dictionary),
    ...emitEnum('CBShadow', buckets.shadow, dictionary),
    ...emitEnum('CBOpacity', buckets.opacity, dictionary),
    ...emitEnum('CBZIndex', buckets.zindex, dictionary),
    ...emitEnum('CBNotion', buckets.notion, dictionary),
    ...emitEnum('CBChart', buckets.chart, dictionary),
    ...emitEnum('CBCoin', buckets.coin, dictionary),
  ];

  return lines.join('\n') + '\n';
}

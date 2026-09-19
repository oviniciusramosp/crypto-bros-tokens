// Day 1 minimum validator (the CI-grade version with contrast/alias checks is Day 2).
//
// Walks tokens/**/*.json with Node built-ins only (no fast-glob), parses each file, and checks
// that every DTCG leaf (an object with `$value`) resolves to a `$type` that is either declared on
// itself or inherited from an ancestor group — mirroring Style Dictionary's own `usesDtcg` group
// $type inheritance (see typeDtcgDelegate.js) — and that the resolved `$type` is in the whitelist.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPE_WHITELIST = new Set([
  'color',
  'dimension',
  'duration',
  'fontFamily',
  'fontWeight',
  'number',
  'cubicBezier',
  'shadow',
  'typography',
  'spring',
  'zIndex',
]);

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tokensDir = path.join(repoRoot, 'tokens');

/** Recursively lists every `.json` file under `dir`, sorted for deterministic output. */
function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return out;
    throw err;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const errors = [];

/**
 * Recursively validates a DTCG tree.
 * @param {unknown} node - the current subtree
 * @param {string[]} pathSegs - dotted-path segments for error messages (excludes '$'-keys)
 * @param {string | undefined} inheritedType - `$type` inherited from the nearest ancestor group
 * @param {string} file - source file, for error messages
 */
function validateNode(node, pathSegs, inheritedType, file) {
  if (!isPlainObject(node)) return;

  const ownType = typeof node.$type === 'string' ? node.$type : undefined;
  const effectiveType = ownType ?? inheritedType;
  const dotted = pathSegs.join('.') || '(root)';

  const isLeaf = Object.prototype.hasOwnProperty.call(node, '$value');

  if (isLeaf) {
    if (!effectiveType) {
      errors.push(`${file}: '${dotted}' has $value but no $type (own or inherited)`);
    } else if (!TYPE_WHITELIST.has(effectiveType)) {
      errors.push(
        `${file}: '${dotted}' has $type '${effectiveType}' which is not in the whitelist ` +
          `{${[...TYPE_WHITELIST].join(', ')}}`,
      );
    }
    // A leaf's own nested keys (e.g. composite $value fields) are data, not child tokens — don't descend.
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue; // $type, $description, $extensions, etc. are metadata
    validateNode(value, [...pathSegs, key], effectiveType, file);
  }
}

const files = walk(tokensDir);

if (files.length === 0) {
  console.error(`No token files found under ${tokensDir}`);
  process.exit(1);
}

for (const file of files) {
  const rel = path.relative(repoRoot, file);
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    errors.push(`${rel}: invalid JSON — ${err.message}`);
    continue;
  }
  validateNode(data, [], undefined, rel);
}

if (errors.length > 0) {
  console.error(`Token validation failed with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('All tokens valid.');

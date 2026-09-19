import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import StyleDictionary from 'style-dictionary';
import config from '../config.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const sd = new StyleDictionary(config);
await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();

// Day 2 adds dist/tokens.ts (compiled here into dist/tokens.js + dist/tokens.d.ts). Until that
// file exists this is a no-op so Day 1 builds don't require a tsconfig that isn't written yet.
const tokensTsPath = fileURLToPath(new URL('../dist/tokens.ts', import.meta.url));
if (existsSync(tokensTsPath)) {
  execFileSync('npx', ['tsc', '-p', 'tsconfig.dist.json'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
}

console.log('Build complete.');

import { swiftFormat } from './formats/swift.mjs';

// Day 2 adds the CSS/TS/JSON platforms (formats/{css,ts,json-flat}.mjs don't exist yet — importing
// them here before Day 2 lands would crash `node scripts/build.mjs`). Keeping the shape below means
// wiring them back up is a small diff:
//
// import { cssFormat } from './formats/css.mjs';
// import { tsFormat } from './formats/ts.mjs';
// import { jsonFlatFormat } from './formats/json-flat.mjs';

export default {
  source: ['tokens/**/*.json'],
  usesDtcg: true,
  log: { verbosity: 'verbose', warnings: 'error' }, // unresolved references fail the build
  hooks: {
    transforms: {
      'dimension/unitless': {
        type: 'value',
        transitive: true,
        filter: (t) => t.$type === 'dimension' && typeof t.$value === 'string',
        transform: (t) => parseFloat(t.$value),
      },
      'duration/ms': {
        type: 'value',
        transitive: true,
        filter: (t) => t.$type === 'duration',
        transform: (t) => parseFloat(t.$value) * (String(t.$value).endsWith('ms') ? 1 : 1000),
      },
    },
    formats: {
      'cb/swift': swiftFormat,
      // Day 2: 'cb/css': cssFormat, 'cb/ts': tsFormat, 'cb/json-flat': jsonFlatFormat,
    },
  },
  platforms: {
    swift: {
      transforms: ['name/camel', 'dimension/unitless', 'duration/ms'],
      buildPath: 'Sources/CryptoBrosTokens/Generated/',
      files: [{ destination: 'Tokens.swift', format: 'cb/swift' }],
    },
    // Day 2:
    // css: { transforms: ['name/kebab'], buildPath: 'dist/',
    //        files: [{ destination: 'tokens.css', format: 'cb/css' }] },
    // ts: { transforms: ['name/camel', 'dimension/unitless', 'duration/ms'], buildPath: 'dist/',
    //       files: [{ destination: 'tokens.ts', format: 'cb/ts' }] },
    // json: { transforms: ['name/kebab'], buildPath: 'dist/',
    //         files: [{ destination: 'tokens.json', format: 'cb/json-flat' }] },
  },
};

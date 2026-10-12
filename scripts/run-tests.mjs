import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
const compile = spawnSync(
  process.execPath,
  ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.tests.json'],
  { stdio: 'inherit' },
);
if (compile.status) process.exit(compile.status);
mkdirSync('.omx/tests-dist', { recursive: true });
writeFileSync('.omx/tests-dist/package.json', '{"type":"commonjs"}');
const files = readdirSync('.omx/tests-dist/tests')
  .filter((name) => name.endsWith('.test.js'))
  .map((name) => '.omx/tests-dist/tests/' + name);
const tests = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(tests.status ?? 1);

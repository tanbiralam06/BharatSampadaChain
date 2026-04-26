import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tests = ['asset_threshold.test.js'];
let anyFailed = false;

for (const t of tests) {
  const result = spawnSync('node', [path.join(__dirname, t)], { stdio: 'inherit' });
  if (result.status !== 0) anyFailed = true;
}

process.exit(anyFailed ? 1 : 0);

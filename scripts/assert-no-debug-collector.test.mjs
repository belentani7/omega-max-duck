import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./assert-no-debug-collector.mjs', import.meta.url));
const defaultHtml = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div></body></html>';

function runFixture(files, expectedExit, expectedError = '') {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'omega-privacy-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const target = path.join(temp, 'dist/public', name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    const result = spawnSync(process.execPath, [script], { cwd: temp, encoding: 'utf8' });
    assert.equal(result.status, expectedExit, `stdout: ${result.stdout}\nstderr: ${result.stderr}`);
    if (expectedError) assert.match(result.stderr, new RegExp(expectedError, 'i'));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

test('clean production output passes', () => {
  runFixture({ 'index.html': defaultHtml, 'assets/app-123.js': 'console.log("hello")' }, 0);
});
test('missing index fails closed', () => {
  runFixture({ 'assets/app.js': 'console.log("hello")' }, 1, 'missing');
});
test('original collector filename is rejected', () => {
  runFixture({ 'index.html': defaultHtml, '__manus__/debug-collector.js': 'console.log("collect")' }, 1, 'collector');
});
test('nested hashed collector artifact is rejected', () => {
  runFixture({ 'index.html': defaultHtml, 'assets/debug-collector-a1b2.js': 'console.log("collect")' }, 1, 'collector');
});
test('bundled code posting browser session logs is rejected', () => {
  runFixture({ 'index.html': defaultHtml, 'assets/app-a1b2.js': 'fetch("/__manus__/logs", {method:"POST"})' }, 1, 'collector|log');
});
test('debug collector reference in nested HTML is rejected', () => {
  runFixture({ 'index.html': defaultHtml, 'pages/other.html': '<script src="/__manus__/debug-collector.js"></script>' }, 1, 'collector');
});
test('escaped bundled log endpoint is rejected', () => {
  runFixture({ 'index.html': defaultHtml, 'assets/app.js': String.raw`fetch("/__manus__\/logs")` }, 1, 'collector|log');
});
test('source maps cannot publish the collector endpoint', () => {
  runFixture({ 'index.html': defaultHtml, 'assets/app.js.map': '{"sourcesContent":["fetch(\"/__manus__/logs\")"]}' }, 1, 'collector|log');
});
test('unapproved analytics and zoom disabling still fail', () => {
  runFixture({ 'index.html': defaultHtml.replace('</head>', '<script src="/umami"></script></head>') }, 1, 'analytics');
  runFixture({ 'index.html': defaultHtml.replace('initial-scale=1', 'maximum-scale=1') }, 1, 'zoom');
});

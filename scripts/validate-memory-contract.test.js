#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function expectMatch(content, pattern, message) {
  assert.ok(pattern.test(content), message ?? `Expected content to match ${pattern}`);
}

function expectNoMatch(content, pattern, message) {
  assert.ok(!pattern.test(content), message ?? `Expected content not to match ${pattern}`);
}

function section(content, heading, nextHeading) {
  const start = content.indexOf(heading);
  assert.notEqual(start, -1, `Missing section: ${heading}`);

  const end = nextHeading ? content.indexOf(nextHeading, start + heading.length) : -1;
  return content.slice(start, end === -1 ? undefined : end);
}

test('the canonical artifact map includes every durable memory home', () => {
  const context = read('skills/context-engineering/SKILL.md');
  const memory = read('skills/memory-management/SKILL.md');
  const draft = read('skills/memory-management/memory-draft.md');
  const canonicalPaths = [
    'docs/project.md',
    'docs/steering/index.md',
    'docs/decisions/index.md',
    'docs/decisions/NNNN-*.md',
    'docs/runbooks/index.md',
    'docs/specs/<slug>/memory-delta.md',
  ];

  for (const artifactPath of canonicalPaths) {
    assert.ok(context.includes(artifactPath), `context-engineering must map ${artifactPath}`);
  }
  expectMatch(context, /decisions\/[^\n]*\n\s*index\.md[^\n]*(?:documentation-and-adrs|producer)/);
  expectMatch(context, /runbooks\/[^\n]*\n\s*index\.md[^\n]*producer/);
  expectMatch(context, /<procedure>\.md/);

  for (const content of [memory, draft]) {
    expectNoMatch(content, /docs\/adrs\/|\badrs\/index\.md|\badrs\//);
    expectMatch(content, /docs\/decisions\//);
  }
});

test('memory deltas route to the canonical home and are promoted during ship', () => {
  const memory = read('skills/memory-management/SKILL.md');
  const promotion = section(
    memory,
    '## How Memory Gets Saved: Delta → Review → Promote',
    '## How Memory Gets Loaded: Progressive Disclosure'
  );

  for (const destination of ['docs/project.md', 'docs/decisions/', 'docs/steering/', 'docs/runbooks/']) {
    assert.ok(promotion.includes(destination), `promotion must route to ${destination}`);
  }
  expectNoMatch(promotion, /promoted into `steering\/`/);
  expectNoMatch(promotion, /discard/i, 'every candidate must retain a disposition');
  expectMatch(promotion, /^\s*[-\d.]+\s+\*\*GO\b/m, 'memory promotion must be explicitly GO-only');
  expectMatch(promotion, /^\s*[-\d.]+\s+\*\*NO-GO\b/m, 'memory promotion must preserve NO-GO deltas');

  const entrypoints = [
    'skills/using-lucas-harness/SKILL.md',
    'skills/shipping-and-launch/SKILL.md',
  ];
  for (const entrypoint of entrypoints) {
    const content = read(entrypoint);
    expectMatch(content, /memory-management/, `${entrypoint} must invoke memory-management`);
    expectMatch(content, /memory-delta\.md/, `${entrypoint} must handle memory-delta.md`);
  }

  const shipping = read('skills/shipping-and-launch/SKILL.md');
  const closeout = section(
    shipping,
    '## Memory Closeout After the Ship Decision',
    '## Feature Flag Strategy'
  );
  expectMatch(closeout, /^- \*\*GO — promote verified knowledge\.\*\*/m, 'GO must promote verified memory');
  expectMatch(closeout, /^- \*\*NO-GO — leave `memory-delta\.md` unpromoted\.\*\*/m, 'NO-GO must leave memory unpromoted');
  expectMatch(closeout, /^- \*\*Ad-hoc ship check\.\*\*/m, 'ad-hoc checks must not invent a delta');

  for (const command of [
    '.claude/commands/ship.md',
    '.gemini/commands/ship.toml',
    'commands/ship.toml',
  ]) {
    const content = read(command);
    expectMatch(content, /shipping-and-launch/, `${command} must invoke shipping-and-launch`);
    expectMatch(content, /docs\/specs\/<slug>\/ship\.md/, `${command} must persist the ship decision`);
  }
});

test('monorepo promotion resolves root versus package scope before artifact type', () => {
  const memory = read('skills/memory-management/SKILL.md');
  const context = read('skills/context-engineering/SKILL.md');
  const documentation = read('skills/documentation-and-adrs/SKILL.md');
  const observability = read('skills/observability-and-instrumentation/SKILL.md');
  const shipping = read('skills/shipping-and-launch/SKILL.md');

  for (const scopedPath of [
    'packages/<pkg>/docs/project.md',
    'packages/<pkg>/docs/steering/index.md',
    'packages/<pkg>/docs/decisions/index.md',
    'packages/<pkg>/docs/runbooks/index.md',
  ]) {
    assert.ok(memory.includes(scopedPath), `memory-management must define ${scopedPath}`);
  }
  expectMatch(memory, /Every durable artifact has a resolved memory root/);
  expectNoMatch(memory, /All durable-memory artifacts are rooted under `docs\/`/);
  expectMatch(memory, /corresponding root or package-local[^\n]*index/);
  expectMatch(context, /packages\/<pkg>\/docs\//);
  expectMatch(documentation, /packages\/<pkg>\/docs\/decisions\//);
  expectMatch(observability, /packages\/<pkg>\/docs\/runbooks\//);
  expectMatch(shipping, /resolve[^\n]*scope[^\n]*before[^\n]*(?:home|route)/i);
});

test('the ADR producer writes numbered decisions and maintains its index', () => {
  const documentation = read('skills/documentation-and-adrs/SKILL.md');

  expectMatch(documentation, /docs\/decisions\/NNNN-\*\.md/);
  expectMatch(documentation, /docs\/decisions\/index\.md/);
  expectNoMatch(documentation, /ADR-\d{3}\b/);

  const observability = read('skills/observability-and-instrumentation/SKILL.md');
  expectMatch(observability, /docs\/runbooks\/index\.md/, 'runbook writer must maintain its index');
});

test('the always-loaded core has one project summary and three indexes', () => {
  const memory = read('skills/memory-management/SKILL.md');
  const loading = section(
    memory,
    '## How Memory Gets Loaded: Progressive Disclosure',
    '## How Memory Is Organized: Organize by Domain, Not by Knowledge-Type'
  );

  for (const corePath of [
    'docs/project.md',
    'docs/steering/index.md',
    'docs/decisions/index.md',
    'docs/runbooks/index.md',
  ]) {
    assert.ok(loading.includes(corePath), `always-loaded core must include ${corePath}`);
  }
  expectNoMatch(memory, /overview\.md\s+→ durable project summary \(always loaded\)/);
});

test('supporting documentation no longer advertises the superseded model', () => {
  const principles = read('principles.md');
  const projectState = section(principles, '## Minimal Project and Workflow State', '## Summary');
  const gettingStarted = read('docs/getting-started.md');

  expectNoMatch(projectState, /projects\/<project-id>\/|\bmemory\/|memory\.json|proposed-updates\/|\badr\/|adr-delta\.md/);
  expectMatch(projectState, /docs\/steering\//);
  expectMatch(projectState, /docs\/decisions\//);
  expectMatch(gettingStarted, /memory-delta\.md/);
  expectNoMatch(
    gettingStarted,
    /delete its `docs\/specs\/<slug>\/` folder|add it to `\.gitignore`/i
  );

  for (const entryDoc of [
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'docs/getting-started.md',
    'docs/agents.md',
    'docs/antigravity-setup.md',
    'docs/gemini-cli-setup.md',
    'docs/opencode-setup.md',
  ]) {
    expectMatch(read(entryDoc), /memory-management/, `${entryDoc} must surface memory-management`);
  }
});

test('memory evals use current paths and reference real fixtures', () => {
  const evals = JSON.parse(read('skills/memory-management/evals/evals.json'));
  const serialized = JSON.stringify(evals);
  const byName = Object.fromEntries(evals.evals.map(scenario => [scenario.name, scenario]));

  expectNoMatch(serialized, /\bmemory\//);
  expectMatch(serialized, /docs\/steering\//);
  expectMatch(serialized, /docs\/decisions\//);
  expectMatch(serialized, /docs\/runbooks\//);
  assert.deepEqual(
    Object.keys(byName).sort(),
    ['link-not-copy', 'over-saving', 'prune-not-size'],
    'the three semantic memory scenarios must remain covered'
  );

  for (const corePath of [
    'fixtures/over-saving/docs/project.md',
    'fixtures/over-saving/docs/steering/index.md',
    'fixtures/over-saving/docs/decisions/index.md',
    'fixtures/over-saving/docs/runbooks/index.md',
  ]) {
    assert.ok(byName['over-saving'].files.includes(corePath), `over-saving must include ${corePath}`);
  }
  expectMatch(JSON.stringify(byName['link-not-copy']), /docs\/project\.md/);
  expectMatch(JSON.stringify(byName['link-not-copy']), /docs\/decisions\//);
  expectMatch(JSON.stringify(byName['prune-not-size']), /docs\/steering\//);
  expectMatch(JSON.stringify(byName['prune-not-size']), /docs\/runbooks\//);

  for (const scenario of evals.evals) {
    for (const fixturePath of scenario.files ?? []) {
      if (fixturePath === 'none') continue;
      assert.ok(
        fs.existsSync(path.join(ROOT, 'skills/memory-management/evals', fixturePath)),
        `${scenario.name} references missing fixture: ${fixturePath}`
      );
    }
  }
});

test('CI runs the memory contract regression test', () => {
  const workflow = read('.github/workflows/test-plugin-install.yml');
  expectMatch(workflow, /node --test scripts\/validate-memory-contract\.test\.js/);
});

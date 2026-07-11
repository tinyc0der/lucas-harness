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

function markdownFiles(relativeDirectory) {
  const absoluteDirectory = path.join(ROOT, relativeDirectory);
  const files = [];

  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...markdownFiles(relativePath));
    } else if (entry.name.endsWith('.md')) {
      files.push(relativePath);
    }
  }

  return files;
}

function splitCanonicalYamlList(value, relativePath, lineNumber) {
  const items = [];
  let current = '';
  let quote = null;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote === '"') {
      current += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quote = null;
      continue;
    }
    if (quote === "'") {
      current += character;
      if (character === "'" && value[index + 1] === "'") {
        current += value[index + 1];
        index += 1;
      } else if (character === "'") {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
    } else if (character === ',') {
      items.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  if (quote || escaped) {
    throw new Error(`${relativePath} has invalid YAML on line ${lineNumber}`);
  }
  items.push(current);
  return items;
}

function parseCanonicalYamlScalar(rawValue, relativePath, lineNumber) {
  let value = rawValue.trim();
  if (!value || value.startsWith('#')) return null;

  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${relativePath} has invalid YAML on line ${lineNumber}`);
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2) {
      throw new Error(`${relativePath} has invalid YAML on line ${lineNumber}`);
    }
    const inner = value.slice(1, -1);
    let parsed = '';
    for (let index = 0; index < inner.length; index += 1) {
      if (inner[index] !== "'") {
        parsed += inner[index];
      } else if (inner[index + 1] === "'") {
        parsed += "'";
        index += 1;
      } else {
        throw new Error(`${relativePath} has invalid YAML on line ${lineNumber}`);
      }
    }
    return parsed;
  }
  if (value.startsWith('[')) {
    if (!value.endsWith(']')) {
      throw new Error(`${relativePath} has invalid YAML on line ${lineNumber}`);
    }
    const items = value.slice(1, -1).trim();
    if (!items) return [];
    return splitCanonicalYamlList(items, relativePath, lineNumber)
      .map(item => parseCanonicalYamlScalar(item, relativePath, lineNumber));
  }
  const comment = value.indexOf(' #');
  if (comment !== -1) value = value.slice(0, comment).trimEnd();
  if (/^[{&*!|>@`]/.test(value) || /:\s/.test(value)) {
    throw new Error(`${relativePath} has unsupported or invalid canonical YAML on line ${lineNumber}`);
  }
  if (/^(?:null|~)$/i.test(value)) return null;
  if (/^(?:true|false)$/i.test(value)) return value.toLowerCase() === 'true';
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function parseYaml(yaml, relativePath) {
  const mapping = {};
  const seen = new Set();
  for (const [index, line] of yaml.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (/^\s/.test(line) || line.includes('\t')) {
      throw new Error(`${relativePath} has unsupported or invalid canonical YAML on line ${lineNumber}`);
    }
    const field = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):(.*)$/);
    if (!field || seen.has(field[1])) {
      throw new Error(`${relativePath} has invalid YAML mapping on line ${lineNumber}`);
    }
    seen.add(field[1]);
    mapping[field[1]] = parseCanonicalYamlScalar(field[2], relativePath, lineNumber);
  }
  return mapping;
}

function splitFrontmatter(content, relativePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, `${relativePath} must contain YAML frontmatter`);
  return { frontmatter: parseYaml(match[1], relativePath), body: content.slice(match[0].length) };
}

function expectConcept(content, relativePath) {
  const { frontmatter } = splitFrontmatter(content, relativePath);
  assert.ok(
    frontmatter && typeof frontmatter === 'object' && !Array.isArray(frontmatter),
    `${relativePath} frontmatter must be a YAML mapping`
  );

  for (const key of ['type', 'title', 'description']) {
    assert.equal(typeof frontmatter[key], 'string', `${relativePath} ${key} must be a string`);
    assert.ok(frontmatter[key].trim(), `${relativePath} ${key} must not be empty`);
  }

  return frontmatter;
}

function expectIndexBody(body, relativePath) {
  const lines = body.split(/\r?\n/).filter(line => line.trim());
  assert.ok(lines.length > 0 && /^#\s+\S/.test(lines[0]), `${relativePath} must begin with a section heading`);

  let inSection = false;
  for (const line of lines) {
    if (/^#\s+\S/.test(line)) {
      inSection = true;
      continue;
    }
    if (/^\*\s+/.test(line)) {
      assert.ok(inSection, `${relativePath} entry must follow a section heading`);
      expectMatch(
        line,
        /^\* \[[^\]]+\]\([^)]+\) - \S.+$/,
        `${relativePath} entries must be links with descriptions`
      );
      continue;
    }
    assert.ok(
      inSection && (/^_.+_$/.test(line) || /^No .+\.$/.test(line)),
      `${relativePath} contains unsupported index content: ${line}`
    );
  }
}

function expectIndex(content, relativePath, { root = false, version = '0.1' } = {}) {
  let body = content;
  if (root) {
    const parsed = splitFrontmatter(content, relativePath);
    assert.deepEqual(parsed.frontmatter, { okf_version: version });
    body = parsed.body;
  } else {
    expectNoMatch(content, /^---/, `${relativePath} must not contain frontmatter`);
  }
  expectIndexBody(body, relativePath);
}

function expectLog(content, relativePath) {
  expectNoMatch(content, /^---/, `${relativePath} must not contain frontmatter`);
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  assert.ok(lines.length >= 3 && /^#\s+\S/.test(lines[0]), `${relativePath} must begin with a title`);

  const dates = [];
  let currentDate = null;
  let entriesInGroup = 0;
  for (const line of lines.slice(1)) {
    const date = line.match(/^## (\d{4}-\d{2}-\d{2})$/);
    if (date) {
      const parsedDate = new Date(`${date[1]}T00:00:00Z`);
      assert.ok(
        !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date[1],
        `${relativePath} date headings must be valid ISO 8601 calendar dates`
      );
      assert.ok(currentDate === null || entriesInGroup > 0, `${relativePath} date groups must contain entries`);
      currentDate = date[1];
      entriesInGroup = 0;
      dates.push(currentDate);
      continue;
    }
    assert.ok(currentDate, `${relativePath} entries must follow an ISO date heading`);
    expectMatch(line, /^\* \S.+$/, `${relativePath} history entries must be flat bullets`);
    entriesInGroup += 1;
  }
  assert.ok(entriesInGroup > 0, `${relativePath} final date group must contain entries`);
  assert.deepEqual(dates, [...dates].sort().reverse(), `${relativePath} date groups must be newest first`);
}

function expectRequiredProfileFiles(relativeBundleRoot, existsSync = fs.existsSync) {
  for (const requiredPath of [
    'project.md',
    'steering/index.md',
    'decisions/index.md',
    'runbooks/index.md',
  ]) {
    assert.ok(
      existsSync(path.join(ROOT, relativeBundleRoot, requiredPath)),
      `${relativeBundleRoot} is missing required profile file ${requiredPath}`
    );
  }
}

function expectOkfBundle(relativeBundleRoot, { version = '0.1' } = {}) {
  const rootIndex = read(path.join(relativeBundleRoot, 'index.md'));
  expectIndex(rootIndex, path.join(relativeBundleRoot, 'index.md'), { root: true, version });
  expectRequiredProfileFiles(relativeBundleRoot);

  for (const requiredTarget of ['project.md', 'steering/', 'decisions/', 'runbooks/']) {
    assert.ok(rootIndex.includes(`](${requiredTarget})`), `root index must map ${requiredTarget}`);
  }

  for (const relativePath of markdownFiles(relativeBundleRoot)) {
    const content = read(relativePath);
    const basename = path.basename(relativePath);

    if (basename === 'index.md') {
      if (relativePath !== path.join(relativeBundleRoot, 'index.md')) {
        expectIndex(content, relativePath);
      }

      const directory = path.dirname(path.join(ROOT, relativePath));
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.md') && !['index.md', 'log.md'].includes(entry.name)) {
          assert.ok(content.includes(`](${entry.name})`), `${relativePath} must inventory ${entry.name}`);
        }
      }
      continue;
    }

    if (basename === 'log.md') {
      expectLog(content, relativePath);
      continue;
    }

    expectConcept(content, relativePath);
  }
}

test('the canonical artifact map includes every durable memory home', () => {
  const context = read('skills/context-engineering/SKILL.md');
  const memory = read('skills/memory-management/SKILL.md');
  const draft = read('skills/memory-management/memory-draft.md');
  const canonicalPaths = [
    'docs/knowledge/index.md',
    'docs/knowledge/project.md',
    'docs/knowledge/steering/index.md',
    'docs/knowledge/decisions/index.md',
    'docs/knowledge/decisions/NNNN-*.md',
    'docs/knowledge/runbooks/index.md',
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
    expectMatch(content, /docs\/knowledge\/decisions\//);
  }
});

test('durable memory is an OKF v0.1 bundle with permissive consumers', () => {
  const memory = read('skills/memory-management/SKILL.md');
  const referencePath = 'skills/memory-management/references/okf-v0.1.md';
  const migrationPath = 'docs/migrations/okf-memory-bundle.md';

  assert.ok(fs.existsSync(path.join(ROOT, referencePath)), 'memory-management must ship its OKF profile');
  assert.ok(fs.existsSync(path.join(ROOT, migrationPath)), 'the legacy memory layout needs a migration guide');
  const reference = read(referencePath);
  const migration = read(migrationPath);

  expectMatch(memory, /Open Knowledge Format|OKF v0\.1/);
  expectMatch(memory, /references\/okf-v0\.1\.md/);
  expectMatch(reference, /https:\/\/github\.com\/GoogleCloudPlatform\/knowledge-catalog\/blob\/main\/okf\/SPEC\.md/);
  expectMatch(reference, /concept ID/i);
  expectMatch(reference, /`type`[^\n]*required|requires?[^\n]*`type`/i);
  expectMatch(reference, /`index\.md`[^\n]*`log\.md`|reserved[^\n]*(?:index\.md|log\.md)/i);
  expectMatch(reference, /okf_version:\s*["']0\.1["']/);
  expectMatch(reference, /unknown types?/i);
  expectMatch(reference, /unknown (?:frontmatter )?(?:fields|keys)/i);
  expectMatch(reference, /broken (?:cross-)?links?/i);
  expectMatch(reference, /unrecognized[^\n]*version[^\n]*best-effort|best-effort[^\n]*unrecognized[^\n]*version/i);
  expectMatch(memory, /unrecognized[^\n]*version[^\n]*best-effort|best-effort[^\n]*unrecognized[^\n]*version/i);
  expectMatch(reference, /bundle-relative/i);
  expectMatch(migration, /docs\/project\.md/);
  expectMatch(migration, /docs\/knowledge\/project\.md/);
  expectMatch(migration, /both[\s\S]*(?:stop|reconcil)/i);
  expectMatch(memory, /any subset of the legacy homes/i);
  expectMatch(reference, /partial or complete legacy layout/i);
  expectMatch(migration, /partial or complete legacy layout/i);
  for (const content of [memory, reference, migration]) {
    expectMatch(content, /reserved/i);
    expectMatch(content, /index\.md|`index\.md`/i);
    expectMatch(content, /log\.md|`log\.md`/i);
    expectMatch(content, /rename/i);
    expectMatch(content, /rules file[\s\S]*unique durable[\s\S]*tool-specific controls/i);
  }
  expectNoMatch(reference, /move all four/i);
});

test('the OKF fixture validator rejects invalid YAML and reserved-file shapes', () => {
  const valid = expectConcept(
    '---\ntype: Project Guidance\ntitle: "Hash # routing"\ndescription: "Explain: quoted punctuation."\ntags: ["routing, docs", metadata]\ntimestamp: 2026-07-11T00:00:00Z\n---\n',
    'valid.md'
  );
  assert.equal(valid.title, 'Hash # routing');
  assert.deepEqual(valid.tags, ['routing, docs', 'metadata']);
  assert.equal(valid.timestamp, '2026-07-11T00:00:00Z');

  for (const invalidType of ['null', '[]', '# empty']) {
    assert.throws(
      () => expectConcept(`---\ntype: ${invalidType}\ntitle: Example\ndescription: Example concept.\n---\n`, 'invalid.md'),
      /type must be a string/
    );
  }
  assert.throws(
    () => expectConcept('---\ntype: [\ntitle: Example\ndescription: Example concept.\n---\n', 'invalid.md'),
    /invalid YAML/
  );
  assert.throws(
    () => expectConcept("---\ntype: Project\ntitle: 'foo'bar'\ndescription: Example concept.\n---\n", 'invalid.md'),
    /invalid YAML/
  );
  assert.throws(
    () => expectIndexBody('# Items\n* [Thing](thing.md)', 'invalid/index.md'),
    /links with descriptions/
  );
  assert.throws(
    () => expectLog('# Updates\n## 2026-01-01\n* First\n## 2026-02-01\n* Second\n', 'invalid/log.md'),
    /newest first/
  );
  assert.throws(
    () => expectLog('# Updates\n## 2026-99-99\n* Invalid date\n', 'invalid/log.md'),
    /valid ISO 8601 calendar dates/
  );
  assert.throws(
    () => expectRequiredProfileFiles('invalid-bundle', () => false),
    /missing required profile file project\.md/
  );
});

test('memory deltas route to the canonical home and are promoted during ship', () => {
  const memory = read('skills/memory-management/SKILL.md');
  const promotion = section(
    memory,
    '## How Memory Gets Saved: Delta → Review → Promote',
    '## How Memory Gets Loaded: Progressive Disclosure'
  );

  for (const destination of [
    'docs/knowledge/project.md',
    'docs/knowledge/decisions/',
    'docs/knowledge/steering/',
    'docs/knowledge/runbooks/',
  ]) {
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
  const harness = read('skills/using-lucas-harness/SKILL.md');

  for (const scopedPath of [
    'packages/<pkg>/docs/knowledge/index.md',
    'packages/<pkg>/docs/knowledge/project.md',
    'packages/<pkg>/docs/knowledge/steering/index.md',
    'packages/<pkg>/docs/knowledge/decisions/index.md',
    'packages/<pkg>/docs/knowledge/runbooks/index.md',
  ]) {
    assert.ok(memory.includes(scopedPath), `memory-management must define ${scopedPath}`);
  }
  expectMatch(memory, /Every durable artifact has a resolved memory root/);
  expectNoMatch(memory, /All durable-memory artifacts are rooted under `docs\/`/);
  expectMatch(memory, /corresponding root or package-local[^\n]*index/);
  expectMatch(context, /packages\/<pkg>\/docs\/knowledge\//);
  expectMatch(documentation, /packages\/<pkg>\/docs\/knowledge\/decisions\//);
  expectMatch(observability, /packages\/<pkg>\/docs\/knowledge\/runbooks\//);
  expectMatch(shipping, /resolve[^\n]*scope[^\n]*before[^\n]*(?:home|route)/i);
  expectMatch(harness, /Step -1[\s\S]*docs\/knowledge\/index\.md[\s\S]*packages\/<pkg>\/docs\/knowledge\/index\.md/);
  expectMatch(memory, /one package[^\n]*bundle exists|package[^\n]*independent bundle exists/i);
});

test('the ADR producer writes numbered decisions and maintains its index', () => {
  const documentation = read('skills/documentation-and-adrs/SKILL.md');

  expectMatch(documentation, /docs\/knowledge\/decisions\/NNNN-\*\.md/);
  expectMatch(documentation, /docs\/knowledge\/decisions\/index\.md/);
  expectMatch(documentation, /type:\s*Architecture Decision/);
  expectNoMatch(documentation, /ADR-\d{3}\b/);

  const observability = read('skills/observability-and-instrumentation/SKILL.md');
  expectMatch(observability, /docs\/knowledge\/runbooks\/index\.md/, 'runbook writer must maintain its index');
  expectMatch(observability, /type:\s*Playbook/);
  expectMatch(observability, /preserve unknown frontmatter keys/i);
  expectMatch(observability, /root index[^\n]*maps the collection/i);
  expectMatch(observability, /# Why[\s\S]*# Citations/);
});

test('the always-loaded core starts at the OKF root index and project concept', () => {
  const memory = read('skills/memory-management/SKILL.md');
  const loading = section(
    memory,
    '## How Memory Gets Loaded: Progressive Disclosure',
    '## How Memory Is Organized: Organize by Domain, Not by Knowledge-Type'
  );

  for (const corePath of ['docs/knowledge/index.md', 'docs/knowledge/project.md']) {
    assert.ok(loading.includes(corePath), `always-loaded core must include ${corePath}`);
  }
  expectMatch(loading, /load[\s\S]*steering[\s\S]*decisions[\s\S]*runbooks[\s\S]*index(?:es)?[\s\S]*on demand/i);
  expectNoMatch(memory, /overview\.md\s+→ durable project summary \(always loaded\)/);
});

test('supporting documentation no longer advertises the superseded model', () => {
  const principles = read('principles.md');
  const projectState = section(principles, '## Minimal Project and Workflow State', '## Summary');
  const gettingStarted = read('docs/getting-started.md');
  const context = read('skills/context-engineering/SKILL.md');
  const rulesFileContract = section(context, '### Level 1: Rules Files', '### Level 2: Specs and Architecture');

  expectNoMatch(projectState, /projects\/<project-id>\/|\bmemory\/|memory\.json|proposed-updates\/|\badr\/|adr-delta\.md/);
  expectMatch(projectState, /docs\/knowledge\/steering\//);
  expectMatch(projectState, /docs\/knowledge\/decisions\//);
  expectMatch(gettingStarted, /memory-delta\.md/);
  expectMatch(rulesFileContract, /docs\/knowledge\/index\.md/);
  expectMatch(rulesFileContract, /pointer|link,? don['’]t (?:copy|restate)/i);
  expectNoMatch(rulesFileContract, /## Tech Stack|## Commands|## Code Conventions|## Patterns/);
  expectNoMatch(context, /Write it down in rules files|covers tech stack, commands, conventions, and boundaries/);
  expectNoMatch(read('skills/documentation-and-adrs/SKILL.md'), /rules files[^\n]*Document project conventions/i);
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
  expectMatch(serialized, /docs\/knowledge\/steering\//);
  expectMatch(serialized, /docs\/knowledge\/decisions\//);
  expectMatch(serialized, /docs\/knowledge\/runbooks\//);
  assert.deepEqual(
    Object.keys(byName).sort(),
    ['link-not-copy', 'over-saving', 'prune-not-size', 'unknown-version'],
    'the semantic and interoperability memory scenarios must remain covered'
  );

  for (const corePath of [
    'fixtures/over-saving/docs/knowledge/index.md',
    'fixtures/over-saving/docs/knowledge/project.md',
    'fixtures/over-saving/docs/knowledge/steering/index.md',
    'fixtures/over-saving/docs/knowledge/decisions/index.md',
    'fixtures/over-saving/docs/knowledge/runbooks/index.md',
  ]) {
    assert.ok(byName['over-saving'].files.includes(corePath), `over-saving must include ${corePath}`);
  }
  expectMatch(JSON.stringify(byName['link-not-copy']), /docs\/knowledge\/project\.md/);
  expectMatch(JSON.stringify(byName['link-not-copy']), /docs\/knowledge\/decisions\//);
  expectMatch(JSON.stringify(byName['prune-not-size']), /docs\/knowledge\/steering\//);
  expectMatch(JSON.stringify(byName['prune-not-size']), /docs\/knowledge\/runbooks\//);

  for (const scenario of evals.evals) {
    for (const fixturePath of scenario.files ?? []) {
      if (fixturePath === 'none') continue;
      assert.ok(
        fs.existsSync(path.join(ROOT, 'skills/memory-management/evals', fixturePath)),
        `${scenario.name} references missing fixture: ${fixturePath}`
      );
    }
  }

  for (const scenario of ['over-saving', 'link-not-copy', 'prune-not-size']) {
    expectOkfBundle(`skills/memory-management/evals/fixtures/${scenario}/docs/knowledge`);
  }

  const unknownRoot = read('skills/memory-management/evals/fixtures/unknown-version/docs/knowledge/index.md');
  expectIndex(unknownRoot, 'fixtures/unknown-version/docs/knowledge/index.md', { root: true, version: '9.9' });
  const unknownConcept = read('skills/memory-management/evals/fixtures/unknown-version/docs/knowledge/project.md');
  const parsedUnknown = splitFrontmatter(unknownConcept, 'fixtures/unknown-version/docs/knowledge/project.md');
  assert.equal(parsedUnknown.frontmatter.type, 'Vendor Project Profile');
  assert.equal(parsedUnknown.frontmatter.vendor_extension, 'preserve-me');
  assert.equal(parsedUnknown.frontmatter.title, undefined);
  expectMatch(parsedUnknown.body, /\/steering\/compatibility\.md/);
});

test('CI runs the memory contract regression test', () => {
  const workflow = read('.github/workflows/test-plugin-install.yml');
  expectMatch(workflow, /node --test scripts\/validate-memory-contract\.test\.js/);
});

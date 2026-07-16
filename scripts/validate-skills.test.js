'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  extractOpenQuestionSections,
  validateOpenQuestionSections,
} = require('./validate-skills');

const instruction =
  'For each unresolved decision, provide 2-3 mutually exclusive options. ' +
  'Put the recommended option first, suffix its label with `(Recommended)`, ' +
  'and give one short tradeoff sentence per option.';

test('accepts two or three options with exactly one recommendation first', () => {
  const content = `
## Open Questions
${instruction}

1. **Which path should we take?**
   - **Path A (Recommended)** — Best default.
   - **Path B** — Lower cost.

2. **Which rollout should we use?**
   - **Canary (Recommended)** — Lowest risk.
   - **Team only** — Fast feedback.
   - **All users** — Fastest reach.
`;

  assert.deepEqual(validateOpenQuestionSections(content), []);
});

test('rejects a free-form section even when contract phrases exist elsewhere', () => {
  const content = `
${instruction}

## Open Questions
- Which path should we take?
`;

  assert.match(
    validateOpenQuestionSections(content).join('\n'),
    /must require 2-3 mutually exclusive options/
  );
});

test('rejects option counts outside the 2-3 choice boundary', () => {
  const oneOption = `
## Open Questions
${instruction}
1. **Which path?**
   - **Path A (Recommended)** — Only choice.
`;
  const fourOptions = `
## Open Questions
${instruction}
1. **Which path?**
   - **Path A (Recommended)** — First choice.
   - **Path B** — Second choice.
   - **Path C** — Third choice.
   - **Path D** — Fourth choice.
`;

  assert.match(validateOpenQuestionSections(oneOption).join('\n'), /has 1 option; expected 2-3/);
  assert.match(validateOpenQuestionSections(fourOptions).join('\n'), /has 4 options; expected 2-3/);
});

test('rejects missing, misplaced, or multiple recommendations', () => {
  const missing = `
## Open Questions
${instruction}
1. **Which path?**
   - **Path A** — First choice.
   - **Path B** — Second choice.
`;
  const misplaced = `
## Open Questions
${instruction}
1. **Which path?**
   - **Path A** — First choice.
   - **Path B (Recommended)** — Second choice.
`;
  const multiple = `
## Open Questions
${instruction}
1. **Which path?**
   - **Path A (Recommended)** — First choice.
   - **Path B (Recommended)** — Second choice.
`;

  assert.match(validateOpenQuestionSections(missing).join('\n'), /exactly one recommended option/);
  assert.match(validateOpenQuestionSections(misplaced).join('\n'), /recommended option must be first/);
  assert.match(validateOpenQuestionSections(multiple).join('\n'), /exactly one recommended option/);
});

test('rejects options without a concise tradeoff', () => {
  const content = `
## Open Questions
${instruction}
1. **Which path?**
   - **Path A (Recommended)**
   - **Path B** — Has a tradeoff.
`;

  assert.match(validateOpenQuestionSections(content).join('\n'), /must include a tradeoff/);
});

test('counts and rejects malformed option bullets', () => {
  const content = `
## Open Questions
${instruction}
1. **Which path?**
   - Unformatted choice
   - **Path A (Recommended)** — First valid choice.
   - **Path B** — Second valid choice.
   - **Path C** — Third valid choice.
`;
  const errors = validateOpenQuestionSections(content).join('\n');

  assert.match(errors, /has 4 options; expected 2-3/);
  assert.match(errors, /must use the multiple-choice option format/);
  assert.match(errors, /recommended option must be first/);
});

test('rejects malformed numbered questions mixed with valid questions', () => {
  const content = `
## Open Questions
${instruction}
1. Which path should we take?
2. **Which valid path should we take?**
   - **Path A (Recommended)** — Best default.
   - **Path B** — Lower cost.
`;

  assert.match(
    validateOpenQuestionSections(content).join('\n'),
    /question `1\. Which path should we take\?` must use the numbered question format/
  );
});

test('allows an explicit None entry when no question remains', () => {
  const content = `
## Open Questions
${instruction}
- None.
`;

  assert.deepEqual(validateOpenQuestionSections(content), []);
});

test('rejects free-form bullets combined with a None entry', () => {
  const content = `
## Open Questions
${instruction}
- Which path should we take?
- None.
`;

  assert.match(validateOpenQuestionSections(content).join('\n'), /must not combine `- None\.`/);
});

test('extracts repeated indented headings in linear-sized output', () => {
  const content = Array.from({ length: 4000 }, () => ' ## Open Questions').join('\n');
  const sections = extractOpenQuestionSections(content);

  assert.equal(sections.length, 4000);
  assert.equal(sections.reduce((total, section) => total + section.length, 0), 0);
});

test('the idea-refine example follows the structural choice contract', () => {
  const examplePath = path.resolve(__dirname, '..', 'skills', 'idea-refine', 'examples.md');
  const content = fs.readFileSync(examplePath, 'utf8');

  assert.deepEqual(validateOpenQuestionSections(content, { requireInstructions: false }), []);
});

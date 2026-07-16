#!/usr/bin/env node
/**
 * validate-skills.js
 *
 * Validates every skill in skills/ against the rules in docs/skill-anatomy.md.
 *
 * Checks (errors block CI):
 *   - SKILL.md exists in every skill directory
 *   - YAML frontmatter present with 'name' and 'description' fields
 *   - frontmatter 'name' matches the directory name
 *   - description does not exceed 1024 characters
 *   - required sections are present
 *
 * Checks (warnings, do not block CI):
 *   - cross-skill references point to known skills
 *
 * Exit codes: 0 = all clear, 1 = one or more errors
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const SKILLS_DIR = path.resolve(__dirname, '..', 'skills');

const MAX_DESCRIPTION_LENGTH = 1024;

// Sections every standard SKILL.md must contain.
// Each entry is an array of acceptable heading strings — the first
// match wins, so you can list canonical + legacy aliases.
const REQUIRED_SECTIONS = [
  ['## Overview'],
  ['## When to Use'],
  ['## Common Rationalizations'],
  ['## Red Flags'],
  ['## Verification'],
];

// Skills that are intentionally exempt from section checks.
// Exemptions live HERE, not in skill frontmatter, so contributors
// cannot bypass the validator by editing their own skill file.
// Every entry must have a documented reason.
const SECTION_EXEMPT_SKILLS = {
  'using-lucas-harness': 'Meta-skill — orchestrates other skills; When-to-Use and Verification are not applicable to a routing document.',
  'idea-refine':        'Legacy structure predating skill-anatomy.md — uses How-It-Works/Usage/Anti-patterns instead of standard headings. Tracked for conformance in https://github.com/tinyc0der/lucas-harness/issues',
  'orchestration':      'External tool-reference skill pulled verbatim from stablyai/orca; documents the `orca orchestration` CLI rather than a lucas-harness process, so it does not follow the skill-anatomy section template. Kept in sync with upstream, so it must not be reformatted.',
};

// Regex patterns that indicate an explicit cross-skill reference.
// Only these patterns trigger the dead-reference warning — generic
// backtick strings in code blocks are intentionally excluded.
const SKILL_REF_PATTERNS = [
  /\buse the `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /\bfollow the `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /\binvoke the `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /\bcontinue with `([a-z][a-z0-9-]+[a-z0-9])`/g,
  /\buse `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /`([a-z][a-z0-9-]+[a-z0-9])` skill\b/g,
  /`([a-z][a-z0-9-]+[a-z0-9])` persona\b/g,
  /\bsee `([a-z][a-z0-9-]+[a-z0-9])`/g,
  /──→ ([a-z][a-z0-9-]+[a-z0-9])\b/g,          // ASCII diagram arrows
  /→ `([a-z][a-z0-9-]+[a-z0-9])`/g,
];

const PER_FEATURE_ARTIFACT_PATTERN = /docs\/specs\/<slug>/;
const RAW_BRANCH_SLUG_PATTERN = /<slug>[^.\n]*(?:current git branch|git branch name)/i;
const SAFE_SLUG_PATTERN = /(?:saniti[sz]ed|filesystem-safe|single path segment|no `\/`|without slashes)/i;
const LOCAL_FILE_URI_LINK_PATTERN = /\[[^\]]+\]\(file:\/\/|<file:\/\//;

const OPEN_QUESTION_OPTION_SKILLS = new Set([
  'idea-refine',
  'planning-and-task-breakdown',
  'spec-driven-development',
]);

const OPEN_QUESTION_INSTRUCTION_REQUIREMENTS = [
  {
    pattern: /2(?:-|–| to )3 mutually exclusive options/i,
    message: 'Open Questions must require 2-3 mutually exclusive options.',
  },
  {
    pattern: /recommended option first/i,
    message: 'Open Questions must place the recommended option first.',
  },
  {
    pattern: /\(Recommended\)/,
    message: 'Open Questions must label the recommended option with `(Recommended)`.',
  },
];

const OPEN_QUESTION_EXAMPLE_FILES = {
  'idea-refine': ['examples.md'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse YAML-style frontmatter from the top of a markdown file.
 * Returns a key→value object, or null if no frontmatter block found.
 * Values are stripped of surrounding quotes.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n/);
  if (!match) return null;

  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key   = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Collect all explicit skill cross-references from content.
 * Only matches against the SKILL_REF_PATTERNS list to avoid
 * false-positives from inline code snippets.
 */
function extractSkillReferences(content) {
  const refs = new Set();
  for (const pattern of SKILL_REF_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(content)) !== null) {
      refs.add(m[1]);
    }
  }
  return refs;
}

/**
 * Extract the body of every `## Open Questions` section. Sections may appear
 * inside fenced artifact templates, so a closing fence also ends the body.
 */
function extractOpenQuestionSections(content) {
  const lines = content.split(/\r?\n/);
  const sections = [];
  let body = null;

  for (const line of lines) {
    const normalized = line.trim();

    if (normalized === '## Open Questions') {
      if (body !== null) sections.push(body.join('\n'));
      body = [];
      continue;
    }

    if (body !== null && (/^##\s/.test(normalized) || /^```/.test(normalized))) {
      sections.push(body.join('\n'));
      body = null;
      continue;
    }

    if (body !== null) body.push(line);
  }

  if (body !== null) sections.push(body.join('\n'));

  return sections;
}

/**
 * Validate that Open Questions are bounded decisions rather than free-form
 * prompts. Semantic exclusivity cannot be proven mechanically, so skill
 * templates must state it explicitly while their sample shape is validated.
 */
function validateOpenQuestionSections(content, { requireInstructions = true } = {}) {
  const errors = [];
  const sections = extractOpenQuestionSections(content);

  if (sections.length === 0) {
    return ['Missing `## Open Questions` section.'];
  }

  sections.forEach((section, sectionIndex) => {
    const prefix = `Open Questions section ${sectionIndex + 1}`;

    if (requireInstructions) {
      for (const requirement of OPEN_QUESTION_INSTRUCTION_REQUIREMENTS) {
        if (!requirement.pattern.test(section)) {
          errors.push(`${prefix} ${requirement.message}`);
        }
      }
    }

    const lines = section.split(/\r?\n/);
    const hasNone = lines.some(line => line.trim() === '- None.');
    const questions = [];
    const malformedQuestions = [];
    const unexpectedBullets = [];
    let currentQuestion = null;

    for (const line of lines) {
      const questionMatch = line.match(/^\s*\d+\.\s+\*\*(.+)\*\*\s*$/);
      if (questionMatch) {
        currentQuestion = { options: [] };
        questions.push(currentQuestion);
        continue;
      }

      if (/^\s*\d+\.\s+\S/.test(line)) {
        malformedQuestions.push(line.trim());
        currentQuestion = null;
        continue;
      }

      const bulletMatch = line.match(/^\s*-\s+(.+)\s*$/);
      if (!bulletMatch || line.trim() === '- None.') continue;

      if (!currentQuestion) {
        unexpectedBullets.push(line.trim());
        continue;
      }

      const optionMatch = line.match(/^\s*-\s+\*\*(.+?)\*\*(?:\s+—\s*(.*))?\s*$/);
      if (optionMatch) {
        currentQuestion.options.push({
          label: optionMatch[1],
          tradeoff: optionMatch[2],
          malformed: false,
        });
      } else {
        currentQuestion.options.push({
          label: bulletMatch[1],
          tradeoff: null,
          malformed: true,
        });
      }
    }

    if (hasNone) {
      if (questions.length > 0 || malformedQuestions.length > 0 || unexpectedBullets.length > 0) {
        errors.push(`${prefix} must not combine \`- None.\` with questions or other bullets.`);
      }
      return;
    }

    for (const question of malformedQuestions) {
      errors.push(
        `${prefix} question \`${question}\` must use the numbered question format ` +
        '`1. **Question?**`.'
      );
    }

    for (const bullet of unexpectedBullets) {
      errors.push(`${prefix} unexpected bullet \`${bullet}\`; use a numbered question followed by options.`);
    }

    if (questions.length === 0) {
      errors.push(`${prefix} must include at least one numbered multiple-choice question.`);
      return;
    }

    questions.forEach((question, questionIndex) => {
      const questionPrefix = `${prefix}, question ${questionIndex + 1}`;
      const optionCount = question.options.length;

      if (optionCount < 2 || optionCount > 3) {
        errors.push(`${questionPrefix} has ${optionCount} option${optionCount === 1 ? '' : 's'}; expected 2-3.`);
      }

      for (const option of question.options) {
        if (option.malformed) {
          errors.push(
            `${questionPrefix} option \`${option.label}\` must use the multiple-choice option format ` +
            '`- **Label** — Tradeoff`.'
          );
        } else if (!option.tradeoff || option.tradeoff.trim().length === 0) {
          errors.push(`${questionPrefix} option \`${option.label}\` must include a tradeoff after an em dash.`);
        } else if (option.tradeoff.trim().split(/\s+/).length > 30) {
          errors.push(`${questionPrefix} option \`${option.label}\` must keep its tradeoff to 30 words or fewer.`);
        }
      }

      const recommendedIndexes = question.options
        .map((option, index) => !option.malformed && option.label.endsWith(' (Recommended)') ? index : -1)
        .filter(index => index !== -1);

      if (recommendedIndexes.length !== 1) {
        errors.push(`${questionPrefix} must have exactly one recommended option.`);
      } else if (recommendedIndexes[0] !== 0) {
        errors.push(`${questionPrefix} recommended option must be first.`);
      }
    });
  });

  return errors;
}

// ─── Validator ───────────────────────────────────────────────────────────────

function validateSkill(dirName, knownSkills) {
  const errors   = [];
  const warnings = [];
  let   exempt   = false;
  const skillPath = path.join(SKILLS_DIR, dirName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    errors.push('Missing SKILL.md');
    return { errors, warnings, exempt };
  }

  let content;
  try {
    content = fs.readFileSync(skillPath, 'utf8');
  } catch (err) {
    errors.push(`Unreadable SKILL.md: ${err.message}`);
    return { errors, warnings, exempt };
  }

  // ── Frontmatter ──────────────────────────────────────────────────────────
  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push('Missing or malformed YAML frontmatter (expected --- block at top of file)');
    return { errors, warnings, exempt };
  }

  if (!fm.name) {
    errors.push("Frontmatter missing required field: 'name'");
  } else if (fm.name !== dirName) {
    errors.push(`Frontmatter name '${fm.name}' does not match directory name '${dirName}'`);
  }

  if (!fm.description) {
    errors.push("Frontmatter missing required field: 'description'");
  } else if (fm.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(
      `Description is ${fm.description.length} chars — exceeds the ${MAX_DESCRIPTION_LENGTH}-char limit` +
      ` (agents inject this into the system prompt)`
    );
  }

  // ── Exemption guard ──────────────────────────────────────────────────────
  // Exemptions are validator-owned (SECTION_EXEMPT_SKILLS above).
  // If a skill's frontmatter tries to declare its own exemption, fail loud —
  // that's a sign someone is trying to bypass the validator.
  if (fm.type === 'meta' || fm.exempt === 'sections') {
    if (!SECTION_EXEMPT_SKILLS[dirName]) {
      errors.push(
        `Frontmatter declares 'type: meta' or 'exempt: sections' but '${dirName}' is not in ` +
        `the validator's SECTION_EXEMPT_SKILLS allowlist. ` +
        `Add an entry to scripts/validate-skills.js with a documented reason.`
      );
    }
  }

  // ── Required sections ────────────────────────────────────────────────────
  exempt = dirName in SECTION_EXEMPT_SKILLS;

  if (!exempt) {
    for (const aliases of REQUIRED_SECTIONS) {
      const found = aliases.some(heading => content.includes(heading));
      if (!found) {
        errors.push(`Missing required section: ${aliases[0]}`);
      }
    }
  }

  // ── Cross-skill references ───────────────────────────────────────────────
  const refs = extractSkillReferences(content);
  for (const ref of refs) {
    if (!knownSkills.has(ref)) {
      warnings.push(`Dead cross-reference: \`${ref}\` is not a known skill`);
    }
  }

  // ── Per-feature artifact slug safety ─────────────────────────────────────
  // Branch names commonly contain slashes (feature/foo, remote/foo). Skills
  // must not imply that raw branch names can be interpolated directly into
  // docs/specs/<slug>/ paths, or agents will create nested directories.
  for (const line of content.split(/\r?\n/)) {
    if (LOCAL_FILE_URI_LINK_PATTERN.test(line)) {
      errors.push(
        'Skill examples must not use local file URI markdown links; use repo-relative or same-directory relative links.'
      );
      break;
    }
  }

  for (const line of content.split(/\r?\n/)) {
    if (
      PER_FEATURE_ARTIFACT_PATTERN.test(line) &&
      RAW_BRANCH_SLUG_PATTERN.test(line) &&
      !SAFE_SLUG_PATTERN.test(line)
    ) {
      errors.push(
        'Per-feature artifact path mentions `<slug>` as the current git branch without also requiring ' +
        'a sanitized/filesystem-safe single path segment.'
      );
      break;
    }
  }

  // ── Open-question decision contract ────────────────────────────────────
  // Define, spec, and plan artifacts should turn unresolved decisions into
  // answerable choices instead of handing humans an unbounded blank prompt.
  if (OPEN_QUESTION_OPTION_SKILLS.has(dirName)) {
    errors.push(...validateOpenQuestionSections(content));

    for (const exampleFile of OPEN_QUESTION_EXAMPLE_FILES[dirName] || []) {
      const examplePath = path.join(SKILLS_DIR, dirName, exampleFile);
      if (!fs.existsSync(examplePath)) {
        errors.push(`Missing Open Questions example file: ${exampleFile}`);
        continue;
      }

      const exampleContent = fs.readFileSync(examplePath, 'utf8');
      for (const error of validateOpenQuestionSections(exampleContent, { requireInstructions: false })) {
        errors.push(`${exampleFile}: ${error}`);
      }
    }
  }

  return { errors, warnings, exempt };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`ERROR: skills directory not found at ${SKILLS_DIR}`);
    process.exit(1);
  }

  const skillDirs = fs.readdirSync(SKILLS_DIR)
    .filter(d => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory())
    .sort();

  const knownSkills = new Set(skillDirs);

  let totalErrors   = 0;
  let totalWarnings = 0;

  for (const dirName of skillDirs) {
    const { errors, warnings, exempt } = validateSkill(dirName, knownSkills);
    totalErrors   += errors.length;
    totalWarnings += warnings.length;

    if (errors.length === 0 && warnings.length === 0) {
      const tag = exempt ? ' (section checks exempt)' : '';
      console.log(`  ✓  ${dirName}${tag}`);
    } else {
      const icon = errors.length > 0 ? '  ✗ ' : '  ⚠ ';
      console.log(`${icon} ${dirName}`);
      for (const msg of errors)   console.log(`       ERROR: ${msg}`);
      for (const msg of warnings) console.log(`       WARN:  ${msg}`);
    }
  }

  const status = totalErrors > 0 ? 'FAILED' : totalWarnings > 0 ? 'PASSED WITH WARNINGS' : 'PASSED';
  console.log(`\n${skillDirs.length} skills checked — ${totalErrors} error(s), ${totalWarnings} warning(s) — ${status}`);

  if (totalErrors > 0) process.exit(1);
}

// Surface unexpected failures (fs errors, bad symlinks, …) as a structured
// one-line CI error instead of an uncaught stack trace.
if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`\nERROR: validate-skills failed unexpectedly: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  extractOpenQuestionSections,
  validateOpenQuestionSections,
};

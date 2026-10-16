import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_PROMPT, AGENT_PROMPT_PATH, SETUP_LINE, SITE, SKILL_COMMAND } from '../src/data.js';
import { markdownPages } from '../src/llms/index.js';
import { RELEASE } from '../src/release.js';

test('the line a visitor pastes points at instructions the build writes', () => {
    assert.ok(SETUP_LINE.includes(`${SITE}${AGENT_PROMPT_PATH}`));
    assert.equal(markdownPages().find((page) => page.path === AGENT_PROMPT_PATH)?.markdown, AGENT_PROMPT);
});

test('the instructions install the skill, carry on from llms.txt without it, and verify a call', () => {
    assert.ok(AGENT_PROMPT.includes(SKILL_COMMAND));
    assert.ok(AGENT_PROMPT.includes(`${SITE}/llms.txt`));
    assert.match(AGENT_PROMPT, /verify at least one JavaScript-to-native call/);
    if (RELEASE.distTagSuffix) assert.ok(AGENT_PROMPT.includes(`npm \`${RELEASE.distTag}\` tag`));
});

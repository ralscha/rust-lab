import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runnerSmokeEnabled } from './check-runner-health.mjs';

const health = {
  ok: true,
  runnerEnabled: true,
  runnerRuntime: 'runsc',
  runnerRequiresGvisor: true,
};

test('public deployment requires gVisor to remain mandatory after restart', () => {
  assert.equal(runnerSmokeEnabled(health, true), true);
  for (const overrides of [
    { runnerRuntime: null },
    { runnerRequiresGvisor: false },
    { runnerEnabled: false },
  ]) {
    assert.throws(() => runnerSmokeEnabled({ ...health, ...overrides }, true), /mandatory gVisor/);
  }
});

test('authenticated deployment skips smoke tests when the backend reports disabled', () => {
  assert.equal(runnerSmokeEnabled({ ...health, runnerEnabled: false }, false), false);
  assert.equal(
    runnerSmokeEnabled({ ...health, runnerRuntime: null, runnerRequiresGvisor: false }, false),
    true,
  );
});

test('missing or malformed health settings fail instead of skipping smoke tests', () => {
  for (const invalid of [
    null,
    { ok: true },
    { ...health, ok: false },
    { ...health, runnerEnabled: 'false' },
    { ...health, runnerRuntime: 'runc' },
    { ...health, runnerRequiresGvisor: undefined },
  ]) {
    assert.throws(() => runnerSmokeEnabled(invalid, false), /valid runner settings/);
  }
});

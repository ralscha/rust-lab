import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function runnerSmokeEnabled(health, publicAccess) {
  if (
    health?.ok !== true ||
    typeof health.runnerEnabled !== 'boolean' ||
    typeof health.runnerRequiresGvisor !== 'boolean' ||
    ![null, 'runsc'].includes(health.runnerRuntime)
  ) {
    throw new Error('Backend did not report valid runner settings.');
  }
  if (
    publicAccess &&
    (!health.runnerRequiresGvisor || health.runnerRuntime !== 'runsc' || !health.runnerEnabled)
  ) {
    throw new Error('Public access requires an enabled runner with mandatory gVisor isolation.');
  }
  return health.runnerEnabled;
}

if (
  process.argv[1] &&
  realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])
) {
  try {
    const [publicAccess, healthFile] = process.argv.slice(2);
    if (!['true', 'false'].includes(publicAccess)) {
      throw new Error('Public access must be true or false.');
    }
    const health = JSON.parse(readFileSync(healthFile, 'utf8'));
    console.log(runnerSmokeEnabled(health, publicAccess === 'true'));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

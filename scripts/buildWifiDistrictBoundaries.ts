import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function geographicPython(): string {
  const local = path.join(root, '.omx', 'geographic-venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  return process.env.GEOGRAPHIC_PYTHON || (existsSync(local) ? local : process.platform === 'win32' ? 'python' : 'python3');
}

/** Runs only local, pinned GIS tooling. Nonzero exit prevents downstream publication. */
export function runGeographic(module = 'boundaries', args: string[] = []): string {
  if (!/^[a-z_]+$/.test(module)) throw new Error('Invalid geographic module');
  const result = spawnSync(geographicPython(), ['-m', `scripts.geographic.${module}`, ...args], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PROJ_NETWORK: 'OFF' }, maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw new Error(`Offline geographic ${module} failed. Set up Python 3.12 with requirements-geographic.txt.\n${result.error?.message ?? ''}${result.stderr}${result.stdout}`);
  return result.stdout;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) console.log(runGeographic());

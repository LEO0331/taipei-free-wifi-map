import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const local = path.resolve('.venv-gis',process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const system = process.platform === 'win32' ? 'python' : 'python3';
function run(command: string, args: string[]) {
  const result = spawnSync(command,args,{stdio:'inherit',env:{...process.env,PYTHONUTF8:'1',PROJ_NETWORK:'OFF'}});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const action = process.argv[2];
if (action === 'setup') {
  if (!existsSync(local)) run(system,['-m','venv','.venv-gis']);
  run(local,['-m','pip','install','-r','scripts/requirements-geographic.txt']);
} else {
  if (!existsSync(local)) throw new Error('Run npm run data:setup:geographic first (Python 3.14 required).');
  run(local,action === 'test' ? ['-m','unittest','discover','-s','tests','-p','geographic_test.py','-v'] : action === 'report' ? ['scripts/reportWifiGeographic.py'] : ['scripts/buildWifiGeographic.py']);
}

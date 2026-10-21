import { access, cp, mkdir, mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

if (process.platform !== 'darwin') throw new Error('DMG packaging must run on macOS.');
const root = process.cwd();
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const directory = path.resolve(process.argv[2] || path.join(root, 'release', pkg.version, `darwin-${process.arch}`));
const appPath = path.join(directory, 'OpenMind.app');
const dmgPath = path.join(directory, `OpenMind-darwin-${process.arch}-${pkg.version}.dmg`);
const zipPath = path.join(directory, `OpenMind-darwin-${process.arch}-${pkg.version}.zip`);
await access(path.join(appPath, 'Contents', 'Info.plist'));
for (const output of [dmgPath, zipPath]) {
  try { await access(output); throw new Error(`輸出已存在：${output}。不會覆寫既有發行檔。`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}

const stage = await mkdtemp(path.join(os.tmpdir(), 'openmind-dmg-'));
try {
  await cp(appPath, path.join(stage, 'OpenMind.app'), { recursive: true, errorOnExist: true, verbatimSymlinks: true });
  await symlink('/Applications', path.join(stage, 'Applications'));
  await mkdir(directory, { recursive: true });
  execFileSync('/usr/sbin/diskutil', ['image', 'create', 'from', '--volumeName', 'OpenMind', '--format', 'UDZO', stage, dmgPath], { stdio: 'inherit' });
  execFileSync('/usr/bin/ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', appPath, zipPath], { stdio: 'inherit' });
} finally {
  await rm(stage, { recursive: true, force: true });
}
console.log(`Created drag-to-Applications installer: ${dmgPath}`);
console.log(`Created signed-app update archive: ${zipPath}`);

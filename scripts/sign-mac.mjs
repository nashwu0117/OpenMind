import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { sign } from '@electron/osx-sign';

if (process.platform !== 'darwin') throw new Error('macOS signing must run on a macOS host.');
const identity = process.env.APPLE_SIGN_IDENTITY;
if (!identity) throw new Error('APPLE_SIGN_IDENTITY is required for a distribution build.');
const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const appPath = path.resolve(process.argv[2] || path.join(root, 'release', packageJson.version, `darwin-${process.arch}`, 'OpenMind.app'));
await access(path.join(appPath, 'Contents', 'Info.plist'));
const mainExecutable = path.join(appPath, 'Contents', 'MacOS', 'OpenMind');

await sign({
  app: appPath,
  platform: 'darwin',
  type: 'distribution',
  identity,
  optionsForFile: (filePath) => path.resolve(filePath) === mainExecutable
    ? { entitlements: ['com.apple.security.cs.allow-jit'], hardenedRuntime: true }
    : null,
});
execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' });
console.log(`Developer ID signature verified: ${appPath}`);

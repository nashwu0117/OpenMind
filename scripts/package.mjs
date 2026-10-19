// Host-native development bundle; no downloader or installer generator required.
import {cp,readFile,writeFile,mkdir,rename,access} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),platform=process.platform,arch=process.arch;
const base=path.join(root,'release',`${platform}-${arch}`);
const target=path.join(base,platform==='darwin'?'OpenMind.app':'OpenMind');
try{await access(target);throw new Error(`輸出已存在：${target}。請先自行移到備份位置，腳本不會覆寫既有套件。`);}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(base,{recursive:true});
const runtime=path.join(root,'node_modules/electron/dist');
await cp(platform==='darwin'?path.join(runtime,'Electron.app'):runtime,target,{recursive:true,errorOnExist:true,verbatimSymlinks:true});
const resources=path.join(target,platform==='darwin'?'Contents/Resources':'resources');
const appPath=path.join(resources,'app');await mkdir(appPath,{recursive:true});
for(const name of ['dist','electron','LICENSE','THIRD_PARTY_NOTICES.md'])await cp(path.join(root,name),path.join(appPath,name),{recursive:true});
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
await writeFile(path.join(appPath,'package.json'),JSON.stringify({name:pkg.name,version:pkg.version,description:pkg.description,license:pkg.license,main:pkg.main}));
if(platform==='darwin'){
 const plistPath=path.join(target,'Contents/Info.plist');let plist=await readFile(plistPath,'utf8');
 for(const [key,value]of Object.entries({CFBundleName:'OpenMind',CFBundleDisplayName:'OpenMind',CFBundleIdentifier:'org.openmind.editor',CFBundleExecutable:'OpenMind',CFBundleShortVersionString:pkg.version,CFBundleVersion:pkg.version,NSHumanReadableCopyright:'OpenMind contributors · Apache-2.0'})){
  const re=new RegExp(`(<key>${key}</key>\\s*<string>)[^<]*(</string>)`);if(re.test(plist))plist=plist.replace(re,`$1${value}$2`);else plist=plist.replace('</dict>',`<key>${key}</key><string>${value}</string></dict>`);
 }
 await writeFile(plistPath,plist);await rename(path.join(target,'Contents/MacOS/Electron'),path.join(target,'Contents/MacOS/OpenMind'));
 // Development signature only. Distribution/notarization is a separate release step.
 execFileSync('/usr/bin/codesign',['--force','--deep','--sign','-',target],{stdio:'pipe'});
 execFileSync('/usr/bin/codesign',['--verify','--deep','--strict',target],{stdio:'pipe'});
}else if(platform==='win32')await rename(path.join(target,'electron.exe'),path.join(target,'OpenMind.exe'));
else await rename(path.join(target,'electron'),path.join(target,'openmind'));
console.log(`Packaged ${platform}/${arch}: ${target}`);
console.log('Development bundle only; no installer, notarization or distribution signature.');

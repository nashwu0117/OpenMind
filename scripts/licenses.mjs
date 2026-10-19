import {readFile,writeFile} from 'node:fs/promises';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const rows=Object.entries(lock.packages).filter(([p])=>p).map(([p,v])=>({name:p.split('node_modules/').at(-1),version:v.version,license:v.license??'See package license',dev:!!v.dev}));
let output='# Third-party notices\n\nGenerated from the lockfile. Runtime license texts below are included with the app; Electron/Chromium retain their own license files in the packaged runtime. Development-only tools are listed for reproducibility and are not shipped as dependencies. No proprietary XMind assets/code are included. System fonts are referenced, not redistributed.\n\n| Package | Version | License | Scope |\n|---|---|---|---|\n';
for(const r of rows)output+=`| ${r.name} | ${r.version} | ${r.license} | ${r.dev?'Development':'Runtime'} |\n`;
for(const name of ['react','react-dom','scheduler','lucide-react','electron']){const text=await readFile(`node_modules/${name}/LICENSE`,'utf8');output+=`\n## ${name}\n\n\`\`\`text\n${text}\n\`\`\`\n`;}
await writeFile('THIRD_PARTY_NOTICES.md',output);console.log(`Wrote license manifest for ${rows.length} packages and 5 runtime license texts.`);

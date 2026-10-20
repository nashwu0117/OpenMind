import {readFile,writeFile,readdir} from 'node:fs/promises';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const rows=Object.entries(lock.packages).filter(([p])=>p).map(([p,v])=>({name:p.split('node_modules/').at(-1),version:v.version,license:v.license??'See package license',dev:!!v.dev}));
let output='# Third-party notices\n\nGenerated from the lockfile. Runtime license texts below are included with the app; Electron/Chromium retain their own license files in the packaged runtime. Development-only tools are listed for reproducibility and are not shipped as dependencies. No proprietary XMind assets/code are included. Noto Sans TC is redistributed unmodified through Fontsource under OFL-1.1; system fallback fonts are not redistributed.\n\n| Package | Version | License | Scope |\n|---|---|---|---|\n';
for(const r of rows)output+=`| ${r.name} | ${r.version} | ${r.license} | ${r.dev?'Development':'Runtime'} |\n`;
const runtime=[...new Set([...rows.filter(r=>!r.dev).map(r=>r.name),'electron'])];
for(const name of runtime){const files=await readdir(`node_modules/${name}`),license=files.find(file=>/^license(?:\.(?:md|txt))?$/i.test(file));
  // This font package declares Apache-2.0 but omits its own text; include the same full Apache license shipped by MathJax.
  if(!license&&name!=='@mathjax/mathjax-newcm-font')throw new Error(`Missing runtime license: ${name}`);
  const text=await readFile(license?`node_modules/${name}/${license}`:'node_modules/@mathjax/src/LICENSE','utf8');output+=`\n## ${name}\n\n\`\`\`text\n${text}\n\`\`\`\n`;
}
await writeFile('THIRD_PARTY_NOTICES.md',output);console.log(`Wrote license manifest for ${rows.length} packages and ${runtime.length} runtime license texts.`);

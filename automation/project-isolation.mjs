import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectId = 'appgprj_6a630a89bf208191bc7915a9410ae47a';
const peerReferences = [
  /appgprj_6ace4c9cb44881918b979e11d440c586/i,
  /brangecycle\.jimblogic\.chatgpt\.site/i,
  /(?:github\.com[/:]|github:|git@github\.com:)JimBLogic\/brangecycle(?:[\s/#.\x22\x27:]|$)/i,
  /(?:repository|uses)\s*:\s*['\x22]?JimBLogic\/brangecycle(?:[\s/@\x22\x27]|$)/i,
];
const excluded = new Set(['node_modules', '.git', '.wrangler', '.sites-runtime', 'dist', '.next', 'docs', 'vendor']);
const surfaces = ['sites-current/app', 'sites-current/db', 'sites-current/lib', 'sites-current/worker',
  'sites-current/build', 'sites-current/scripts', 'sites-current/.openai', 'automation', '.github', 'qa',
  'sites-current/package.json', 'sites-current/package-lock.json', 'sites-current/vite.config.ts',
  'sites-current/wrangler.selfhost.jsonc', 'sites-current/compose.selfhost.yml', 'sites-current/compose.local.yml',
  'sites-current/Dockerfile.selfhost', 'sites-current/Dockerfile.local'];

export async function verifyProjectIsolation(root) {
  const failures = [];
  const manifest = JSON.parse(await readFile(path.join(root, 'sites-current/.openai/hosting.json'), 'utf8'));
  if (manifest.project_id !== projectId) failures.push('ABCM Site identity changed');
  if (manifest.d1 !== 'DB' || manifest.r2 !== null) failures.push('ABCM storage contract changed: review bindings explicitly');
  let filesChecked = 0;
  async function scan(relative) {
    const absolute = path.join(root, relative);
    const info = await lstat(absolute).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (!info) return;
    if (info.isSymbolicLink()) { failures.push(`${relative}: symlink may escape project isolation`); return; }
    if (info.isDirectory()) {
      for (const entry of (await readdir(absolute)).sort()) {
        if (!excluded.has(entry)) await scan(`${relative}/${entry}`);
      }
      return;
    }
    if (relative === 'automation/project-isolation.mjs' || relative === 'automation/project-isolation.test.mjs') return;
    if (!/\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|sh)$/.test(relative) && !/Dockerfile\./.test(relative)) return;
    filesChecked++;
    const source = await readFile(absolute, 'utf8');
    if (peerReferences.some(pattern => pattern.test(source))) failures.push(`${relative}: peer project reference in executable/deployment surface`);
    if (/\bremote\s*[\x22\x27]?\s*:\s*true/.test(source)) failures.push(`${relative}: remote storage binding`);
    if (/wrangler[^\n]*\bd1\b[^\n]*--remote\b/.test(source)) failures.push(`${relative}: remote database command`);
  }
  for (const surface of surfaces) await scan(surface);
  if (failures.length) throw new Error(`Project isolation failed:\n${failures.join('\n')}`);
  return { project: 'ABCM', projectId, filesChecked, runtimeCoupling: 'none detected' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  console.log(JSON.stringify(await verifyProjectIsolation(root)));
}

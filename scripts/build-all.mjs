// Builds every site locally into dist-all/<site>/ so you can sanity check all six before pushing.
import { execSync } from 'node:child_process';
import { readdirSync, rmSync, renameSync, mkdirSync } from 'node:fs';
const sites = readdirSync('src/data/locations').map((f) => f.replace('.json', ''));
rmSync('dist-all', { recursive: true, force: true }); mkdirSync('dist-all');
for (const s of sites) {
  console.log(`\n=== ${s} ===`);
  execSync('npx astro build', { stdio: 'inherit', env: { ...process.env, SITE_ID: s } });
  renameSync('dist/client', `dist-all/${s}`);
}
console.log('\nBuilt:', sites.join(', '));

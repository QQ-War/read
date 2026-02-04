import { mkdir, copyFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const distDir = resolve('dist');
const src = resolve(distDir, 'index.html');
const adminDir = resolve(distDir, 'admin');
const dest = resolve(adminDir, 'index.html');

try {
  await stat(src);
  await mkdir(adminDir, { recursive: true });
  await copyFile(src, dest);
  console.log('[postbuild] admin index copied');
} catch (err) {
  console.warn('[postbuild] skip admin index:', err?.message || err);
}

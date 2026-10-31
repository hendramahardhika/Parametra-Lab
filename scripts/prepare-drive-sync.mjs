import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'public/integrations/google-drive');
await mkdir(target, { recursive: true });
for (const name of ['Code.gs', 'Sync.gs', 'Index.html', 'AKTIVASI.md']) await copyFile(path.join(root, 'integrations/google-drive', name), path.join(target, name));

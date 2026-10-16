import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { unzipSync, zipSync, strToU8 } from 'fflate';

const root = resolve(import.meta.dirname, '..');
const { version } = JSON.parse(
  readFileSync(resolve(root, 'apps/extension/package.json'), 'utf8'),
) as { version: string };
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Expected a numeric release version.');
const filename = `formpilot-${version}-chrome.zip`;
const output = resolve(root, 'apps/extension/.output');
const entries = unzipSync(readFileSync(resolve(output, filename)));
const manifest = JSON.parse(Buffer.from(entries['manifest.json'] ?? []).toString('utf8'));
if (
  manifest.version !== version ||
  manifest.name !== 'FormPilot' ||
  manifest.manifest_version !== 3
)
  throw new Error('The package and production manifest must identify the same FormPilot release.');
if (
  JSON.stringify([...manifest.permissions].sort()) !==
    JSON.stringify(['activeTab', 'scripting', 'storage']) ||
  manifest.host_permissions?.length ||
  manifest.content_scripts?.length ||
  manifest.web_accessible_resources?.length
)
  throw new Error('Unexpected production permission or automatic page access.');

// Distribute only the compiled extension. No source files, settings or local exports.
for (const [name, bytes] of Object.entries(entries)) {
  if (
    name.startsWith('/') ||
    name.includes('\\') ||
    name.split('/').some((part) => part.startsWith('.')) ||
    !['.json', '.js', '.css', '.html', '.png'].includes(extname(name))
  )
    throw new Error(`Unexpected extension archive entry: ${name}`);
  if (!Buffer.from(bytes).equals(readFileSync(resolve(output, 'chrome-mv3', name))))
    throw new Error(`Archive differs from the production build: ${name}`);
}
for (const name of [
  'manifest.json',
  'background.js',
  'detector.js',
  'popup.html',
  'review.html',
  'options.html',
])
  if (!entries[name]) throw new Error(`Missing extension entrypoint: ${name}`);

const instructions = `FormPilot ${version} — prebuilt desktop Chromium extension

No Node.js, npm, account or build step is needed to use this download.

INSTALL
1. Extract ${filename} into a permanent folder, such as Documents/FormPilot.
2. Open chrome://extensions in Chrome, edge://extensions in Edge, or brave://extensions in Brave.
3. Turn on Developer mode. Click Load unpacked.
4. Select the extracted folder containing manifest.json (not the ZIP file).
5. Pin FormPilot. Create and save a profile, or try the fictional sample.
6. On a web form, click FormPilot > Fill form. All empty high-confidence matches fill together.
   No new window opens. Existing values, uncertain matches and sensitive fields are skipped.
   Optional Review fields & corrections stays in the popup. The form is never submitted.
   Undo works while the popup stays open; closing it or scanning again clears undo.

COMPATIBILITY
The production package is tested in Chromium; see docs/QA_REPORT.md in the source repository
for the measured browser version. Chrome 120 is the declared API minimum, not a tested version matrix.
Edge and Brave use Chromium and can load this format, but have not been independently tested here.
Firefox, Safari and mobile browsers are not supported by this package. Browser or organization policies
may prevent Developer mode. There is no published store listing or automatic installer.

UPDATES
Keep this folder in place. Export a profile backup before updating; it contains personal information.
Replace the files in the SAME folder, click Reload on the extension card, refresh the web page,
and reopen the toolbar popup. Do not remove the installed extension first. A new folder can create a new extension
identity and separate storage. There is no automatic update service for this unpacked build.

PRIVACY
Profiles stay in extension-local storage. Storage and profile exports are not encrypted.
Websites can read values once filled. No automatic submission, cloud sync or external matching calls.
No personal profiles or saved settings are included in this archive.

Built by Faizal Imam. FormPilot source is licensed under MIT; see LICENSE.txt.
Source: https://github.com/faizalimam00/FORM-PILOT
Creator: https://github.com/faizalimam00
Documentation: https://github.com/faizalimam00/FORM-PILOT/tree/main/docs
`;
entries['INSTALL.txt'] = strToU8(instructions);
entries['LICENSE.txt'] = readFileSync(resolve(root, 'LICENSE'));
entries['THIRD-PARTY-NOTICES.txt'] = strToU8(
  ['react', 'react-dom', 'scheduler', 'zod']
    .map((name) => {
      const dependencyRoot = resolve(root, 'node_modules', name);
      const pkg = JSON.parse(readFileSync(resolve(dependencyRoot, 'package.json'), 'utf8')) as {
        version: string;
      };
      return `${name} ${pkg.version}\n${'='.repeat(60)}\n${readFileSync(resolve(dependencyRoot, 'LICENSE'), 'utf8')}`;
    })
    .join('\n\n'),
);
const zip = zipSync(entries, { level: 9, mtime: new Date('2020-01-01T00:00:00Z') });
const sha256 = createHash('sha256').update(zip).digest('hex');
const release = {
  version,
  filename,
  bytes: zip.byteLength,
  sha256,
  format: 'chromium-mv3',
  install: 'extract-and-load-unpacked',
};
const artifacts: Record<string, Uint8Array | string> = {
  [filename]: zip,
  'SHA256SUMS.txt': `${sha256}  ${filename}\n`,
  'INSTALL.txt': instructions,
  'release.json': JSON.stringify(release, null, 2) + '\n',
};
for (const directory of ['dist/releases', 'apps/website/public/downloads']) {
  const destination = resolve(root, directory);
  mkdirSync(destination, { recursive: true });
  // Remove only stale generated packages, leaving unrelated files untouched.
  for (const name of readdirSync(destination))
    if (/^formpilot-\d+\.\d+\.\d+-chrome\.zip$/.test(name) && name !== filename)
      rmSync(resolve(destination, name));
  for (const [name, content] of Object.entries(artifacts))
    writeFileSync(resolve(destination, name), content);
}
console.log(`Packaged ${filename} (${zip.byteLength.toLocaleString()} bytes). SHA-256: ${sha256}`);
console.log('Ready in dist/releases/ and website public/downloads/. Nothing was published.');

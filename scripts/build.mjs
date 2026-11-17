import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true, write: false, format: 'iife', target: 'es2022',
  minify: true, legalComments: 'inline', metafile: true,
  loader: { '.wgsl': 'text' },
});
const externals = Object.values(result.metafile.outputs).flatMap(output => output.imports).filter(item => item.external);
if (externals.length) throw new Error('Standalone build has external imports: ' + JSON.stringify(externals));
let html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'src/styles.css'), 'utf8');
const cssTag = /<link\b[^>]*href=["']\/?src\/styles\.css["'][^>]*>/i;
const jsTag = /<script\b[^>]*src=["']\/?src\/main\.js["'][^>]*>\s*<\/script>/i;
if (!cssTag.test(html) || !jsTag.test(html)) throw new Error('index.html must reference src/styles.css and src/main.js for inlining.');
const js = result.outputFiles.find(file => file.path.endsWith('.js'))?.text ?? result.outputFiles[0]?.text;
if (!js) throw new Error('JavaScript build was empty');
html = html.replace(cssTag, () => '<style>' + css.replace(/<\/style/gi, '<\\/style') + '</style>');
html = html.replace(jsTag, () => '<script>' + js.replace(/<\/script/gi, '<\\/script') + '</script>');
if (/<(?:script|link|img|audio)\b[^>]*(?:src|href)=["'](?:https?:)?\/\//i.test(html)) {
  throw new Error('External runtime assets are not allowed in standalone output.');
}
await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(path.join(root, 'dist/stillwater.html'), html);
console.log('Built dist/stillwater.html (' + Math.round(Buffer.byteLength(html) / 1024) + ' KiB), JavaScript and CSS inlined.');

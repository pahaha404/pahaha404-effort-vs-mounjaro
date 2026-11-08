// node tools/bundle.js — src/ 의 ES module 들과 CSS를 index.html 한 파일로 합친다.
// 결과물은 더블클릭(file://)으로도 열린다. 의존성 없음.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => fs.readFileSync(path.join(root, 'src', f), 'utf8');
const ORDER = ['data.js', 'model.js', 'characters.js', 'chart.js', 'intro.js', 'panel.js', 'game.js', 'main.js'];

function toIIFE(file) {
  let code = src(file);
  code = code.replace(/^import[\s\S]*?from\s*'[^']+';\s*$/gm, '');          // import 제거
  const names = [...code.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  code = code.replace(/^export\s+/gm, '');                                    // export 키워드 제거
  const ret = names.length ? `return { ${names.join(', ')} };` : '';
  const head = names.length ? `const { ${names.join(', ')} } = ` : '';
  return `// ---- src/${file} ----\n${head}(() => {\n${code}\n${ret}\n})();\n`;
}

const js = ORDER.map(toIIFE).join('\n');
const css = src('style.css');
let html = src('page.html');
html = html.replace('  <!--STYLE-->\n', `  <style>\n${css}\n  </style>\n`);
html = html.replace('  <!--SCRIPT-->\n', `  <script>\n'use strict';\n${js}\n  </script>\n`);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`index.html 생성: ${(html.length / 1024).toFixed(0)} KB`);

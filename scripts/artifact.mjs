// dist/index.html を、アーティファクト用の本文（doctype/html/head/body なし）に変換する
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const meta = html.match(/<meta name="claude:viewport-fit-sides"[^>]*>/)[0];
const styles = html.match(/<style[\s\S]*?<\/style>/g) ?? [];
const scripts = html.match(/<script[\s\S]*?<\/script>/g) ?? [];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '').trim();

writeFileSync('dist/artifact.html', [title, meta, ...styles, body, ...scripts].join('\n'));
console.log('dist/artifact.html written');

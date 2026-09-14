import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [html,identity,app,tools]=await Promise.all(['index.html','identity.css','src/app.js','src/tools.js'].map(file=>readFile(new URL(file,root),'utf8')));

test('public page contains the Tipmaster-aligned navigation',()=>{assert.match(html,/tm-logo\.png/);assert.match(html,/class="nav-link"[^>]+signin/);assert.match(html,/class="signup-link"[^>]+signup/);assert.match(html,/id="language-toggle"/)});
test('identity layer uses the local trophy hero and Tipmaster palette',()=>{assert.match(identity,/assets\/tipmaster-trophy-hero\.png/);assert.match(identity,/#0f172a/i);assert.match(identity,/#ffcc33/i);assert.match(identity,/#3d8a5c/i)});
test('German and English product copy are both available',()=>{assert.match(app,/Weniger Bauchgefühl/);assert.match(app,/Less guesswork/);assert.match(app,/No live betting/);assert.match(app,/Keine Live-Wetten/)});
test('WebMCP uses the current API and all safety annotations',()=>{assert.match(tools,/document\?\.modelContext/);assert.match(tools,/readOnlyHint/);assert.match(tools,/untrustedContentHint/);assert.match(tools,/consequentialHint/);assert.doesNotMatch(tools,/navigator\.webmcp/)});
test('public files contain no assessment URL or personal email',()=>{for(const content of [html,identity,app,tools]){assert.doesNotMatch(content,/f8825363/);assert.doesNotMatch(content,/@gmail\.com/i)}});
test('all external assets and links are HTTPS',()=>{const urls=[...html.matchAll(/https?:\/\/[^"')\s]+/g),...identity.matchAll(/https?:\/\/[^"')\s]+/g)].map(match=>match[0]);assert.ok(urls.length>=4);assert.ok(urls.every(url=>url.startsWith('https://')))});

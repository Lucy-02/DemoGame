// public/ 아래 이미지가 assets/provenance.jsonl에 기록돼 있는지 검사해요.
// --release: 기록이 없거나 status가 release가 아닌 이미지가 있으면 실패.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const release = process.argv.includes('--release');
const entries = new Map<string, { status?: string }>();
for (const line of readFileSync('assets/provenance.jsonl', 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const e = JSON.parse(line);
  entries.set(e.path, e);
}
function images(dir: string): string[] {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? images(p) : /\.(png|jpe?g|webp)$/i.test(p) ? [p] : [];
  });
}
let bad = 0;
for (const f of images('public')) {
  const key = relative('public', f).replaceAll('\\', '/');
  const e = entries.get(key);
  const problem = !e ? '출처 기록 없음' : e.status !== 'release' ? `상태 ${e.status}` : '';
  if (!problem) continue;
  if (release || !e) bad++;
  console.log(`${release || !e ? '✗' : '·'} ${key}: ${problem}`);
}
console.log(release ? `출시 점검: 문제 ${bad}건` : `출처 기록 없는 이미지 ${bad}건`);
process.exit(bad ? 1 : 0);

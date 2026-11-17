// 소리 파일을 저장소 밖 폴더에서 public/assets/audio/ 로 가져와요 (0087 8번 · 0091).
// 재배포가 막힌 팩이 섞여 있어 저장소와 CI에는 소리 파일이 없어요. 없으면 게임은 조용히 돌아요.
// 쓰는 법: pnpm audio (기본 ~/workspace/jjal/sound-packs/game), 다른 곳이면 SOUND_DIR=<폴더> pnpm audio
import { cpSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const from = process.env.SOUND_DIR ?? join(homedir(), 'workspace/jjal/sound-packs/game');
if (!existsSync(from)) {
  console.log(`소리 폴더가 없어요: ${from} (소리 없이 진행)`);
  process.exit(0);
}
for (const dir of ['sfx', 'music']) {
  if (existsSync(join(from, dir))) cpSync(join(from, dir), join('public/assets/audio', dir), { recursive: true });
}
// 은행이 부르는 파일이 다 왔는지 알려요
const bank = JSON.parse(readFileSync('src/presentation/audio/bank.json', 'utf8')) as { sfx: Record<string, { files: string[] }>; music: Record<string, string> };
const have = (dir: string) => new Set(existsSync(join('public/assets/audio', dir)) ? readdirSync(join('public/assets/audio', dir)) : []);
const sfx = have('sfx');
const music = have('music');
const missing = [
  ...Object.values(bank.sfx).flatMap((e) => e.files).filter((f) => !sfx.has(f)).map((f) => `sfx/${f}`),
  ...Object.values(bank.music).filter((f) => !music.has(f)).map((f) => `music/${f}`),
];
console.log(`소리 가져옴: 효과음 ${sfx.size}개, 음악 ${music.size}개${missing.length ? `, 은행에 있는데 없는 파일 ${missing.length}개: ${missing.join(', ')}` : ''}`);

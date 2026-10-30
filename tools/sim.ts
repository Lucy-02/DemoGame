// 헤드리스 전투 시뮬레이터: 단순 AI로 인카운터별 승률과 평균 턴을 봐요.
// 사용: npm run sim -- [반복 수]
import { ENCOUNTERS } from "../src/core/data";
import { autoBattle } from "./autoplay";

const N = Number(process.argv[2] ?? 200);

for (const enc of ENCOUNTERS) {
  let wins = 0, turns = 0, hpLeft = 0, awakens = 0, breaks = 0, cancels = 0;
  for (let i = 0; i < N; i++) {
    const { battle: b, events } = autoBattle(enc.enemies, i);
    for (const e of events) {
      if (e.k === "awaken") awakens++;
      if (e.k === "break") breaks++;
      if (e.k === "cancel") cancels++;
    }
    if (b.result === "victory") {
      wins++;
      hpLeft += b.spirits.reduce((a, s) => a + s.hp, 0);
    }
    turns += b.turn;
  }
  console.log(
    `${enc.id.padEnd(14)} 승률 ${((wins / N) * 100).toFixed(0).padStart(3)}%  평균 턴 ${(turns / N).toFixed(1).padStart(4)}  ` +
    `승리 시 남은 HP합 ${(wins ? hpLeft / wins : 0).toFixed(0).padStart(3)}/84  각성 ${(awakens / N).toFixed(1)}  브레이크 ${(breaks / N).toFixed(1)}  행동취소 ${(cancels / N).toFixed(1)}`,
  );
}

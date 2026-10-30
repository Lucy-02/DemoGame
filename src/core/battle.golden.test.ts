// 골든 테스트: 같은 시드면 같은 전투 결과가 나와야 해요.
// 규칙을 일부러 바꿨다면 `pnpm test -u`로 스냅샷을 갱신하고, 바뀐 숫자를 PR에 적어요.
import { describe, expect, it } from "vitest";
import { autoBattle } from "../../tools/autoplay";
import { ENCOUNTERS } from "./data";

const SEEDS = 20;

describe("전투 골든", () => {
  it("인카운터별 요약이 바뀌지 않는다", () => {
    const summary = ENCOUNTERS.map((enc) => {
      let wins = 0, turns = 0, hpLeft = 0, awakens = 0, breaks = 0, cancels = 0;
      for (let i = 0; i < SEEDS; i++) {
        const { battle, events } = autoBattle(enc.enemies, i);
        if (battle.result === "victory") wins++;
        turns += battle.turn;
        hpLeft += battle.spirits.reduce((a, s) => a + s.hp, 0);
        for (const e of events) {
          if (e.k === "awaken") awakens++;
          if (e.k === "break") breaks++;
          if (e.k === "cancel") cancels++;
        }
      }
      return `${enc.id} wins=${wins}/${SEEDS} turns=${turns} hp=${hpLeft} awaken=${awakens} break=${breaks} cancel=${cancels}`;
    });
    expect(summary).toMatchSnapshot();
  });

  it("보스전 한 판의 이벤트 로그가 바뀌지 않는다", () => {
    const boss = ENCOUNTERS.find((e) => e.tier === "boss")!;
    const { events } = autoBattle(boss.enemies, 0);
    expect(events.map((e) => JSON.stringify(e))).toMatchSnapshot();
  });

  it("같은 시드는 같은 결과를 낸다", () => {
    const enc = ENCOUNTERS[0];
    expect(autoBattle(enc.enemies, 3).events).toEqual(autoBattle(enc.enemies, 3).events);
  });
});

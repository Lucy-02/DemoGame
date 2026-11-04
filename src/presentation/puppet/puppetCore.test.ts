// 퍼핏 식 골든 테스트: 리그를 고정 스텝으로 돌린 정점 요약이 바뀌면 실패해요.
// 움직임을 일부러 바꿨으면 스냅샷을 갱신하고 PR에 이유를 적어요(빌더가 새 리그를 내도 바뀌어요).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PuppetCore, type Rig } from "./puppetCore";

const DIR = resolve(__dirname, "../../../public/assets/puppets");
const IDS = readdirSync(DIR).filter((d) => statSync(resolve(DIR, d)).isDirectory()).sort();

/** 레이어마다 정점 합·최대 이동량 (소수 셋째 자리) */
function summary(core: PuppetCore) {
  return core.parts.map((p) => {
    let sx = 0, sy = 0, dmax = 0;
    for (let i = 0; i < p.nv; i++) {
      const x = p.out[2 * i], y = p.out[2 * i + 1];
      sx += x;
      sy += y;
      dmax = Math.max(dmax, Math.hypot(x - p.base[2 * i], y - p.base[2 * i + 1]));
    }
    return [p.name, +(sx / p.nv).toFixed(3), +(sy / p.nv).toFixed(3), +dmax.toFixed(3)];
  });
}

describe("puppet core", () => {
  it.each(IDS)("%s: 난수 이벤트를 끈 30·90번째 프레임", (id) => {
    const rig = JSON.parse(readFileSync(resolve(DIR, id, "rig.json"), "utf8")) as Rig;
    const core = new PuppetCore(rig, { noEvents: true });
    const at: Record<number, unknown> = {};
    for (let f = 1; f <= 90; f++) {
      core.step(1 / 30);
      if (f === 30 || f === 90) at[f] = summary(core);
    }
    expect(at).toMatchSnapshot();
  });

  it("같은 seed면 이벤트까지 같아요", () => {
    const rig = JSON.parse(readFileSync(resolve(DIR, IDS[0], "rig.json"), "utf8")) as Rig;
    const a = new PuppetCore(rig, { seed: 3 });
    const b = new PuppetCore(rig, { seed: 3 });
    for (let f = 0; f < 240; f++) {
      a.step(1 / 30);
      b.step(1 / 30);
    }
    expect(Array.from(a.parts[0].out)).toEqual(Array.from(b.parts[0].out));
  });
});

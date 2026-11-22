import { describe, expect, it } from "vitest";
import encounters from "../../data/encounters.json";
import enemies from "../../data/enemies.json";
import fits from "./enemyFit.json";
import { enemiesWidth, enemySpots } from "./enemyLayout";
import { ENEMY, INFO } from "./layout";

const FITS = fits as unknown as Record<string, { size?: keyof typeof ENEMY.sizes; h?: number; w?: number; of?: string }>;
const fitOf = (id: string) => FITS[FITS[id]?.of ?? id];

describe("적 자리 (0158)", () => {
  it("모든 적에 크기 등급이 있고, 그림이 등급 상자 안에 들어가요", () => {
    for (const e of enemies) {
      const fit = fitOf(e.id);
      expect(fit?.size, e.id).toBeDefined();
      const box = ENEMY.sizes[fit.size!];
      expect(fit.h!, e.id).toBeLessThanOrEqual(box.h);
      expect(fit.w!, e.id).toBeLessThanOrEqual(box.w + 1);
    }
  });

  it("가장 작은 적도 고를 수 있는 크기예요", () => {
    for (const e of enemies) expect(fitOf(e.id).h!, e.id).toBeGreaterThanOrEqual(44);
  });

  it("모든 조우가 적 쪽 가로 범위 안에 들어가요", () => {
    const room = ENEMY.field.right - ENEMY.field.left;
    for (const enc of encounters) expect(enemiesWidth(enc.enemies), enc.id).toBeLessThanOrEqual(room);
  });

  it("자리는 겹치지 않고 범위 안에서 가운데로 모여요", () => {
    for (const enc of encounters) {
      const spots = enemySpots(enc.enemies);
      spots.forEach((s, i) => {
        expect(s.x - s.slot / 2, enc.id).toBeGreaterThanOrEqual(ENEMY.field.left - 1);
        expect(s.x + s.slot / 2, enc.id).toBeLessThanOrEqual(ENEMY.field.right + 1);
        if (i > 0) expect(s.x - s.slot / 2, enc.id).toBeGreaterThanOrEqual(spots[i - 1].x + spots[i - 1].slot / 2);
      });
    }
  });

  it("의도 알약은 큰 적의 머리 위로 올라가고, 작은 적은 같은 줄에 있어요", () => {
    const [small, boss] = enemySpots(["wisp", "grimbark"]);
    expect(small.top).toBe(ENEMY.top);
    expect(boss.top).toBeLessThan(ENEMY.top);
    expect(boss.bar).toBeGreaterThan(small.bar);
  });

  it("그림이 없는 적은 예전 자리표시 크기로 서요", () => {
    const [s] = enemySpots(["no_such_enemy"]);
    expect([s.w, s.h, s.bar]).toEqual([ENEMY.art.w, ENEMY.art.h, INFO.w]);
  });
});

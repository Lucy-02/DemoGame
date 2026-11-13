import { describe, expect, it } from "vitest";
import { EQUIP_PASSIVES } from "./battle/passives";
import { CARDS, EQUIPMENT, cardDef, equipDef } from "./data";
import { andThen, hasBatchim, josa, polite } from "./korean";
import { EQUIP_PASSIVE_TEXT, describeCard, describeEquipTier } from "./text";

describe("한국어 도우미", () => {
  it("받침으로 조사를 골라요. 숫자는 읽는 소리로", () => {
    expect([josa("불여우", "이/가"), josa("유리 도롱뇽", "이/가"), josa("성체", "으로/로"), josa("물", "으로/로")])
      .toEqual(["불여우가", "유리 도롱뇽이", "성체로", "물로"]);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 100].map((n) => hasBatchim(String(n))))
      .toEqual([true, false, true, false, false, true, true, true, false, true, true, true]);
    expect([1, 2, 3, 6, 7, 8].map((n) => josa(String(n), "으로/로"))).toEqual(["1로", "2로", "3으로", "6으로", "7로", "8로"]);
  });

  it("동사 줄기를 합니다체·연결형으로", () => {
    expect(["입히", "얻", "오르", "부여하", "뽑", "나서", "되"].map(polite))
      .toEqual(["입힙니다", "얻습니다", "오릅니다", "부여합니다", "뽑습니다", "나섭니다", "됩니다"]);
    expect(andThen("입히")).toBe("입히고");
  });
});

describe("카드 효과 문구 (0022)", () => {
  const text = (id: string) => describeCard(cardDef(id), null);

  it("Lucy 예시 그대로: 서술어가 있는 합니다체, 조건은 앞에", () => {
    expect(text("fire_claw")).toBe("피해를 6 입힙니다.");
    expect(text("backfire")).toBe("피해를 8 입힙니다. 대상이 화상 상태이면 피해를 추가로 8 입힙니다.");
  });

  it("대상은 효과마다. 같은 대상이 이어지면 한 번만", () => {
    expect(text("fire_storm")).toBe("모든 적에게 피해를 5 입히고 화상을 3 부여합니다.");
    expect(text("glass_skin")).toBe("벽 방어도를 4 얻습니다. 반격을 2 얻습니다.");
    expect(text("bubble_shield")).toBe("아군 하나에게 방어도를 5 줍니다.");
    expect(text("mend")).toBe("아군 하나의 HP를 4 회복합니다.");
  });

  it("다단 히트·연속·소멸·지속", () => {
    expect(text("double_strike")).toBe("피해를 3씩 2번 입힙니다.");
    expect(text("whirl_slash")).toBe("피해를 3 입힙니다. 연속 2: 피해를 3씩 2번 입힙니다.");
    expect(text("eternal_ice")).toBe("빙결시킵니다. 보스에게는 대신 냉기를 5 부여합니다. 소멸.");
    expect(text("blaze_aura")).toBe("지속. 이 정령이 화상을 부여할 때마다 화상을 1 더 부여합니다.");
  });

  it("시전 정령 능력치를 반영한 최종 수치를 써요", () => {
    expect(describeCard(cardDef("fire_claw"), { power: 15, guard: 10, focus: 10 })).toMatch(/^피해를 \d+ 입힙니다\.$/);
  });

  it("모든 카드: 마침표로 끝나고, 괄호 조사·명사 끝·× 기호가 없어요", () => {
    for (const c of CARDS) {
      const s = describeCard(c, null);
      expect(s, c.id).toMatch(/\.$/);
      expect(s, c.id).not.toMatch(/\(|×|→|!|,/);
      // 숫자 뒤 조사 없음 (고정 문구 "비용이 0이 됩니다"는 숫자가 바뀌지 않아요)
      expect(s.replace("0이 됩니다", ""), c.id).not.toMatch(/\d(을|를|이|가)\s/);
    }
    // 무기 기술은 대표 카드와 이름이 같아서 id로 적어요
    expect(Object.fromEntries(CARDS.map((c) => [c.obtain === "equipment" ? c.id : c.name, describeCard(c, null)]))).toMatchSnapshot();
  });
});

describe("장비 효과문", () => {
  it("장비 효과마다 문장이 있고, 모든 장비의 모든 층이 합니다체 문장으로 나와요", () => {
    expect(Object.keys(EQUIP_PASSIVE_TEXT).sort()).toEqual(Object.keys(EQUIP_PASSIVES).sort());
    for (const e of EQUIPMENT) {
      for (const tier of [...e.tiers, ...(e.downside ? [e.downside] : [])]) {
        for (const line of describeEquipTier(tier)) expect(line).toMatch(/니다\.$/);
      }
    }
  });

  it("조건 없는 기본 능력치는 숫자로 보여서 문장에서 빠지고, 조건부와 치명은 문장으로 써요", () => {
    expect(describeEquipTier(equipDef("bone_sword").tiers[0])).toEqual(["내 턴의 첫 타격은 피해를 추가로 1 입힙니다."]);
    expect(describeEquipTier(equipDef("round_shield").tiers[0])).toEqual(["HP가 절반 아래이면 가드가 2 더 높습니다."]);
    expect(describeEquipTier(equipDef("crystal_dagger").tiers[1])).toEqual([
      "치명 확률이 3% 높습니다.", "치명 피해가 10% 높습니다.", "대상의 HP가 가득이면 치명 확률이 10% 높습니다.",
    ]);
    expect(describeEquipTier(equipDef("moss_hammer").downside!)).toEqual([]);
  });
});

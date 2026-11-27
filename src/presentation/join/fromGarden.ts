// 정원 → 깃들기 화면 값. 후보와 성격은 core/garden joinCandidates가 정해요 (0076 12).
import { C, CARDS, personalityDef, spiritDef } from "../../core/data";
import { joinCandidates, type Garden } from "../../core/garden";
import { ELEMENT_ICON } from "../faces";
import { cardVM } from "../run/fromCore";
import { spiritArt } from "../spiritArt";
import { COPY } from "./copy";
import { ROLE_ICON } from "../spirits/fromGarden";
import type { FaceVM, JoinCandVM, JoinVM, PersonalityVM } from "./viewmodel";

export function faceOf(id: string): FaceVM | null {
  const a = spiritArt(id, "baby");
  return a?.crop ? { id, key: a.body, crop: a.crop } : null;
}

/** 대표 카드: 시작 덱에서 그 정령이 들고 오는 기본 카드 */
export function signatureCard(id: string): string {
  const card = CARDS.find((c) => c.startOwner === id && c.rarity === "basic") ?? CARDS.find((c) => c.startOwner === id);
  if (!card) throw new Error(`대표 카드가 없는 정령 ${id}`);
  return card.id;
}

/** 떠날 때는 유체라 성격 효과가 아직 없어요: "성체부터" */
export function personalityVM(id: string): PersonalityVM {
  const per = personalityDef(id);
  return { id, name: per.name, desc: per.desc, note: COPY.personalityFrom };
}

export function joinCandVM(id: string, personality: string): JoinCandVM {
  const def = spiritDef(id);
  const art = spiritArt(id, "baby");
  return {
    id, name: def.name, element: ELEMENT_ICON[def.element] ?? ELEMENT_ICON.none, role: ROLE_ICON[def.role],
    personality: personalityVM(personality),
    card: cardVM(signatureCard(id), id), art, face: faceOf(id) ?? undefined,
  };
}

/** prev = 이번 판 끝에 바로 앞서 고른 정령 (연달아 둘째 깃들기) */
export function joinVM(g: Garden, prev?: string): JoinVM {
  return {
    cands: joinCandidates(g).map((c) => joinCandVM(c.id, c.personality)),
    party: g.spirits.map((s) => faceOf(s.id)),
    seats: C.party_size,
    ...(prev ? { prev: faceOf(prev) } : {}),
  };
}

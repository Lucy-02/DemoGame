// 퍼핏(라투디)이 있는 정령 목록. Phaser를 모르는 곳(뷰모델·테스트)에서도 쓸 수 있게 따로 둬요.
import index from "../../../public/assets/puppets/index.json";

/** 퍼핏이 있는 정령 (에셋 폴더 이름) */
export const PUPPET_IDS: ReadonlySet<string> = new Set((index as { spirits: string[] }).spirits);

/** 정령 id(fire_fox) → 퍼핏 에셋 이름(fire-fox). 각성체 퍼핏이 없으면 undefined */
export const awakenedPuppet = (spiritId: string): string | undefined => {
  const name = spiritId.replaceAll("_", "-");
  return PUPPET_IDS.has(name) ? name : undefined;
};

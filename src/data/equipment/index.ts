// 장비 묶음 파일 목록. 카드처럼 정령별 파일(`<정령 id>.json`)로 나누고 여기에 더해요. 형식은 `src/core/types.ts`의 `EquipDef`.
import type { EquipDef } from "../../core/types";

export const EQUIP_FILES: Record<string, EquipDef[]> = {};

// 장비 묶음 파일 목록. 새 파일은 여기에 더해요. 형식은 `src/core/types.ts`의 `EquipDef`.
import type { EquipDef } from "../../core/types";
import exclusive from "./exclusive.json";

export const EQUIP_FILES: Record<string, EquipDef[]> = { exclusive: exclusive as unknown as EquipDef[] };

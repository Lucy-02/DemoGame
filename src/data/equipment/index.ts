// 장비 묶음 파일 목록. 새 파일은 여기에 더해요. 형식은 `src/core/types.ts`의 `EquipDef`.
import type { EquipDef } from "../../core/types";
import boss from "./boss.json";
import exclusive from "./exclusive.json";
import generic from "./generic.json";

const as = (rows: unknown) => rows as EquipDef[];
export const EQUIP_FILES: Record<string, EquipDef[]> = { generic: as(generic), exclusive: as(exclusive), boss: as(boss) };

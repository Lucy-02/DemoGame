# 0065. 장비 12개 이름

- 날짜: 2026-11-13
- 단계: 코어 기획 (네이밍)
- 라운드: 장비 기획 다각도로 확장 스레드
- 상태: 수락됨 (Lucy 2026-11-13 "1안 좋네")
- 관련: 0056 장비 규칙, 0061 기술 카드 · 희귀도 이름, 0064 장비 화면

## 맥락
장비에 이름이 없어서 화면의 이름 자리가 비어 있었어요.

## 고려한 선택지
장비마다 세 안. 후보 전체는 프로젝트 파일 `equipment-design/NAMES.md`.

## Lucy의 결정
1안 그대로예요.

| 희귀도 | id | 이름 |
| --- | --- | --- |
| 유니크 | fox_spear | 플레임 랜스 |
| 유니크 | salamander_gauntlet | 크림슨 건틀릿 |
| 유니크 | cat_fan | 서리 부채 |
| 일반 | bronze_helmet | 청동 투구 |
| 일반 | bone_sword | 본 블레이드 |
| 일반 | round_shield | 버클러 |
| 일반 | short_bow | 사냥 활 |
| 일반 | javelin | 재블린 |
| 일반 | crystal_dagger | 자수정 단검 |
| 전설 | moss_hammer | 고목 망치 |
| 전설 | obsidian_scythe | 흑요석 낫 |
| 전설 | stone_axe | 태고의 도끼 |

- 일반은 물건이 바로 읽히는 쉬운 이름, 유니크와 전설은 한 단계 격이 있는 이름이에요.

## 구현
- `src/data/locales/ko/equipment.json`. 이름은 `equipName(id)`(`src/core/data.ts`)로 읽어요.
- 영어 이름은 아직 없어요. 영어 표가 비어 있으면 한국어 이름이 보여요.

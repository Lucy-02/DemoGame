# 에셋 출처 기록

TTI(NovelAI Diffusion V5 / V4.5)가 들어간 파일은 모두 `assets/provenance.jsonl`에 한 줄씩 기록해요. 스팀 AI 콘텐츠 공개 문구와 저작권(사람 기여분) 근거로 쓰여요.

| 필드 | 내용 |
| --- | --- |
| `path` | 빌드에 들어가는 파일 경로 (`public/` 기준) |
| `sha256` | 파일 해시 |
| `status` | `exploration`(탐색) / `placeholder`(임시) / `release`(출시용) |
| `model` | 예: `NovelAI Diffusion V5 Full`, `V4.5 Full` |
| `prompt_sheet` | 프롬프트 시트 ID |
| `prompt`, `negative`, `seed`, `settings` | 실제 생성 값 (원본 PNG 메타데이터에서) |
| `references` | 바이브 파일·Precise Reference 이미지와 출처 |
| `source_png` | 원본 PNG 보관 위치 (Download 버튼으로 받아 메타데이터 보존) |
| `human_work` | 선별, 인페인트, 페인트오버, 합성, 재작도와 정도 |
| `note` | 기타 |

검사: `npm run check:assets` (보고), `npm run check:assets -- --release` (기록 없음·임시 에셋이 있으면 실패).

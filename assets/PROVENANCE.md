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

검사 (0139):
- `pnpm check:assets`: 기록 없는 파일, 기록과 해시가 다른 파일, 생성 값(seed · prompt)이 없거나 모델이 추정 · 미확인인데 `release`인 줄이 있으면 실패. `pnpm check`와 CI에서 돌아요.
- `pnpm check:assets --release`: 위에 더해 임시 에셋이 있으면 실패. `--summary`: 스팀 AI 공개 설문에 쓸 집계 (`docs/release/AI_DISCLOSURE.md`).
- 생성 모델을 쓰지 않은 파일(기호 · 커서)도 한 줄씩 적어요. `model`은 `없음 (…)`으로 시작해요.

## 소리

소리 파일(public/assets/audio/, 아직 없는 폴더)도 한 줄씩 기록해요 (0087). TTI 필드 대신 아래를 써요.

| 필드 | 내용 |
| --- | --- |
| `path`, `sha256`, `status` | 위와 같음 |
| `source` | 팩 이름과 받은 페이지 주소 |
| `author` | 제작자 |
| `license` | 라이선스 이름과 그 글이 있는 주소. 표기 의무가 있으면 `credit`에 표기 문구 |
| `source_file` | 팩 안의 원본 파일 이름 |
| `human_work` | 자르기 · 음량 맞추기 · 변환 |

저장소가 공개라서 원본 재배포를 막는 라이선스의 파일은 넣지 않아요.

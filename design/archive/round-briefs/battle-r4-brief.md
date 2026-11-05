# 전투 화면 R4 브리프 (2026-10-29)

먼저 읽기 (네트워크 마운트라 경로 끝에 / 붙이고, 폴더 전체 검색 금지):
- /mnt/project-files/design-concepts/LEDGER.md — 정본 장부. 여기 있는 확정 조각은 빠짐없이 담고, 다른 점은 페이지 머리 "장부 대비 변경"에 적어요.
- /mnt/project-files/design-concepts/BRIEF.md — 게임·전투 필수 정보(1번 항목), 정보 원칙
- /mnt/project-files/design-concepts/TIMELINE_QUESTIONS.md — 해결 순서표 규칙은 미정. 순서표는 "자리와 형태"만 보여 주고 규칙이 필요한 곳은 기획 메모 레이어로.
- 리뷰: /mnt/project-files/design-concepts/reviews/endturn-*.md, card-material-*.md, r4-synthesis.md

## 기준 화면 (캡처)
- 마지막 전투 시안 R3 A (Lucy: "카드 위계는 이 정도", 이걸 베이스로): /tmp/claude-0/concepts/r3-battle/variant-a.png, 소스 /tmp/claude-0/concepts/r3-battle/index.html
- 그 이전 R2 B (주인 묶음 손패, 섹션 분할): /mnt/project-files/design-concepts/archive/r2-battle/frameB.jpg
- 확정 카드 손패 띠와 재질: /mnt/project-files/design-concepts/archive/card-material/strips.jpg, fire-a.jpg, 소스 /tmp/claude-0/concepts/card-material/index.html (복사해서 쓰고 원본은 고치지 않기)
- 정령 관리 R4 v5 (팔레트·유리·Orbit 적용 예): /mnt/project-files/design-concepts/archive/spirit4-dark/v5-f01.jpg, 소스 /tmp/claude-0/concepts/spirit4-dark/
- 지도 R2 C (절제된 유리): /mnt/project-files/design-concepts/archive/r2-map/f03.jpg

## 꼭 지킬 것 (정본)
- 다크 "무채 유리 + 한 가지 강조" 팔레트 (spirit4-dark의 pal.css 값 재사용, 임시 값). Orbit 단일 글꼴 + Pretendard 대체 (spirit4-dark 방식 그대로).
- 좌우 대치: 아군 3 왼쪽(오른쪽 끝이 앞열), 적 1~3 오른쪽, 손패 아래.
- 손패는 주인 묶음(R2 B/R3 A). 카드는 확정 카드: 그림 창 + 얇은 이름 띠, 5:7, SD 초상 홈, 기호+최종 수치, 단색 속성 기호, 재질은 이름 띠에만, 호버 시 카드 전체 + 효과 설명. 불=밝은 용암석.
- 마력·턴 종료: 관례형 분리 (마력 손패 왼쪽, 턴 종료 오른쪽 단독, 낼 카드 남으면 차분/없으면 강조).
- 정보 원칙: 익히는 정보(효과 설명, 속성, 주인 이름, 더미 이름)는 기호·호버. 판단 정보(최종 수치, 비용 증감, 적 의도와 양·대상, HP·방어도, 차징, 사용 불가 사유, 마력)만 항상. 더미는 작은 아이콘+숫자.
- 해결 순서표: 상단, 모식화 아이콘, 가볍게. 무겁고 어려운 정보 금지.
- Lucy 피드백: "플레이어는 손패와 상대와 내 캐릭터를 본다", 과밀 금지, 카드 하단 바 높이 과함, 큰 숫자는 무엇의 수치인지 알 수 있게.
- 꽉 찬 상황 필수: 손패 10장(사용 불가 2장), 적 3, 차징 중인 적 1, 상태이상 여러 개. 호버 상태 1장.
- 캐릭터: 필드의 정령·적은 도형 자리표시(나중에 Spine). SD 초상 홈/얼굴에는 각성체 일러스트 얼굴 크롭을 써도 돼요: /mnt/project-files/design-concepts/assets/{fire,star,jelly}-cut3.png (아군 이름: 불 정령, 별 정령, 해파리 정령 — 이름 미정).
- 색·크기 값은 시안용 임시. 토큰 아님.

## 산출물
- 1280×800 프레임 2장: (1) 내 턴, 꽉 찬 상황, 카드 1장 호버 (2) 같은 전투에서 상태가 다른 순간(예: 낼 카드 없음 → 턴 종료 강조, 차징 직전).
- 페이지 맨 위: 컨셉 이름, 의도 한 문단, 잘하는 것 / 포기하는 것 2~3줄, "장부 대비 변경" 목록. 기획 필요 메모는 "기획 메모 보기" 토글 레이어로(화면에 상시 노출 금지).
- 모든 요소에 고유 id + data-comment-target.
- 아티팩트로 발행하지 마세요. 자기 폴더에 page.html(단일 파일, 이미지는 상대 경로 img/…, 폰트는 Google Fonts 링크 또는 data URI)로 만들고 Playwright로 확인(폰트 로드, 1360/400 가로 넘침 없음, 스크린샷 직접 보기). 스크린샷 frame1.png, frame2.png도 같은 폴더에.

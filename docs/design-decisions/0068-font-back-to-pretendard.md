# 0068. 글꼴을 Orbit에서 Pretendard로 되돌림

- 날짜: 2026-11-14
- 상태: 수락됨 (Lucy 2026-11-14 "그냥 프리텐다드로 돌아갈까? orbit 이거 좀 에바같은데")
- 관련: 0006 (Orbit 단일 글꼴을 대체)

## 결정
- 게임 글꼴은 Pretendard 단일(Regular 하나). 굵기 1종이라 위계는 지금처럼 크기·색으로.
- Orbit 파일과 라이선스는 번들에서 뺐어요.
- 글자 크기·배치 토큰은 그대로예요. 바꿔야 할 곳이 생기면 따로 제안해요.
- 정본 HTML(`design/canon/`)은 그대로 두고 Orbit을 Pretendard로 읽어요. `pnpm visual`이 정본 글꼴을 Pretendard로 바꿔 찍어요.

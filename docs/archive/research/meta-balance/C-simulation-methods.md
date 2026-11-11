# C. 자동 플레이 시뮬레이션 · 밸런싱 기법 조사 (2026-11-11)

조사 에이전트 보고를 간추린 원문이에요. [S] 출처 확인, [I] 추론.

## 스튜디오와 연구가 실제로 쓴 것
- Mega Crit(Slay the Spire)은 봇이 아니라 **사람 플레이 기록**으로 맞췄어요 [S]. 픽률, 무엇 대신 골랐나, 이긴 덱에 든 비율, 카드 보유별 적에게 받은 피해, 변경 전후 보스 승률. https://gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder
- Monster Train · Balatro · Wildfrost · Marvel Snap · LoR의 봇 · 시뮬레이션 도구는 공개 자료를 찾지 못했어요 [S, 없음 확인].
- StS 봇 사례: 턴 안 너비 탐색 + 지배 가지치기가 같은 계산량에서 MCTS와 차이가 없었고, 손으로 쓴 규칙 봇(bottled_ai, 승률 약 26%)이 탐색 봇(약 6%)보다 셌어요 [S]. https://dev.to/doronsinger/part-7-diminishing-returns-38me
- 강화학습은 보스 한 판에 학습 6~36시간, 보상 설계가 편향을 넣어요 [S]. https://www.etc.cmu.edu/projects/ai-playtesting/?p=165
- MiniStS(UCSC 2024): 무작위 · 앞보기 · LLM 봇, 승률 · HP 분포 · 카드 사용 · 턴 수 [S]. https://ceur-ws.org/Vol-3926/paper7.pdf
- LLM 봇은 StS 최고 난이도에서 17~20%, 상위 사람은 80% 이상 [S]. https://epoch.ai/publications/ai-systems-are-improving-rapidly-at-slay-the-spire-and-its-sequel
- 숨은 드로우는 ISMCTS(결정화)가 표준 [S]. https://eprints.whiterose.ac.uk/75048/1/CowlingPowleyWhitehouse2012.pdf
- 절차적 페르소나(목표가 다른 봇 여럿) [S]. https://ojs.aaai.org/index.php/AIIDE/article/view/12849
- 목표 승률로 수치를 진화시키기(Hearthstone), 봇 셋 모두에서 통하는 카드만 균형으로 보기(Dominion) [S]. https://arxiv.org/abs/1907.01623v1 · https://arxiv.org/pdf/1811.06962

## 함정
- 봇 하나에 맞추면 그 봇의 버릇에 과적합해요. 실력이 다른 봇 여럿을 쓰고, 봇 사이 격차를 실력 표현 지표로 봐요 [S]. https://www.kmjn.org/publications/GVGprofiles_Evostar15.pdf
- 봇 승률은 절댓값이 아니에요. 시뮬레이터는 순위 비교에만 믿을 만해요(한 사례: 보스 승률 모의 2.3% 대 실제 19.2%) [S]. https://tomokinotes.pages.dev/en/blog/sts2-bot-03-boss-simulator/
- 카드 고르기 · 길 고르기 정책이 전투 플레이보다 결과를 더 흔들어요 [I, 일부 S].
- "도달 층"은 보스 벽에서 막히는 지표예요 [S].

## 지표
- 픽률, 이긴 덱 비율, 적별 받은 피해, 변경 전후 보스 승률 [S].
- 층별 인카운터 HP 손실(난이도 곡선), 처치 턴 수, 마력당 피해 · 방어, 카드별 승률 차(넣었을 때 대 뺐을 때, 같은 시드), 죽은 카드 · 지배 카드, 분산과 꼬리 [I].
- 첫 플레이어 목표 승률의 공신력 있는 공개 수치는 찾지 못했어요.

## 통계
- **같은 시드 짝 비교 + 부호 검정(McNemar)**: 4,000쌍으로 7.5% → 8.8% 차이를 잡은 사례 [S]. 짝짓기는 결과가 양의 상관일 때만 이득 [S]. https://arxiv.org/abs/2512.24145v3
- 승률 95% 구간 반폭 ≈ 1.96·√(p(1−p)/n). p≈0.5에서 ±3%p는 약 1,000판, ±1%p는 약 10,000판 [I]. Wilson 구간.
- 자동 조정: 목표 난이도를 향한 베이즈 최적화, 진화 탐색, 언덕 오르기 [S]. https://research.google/pubs/finding-game-levels-with-the-right-difficulty-in-a-few-trials-through-intelligent-trial-and-error/

## 1인 개발 · 결정적 헤드리스 엔진에 권하는 순서 [I]
1. 시드 묶음 실행기 + JSONL 기록(Mega Crit이 보던 항목).
2. 실력이 다른 규칙 봇 2~3개(무작위 · 한 수 앞 · 한 수 앞 + 덱 규칙).
3. 턴 안 전수 · 빔 탐색(지배 가지치기, 같은 상태 합치기).
4. 같은 시드 짝 비교 도구(McNemar · Wilson).
5. 덱을 고정한 인카운터 · 보스 단독 시뮬레이터.
6. 카드별 넣기/빼기 승률 차 보고서(모든 봇에서).
- 다음 단계: 몬테카를로 롤아웃 · ISMCTS 천장 봇, 봇 격차 추적, 목표 곡선을 향한 수치 탐색.
- 지금은 과함: 심층 강화학습, LLM 봇, 카드 풀 전체 다목적 진화.
- 사람과 맞춰 보기: 사람 판도 같은 형식으로 기록해 인카운터별 HP 손실 · 턴 수 · 픽률의 순위가 봇과 같은지 봐요.

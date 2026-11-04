# CARD-R2 · game-ux 리뷰 (반대자 역할)

```json
[
  {
    "id": "R2-UX-001",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "mka",
    "persona": "game-ux",
    "severity": 3,
    "heuristic_id": "PIN-8",
    "target_element": "mka-x-whirl-plate",
    "title": "호버·포커스 카드에서 준비 표식이 사라짐 (세 안 공통)",
    "standard": "0008: 준비 표식은 조건이 채워진 카드의 상태. CONTEXT: 컨트롤러 포커스 = 호버와 같은 확대 상태. 상태 표시는 카드를 들여다보는 순간에도 유지되어야 함(PIN-8, NN-1).",
    "gap": "손패 카드의 숫자판에는 표식 요소가 있지만, 같은 카드의 호버 확대본 숫자판에는 표식 요소가 없음. 플레이어가 결정하려고 카드를 들여다보는(컨트롤러로 포커스하는) 순간 준비 상태가 화면에서 빠짐.",
    "evidence": "page.html: mka-star-whirl-plate 안에 span.rmk#mka-star-whirl-ready가 있으나 mka-x-whirl-plate / mkb-x-whirl-plate / mkc-x-whirl-plate 안에는 .rmk가 없음(×3만 있음). CSS에 .mk-a .x .rmk 규칙은 정의되어 있어 의도는 있었으나 마크업이 빠짐. 호버 설명(mka-x-whirl-txt)도 조건 충족 여부를 말하지 않음.",
    "suggestion": "호버·포커스 확대본에 손패와 같은 위치·같은 모양의 준비 표식을 그대로 옮겨 싣기. 설명 말풍선의 해당 키워드 줄에 충족 여부를 한 단어로 함께 적는 구조 검토.",
    "confidence": "high",
    "status": "open"
  },
  {
    "id": "R2-UX-002",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "mkb",
    "persona": "game-ux",
    "severity": 2,
    "heuristic_id": "NN-4",
    "target_element": "mkb-star-whirl-pips",
    "title": "b안은 표식이 켜질 때 연속 칸 위치가 옆으로 밀림",
    "standard": "상태가 바뀔 때 다른 판단 정보(연속 칸)의 위치는 고정되어야 시선이 같은 자리에서 변화를 읽음(NN-4 일관성, PIN-8).",
    "gap": "b안에서 준비가 켜진 카드만 연속 칸이 왼쪽으로 이동해 꼭지 표식 자리를 비켜 줌. 준비 켜짐 순간 칸이 '채워짐'과 '이동'을 동시에 겪음.",
    "evidence": "page.html CSS: `.mk-b .g-rdy .pips{right:28px}` (기본 .pips는 right:6px). mkb.png에서 회오리 베기의 칸(■■)이 칼바람의 칸(■■□)보다 왼쪽에 있음.",
    "suggestion": "표식과 연속 칸이 서로 다른 고정 자리를 갖도록 배치 구조를 정하거나, 칸이 이동하지 않는 안(a·c)을 택하기.",
    "confidence": "high",
    "status": "open"
  },
  {
    "id": "R2-UX-003",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "mka",
    "persona": "game-ux",
    "severity": 2,
    "heuristic_id": "PIN-6",
    "target_element": "mka-fire-ignite-ready",
    "title": "대상에 따라 달라지는 준비(점화 = 화상 대상 있음)를 손패 표식 하나로 말할 수 없음",
    "standard": "결과 예측 가능성: 카드 상태가 '어느 대상에게 쓰느냐'에 달려 있으면, 표식이 무엇을 보장하는지가 분명해야 함(PIN-6, 결과 미리보기 R5).",
    "gap": "시안은 적 하나만 있는 전제에서 점화가 준비로 표시됨. 적이 여럿이고 일부만 화상이면 손패 표식은 '어느 적에게나 준비'로 오해될 수 있음.",
    "evidence": "mka.png 하단 범례: '점화(화상 대상 있음)'. 연속(회오리 베기)은 카드 자체 조건이고 점화는 대상 조건인데 같은 표식을 씀.",
    "suggestion": "규칙으로 정하기: 손패 표식 = '조건을 만족하는 대상이 하나 이상 있음'. 실제 충족 여부는 조준 시 필드 결과 미리보기(R5)에서 대상별로 확인. 이 규칙을 호버 설명 구조에 반영.",
    "confidence": "medium",
    "status": "open"
  },
  {
    "id": "R2-UX-004",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "awa",
    "persona": "game-ux",
    "severity": 2,
    "heuristic_id": "PIN-2",
    "target_element": "awa-fire-turns",
    "title": "각성이 끝나는 순간 카드 수치가 내려가는 전환이 모션 세트에 없음",
    "standard": "상태 변화는 시작과 끝이 모두 보여야 함(PIN-2 즉각적 피드백). 0008 후속 범위에 '비용/수치 변화'와 '각성 중 카드 표기'가 포함됨.",
    "gap": "각성 중 카드는 12▲로 오르지만, 2턴 뒤 원래 값으로 돌아갈 때의 카드 동작이 정의되지 않음. 모션 세트에는 '수치 오름'만 있고 '수치 내림/각성 끝'이 없음.",
    "evidence": "page.html 모션 동작 목록: 뽑기·호버·집기·사용·소멸·지속·버림·섞기·생성·쓰러짐·비용 변화·수치 오름·준비 켜짐. awa-x-claw-calc '× 각성 1.5'. 남은 턴 칩(awa-fire-turns)은 있으나 0턴 이후 동작 없음.",
    "suggestion": "'각성 끝' 동작을 모션 세트에 추가: 남은 턴 칩이 사라지는 것과 그 정령 카드 숫자판이 원래 값으로 바뀌는 것을 한 번에 묶어 보여 주는 구조. 모션 줄이기일 때는 값만 바뀜.",
    "confidence": "high",
    "status": "open"
  },
  {
    "id": "R2-UX-005",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "mo",
    "persona": "game-ux",
    "dissent_role": true,
    "severity": 2,
    "heuristic_id": "NN-5",
    "target_element": "mo",
    "title": "[반론] 모션 성격 셋은 지금 임시 값으로만 갈려 있어, 이번 라운드에 '성격'을 고르면 임시 시간 값을 고르는 것이 됨",
    "standard": "CLAUDE.md: 시간 값은 지어내지 않고 TODO_TOKEN. 선택지는 구조 차이로 비교되어야 함.",
    "gap": "가·나·다의 차이는 코드상 전부 par()의 파라미터(시간 배율 k, 이징, 기울기 rot, 착지 방식)뿐이고 이 값들은 모두 '임시'. 같은 동작을 눌러 보고 느낌으로 고르면 실제로는 임시 시간·넘침 값에 대한 선호를 고르게 됨. 특히 나(k 1.2)는 모든 동작이 가장 느려지고 빠르게 모드는 전체를 같은 비율로 줄일 뿐이라(0008의 '첫 박자 줄임'과 다름) 반복 플레이 체감이 임시 값에 좌우됨.",
    "evidence": "page.html script: `if(PERS==='paper') return {k:.85,...,rot:7,land:'flutter'}`, `'slab' → {k:1.2,...,rot:0,land:'settle'}`, 다는 속성별 k .72~1.12, 바람 rot 12 + arc. 주석 '성격별 파라미터 (전부 임시 값)'. 속도 버튼은 K=.5를 모든 구간에 곱함(flyTo의 들어올림 140ms 구간도 동일 비율).",
    "suggestion": "이번 라운드에서는 구조 축만 결정: (1) 비행·착지에 기울기를 쓰나, (2) 넘침(오버슛)을 쓰나, (3) 속성마다 다르게 하나. 시간 값은 TODO_TOKEN으로 두고 실제 전투 속도 테스트 후 정하기. 빠르게 모드는 0008대로 첫 박자를 줄이는 구조로 스테이지를 맞추기.",
    "confidence": "medium",
    "status": "open"
  }
]
```

## 고른 것 (game-ux 관할)

준비 표식은 **c(받침 줄)**를 골라요. 연속 칸과 효과 기호 어느 쪽과도 자리를 다투지 않고 칸 위치가 그대로라(b는 칸이 밀림, a는 점화에서 효과 기호 바로 옆 모서리에 붙음), 손패 10장에서 가장 넓은 면적으로 있다/없다가 읽혀요. 각성 중 카드는 **a(초상 홈 + 남은 턴 칩)**가 0008의 "정령 단위 상태는 묶음 머리표와 초상 홈" 규칙을 그대로 따르고, b처럼 손패 카드 셋이 호버 상태와 같은 모습이 되어 포커스 위치가 흐려지는 문제가 없어요. 모션 성격은 반응 속도와 동작 간 리듬이 일정한 **가(가벼운 종이)**가 가장 낫고, 다는 같은 동작의 길이가 속성마다 달라져 예측성이 떨어져요. 다만 반론 카드대로 이번에는 기울기·넘침·속성별 차이 같은 구조만 정하고 시간 값은 비워 두기를 권해요.

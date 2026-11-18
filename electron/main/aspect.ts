// 창을 끌어 늘릴 때 안쪽(게임 화면)이 비율을 지키게 바깥 크기를 다시 계산해요. Electron에 의존하지 않아서 Node 테스트로 바로 확인해요.
// 윈도의 setAspectRatio는 창틀까지 포함한 바깥 크기에 비율을 걸고 extraSize도 듣지 않아서, 윈도에서는 will-resize에서 이 계산을 써요.

export interface Bounds { x: number; y: number; width: number; height: number }
export interface Size { width: number; height: number }

/**
 * current = 지금 바깥 창, next = 끌어서 되려는 바깥 창, edge = 끌린 변(will-resize의 details.edge), frame = 바깥 − 안쪽(창틀).
 * 좌우 변은 너비를, 위아래 변은 높이를, 모서리는 커서를 덮는 쪽을 기준으로 안쪽을 ratio에 맞춰요. 끌지 않은 쪽 변은 제자리예요.
 */
export function fitResize(current: Bounds, next: Bounds, edge: string, frame: Size, ratio: number, min: Size): Bounds {
  const horizontal = edge === "left" || edge === "right";
  const vertical = edge === "top" || edge === "bottom";
  // 모서리는 되려는 창(next)만 보고 커서를 덮는 쪽을 골라요. 지금 창과의 차이로 고르면 끄는 동안 기준이 오락가락해서 떨려요
  const byWidth = horizontal || (!vertical && next.width - frame.width >= (next.height - frame.height) * ratio);
  let innerW = byWidth ? next.width - frame.width : (next.height - frame.height) * ratio;
  innerW = Math.max(min.width, min.height * ratio, innerW);
  const width = Math.round(innerW) + frame.width;
  const height = Math.round(innerW / ratio) + frame.height;
  return {
    x: edge.includes("left") ? current.x + current.width - width : current.x,
    y: edge.includes("top") ? current.y + current.height - height : current.y,
    width, height,
  };
}

/**
 * 처음 열 때의 안쪽 크기. base(기준 해상도)가 화면의 쓸 수 있는 곳(work)에 창틀까지 들어가면 그대로,
 * 안 들어가면(1366×768 같은 작은 화면) 비율을 지키며 들어갈 만큼 줄여요.
 */
export function fitStart(base: Size, work: Size, frame: Size): Size {
  const scale = Math.min(1, (work.width - frame.width) / base.width, (work.height - frame.height) / base.height);
  if (scale >= 1) return base;
  const width = Math.floor(base.width * scale);
  return { width, height: Math.round((width * base.height) / base.width) };
}

/**
 * will-resize를 거치지 않고 크기가 바뀐 창(윈도 스냅: 아래 끝까지 끌면 세로로 꽉 차요)을 다시 맞춰요.
 * 높이를 기준으로 안쪽을 ratio에 맞추고, 화면의 쓸 수 있는 곳(work)을 넘으면 줄이고 안으로 당겨요.
 */
export function fitSnapped(current: Bounds, frame: Size, ratio: number, work: Bounds): Bounds {
  const innerH = current.height - frame.height;
  const inner = fitStart({ width: Math.round(innerH * ratio), height: innerH }, work, frame);
  const width = inner.width + frame.width;
  const height = inner.height + frame.height;
  return {
    x: Math.max(Math.min(current.x, work.x), Math.min(current.x, work.x + work.width - width)),
    y: Math.max(Math.min(current.y, work.y), Math.min(current.y, work.y + work.height - height)),
    width, height,
  };
}

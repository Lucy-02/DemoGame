// 자동 생성: pnpm tokens (원본 design/tokens/tokens.json). 직접 고치지 마세요.
export const TODO_TOKEN = 'TODO_TOKEN' as const;

export const tokens = {
  "color": {
    "bg": {
      "base": "#232120",
      "panel": "rgba(24,23,22,.74)"
    },
    "text": {
      "primary": "#f3efe8",
      "secondary": "#cbc4ba",
      "disabled": "TODO_TOKEN"
    },
    "accent": "#7a4577",
    "element": {
      "fire": "#c99a88",
      "water": "#8eaab0",
      "forest": "#9eab8b",
      "wind": "#b4b8b0",
      "neutral": "#a59f96"
    },
    "role": {
      "guard": "TODO_TOKEN",
      "attack": "TODO_TOKEN",
      "support": "TODO_TOKEN",
      "disrupt": "TODO_TOKEN"
    },
    "stat": {
      "hp": "#e6dfd3",
      "block": "TODO_TOKEN",
      "shield": "#d6ad62",
      "sync": "TODO_TOKEN",
      "mana": "#34302c"
    },
    "feedback": {
      "damage": "TODO_TOKEN",
      "heal": "TODO_TOKEN",
      "crit": "TODO_TOKEN",
      "weak": "TODO_TOKEN",
      "resist": "TODO_TOKEN"
    },
    "status": {
      "buff": "TODO_TOKEN",
      "debuff": "TODO_TOKEN"
    },
    "rarity": {
      "basic": "TODO_TOKEN",
      "common": "TODO_TOKEN",
      "uncommon": "TODO_TOKEN",
      "rare": "TODO_TOKEN"
    },
    "mapnode": {
      "battle": "TODO_TOKEN",
      "elite": "TODO_TOKEN",
      "event": "TODO_TOKEN",
      "shop": "TODO_TOKEN",
      "rest": "TODO_TOKEN",
      "boss": "TODO_TOKEN"
    }
  },
  "font": {
    "display": "Orbit, Pretendard, sans-serif",
    "title": "Orbit, Pretendard, sans-serif",
    "body": "Orbit, Pretendard, sans-serif",
    "number": "Orbit, Pretendard, sans-serif",
    "caption": "Orbit, Pretendard, sans-serif"
  },
  "size": {
    "text": {
      "display": "TODO_TOKEN",
      "title": "TODO_TOKEN",
      "body": "TODO_TOKEN",
      "number": "TODO_TOKEN",
      "caption": "TODO_TOKEN"
    },
    "space": {
      "unit": "TODO_TOKEN"
    },
    "radius": {
      "panel": "TODO_TOKEN",
      "card": "TODO_TOKEN",
      "button": "TODO_TOKEN",
      "badge": "TODO_TOKEN"
    },
    "border": {
      "width": "TODO_TOKEN"
    }
  },
  "motion": {
    "fast": "TODO_TOKEN",
    "normal": "TODO_TOKEN",
    "emphasis": "TODO_TOKEN"
  },
  "screen": {
    "base": {
      "width": "1280px",
      "height": "800px"
    }
  },
  "palette": {
    "floor": "#232120",
    "wall": "#4a4743",
    "wallHi": "#56524d",
    "wallLo": "#2e2c2a",
    "ink": "#f3efe8",
    "ink2": "#cbc4ba",
    "ink3": "#b5aea4",
    "acc": "#7a4577",
    "accHi": "#c99bc4",
    "onAcc": "#fbf3fa",
    "onAccHi": "#2a1c29",
    "danger": "#d9786a",
    "onDanger": "#241614",
    "ok": "#9dbb93",
    "warn": "#d6ad62",
    "onWarn": "#2a2214",
    "hp": "#e6dfd3",
    "glass": "rgba(31,29,27,.76)",
    "glassD": "rgba(31,29,27,.86)",
    "glassLine": "rgba(246,241,233,.14)",
    "plate": "rgba(24,23,22,.74)",
    "chip": "#46423e",
    "face": "#3a3734",
    "paper": "#e9e6df",
    "paper2": "#dcd8cf",
    "paperInk": "#2a2724",
    "pMute": "#6d6862",
    "cardLine": "#c6c0b5",
    "art": "#b7b1a6",
    "off": "#aaa69f",
    "off2": "#9c9891",
    "offLine": "#7d7a75",
    "offInk": "#55524e",
    "mana": "#34302c",
    "manaInk": "#f3efe8",
    "material": {
      "fire": "#e9e0d7",
      "fireEdge": "#c4b2a4",
      "water": "#dfe3e1",
      "waterEdge": "#adbab7",
      "wind": "#e6e5e1",
      "windEdge": "#c2c3bf",
      "wood": "#e2e3d9",
      "woodEdge": "#b7bba6"
    },
    "el": {
      "fire": "#c99a88",
      "water": "#8eaab0",
      "wood": "#9eab8b",
      "wind": "#b4b8b0",
      "light": "#c9bb93",
      "none": "#a59f96"
    },
    "sil": {
      "star": "#8c887f",
      "fire": "#8f817b",
      "jelly": "#7f898b"
    },
    "glassThin": "rgba(31,29,27,.5)",
    "barTrack": "rgba(246,241,233,.14)",
    "chipSoft": "rgba(246,241,233,.08)",
    "chipSofter": "rgba(246,241,233,.07)",
    "plateLine": "rgba(246,241,233,.06)",
    "debuffLine": "rgba(246,241,233,.32)",
    "hoverRing": "rgba(246,241,233,.7)",
    "groundShade": "rgba(0,0,0,.35)"
  },
  "text": {
    "battle": {
      "where": "14px",
      "whereNum": "15px",
      "orderLabel": "13px",
      "orderNum": "12px",
      "hp": "16px",
      "hpMax": "12px",
      "incoming": "15px",
      "incomingLabel": "12px",
      "chip": "13px",
      "block": "14px",
      "tag": "12px",
      "intentOrder": "12px",
      "intentAmount": "19px",
      "intentAmountDebuff": "16px",
      "intentLabel": "14px",
      "intentTo": "12px",
      "intentAll": "13px",
      "shieldLabel": "13px",
      "shieldNum": "14px"
    }
  }
} as const;

/** 아직 Lucy가 정하지 않은 토큰 경로 */
export const todoTokens: readonly string[] = [
  "color.text.disabled",
  "color.role.guard",
  "color.role.attack",
  "color.role.support",
  "color.role.disrupt",
  "color.stat.block",
  "color.stat.sync",
  "color.feedback.damage",
  "color.feedback.heal",
  "color.feedback.crit",
  "color.feedback.weak",
  "color.feedback.resist",
  "color.status.buff",
  "color.status.debuff",
  "color.rarity.basic",
  "color.rarity.common",
  "color.rarity.uncommon",
  "color.rarity.rare",
  "color.mapnode.battle",
  "color.mapnode.elite",
  "color.mapnode.event",
  "color.mapnode.shop",
  "color.mapnode.rest",
  "color.mapnode.boss",
  "size.text.display",
  "size.text.title",
  "size.text.body",
  "size.text.number",
  "size.text.caption",
  "size.space.unit",
  "size.radius.panel",
  "size.radius.card",
  "size.radius.button",
  "size.radius.badge",
  "size.border.width",
  "motion.fast",
  "motion.normal",
  "motion.emphasis"
];

export function isTodo(v: unknown): v is typeof TODO_TOKEN {
  return v === TODO_TOKEN;
}

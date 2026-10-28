// 자동 생성: npm run tokens (원본 design/tokens/tokens.json). 직접 고치지 마세요.
export const TODO_TOKEN = 'TODO_TOKEN' as const;

export const tokens = {
  "color": {
    "bg": {
      "base": "TODO_TOKEN",
      "panel": "TODO_TOKEN"
    },
    "text": {
      "primary": "TODO_TOKEN",
      "secondary": "TODO_TOKEN",
      "disabled": "TODO_TOKEN"
    },
    "accent": "TODO_TOKEN",
    "element": {
      "fire": "TODO_TOKEN",
      "water": "TODO_TOKEN",
      "forest": "TODO_TOKEN",
      "wind": "TODO_TOKEN",
      "neutral": "TODO_TOKEN"
    },
    "role": {
      "guard": "TODO_TOKEN",
      "attack": "TODO_TOKEN",
      "support": "TODO_TOKEN",
      "disrupt": "TODO_TOKEN"
    },
    "stat": {
      "hp": "TODO_TOKEN",
      "block": "TODO_TOKEN",
      "shield": "TODO_TOKEN",
      "sync": "TODO_TOKEN",
      "mana": "TODO_TOKEN"
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
    "display": "TODO_TOKEN",
    "title": "TODO_TOKEN",
    "body": "TODO_TOKEN",
    "number": "TODO_TOKEN",
    "caption": "TODO_TOKEN"
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
      "width": "TODO_TOKEN",
      "height": "TODO_TOKEN"
    }
  }
} as const;

/** 아직 Lucy가 정하지 않은 토큰 경로 */
export const todoTokens: readonly string[] = [
  "color.bg.base",
  "color.bg.panel",
  "color.text.primary",
  "color.text.secondary",
  "color.text.disabled",
  "color.accent",
  "color.element.fire",
  "color.element.water",
  "color.element.forest",
  "color.element.wind",
  "color.element.neutral",
  "color.role.guard",
  "color.role.attack",
  "color.role.support",
  "color.role.disrupt",
  "color.stat.hp",
  "color.stat.block",
  "color.stat.shield",
  "color.stat.sync",
  "color.stat.mana",
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
  "font.display",
  "font.title",
  "font.body",
  "font.number",
  "font.caption",
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
  "motion.emphasis",
  "screen.base.width",
  "screen.base.height"
];

export function isTodo(v: unknown): v is typeof TODO_TOKEN {
  return v === TODO_TOKEN;
}

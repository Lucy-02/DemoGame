// 언어별 문구 찾기. 기본 언어(ko) 표는 모든 id를 채우고, 다른 언어에서 빠진 문구는 기본 언어로 보여요.
import { LOCALES } from "../data/locales";

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALE_IDS = Object.keys(LOCALES) as Locale[];

export interface CardText {
  name: string;
}

type Table<T> = Record<string, T | undefined>;

const cardTable = (locale: Locale): Table<CardText> => LOCALES[locale].cards;

export function cardText(id: string, locale: Locale = DEFAULT_LOCALE): CardText {
  const text = cardTable(locale)[id] ?? cardTable(DEFAULT_LOCALE)[id];
  if (!text) throw new Error(`no card text: ${id}`);
  return text;
}

/** 표에 있는 카드 id (검사용) */
export const cardTextIds = (locale: Locale) => Object.keys(cardTable(locale));

/** 장비 이름 (0065). 다른 언어에 없으면 기본 언어로 보여요 */
const equipTable = (locale: Locale): Table<CardText> => LOCALES[locale].equipment;

export function equipText(id: string, locale: Locale = DEFAULT_LOCALE): CardText {
  const text = equipTable(locale)[id] ?? equipTable(DEFAULT_LOCALE)[id];
  if (!text) throw new Error(`no equipment text: ${id}`);
  return text;
}

export const equipTextIds = (locale: Locale) => Object.keys(equipTable(locale));

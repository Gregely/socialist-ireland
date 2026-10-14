// Reader's choice of design variant for the switchable questions (Q1, Q4).
// Defaults come from design/decisions.json; the choice is remembered per browser.
import { decisions } from './data.js';

const KEY = 'bunreacht.variants.v1';
const switchable = decisions.questions.filter((q) => q.switchable);
export const DEFAULTS = Object.fromEntries(switchable.map((q) => [q.id, q.default]));

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    const out = { ...DEFAULTS };
    for (const q of switchable) {
      if (q.options.some((o) => o.id === saved[q.id])) out[q.id] = saved[q.id];
    }
    return out;
  } catch {
    return { ...DEFAULTS };
  }
}

let current = load();
const listeners = new Set();

export const getVariants = () => ({ ...current });
export const isDefault = () => Object.keys(DEFAULTS).every((k) => current[k] === DEFAULTS[k]);

export function setVariant(q, option) {
  current = { ...current, [q]: option };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable: keep in memory only */
  }
  listeners.forEach((fn) => fn(getVariants()));
}

export const resetVariants = () => Object.entries(DEFAULTS).forEach(([q, o]) => setVariant(q, o));
export const onVariantChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));

/** True if an item tagged `variants: {Q1: ['A']}` should show under the current settings. */
export function matches(variants) {
  if (!variants) return true;
  return Object.entries(variants).every(([q, opts]) => opts.includes(current[q]));
}

/** "Q1=A" / "Q1=B,D" condition strings used in Markdown and scenario notes. */
export function matchesCondition(cond) {
  return cond
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => {
      const [q, opts] = part.split('=');
      return opts.split(',').includes(current[q]);
    });
}

export function optionLabel(q, id) {
  const question = decisions.questions.find((x) => x.id === q);
  return question?.options?.find((o) => o.id === id);
}

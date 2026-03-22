import { randomUUID } from 'node:crypto';

import { LOCALE_CONVERTER, UUID_V4_REGEX } from '../constants';

export const uuid = {
  v4: {
    isValid: (value: string) => UUID_V4_REGEX.test(value),
    generate: randomUUID,
  },
};

export const waitForMs = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ignoreErrorOnFunc<TOut>(
  func: () => TOut | null,
  returnOnErr: TOut | null = null,
): TOut | null {
  try {
    return func();
  } catch (err) {
    // do nothing
    return returnOnErr;
  }
}

export function convertLocaleCode(codeInHeader: string, locales = LOCALE_CONVERTER): string | null {
  const found = locales.find(row => row.pattern.test(codeInHeader));
  if (found) return found.code;
  return null;
}

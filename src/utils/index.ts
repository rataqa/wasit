import { randomUUID } from 'node:crypto';

import { UUID_V4_REGEX } from '../constants';

export const uuid = {
  v4: {
    test: (value: string) => UUID_V4_REGEX.test(value),
    generate: randomUUID,
  },
};

export const delay = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

import { describe, expect, it } from 'vitest';
import { generateId, safeJsonParse } from './utils';

describe('utils', () => {
  it('genera ids con prefijo', () => expect(generateId('nte')).toMatch(/^nte_[a-z0-9-]+$/));
  it('parsea JSON inválido como null', () => expect(safeJsonParse('{')).toBeNull());
});

import { capFrom } from './caps';

describe('capFrom', () => {
  it('uses the fallback when the env var is missing', () => {
    expect(capFrom(undefined, 120)).toBe(120);
  });

  it('parses a valid positive integer override', () => {
    expect(capFrom('50', 120)).toBe(50);
  });

  it('rejects non-positive, non-integer, and non-numeric values', () => {
    expect(capFrom('0', 120)).toBe(120);
    expect(capFrom('-5', 120)).toBe(120);
    expect(capFrom('12.5', 120)).toBe(120);
    expect(capFrom('abc', 120)).toBe(120);
    expect(capFrom('', 120)).toBe(120);
  });
});

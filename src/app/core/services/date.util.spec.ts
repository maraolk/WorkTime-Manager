import { formatDuration, isWithinPeriod, minutesToHours } from './date.util';

describe('date utilities', () => {
  it('formats minutes as hours and minutes', () => {
    expect(formatDuration(135)).toBe('2h 15m');
  });

  it('pads minutes below ten', () => {
    expect(formatDuration(61)).toBe('1h 01m');
  });

  it('converts minutes to rounded hours', () => {
    expect(minutesToHours(95)).toBe(1.6);
  });

  it('detects dates inside period', () => {
    expect(isWithinPeriod('2026-04-20', '2026-04-01', '2026-04-30')).toBe(true);
  });

  it('detects dates outside period', () => {
    expect(isWithinPeriod('2026-05-01', '2026-04-01', '2026-04-30')).toBe(false);
  });
});

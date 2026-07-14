import { describe, expect, it } from 'vitest';
import { createPresenceTracker, observePresence } from './presence';

describe('presence tracker', () => {
  it('requires two consecutive absent observations', () => {
    const first = observePresence(createPresenceTracker(), 'absent');
    expect(first.result).toBe('pending-away');
    expect(observePresence(first.tracker, 'absent').result).toBe('away');
  });

  it('resets an absence streak when presence returns', () => {
    const first = observePresence(createPresenceTracker(), 'absent');
    const present = observePresence(first.tracker, 'present');
    expect(present.tracker.absentStreak).toBe(0);
    expect(present.result).toBe('stable-present');
  });

  it('does not turn uncertainty into an away event', () => {
    const first = observePresence(createPresenceTracker(), 'absent');
    const uncertain = observePresence(first.tracker, 'uncertain');
    expect(uncertain.result).toBe('uncertain');
    expect(uncertain.tracker.absentStreak).toBe(1);
  });
});

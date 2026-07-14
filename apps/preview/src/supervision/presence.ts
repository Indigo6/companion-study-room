export type PresenceStatus = 'present' | 'absent' | 'uncertain';
export type PresenceResult = 'stable-present' | 'pending-away' | 'away' | 'uncertain';
export type PresenceTracker = { absentStreak: number };

export function createPresenceTracker(): PresenceTracker {
  return { absentStreak: 0 };
}

export function observePresence(tracker: PresenceTracker, status: PresenceStatus): { tracker: PresenceTracker; result: PresenceResult } {
  if (status === 'uncertain') return { tracker, result: 'uncertain' };
  if (status === 'present') return { tracker: { absentStreak: 0 }, result: 'stable-present' };
  const next = { absentStreak: tracker.absentStreak + 1 };
  return { tracker: next, result: next.absentStreak >= 2 ? 'away' : 'pending-away' };
}

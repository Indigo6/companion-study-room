export type TimerPhase = 'idle' | 'focus' | 'paused' | 'completed';

export type FocusTimer = {
  phase: TimerPhase;
  durationMs: number;
  remainingMs: number;
  startedAt: number | null;
  endsAt: number | null;
};

export function createTimer(durationMs: number): FocusTimer {
  return { phase: 'idle', durationMs, remainingMs: durationMs, startedAt: null, endsAt: null };
}

export function startTimer(timer: FocusTimer, now: number): FocusTimer {
  return { ...timer, phase: 'focus', startedAt: now, endsAt: now + timer.remainingMs };
}

export function tickTimer(timer: FocusTimer, now: number): FocusTimer {
  if (timer.phase !== 'focus' || timer.endsAt === null) return timer;
  const remainingMs = Math.max(0, timer.endsAt - now);
  return { ...timer, remainingMs, phase: remainingMs === 0 ? 'completed' : 'focus' };
}

export function pauseTimer(timer: FocusTimer, now: number): FocusTimer {
  const current = tickTimer(timer, now);
  return current.phase === 'completed' ? current : { ...current, phase: 'paused', endsAt: null };
}

export function resumeTimer(timer: FocusTimer, now: number): FocusTimer {
  if (timer.phase !== 'paused') return timer;
  return { ...timer, phase: 'focus', endsAt: now + timer.remainingMs };
}

export function resetTimer(timer: FocusTimer): FocusTimer {
  return createTimer(timer.durationMs);
}

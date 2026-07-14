import { describe, expect, it } from 'vitest';
import { createTimer, finishTimer, pauseTimer, resumeTimer, startTimer, tickTimer } from './timer';

describe('focus timer', () => {
  it('can finish an active session early', () => {
    const running = startTimer(createTimer(60_000), 1_000);
    expect(finishTimer(running, 21_000)).toMatchObject({ phase: 'completed', remainingMs: 40_000 });
  });
  it('starts from an absolute end time', () => {
    const timer = startTimer(createTimer(25 * 60_000), 1_000);
    expect(timer.phase).toBe('focus');
    expect(timer.endsAt).toBe(1_501_000);
  });

  it('corrects remaining time from the current clock', () => {
    const timer = startTimer(createTimer(60_000), 1_000);
    expect(tickTimer(timer, 31_000).remainingMs).toBe(30_000);
  });

  it('pauses and resumes without counting paused time', () => {
    const running = startTimer(createTimer(60_000), 1_000);
    const paused = pauseTimer(running, 21_000);
    expect(paused.remainingMs).toBe(40_000);
    const resumed = resumeTimer(paused, 101_000);
    expect(resumed.endsAt).toBe(141_000);
  });

  it('completes at or after the end time', () => {
    const timer = startTimer(createTimer(1_000), 5_000);
    expect(tickTimer(timer, 6_000)).toMatchObject({ phase: 'completed', remainingMs: 0 });
  });
});

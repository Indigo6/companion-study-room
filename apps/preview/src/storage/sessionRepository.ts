const STORAGE_KEY = 'companion-study-room:sessions:v1';

export type SessionOutcome = 'completed' | 'abandoned';

export interface SessionRecord {
  id: string;
  goal: string;
  plannedMinutes: number;
  actualSeconds: number;
  pauseCount: number;
  awayCount: number;
  outcome: SessionOutcome;
  completedAt: string;
}

export function loadSessions(storage: Storage = window.localStorage): SessionRecord[] {
  try {
    const value = storage.getItem(STORAGE_KEY);
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(storage: Storage, record: SessionRecord): void {
  const sessions = loadSessions(storage);
  storage.setItem(STORAGE_KEY, JSON.stringify([record, ...sessions]));
}

export function summarizeToday(records: SessionRecord[], now = new Date()): { seconds: number; completed: number } {
  const localDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return records.reduce(
    (summary, record) => {
      const completed = new Date(record.completedAt);
      const recordDay = `${completed.getFullYear()}-${String(completed.getMonth() + 1).padStart(2, '0')}-${String(completed.getDate()).padStart(2, '0')}`;
      if (recordDay === localDay) {
        summary.seconds += record.actualSeconds;
        if (record.outcome === 'completed') summary.completed += 1;
      }
      return summary;
    },
    { seconds: 0, completed: 0 },
  );
}

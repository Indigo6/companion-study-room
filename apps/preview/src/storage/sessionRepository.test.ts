import { describe, expect, it } from 'vitest';
import { loadSessions, saveSession, summarizeToday, type SessionRecord } from './sessionRepository';

const record: SessionRecord = { id:'1', goal:'复习', plannedMinutes:25, actualSeconds:1500, pauseCount:0, awayCount:0, outcome:'completed', completedAt:'2026-07-14T08:00:00.000Z' };

describe('session repository', () => {
  it('recovers from corrupt data', () => {
    const storage = { getItem: () => '{bad', setItem: () => {}, removeItem: () => {}, clear:()=>{}, key:()=>null, length:0 } as Storage;
    expect(loadSessions(storage)).toEqual([]);
  });
  it('saves and summarizes records', () => {
    const data = new Map<string,string>();
    const storage = { getItem:(k:string)=>data.get(k)??null, setItem:(k:string,v:string)=>data.set(k,v), removeItem:(k:string)=>data.delete(k), clear:()=>data.clear(), key:()=>null, length:0 } as Storage;
    saveSession(storage, record);
    expect(loadSessions(storage)).toHaveLength(1);
    expect(summarizeToday(loadSessions(storage), new Date('2026-07-14T12:00:00.000Z'))).toEqual({ seconds:1500, completed:1 });
  });
});

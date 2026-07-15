import { describe, expect, it } from 'vitest';
import { defaultPreferences, loadPreferences, savePreferences } from './preferences';

describe('versioned preferences', () => {
  it('keeps chat, vision and speech providers independent', () => {
    const defaults = defaultPreferences();
    expect(defaults.services.chat).not.toBe(defaults.services.vision);
    expect(defaults.services.speech).not.toBe(defaults.services.chat);
  });

  it('recovers from corrupt persisted preferences', () => {
    const storage = { getItem: () => '{bad', setItem: () => {} } as unknown as Storage;
    expect(loadPreferences(storage)).toEqual(defaultPreferences());
  });

  it('saves non-secret preferences with a schema version', () => {
    let stored = '';
    const storage = { getItem: () => stored || null, setItem: (_key: string, value: string) => { stored = value; } } as unknown as Storage;
    const preferences = { ...defaultPreferences(), reduceMotion: true };
    savePreferences(storage, preferences);
    expect(JSON.parse(stored)).toMatchObject({ version: 1, reduceMotion: true });
  });
});

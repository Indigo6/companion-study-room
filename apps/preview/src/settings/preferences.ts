export type ProviderId = 'openai' | 'deepseek' | 'siliconflow' | 'ollama' | 'custom';
export type ServiceId = 'chat' | 'vision' | 'speech';
export type CompanionId = 'lamp' | 'sprout' | 'cloud';

export interface ServicePreference {
  provider: ProviderId;
  enabled: boolean;
  baseUrl: string;
  model: string;
  voice?: string;
}

export interface Preferences {
  version: 1;
  companionId: CompanionId;
  reduceMotion: boolean;
  voiceURI: string;
  supervisionIntervalSeconds: number;
  services: Record<ServiceId, ServicePreference>;
}

const STORAGE_KEY = 'companion-study-room:preferences:v1';

export function defaultPreferences(): Preferences {
  return {
    version: 1, companionId: 'lamp', reduceMotion: false, voiceURI: '', supervisionIntervalSeconds: 45,
    services: {
      chat: { provider: 'ollama', enabled: false, baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b' },
      vision: { provider: 'ollama', enabled: false, baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen2.5vl:7b' },
      speech: { provider: 'openai', enabled: false, baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini-tts', voice: 'alloy' },
    },
  };
}

export function loadPreferences(storage: Storage = window.localStorage): Preferences {
  try {
    const value = storage.getItem(STORAGE_KEY);
    if (!value) return defaultPreferences();
    const parsed = JSON.parse(value) as Partial<Preferences>;
    if (parsed.version !== 1 || !parsed.services) return defaultPreferences();
    return { ...defaultPreferences(), ...parsed, services: { ...defaultPreferences().services, ...parsed.services } };
  } catch { return defaultPreferences(); }
}

export function savePreferences(storage: Storage, preferences: Preferences): void {
  storage.setItem(STORAGE_KEY, JSON.stringify({ ...preferences, version: 1 }));
}

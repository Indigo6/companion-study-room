import type { ServiceId } from './preferences';
const keyFor = (service: ServiceId) => `companion-study-room:api-key:${service}`;
export const loadSessionSecrets = (): Record<ServiceId, string> => ({ chat: sessionStorage.getItem(keyFor('chat')) ?? '', vision: sessionStorage.getItem(keyFor('vision')) ?? '', speech: sessionStorage.getItem(keyFor('speech')) ?? '' });
export function saveSessionSecret(service: ServiceId, value: string): void { if (value) sessionStorage.setItem(keyFor(service), value); else sessionStorage.removeItem(keyFor(service)); }

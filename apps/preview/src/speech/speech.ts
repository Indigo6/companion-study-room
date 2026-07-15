export const buildTtsRequest = (text: string, config: { model: string; voice?: string }) => ({ model: config.model, voice: config.voice || 'alloy', input: text, response_format: 'mp3' });
export const pickVoice = (voices: SpeechSynthesisVoice[], voiceURI: string) => voices.find(voice => voice.voiceURI === voiceURI) ?? voices[0];

export function speakWithSystem(text: string, voiceURI: string, onSpeaking: (value: boolean) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) { reject(new Error('当前系统不支持语音朗读')); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = pickVoice(window.speechSynthesis.getVoices(), voiceURI) ?? null;
    utterance.rate = 1; utterance.pitch = 1;
    utterance.onstart = () => onSpeaking(true);
    utterance.onend = () => { onSpeaking(false); resolve(); };
    utterance.onerror = event => { onSpeaking(false); reject(new Error(event.error)); };
    window.speechSynthesis.speak(utterance);
  });
}

export async function requestCompatibleSpeech(text: string, config: { baseUrl: string; model: string; voice?: string }, apiKey: string, fetcher: typeof fetch = fetch): Promise<Blob> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }; if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const response = await fetcher(`${config.baseUrl.replace(/\/$/, '')}/audio/speech`, { method: 'POST', headers, body: JSON.stringify(buildTtsRequest(text, config)) });
  if (!response.ok) throw new Error(`语音服务返回 ${response.status}`);
  return response.blob();
}

export function playSpeechBlob(blob: Blob, onSpeaking: (value: boolean) => void): Promise<void> {
  return new Promise((resolve, reject) => { const url = URL.createObjectURL(blob); const audio = new Audio(url); audio.onplay = () => onSpeaking(true); audio.onended = () => { onSpeaking(false); URL.revokeObjectURL(url); resolve(); }; audio.onerror = () => { onSpeaking(false); URL.revokeObjectURL(url); reject(new Error('语音播放失败')); }; void audio.play(); });
}

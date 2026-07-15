import { ChangeEvent, useEffect, useState } from 'react';
import { removeLocalAsset, saveLocalAsset, type LocalAssetKind } from '../assets/localAssetStore';
import type { CompanionId, Preferences, ServiceId } from './preferences';
import { applyProviderTemplate } from './providerTemplates';
import { speakWithSystem } from '../speech/speech';

type Tab = 'appearance' | 'sound' | 'ai' | 'privacy';
export type AssetState = Record<LocalAssetKind, { name: string; url: string } | null>;
const tabs: Array<{ id: Tab; label: string; glyph: string }> = [
  { id: 'appearance', label: '外观', glyph: '◐' }, { id: 'sound', label: '声音', glyph: '♫' },
  { id: 'ai', label: 'AI 服务', glyph: '✦' }, { id: 'privacy', label: '隐私监督', glyph: '◎' },
];
const companions: Array<{ id: CompanionId; name: string; note: string }> = [
  { id: 'lamp', name: '灯灯', note: '温暖、安静' }, { id: 'sprout', name: '芽芽', note: '清醒、轻快' }, { id: 'cloud', name: '云朵', note: '柔和、松弛' },
];

export function SettingsPanel({ preferences, assets, secrets, savedSecrets, onChange, onSecretChange, onTestService, onAssetChange, onClose }: { preferences: Preferences; assets: AssetState; secrets: Record<ServiceId, string>; savedSecrets: Record<ServiceId, boolean>; onChange(value: Preferences): void; onSecretChange(id: ServiceId, value: string): void; onTestService(id: ServiceId, config: Preferences['services'][ServiceId], apiKey: string): Promise<boolean>; onAssetChange(kind: LocalAssetKind, value: AssetState[LocalAssetKind]): void; onClose(): void }) {
  const [tab, setTab] = useState<Tab>('appearance');
  const [assetError, setAssetError] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => { if (!('speechSynthesis' in window)) return; const load = () => setVoices(window.speechSynthesis.getVoices()); load(); window.speechSynthesis.addEventListener('voiceschanged', load); return () => window.speechSynthesis.removeEventListener('voiceschanged', load); }, []);
  const updateService = (id: ServiceId, patch: Partial<Preferences['services'][ServiceId]>) => onChange({ ...preferences, services: { ...preferences.services, [id]: { ...preferences.services[id], ...patch } } });
  const importAsset = async (event: ChangeEvent<HTMLInputElement>, kind: LocalAssetKind) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const asset = await saveLocalAsset(file, kind); onAssetChange(kind, { name: asset.name, url: URL.createObjectURL(asset.blob) }); setAssetError(''); }
    catch (error) { setAssetError(error instanceof Error ? error.message : '导入失败'); }
    event.target.value = '';
  };
  const clearAsset = async (kind: LocalAssetKind) => { await removeLocalAsset(kind); onAssetChange(kind, null); onChange({ ...preferences, [kind === 'background' ? 'backgroundMode' : 'ambienceMode']: 'scene' }); };

  return <div className="settings-backdrop" onMouseDown={onClose}><section className="settings-panel" aria-label="设置中心" onMouseDown={event => event.stopPropagation()}>
    <header><div><small>STUDY ENVIRONMENT</small><h2>设置中心</h2></div><button aria-label="关闭设置" onClick={onClose}>×</button></header>
    <div className="settings-body"><nav aria-label="设置分类">{tabs.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><i>{item.glyph}</i>{item.label}</button>)}</nav><div className="settings-content">
      {assetError && <p className="settings-error">{assetError}</p>}
      {tab === 'appearance' && <><Section title="陪伴形象" note="一期提供官方形象，保持动画效果稳定。"><div className="companion-grid">{companions.map(item => <button key={item.id} className={preferences.companionId === item.id ? 'selected' : ''} onClick={() => onChange({ ...preferences, companionId: item.id })}><i className={`mini-spirit ${item.id}`}/><strong>{item.name}</strong><small>{item.note}</small></button>)}</div></Section><AssetPicker kind="background" title="自定义背景" accept="image/png,image/jpeg,image/webp" asset={assets.background} selected={preferences.backgroundMode === 'custom'} onImport={importAsset} onSelect={() => onChange({ ...preferences, backgroundMode: 'custom' })} onClear={clearAsset}/><Section title="动态效果"><Toggle checked={preferences.reduceMotion} label="减少环境与桌宠动态" onChange={checked => onChange({ ...preferences, reduceMotion: checked })}/></Section></>}
      {tab === 'sound' && <><AssetPicker kind="ambience" title="自定义白噪音" accept="audio/*" asset={assets.ambience} selected={preferences.ambienceMode === 'custom'} onImport={importAsset} onSelect={() => onChange({ ...preferences, ambienceMode: 'custom' })} onClear={clearAsset}/><Section title="系统音色" note="在线 TTS 启用时优先使用 AI 服务中的音色。"><Toggle checked={preferences.speakResponses} label="自动朗读 AI 回复" onChange={checked => onChange({ ...preferences, speakResponses: checked })}/><div className="voice-row"><select value={preferences.voiceURI} onChange={event => onChange({ ...preferences, voiceURI: event.target.value })}>{voices.length ? voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>) : <option value="">系统默认音色</option>}</select><button onClick={() => void speakWithSystem('准备好时，我们就开始。', preferences.voiceURI, () => undefined)}>试听</button></div></Section></>} 
      {tab === 'ai' && <>{(['chat', 'vision', 'speech'] as ServiceId[]).map(id => <ServiceCard key={id} id={id} value={preferences.services[id]} apiKey={secrets[id]} saved={savedSecrets[id]} onApiKey={value => onSecretChange(id, value)} onTest={() => onTestService(id, preferences.services[id], secrets[id])} update={patch => updateService(id, patch)}/>)}</>}
      {tab === 'privacy' && <Section title="视觉监督"><label className="field"><span>检查间隔</span><select value={preferences.supervisionIntervalSeconds} onChange={event => onChange({ ...preferences, supervisionIntervalSeconds: Number(event.target.value) })}><option value="30">30 秒</option><option value="45">45 秒</option><option value="60">60 秒</option></select></label><p className="privacy-note">摄像头默认关闭。只有监督和计时同时开启时才抽取临时检查帧。</p></Section>}
    </div></div><footer><span><i/>设置和素材只保存在本机</span><button onClick={onClose}>完成</button></footer>
  </section></div>;
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) { return <section className="setting-section"><header><h3>{title}</h3>{note && <p>{note}</p>}</header>{children}</section>; }
function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange(value: boolean): void }) { return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)}/><i/></label>; }
function AssetPicker({ kind, title, accept, asset, selected, onImport, onSelect, onClear }: { kind: LocalAssetKind; title: string; accept: string; asset: AssetState[LocalAssetKind]; selected: boolean; onImport(event: ChangeEvent<HTMLInputElement>, kind: LocalAssetKind): void; onSelect(): void; onClear(kind: LocalAssetKind): void }) { return <Section title={title} note={kind === 'background' ? 'PNG、JPG 或 WebP，最大 12 MB。' : '选择本机音频，最大 40 MB，文件不会上传。'}><div className="asset-row"><div><strong>{asset?.name ?? '尚未导入'}</strong><small>{asset ? selected ? '正在使用' : '已保存在本机' : '使用官方场景'}</small></div><label className="file-button">选择文件<input type="file" accept={accept} onChange={event => void onImport(event, kind)}/></label>{asset && <><button onClick={onSelect}>使用</button><button className="danger" onClick={() => void onClear(kind)}>移除</button></>}</div></Section>; }
function ServiceCard({ id, value, apiKey, saved, onApiKey, onTest, update }: { id: ServiceId; value: Preferences['services'][ServiceId]; apiKey: string; saved: boolean; onApiKey(value: string): void; onTest(): Promise<boolean>; update(value: Partial<Preferences['services'][ServiceId]>): void }) {
  const names = { chat: '学习问答', vision: '视觉监督', speech: '语音合成' }; const [status, setStatus] = useState('');
  const connect = async () => { setStatus('正在连接…'); try { await onTest(); setStatus('连接成功'); } catch (error) { setStatus(error instanceof Error ? error.message : '连接失败'); } };
  return <Section title={names[id]}><Toggle checked={value.enabled} label="启用此服务" onChange={enabled => update({ enabled })}/><div className="service-fields"><label className="field"><span>服务</span><select value={value.provider} onChange={event => update(applyProviderTemplate(id, event.target.value as Preferences['services'][ServiceId]['provider']))}><option value="openai">OpenAI</option><option value="deepseek">DeepSeek</option><option value="siliconflow">硅基流动</option><option value="ollama">Ollama</option><option value="custom">自定义兼容服务</option></select></label><label className="field wide"><span>Base URL</span><input value={value.baseUrl} onChange={event => update({ baseUrl: event.target.value })}/></label><label className="field wide"><span>模型</span><input value={value.model} onChange={event => update({ model: event.target.value })}/></label>{id === 'speech' && <label className="field wide"><span>音色</span><input value={value.voice ?? 'alloy'} onChange={event => update({ voice: event.target.value })}/></label>}<label className="field wide"><span>API Key</span><input type="password" value={apiKey} placeholder={value.provider === 'ollama' ? '本地服务通常不需要' : saved ? '已由系统安全保存；输入新值可替换' : '仅保存在本机'} onChange={event => onApiKey(event.target.value)}/></label></div><div className="connection-row"><button onClick={() => void connect()}>测试连接</button><span>{status || (saved ? '已安全保存 Key' : '')}</span></div></Section>;
}

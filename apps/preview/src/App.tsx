import { FormEvent, useEffect, useRef, useState } from 'react';
import { WhiteNoiseEngine } from './audio/whiteNoise';
import { CompatibleAiProvider, createAiProvider } from './ai/provider';
import { createTimer, finishTimer, pauseTimer, resumeTimer, startTimer, tickTimer } from './domain/timer';
import { loadSessions, saveSession, summarizeToday, type SessionRecord } from './storage/sessionRepository';
import { CameraSession } from './supervision/cameraSession';
import { captureVideoFrame } from './supervision/frameCapture';
import { createPresenceTracker, observePresence, type PresenceResult } from './supervision/presence';
import { SettingsPanel } from './settings/SettingsPanel';
import type { AssetState } from './settings/SettingsPanel';
import { loadPreferences, savePreferences } from './settings/preferences';
import type { ServiceId } from './settings/preferences';
import { loadSessionSecrets, saveSessionSecret } from './settings/secretStore';
import { loadLocalAsset, type LocalAssetKind } from './assets/localAssetStore';
import './camera-preview.css';

type SceneId = 'rain' | 'forest' | 'coast' | 'cafe';
const scenes = [
  { id: 'rain' as const, name: '雨夜书房', noise: '窗外雨声', time: '22:18', icon: '⌁' },
  { id: 'forest' as const, name: '森林晨雾', noise: '林间风声', time: '06:42', icon: '♧' },
  { id: 'coast' as const, name: '海边黄昏', noise: '缓慢潮声', time: '18:27', icon: '≈' },
  { id: 'cafe' as const, name: '安静咖啡馆', noise: '咖啡馆低语', time: '15:06', icon: '⌇' },
];

const artworkLabels: Record<SceneId, string> = {
  rain: '雨夜城市窗景', forest: '晨雾森林窗景', coast: '黄昏海岸窗景', cafe: '咖啡馆室内窗景',
};
declare global { interface Window { companionAi?: { ask(question: string): Promise<string>; inspect(image: string): Promise<'present' | 'absent' | 'uncertain'> } } }
const aiProvider = createAiProvider(import.meta.env.VITE_AI_API_URL, window.companionAi);
const visionUsesNetwork = Boolean(import.meta.env.VITE_AI_API_URL || window.companionAi);

function SceneArtwork({ scene }: { scene: SceneId }) {
  return <div className={`scene-art art-${scene}`} role="img" aria-label={artworkLabels[scene]}>
    {scene === 'rain' && <><div className="moon"/><div className="city back"/><div className="city front"/><div className="neon">夜读</div></>}
    {scene === 'forest' && <><div className="forest-moon"/><div className="mist m1"/><div className="mist m2"/><div className="trees back"/><div className="trees front"/></>}
    {scene === 'coast' && <><div className="sunset-sun"/><div className="island"/><div className="sea"><i/><i/><i/></div><div className="birds">⌁　⌁</div></>}
    {scene === 'cafe' && <><div className="pendant p1"/><div className="pendant p2"/><div className="shelves"><i/><i/><i/></div><div className="counter"><span/><b/></div></>}
  </div>;
}

export function App() {
  const [sceneId, setSceneId] = useState<SceneId>('rain');
  const [timer, setTimer] = useState(() => createTimer(25 * 60_000));
  const [goal, setGoal] = useState('整理第三章笔记，并完成 10 道练习');
  const [pauseCount, setPauseCount] = useState(0);
  const [todaySummary, setTodaySummary] = useState(() => summarizeToday(loadSessions()));
  const [report, setReport] = useState<SessionRecord | null>(null);
  const [supervising, setSupervising] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [presenceResult, setPresenceResult] = useState<PresenceResult | 'waiting'>('waiting');
  const [awayCount, setAwayCount] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [secrets, setSecrets] = useState(loadSessionSecrets);
  const [assets, setAssets] = useState<AssetState>({ background: null, ambience: null });
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(62);
  const [audioReady, setAudioReady] = useState(false);
  const audioEngine = useRef<WhiteNoiseEngine | null>(null);
  const customAudio = useRef<HTMLAudioElement | null>(null);
  const cameraSession = useRef<CameraSession | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recordedCompletion = useRef(false);
  const presenceTracker = useRef(createPresenceTracker());
  const previousPresence = useRef<PresenceResult | 'waiting'>('waiting');
  const scene = scenes.find(item => item.id === sceneId)!;
  const running = timer.phase === 'focus';
  const minutes = Math.floor(timer.remainingMs / 60_000);
  const seconds = Math.floor((timer.remainingMs % 60_000) / 1_000);
  const presenceText = { waiting: '专注开始后每 45 秒检查', 'stable-present': '状态良好 · 正在专注', 'pending-away': '暂未检测到 · 将再次确认', away: '检测到离席', uncertain: '画面不明确 · 不计离席' }[presenceResult];

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTimer(current => tickTimer(current, Date.now())), 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => savePreferences(window.localStorage, preferences), [preferences]);

  useEffect(() => {
    (['background', 'ambience'] as LocalAssetKind[]).forEach(kind => void loadLocalAsset(kind).then(asset => {
      if (asset) setAssets(current => ({ ...current, [kind]: { name: asset.name, url: URL.createObjectURL(asset.blob) } }));
    }).catch(() => undefined));
  }, []);

  useEffect(() => {
    if (timer.phase !== 'completed' || recordedCompletion.current) return;
    recordedCompletion.current = true;
    const record: SessionRecord = {
      id: crypto.randomUUID(), goal, plannedMinutes: timer.durationMs / 60_000,
      actualSeconds: Math.round((timer.durationMs - timer.remainingMs) / 1_000), pauseCount, awayCount,
      outcome: timer.remainingMs === 0 ? 'completed' : 'abandoned', completedAt: new Date().toISOString(),
    };
    saveSession(window.localStorage, record);
    setReport(record);
    setTodaySummary(summarizeToday(loadSessions()));
  }, [timer.phase, timer.durationMs, timer.remainingMs, goal, pauseCount, awayCount]);

  useEffect(() => {
    if (!supervising || !running) return;
    let disposed = false;
    const inspect = async () => {
      if (!videoRef.current) return;
      try {
        const frame = await captureVideoFrame(videoRef.current);
        const visionPreference = preferences.services.vision;
        const provider = visionPreference.enabled && !window.companionAi ? new CompatibleAiProvider({ baseUrl: visionPreference.baseUrl, model: visionPreference.model, apiKey: secrets.vision }) : aiProvider;
        const status = await provider.inspectFrame(frame);
        if (disposed) return;
        const observation = observePresence(presenceTracker.current, status);
        presenceTracker.current = observation.tracker;
        setPresenceResult(observation.result);
        if (observation.result === 'away' && previousPresence.current !== 'away') setAwayCount(count => count + 1);
        previousPresence.current = observation.result;
      } catch {
        if (!disposed) setPresenceResult('uncertain');
      }
    };
    const interval = window.setInterval(inspect, preferences.supervisionIntervalSeconds * 1_000);
    return () => { disposed = true; window.clearInterval(interval); };
  }, [supervising, running, preferences.supervisionIntervalSeconds, preferences.services.vision, secrets.vision]);

  useEffect(() => {
    audioEngine.current?.update(sceneId, volume, muted);
    if (customAudio.current) { customAudio.current.volume = muted ? 0 : volume / 100; }
  }, [sceneId, volume, muted]);

  useEffect(() => () => { audioEngine.current?.stop(); customAudio.current?.pause(); cameraSession.current?.stop(); }, []);

  const enableAudio = () => {
    if (preferences.ambienceMode === 'custom' && assets.ambience) {
      audioEngine.current?.stop(); audioEngine.current = null;
      if (!customAudio.current || customAudio.current.src !== assets.ambience.url) customAudio.current = new Audio(assets.ambience.url);
      customAudio.current.loop = true; customAudio.current.volume = muted ? 0 : volume / 100;
      void customAudio.current.play().then(() => setAudioReady(true)); return;
    }
    customAudio.current?.pause(); customAudio.current = null;
    if (!audioEngine.current) audioEngine.current = new WhiteNoiseEngine();
    void audioEngine.current.start(sceneId, volume, muted).then(() => setAudioReady(true));
  };

  const toggleSupervision = async () => {
    if (supervising) {
      cameraSession.current?.stop();
      if (videoRef.current) videoRef.current.srcObject = null;
      setSupervising(false);
      setPresenceResult('waiting');
      return;
    }
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('请使用 localhost 或 HTTPS 打开摄像头');
      cameraSession.current = new CameraSession();
      const stream = await cameraSession.current.start();
      if (videoRef.current) videoRef.current.srcObject = stream;
      presenceTracker.current = createPresenceTracker();
      previousPresence.current = 'waiting';
      setPresenceResult('waiting');
      setSupervising(true);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : '无法访问摄像头');
    }
  };

  const toggleTimer = () => setTimer(current => {
    if (current.phase === 'idle' || current.phase === 'completed') { recordedCompletion.current = false; setPauseCount(0); return startTimer(createTimer(current.durationMs), Date.now()); }
    if (current.phase === 'paused') return resumeTimer(current, Date.now());
    setPauseCount(count => count + 1);
    return pauseTimer(current, Date.now());
  });

  const selectDuration = (minutes: number) => setTimer(createTimer(minutes * 60_000));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    const submittedQuestion = question;
    setQuestion('');
    setAsking(true);
    try { const chat = preferences.services.chat; const provider = chat.enabled && !window.companionAi ? new CompatibleAiProvider({ baseUrl: chat.baseUrl, model: chat.model, apiKey: secrets.chat }) : aiProvider; setAnswer(await provider.ask(submittedQuestion)); }
    catch (error) { setAnswer(error instanceof Error ? `暂时无法回答：${error.message}` : '暂时无法回答'); }
    finally { setAsking(false); }
  };

  return <main className={`app scene-${scene.id} companion-${preferences.companionId} ${preferences.reduceMotion ? 'reduce-motion' : ''}`} aria-label={`${scene.name}场景`}>
    <div className="atmosphere" aria-hidden="true"><span/><span/><span/><span/></div>
    <header className="topbar">
      <div className="brand"><i className="brand-light"/><span>伴读</span><em>STUDY WITH ME</em></div>
      <div className="demo-pill"><i/>视觉预览 · 演示模式</div>
      <div className="today"><span>今日专注</span><strong>{String(Math.floor(todaySummary.seconds / 3600)).padStart(2, '0')}<small>h</small> {String(Math.floor(todaySummary.seconds % 3600 / 60)).padStart(2, '0')}<small>m</small></strong><button className="settings-trigger" aria-label="打开设置" onClick={() => setSettingsOpen(true)}>⚙</button></div>
    </header>

    <nav className="scene-switcher" aria-label="选择学习场景">
      {scenes.map(item => <button key={item.id} aria-pressed={sceneId === item.id} onClick={() => setSceneId(item.id)} aria-label={item.name}>
        <span>{item.icon}</span><b>{item.name}</b><small>{item.time}</small>
      </button>)}
    </nav>

    <section className="workspace">
      <div className="window-frame">{preferences.backgroundMode === 'custom' && assets.background ? <img className="custom-background" src={assets.background.url} alt="自定义学习背景"/> : <SceneArtwork scene={scene.id}/>}</div>
      <div className="desk-line" aria-hidden="true"/>
      <section className={`companion ${running ? 'is-focus' : ''} ${supervising ? 'is-watch' : ''}`} aria-label="AI 伙伴灯灯">
        <div className="speech"><small>灯灯</small><p>{supervising && running ? presenceText : supervising ? '摄像头已就绪，开始专注后检查。' : running ? '陪你专注中' : '准备好时，我们就开始。'}</p></div>
        <div className="spirit"><div className="halo"/><div className="face"><i/><i/><b/></div><div className="body"/></div>
      </section>
      <div className={`camera-preview ${supervising ? 'visible' : ''}`} aria-hidden={!supervising}><video ref={videoRef} autoPlay muted playsInline/><span>仅本机实时画面 · 不保存</span></div>

      <section className="timer-card" aria-label="番茄钟">
        <div className="timer-meta"><span>{running ? 'FOCUSING' : timer.phase === 'paused' ? 'PAUSED' : 'READY'}</span><div><button onClick={() => selectDuration(25)}>25 / 5</button><button onClick={() => selectDuration(45)}>45 / 10</button></div></div>
        <div className="clock">{String(minutes).padStart(2, '0')}<span>:</span>{String(seconds).padStart(2, '0')}</div>
        <div className="goal"><small>本次目标</small><input aria-label="本次目标" value={goal} onChange={event => setGoal(event.target.value)}/></div>
        <button className="start" aria-label={running ? '暂停一下' : timer.phase === 'paused' ? '继续专注' : '开始专注'} onClick={toggleTimer}>{running ? '暂停一下' : timer.phase === 'paused' ? '继续专注' : '开始专注'}<span aria-hidden="true">→</span></button>
        {(running || timer.phase === 'paused') && <button className="finish" onClick={() => setTimer(current => finishTimer(current, Date.now()))}>提前结束并生成报告</button>}
      </section>
    </section>

    <section className="control-dock">
      <div className="ambience"><div className="control-icon">♫</div><div><small>{audioReady ? muted ? '已静音' : '正在播放' : '点击播放'}</small><strong>{preferences.ambienceMode === 'custom' && assets.ambience ? assets.ambience.name : scene.noise}</strong></div><button onClick={() => { if (!audioReady) enableAudio(); else setMuted(v => !v); }} aria-label={!audioReady ? '播放白噪音' : muted ? '取消静音' : '静音'}>{!audioReady ? '▶' : muted ? '×' : '◖'}</button><input aria-label="白噪音音量" type="range" min="0" max="100" value={volume} onPointerDown={enableAudio} onChange={e => setVolume(Number(e.target.value))}/><output>{volume}%</output></div>
      <div className="divider"/>
      <div className="supervision"><div className={`camera-dot ${supervising ? 'on' : ''}`}>◉</div><div><small>摄像头监督</small><strong>{cameraError || (supervising ? presenceText : '关闭时不访问摄像头')}</strong></div><button onClick={toggleSupervision}>{supervising ? '关闭摄像头' : '允许并开启'}</button></div>
      <button className="ask" onClick={() => setDrawer(true)} aria-label="问问灯灯"><span>✦</span>问问灯灯</button>
    </section>

    <footer><span>今天已经完成 {todaySummary.completed} 个番茄钟</span><i/><span>本次离席：{awayCount} 次</span><i/><span>{visionUsesNetwork ? '检查帧临时发送至所配置服务，不保存' : '演示检查完全在本机，不上传画面'}</span></footer>

    {drawer && <div className="drawer-backdrop" onMouseDown={() => setDrawer(false)}><aside className="ai-drawer" onMouseDown={e => e.stopPropagation()} aria-label="AI 问答">
      <header><div><small>演示问答</small><h2>问问灯灯</h2></div><button aria-label="关闭问答" onClick={() => setDrawer(false)}>×</button></header>
      <div className="chat"><div className="bot-message">我可以帮你拆解任务、解释知识点，或者在卡住时给一点提示。</div>{answer && <div className="bot-message answer">{answer}</div>}</div>
      <form onSubmit={submit}><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="输入一个学习问题…" disabled={asking}/><button aria-label="发送" disabled={asking}>{asking ? '…' : '↑'}</button></form>
      <p>{aiProvider.label} · 可通过 VITE_AI_API_URL 配置</p>
    </aside></div>}
    {report && <div className="report-backdrop"><section className="session-report" aria-label="本次自习报告"><small>SESSION COMPLETE</small><h2>{report.outcome === 'completed' ? '完成得很好' : '本次自习已结束'}</h2><p>{report.goal || '未填写目标'}</p><div><strong>{Math.floor(report.actualSeconds / 60)}<small> 分钟</small></strong><span>暂停 {report.pauseCount} 次</span><span>离席 {report.awayCount} 次</span></div><p className="report-summary">灯灯总结：你已经为目标投入了一段真实的时间。下一次可以从刚才停下的位置继续。</p><button onClick={() => { setReport(null); setTimer(createTimer(timer.durationMs)); }}>收下报告</button></section></div>}
    {settingsOpen && <SettingsPanel preferences={preferences} assets={assets} secrets={secrets} onChange={setPreferences} onSecretChange={(id: ServiceId, value: string) => { setSecrets(current => ({ ...current, [id]: value })); saveSessionSecret(id, value); }} onAssetChange={(kind, value) => setAssets(current => ({ ...current, [kind]: value }))} onClose={() => setSettingsOpen(false)}/>} 
  </main>;
}

import { FormEvent, useEffect, useRef, useState } from 'react';
import { WhiteNoiseEngine } from './audio/whiteNoise';
import { createTimer, pauseTimer, resumeTimer, startTimer, tickTimer } from './domain/timer';
import { loadSessions, saveSession, summarizeToday } from './storage/sessionRepository';
import { CameraSession } from './supervision/cameraSession';
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
  const [supervising, setSupervising] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(62);
  const [audioReady, setAudioReady] = useState(false);
  const audioEngine = useRef<WhiteNoiseEngine | null>(null);
  const cameraSession = useRef<CameraSession | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recordedCompletion = useRef(false);
  const scene = scenes.find(item => item.id === sceneId)!;
  const running = timer.phase === 'focus';
  const minutes = Math.floor(timer.remainingMs / 60_000);
  const seconds = Math.floor((timer.remainingMs % 60_000) / 1_000);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTimer(current => tickTimer(current, Date.now())), 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (timer.phase !== 'completed' || recordedCompletion.current) return;
    recordedCompletion.current = true;
    saveSession(window.localStorage, {
      id: crypto.randomUUID(), goal, plannedMinutes: timer.durationMs / 60_000,
      actualSeconds: Math.round(timer.durationMs / 1_000), pauseCount, awayCount: 0,
      outcome: 'completed', completedAt: new Date().toISOString(),
    });
    setTodaySummary(summarizeToday(loadSessions()));
  }, [timer.phase, timer.durationMs, goal, pauseCount]);

  useEffect(() => {
    audioEngine.current?.update(sceneId, volume, muted);
  }, [sceneId, volume, muted]);

  useEffect(() => () => { audioEngine.current?.stop(); cameraSession.current?.stop(); }, []);

  const enableAudio = () => {
    if (!audioEngine.current) audioEngine.current = new WhiteNoiseEngine();
    void audioEngine.current.start(sceneId, volume, muted).then(() => setAudioReady(true));
  };

  const toggleSupervision = async () => {
    if (supervising) {
      cameraSession.current?.stop();
      if (videoRef.current) videoRef.current.srcObject = null;
      setSupervising(false);
      return;
    }
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('请使用 localhost 或 HTTPS 打开摄像头');
      cameraSession.current = new CameraSession();
      const stream = await cameraSession.current.start();
      if (videoRef.current) videoRef.current.srcObject = stream;
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

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    setAnswer('先写下今天最小的一步，完成它以后再决定下一步。现在，先专注十分钟。');
    setQuestion('');
  };

  return <main className={`app scene-${scene.id}`} aria-label={`${scene.name}场景`}>
    <div className="atmosphere" aria-hidden="true"><span/><span/><span/><span/></div>
    <header className="topbar">
      <div className="brand"><i className="brand-light"/><span>伴读</span><em>STUDY WITH ME</em></div>
      <div className="demo-pill"><i/>视觉预览 · 演示模式</div>
      <div className="today"><span>今日专注</span><strong>{String(Math.floor(todaySummary.seconds / 3600)).padStart(2, '0')}<small>h</small> {String(Math.floor(todaySummary.seconds % 3600 / 60)).padStart(2, '0')}<small>m</small></strong></div>
    </header>

    <nav className="scene-switcher" aria-label="选择学习场景">
      {scenes.map(item => <button key={item.id} aria-pressed={sceneId === item.id} onClick={() => setSceneId(item.id)} aria-label={item.name}>
        <span>{item.icon}</span><b>{item.name}</b><small>{item.time}</small>
      </button>)}
    </nav>

    <section className="workspace">
      <div className="window-frame"><SceneArtwork scene={scene.id}/></div>
      <div className="desk-line" aria-hidden="true"/>
      <section className={`companion ${running ? 'is-focus' : ''} ${supervising ? 'is-watch' : ''}`} aria-label="AI 伙伴灯灯">
        <div className="speech"><small>灯灯</small><p>{supervising ? '我会安静看守这段时间。' : running ? '陪你专注中' : '准备好时，我们就开始。'}</p></div>
        <div className="spirit"><div className="halo"/><div className="face"><i/><i/><b/></div><div className="body"/></div>
      </section>
      <div className={`camera-preview ${supervising ? 'visible' : ''}`} aria-hidden={!supervising}><video ref={videoRef} autoPlay muted playsInline/><span>仅本机实时画面 · 不保存</span></div>

      <section className="timer-card" aria-label="番茄钟">
        <div className="timer-meta"><span>{running ? 'FOCUSING' : timer.phase === 'paused' ? 'PAUSED' : 'READY'}</span><div><button onClick={() => selectDuration(25)}>25 / 5</button><button onClick={() => selectDuration(45)}>45 / 10</button></div></div>
        <div className="clock">{String(minutes).padStart(2, '0')}<span>:</span>{String(seconds).padStart(2, '0')}</div>
        <div className="goal"><small>本次目标</small><input aria-label="本次目标" value={goal} onChange={event => setGoal(event.target.value)}/></div>
        <button className="start" aria-label={running ? '暂停一下' : timer.phase === 'paused' ? '继续专注' : '开始专注'} onClick={toggleTimer}>{running ? '暂停一下' : timer.phase === 'paused' ? '继续专注' : '开始专注'}<span aria-hidden="true">→</span></button>
      </section>
    </section>

    <section className="control-dock">
      <div className="ambience"><div className="control-icon">♫</div><div><small>{audioReady ? muted ? '已静音' : '正在播放' : '点击播放'}</small><strong>{scene.noise}</strong></div><button onClick={() => { if (!audioReady) enableAudio(); else setMuted(v => !v); }} aria-label={!audioReady ? '播放白噪音' : muted ? '取消静音' : '静音'}>{!audioReady ? '▶' : muted ? '×' : '◖'}</button><input aria-label="白噪音音量" type="range" min="0" max="100" value={volume} onPointerDown={enableAudio} onChange={e => setVolume(Number(e.target.value))}/><output>{volume}%</output></div>
      <div className="divider"/>
      <div className="supervision"><div className={`camera-dot ${supervising ? 'on' : ''}`}>◉</div><div><small>摄像头监督</small><strong>{cameraError || (supervising ? '本机预览已开启 · 尚未调用模型' : '关闭时不访问摄像头')}</strong></div><button onClick={toggleSupervision}>{supervising ? '关闭摄像头' : '允许并开启'}</button></div>
      <button className="ask" onClick={() => setDrawer(true)} aria-label="问问灯灯"><span>✦</span>问问灯灯</button>
    </section>

    <footer><span>今天已经完成 {todaySummary.completed} 个番茄钟</span><i/><span>最近一次离席：无</span><i/><span>摄像头画面不上传、不保存</span></footer>

    {drawer && <div className="drawer-backdrop" onMouseDown={() => setDrawer(false)}><aside className="ai-drawer" onMouseDown={e => e.stopPropagation()} aria-label="AI 问答">
      <header><div><small>演示问答</small><h2>问问灯灯</h2></div><button aria-label="关闭问答" onClick={() => setDrawer(false)}>×</button></header>
      <div className="chat"><div className="bot-message">我可以帮你拆解任务、解释知识点，或者在卡住时给一点提示。</div>{answer && <div className="bot-message answer">{answer}</div>}</div>
      <form onSubmit={submit}><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="输入一个学习问题…"/><button aria-label="发送">↑</button></form>
      <p>本地固定回复 · 未调用在线模型</p>
    </aside></div>}
  </main>;
}

import { FormEvent, useState } from 'react';

type SceneId = 'rain' | 'forest' | 'coast' | 'cafe';
const scenes = [
  { id: 'rain' as const, name: '雨夜书房', noise: '窗外雨声', time: '22:18', icon: '⌁' },
  { id: 'forest' as const, name: '森林晨雾', noise: '林间风声', time: '06:42', icon: '♧' },
  { id: 'coast' as const, name: '海边黄昏', noise: '缓慢潮声', time: '18:27', icon: '≈' },
  { id: 'cafe' as const, name: '安静咖啡馆', noise: '咖啡馆低语', time: '15:06', icon: '⌇' },
];

export function App() {
  const [sceneId, setSceneId] = useState<SceneId>('rain');
  const [running, setRunning] = useState(false);
  const [supervising, setSupervising] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(62);
  const scene = scenes.find(item => item.id === sceneId)!;

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
      <div className="today"><span>今日专注</span><strong>02<small>h</small> 15<small>m</small></strong></div>
    </header>

    <nav className="scene-switcher" aria-label="选择学习场景">
      {scenes.map(item => <button key={item.id} aria-pressed={sceneId === item.id} onClick={() => setSceneId(item.id)} aria-label={item.name}>
        <span>{item.icon}</span><b>{item.name}</b><small>{item.time}</small>
      </button>)}
    </nav>

    <section className="workspace">
      <div className="window-frame" aria-hidden="true"><div className="horizon"/><div className="rain-lines"/></div>
      <div className="desk-line" aria-hidden="true"/>
      <section className={`companion ${running ? 'is-focus' : ''} ${supervising ? 'is-watch' : ''}`} aria-label="AI 伙伴灯灯">
        <div className="speech"><small>灯灯</small><p>{supervising ? '我会安静看守这段时间。' : running ? '陪你专注中' : '准备好时，我们就开始。'}</p></div>
        <div className="spirit"><div className="halo"/><div className="face"><i/><i/><b/></div><div className="body"/></div>
      </section>

      <section className="timer-card" aria-label="番茄钟">
        <div className="timer-meta"><span>{running ? 'FOCUSING' : 'READY'}</span><div><button>25 / 5</button><button>45 / 10</button></div></div>
        <div className="clock">25<span>:</span>00</div>
        <div className="goal"><small>本次目标</small><input aria-label="本次目标" defaultValue="整理第三章笔记，并完成 10 道练习"/></div>
        <button className="start" aria-label={running ? '暂停一下' : '开始专注'} onClick={() => setRunning(value => !value)}>{running ? '暂停一下' : '开始专注'}<span aria-hidden="true">→</span></button>
      </section>
    </section>

    <section className="control-dock">
      <div className="ambience"><div className="control-icon">♫</div><div><small>正在播放</small><strong>{scene.noise}</strong></div><button onClick={() => setMuted(v => !v)} aria-label={muted ? '取消静音' : '静音'}>{muted ? '×' : '◖'}</button><input aria-label="白噪音音量" type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))}/><output>{volume}%</output></div>
      <div className="divider"/>
      <div className="supervision"><div className={`camera-dot ${supervising ? 'on' : ''}`}>◉</div><div><small>模拟监督</small><strong>{supervising ? '模拟监督已开启' : '未调用摄像头或在线模型'}</strong></div><button onClick={() => setSupervising(v => !v)}>{supervising ? '关闭模拟监督' : '开启模拟监督'}</button></div>
      <button className="ask" onClick={() => setDrawer(true)} aria-label="问问灯灯"><span>✦</span>问问灯灯</button>
    </section>

    <footer><span>今天已经完成 4 个番茄钟</span><i/><span>最近一次离席：无</span><i/><span>所有监督结果均为模拟</span></footer>

    {drawer && <div className="drawer-backdrop" onMouseDown={() => setDrawer(false)}><aside className="ai-drawer" onMouseDown={e => e.stopPropagation()} aria-label="AI 问答">
      <header><div><small>演示问答</small><h2>问问灯灯</h2></div><button aria-label="关闭问答" onClick={() => setDrawer(false)}>×</button></header>
      <div className="chat"><div className="bot-message">我可以帮你拆解任务、解释知识点，或者在卡住时给一点提示。</div>{answer && <div className="bot-message answer">{answer}</div>}</div>
      <form onSubmit={submit}><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="输入一个学习问题…"/><button aria-label="发送">↑</button></form>
      <p>本地固定回复 · 未调用在线模型</p>
    </aside></div>}
  </main>;
}

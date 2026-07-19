import { useEffect, useState } from 'react';
import './update-notice.css';

export type UpdateState =
  | { status: 'idle' | 'checking' }
  | { status: 'available'; version?: string }
  | { status: 'downloading'; version?: string; percent: number; transferred: number; total: number }
  | { status: 'downloaded'; version?: string; action: 'restart' | 'open-installer' }
  | { status: 'error'; message: string };

export interface CompanionUpdateBridge {
  getState(): Promise<UpdateState>;
  check(): Promise<boolean>;
  install(): Promise<boolean>;
  dismiss(): Promise<void>;
  onState(listener: (state: UpdateState) => void): () => void;
}

declare global { interface Window { companionUpdate?: CompanionUpdateBridge } }

export function UpdateNotice({ bridge = window.companionUpdate }: { bridge?: CompanionUpdateBridge }) {
  const [state, setState] = useState<UpdateState>({ status: 'idle' });

  useEffect(() => {
    if (!bridge) return;
    let mounted = true;
    void bridge.getState().then(value => { if (mounted) setState(value); }).catch(() => undefined);
    const unsubscribe = bridge.onState(value => { if (mounted) setState(value); });
    return () => { mounted = false; unsubscribe(); };
  }, [bridge]);

  if (!bridge || state.status === 'idle') return null;

  if (state.status === 'downloaded') {
    const opensInstaller = state.action === 'open-installer';
    return <section className="update-notice update-ready" role="dialog" aria-label="应用更新">
      <div><strong>新版本{state.version ? ` ${state.version}` : ''}已准备好</strong><span>{opensInstaller ? '打开安装包后，请按系统提示完成更新。' : '重启后将自动完成安装。'}</span></div>
      <button className="update-primary" onClick={() => void bridge.install()}>{opensInstaller ? '打开安装包' : '立即重启更新'}</button>
      <button onClick={() => void bridge.dismiss()}>稍后</button>
    </section>;
  }

  if (state.status === 'downloading') {
    return <section className="update-notice" role="status">
      <div><strong>正在下载{state.version ? ` ${state.version}` : '更新'}</strong><span>{Math.round(state.percent)}%</span></div>
      <progress aria-label="更新下载进度" aria-valuenow={state.percent} value={state.percent} max="100"/>
    </section>;
  }

  if (state.status === 'error') {
    return <section className="update-notice update-error" role="status"><span>{state.message}</span><button onClick={() => void bridge.dismiss()}>关闭</button></section>;
  }

  return <section className="update-notice" role="status"><span>{state.status === 'checking' ? '正在检查更新…' : `发现新版本${state.version ? ` ${state.version}` : ''}，准备下载…`}</span></section>;
}

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UpdateNotice, type CompanionUpdateBridge, type UpdateState } from './UpdateNotice';

function bridge(initial: UpdateState) {
  let listener: ((state: UpdateState) => void) | undefined;
  const unsubscribe = vi.fn();
  const api: CompanionUpdateBridge = {
    getState: vi.fn().mockResolvedValue(initial),
    check: vi.fn().mockResolvedValue(true),
    install: vi.fn().mockResolvedValue(true),
    dismiss: vi.fn().mockResolvedValue(undefined),
    onState: vi.fn(callback => { listener = callback; return unsubscribe; }),
  };
  return { api, emit: (state: UpdateState) => listener?.(state), unsubscribe };
}

afterEach(() => cleanup());

describe('UpdateNotice', () => {
  it('stays hidden while updates are idle', async () => {
    const { api } = bridge({ status: 'idle' });
    const { container } = render(<UpdateNotice bridge={api}/>);
    await waitFor(() => expect(api.getState).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows normalized download progress', async () => {
    const { api } = bridge({ status: 'downloading', version: '0.2.0', percent: 42.3, transferred: 420, total: 1000 });
    render(<UpdateNotice bridge={api}/>);
    expect(await screen.findByText('正在下载 0.2.0')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42.3');
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('prompts for a Windows restart and allows postponing', async () => {
    const { api } = bridge({ status: 'downloaded', version: '0.2.0', action: 'restart' });
    render(<UpdateNotice bridge={api}/>);
    fireEvent.click(await screen.findByRole('button', { name: '立即重启更新' }));
    expect(api.install).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '稍后' }));
    expect(api.dismiss).toHaveBeenCalledTimes(1);
  });

  it('prompts unsigned macOS users to open the installer', async () => {
    const { api } = bridge({ status: 'downloaded', version: '0.2.0', action: 'open-installer' });
    render(<UpdateNotice bridge={api}/>);
    fireEvent.click(await screen.findByRole('button', { name: '打开安装包' }));
    expect(api.install).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: '立即重启更新' })).not.toBeInTheDocument();
  });

  it('shows safe errors and cleans up its subscription', async () => {
    const { api, emit, unsubscribe } = bridge({ status: 'idle' });
    const view = render(<UpdateNotice bridge={api}/>);
    await waitFor(() => expect(api.onState).toHaveBeenCalled());
    emit({ status: 'error', message: '更新暂时不可用，请稍后重试' });
    expect(await screen.findByText('更新暂时不可用，请稍后重试')).toBeInTheDocument();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('study room preview', () => {
  it('does not show the demonstration preview badge', () => {
    render(<App />);
    expect(screen.queryByText('视觉预览 · 演示模式')).not.toBeInTheDocument();
  });

  it('opens a persistent settings center', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '打开设置' }));
    expect(screen.getByRole('region', { name: '设置中心' })).toBeVisible();
    expect(screen.getByRole('button', { name: /芽芽/ })).toBeVisible();
  });

  it('shows bundled scene credits and license links', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '打开设置' }));
    await userEvent.click(screen.getByRole('button', { name: /素材鸣谢/ }));
    expect(screen.getByText('Hemanth K M · Pexels')).toBeVisible();
    expect(screen.getByText('Ambient_House · Pixabay')).toBeVisible();
    expect(screen.getByText('정규송 Nui MALAMA · Pexels')).toBeVisible();
    expect(screen.getByText('Bonus Studio · Pexels')).toBeVisible();
    expect(screen.getAllByRole('link', { name: '查看来源' })).toHaveLength(8);
    expect(screen.getAllByRole('link', { name: '查看许可证' })).toHaveLength(8);
  });

  it('switches between all four atmospheric scenes', async () => {
    render(<App />);
    expect(screen.getByLabelText('雨中绿叶')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '森林' }));
    expect(screen.getByRole('main', { name: '森林场景' })).toBeVisible();
    expect(screen.getByText('森林风声与鸟鸣')).toBeVisible();
    expect(screen.getByLabelText('绿树与天空')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '海边' }));
    expect(screen.getByLabelText('宁静沙滩海浪')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '咖啡馆' }));
    expect(screen.getByLabelText('咖啡馆室内窗景')).toBeVisible();
  });

  it('uses standard play and pause ambience controls', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: '播放白噪音' })).toHaveTextContent('▶');
    expect(screen.getByRole('slider', { name: '白噪音音量' })).toHaveValue('62');
  });

  it('starts a visual focus session', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '开始专注' }));
    expect(screen.getByRole('button', { name: '暂停一下' })).toBeVisible();
    expect(screen.getByText('陪你专注中')).toBeVisible();
    expect(screen.queryByText('视觉预览 · 演示模式')).not.toBeInTheDocument();
  });

  it('creates a report when the user ends a session early', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '开始专注' }));
    await userEvent.click(screen.getByRole('button', { name: '提前结束并生成报告' }));
    expect(await screen.findByRole('region', { name: '本次自习报告' })).toBeVisible();
    expect(screen.getByText('本次自习已结束')).toBeVisible();
  });

  it('discloses camera privacy and answers locally', async () => {
    render(<App />);
    expect(screen.getByText('关闭时不访问摄像头')).toBeVisible();
    expect(screen.getByText('演示检查完全在本机，不上传画面')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '问问灯灯' }));
    await userEvent.type(screen.getByPlaceholderText('输入一个学习问题…'), '怎么开始复习？');
    await userEvent.click(screen.getByRole('button', { name: '发送' }));
    expect(screen.getByText(/先写下今天最小的一步/)).toBeVisible();
  });
});

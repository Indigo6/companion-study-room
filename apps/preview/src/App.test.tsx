import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('study room preview', () => {
  it('identifies itself as a demonstration preview', () => {
    render(<App />);
    expect(screen.getByText('视觉预览 · 演示模式')).toBeVisible();
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
    expect(screen.getByText('Imeel Bagdisar · Pexels')).toBeVisible();
    expect(screen.getByText('EminYILDIRIM · Freesound CC0')).toBeVisible();
    expect(screen.getByText('Dey Kheireddine · Pexels')).toBeVisible();
    expect(screen.getByText('Bonus Studio · Pexels')).toBeVisible();
    expect(screen.getAllByRole('link', { name: '查看来源' })).toHaveLength(8);
    expect(screen.getAllByRole('link', { name: '查看许可证' })).toHaveLength(8);
  });

  it('switches between all four atmospheric scenes', async () => {
    render(<App />);
    expect(screen.getByLabelText('雨夜城市窗景')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '森林晨雾' }));
    expect(screen.getByRole('main', { name: '森林晨雾场景' })).toBeVisible();
    expect(screen.getByText('林间风声')).toBeVisible();
    expect(screen.getByLabelText('晨雾森林窗景')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '海边黄昏' }));
    expect(screen.getByLabelText('黄昏海岸窗景')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '安静咖啡馆' }));
    expect(screen.getByLabelText('咖啡馆室内窗景')).toBeVisible();
  });

  it('starts a visual focus session and keeps demo disclosure', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '开始专注' }));
    expect(screen.getByRole('button', { name: '暂停一下' })).toBeVisible();
    expect(screen.getByText('陪你专注中')).toBeVisible();
    expect(screen.getByText('视觉预览 · 演示模式')).toBeVisible();
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

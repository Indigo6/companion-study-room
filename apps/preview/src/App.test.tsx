import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('study room preview', () => {
  it('identifies itself as a demonstration preview', () => {
    render(<App />);
    expect(screen.getByText('视觉预览 · 演示模式')).toBeVisible();
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

  it('labels supervision as simulated and answers locally', async () => {
    render(<App />);
    expect(screen.getByText('未调用摄像头或在线模型')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '开启模拟监督' }));
    expect(screen.getByText('模拟监督已开启')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '问问灯灯' }));
    await userEvent.type(screen.getByPlaceholderText('输入一个学习问题…'), '怎么开始复习？');
    await userEvent.click(screen.getByRole('button', { name: '发送' }));
    expect(screen.getByText(/先写下今天最小的一步/)).toBeVisible();
  });
});

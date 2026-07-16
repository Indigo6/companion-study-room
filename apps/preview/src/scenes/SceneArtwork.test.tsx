import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SceneArtwork } from './SceneArtwork';

describe('SceneArtwork', () => {
  it('renders an ambient inline video for the selected scene', () => {
    render(<SceneArtwork scene="coast" reduceMotion={false}/>);
    const video = screen.getByLabelText('黄昏海岸窗景');
    expect(video).toHaveAttribute('src', './media/scenes/coast.webm');
    expect(video).toHaveAttribute('poster', './media/scenes/coast.webp');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveProperty('muted', true);
  });

  it('uses the poster when reduced motion is enabled', () => {
    render(<SceneArtwork scene="forest" reduceMotion/>);
    expect(screen.getByRole('img', { name: '晨雾森林窗景' })).toHaveAttribute('src', './media/scenes/forest.webp');
    expect(screen.queryByLabelText('晨雾森林窗景', { selector: 'video' })).not.toBeInTheDocument();
  });

  it('falls back to the poster when video loading fails', () => {
    render(<SceneArtwork scene="rain" reduceMotion={false}/>);
    fireEvent.error(screen.getByLabelText('雨夜城市窗景'));
    expect(screen.getByRole('img', { name: '雨夜城市窗景' })).toHaveAttribute('src', './media/scenes/rain.webp');
  });
});

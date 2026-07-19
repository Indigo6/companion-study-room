import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SceneArtwork } from './SceneArtwork';

describe('SceneArtwork', () => {
  it('renders an ambient inline video for the selected scene', () => {
    render(<SceneArtwork scene="coast" reduceMotion={false}/>);
    const video = screen.getByLabelText('宁静沙滩海浪');
    expect(video).toHaveAttribute('src', './media/scenes/coast.webm');
    expect(video).toHaveAttribute('poster', './media/scenes/coast.webp');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveProperty('muted', true);
  });

  it('uses the poster when reduced motion is enabled', () => {
    render(<SceneArtwork scene="forest" reduceMotion/>);
    expect(screen.getByRole('img', { name: '绿树与天空' })).toHaveAttribute('src', './media/scenes/forest.webp');
    expect(screen.queryByLabelText('绿树与天空', { selector: 'video' })).not.toBeInTheDocument();
  });

  it('falls back to the poster when video loading fails', () => {
    render(<SceneArtwork scene="rain" reduceMotion={false}/>);
    fireEvent.error(screen.getByLabelText('雨中绿叶'));
    expect(screen.getByRole('img', { name: '雨中绿叶' })).toHaveAttribute('src', './media/scenes/rain.webp');
  });
});

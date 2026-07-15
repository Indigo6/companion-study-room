import { describe, expect, it } from 'vitest';
import { loadLocalAsset, validateLocalAsset } from './localAssetStore';

describe('local asset validation', () => {
  it('accepts supported background and ambience files', () => {
    expect(validateLocalAsset(new File(['x'], 'room.webp', { type: 'image/webp' }), 'background').ok).toBe(true);
    expect(validateLocalAsset(new File(['x'], 'rain.mp3', { type: 'audio/mpeg' }), 'ambience').ok).toBe(true);
  });

  it('rejects mismatched and oversized files', () => {
    expect(validateLocalAsset(new File(['x'], 'bad.exe', { type: 'application/octet-stream' }), 'background').ok).toBe(false);
    const huge = { name: 'huge.wav', type: 'audio/wav', size: 41 * 1024 * 1024 } as File;
    expect(validateLocalAsset(huge, 'ambience')).toEqual({ ok: false, error: '音频不能超过 40 MB' });
  });

  it('reports unavailable persistent storage without an unhandled reference error', async () => {
    await expect(loadLocalAsset('background')).rejects.toThrow('当前环境不支持本地素材存储');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { captureVideoFrame } from './frameCapture';

describe('transient frame capture', () => {
  it('draws a small frame and encodes it as compressed jpeg', async () => {
    const blob = new Blob(['frame'], { type: 'image/jpeg' });
    const drawImage = vi.fn();
    const canvas = {
      width: 0, height: 0,
      getContext: () => ({ drawImage }),
      toBlob: (callback: BlobCallback, type?: string, quality?: number) => {
        expect(type).toBe('image/jpeg');
        expect(quality).toBe(0.6);
        callback(blob);
      },
    } as unknown as HTMLCanvasElement;
    const video = { videoWidth: 1280, videoHeight: 720 } as HTMLVideoElement;

    await expect(captureVideoFrame(video, () => canvas)).resolves.toBe(blob);
    expect([canvas.width, canvas.height]).toEqual([480, 270]);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 480, 270);
  });

  it('refuses to capture before video metadata is ready', async () => {
    await expect(captureVideoFrame({ videoWidth: 0, videoHeight: 0 } as HTMLVideoElement)).rejects.toThrow('摄像头画面尚未就绪');
  });
});

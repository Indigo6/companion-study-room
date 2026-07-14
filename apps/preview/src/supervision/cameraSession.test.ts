import { describe, expect, it, vi } from 'vitest';
import { CameraSession } from './cameraSession';

describe('camera session', () => {
  it('requests a modest front-facing video stream and stops every track', async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    const session = new CameraSession({ getUserMedia } as unknown as MediaDevices);

    expect(await session.start()).toBe(stream);
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 360 } }, audio: false });
    session.stop();
    expect(stop).toHaveBeenCalledOnce();
  });

  it('reports denied permission without retaining a stream', async () => {
    const session = new CameraSession({ getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) } as unknown as MediaDevices);
    await expect(session.start()).rejects.toThrow('denied');
    expect(session.active).toBe(false);
  });
});

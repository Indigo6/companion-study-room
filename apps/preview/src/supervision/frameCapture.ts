type CanvasFactory = () => HTMLCanvasElement;

export function captureVideoFrame(
  video: HTMLVideoElement,
  createCanvas: CanvasFactory = () => document.createElement('canvas'),
): Promise<Blob> {
  if (!video.videoWidth || !video.videoHeight) return Promise.reject(new Error('摄像头画面尚未就绪'));
  const canvas = createCanvas();
  canvas.width = 480;
  canvas.height = Math.round(480 * video.videoHeight / video.videoWidth);
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('无法读取摄像头画面'));
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('无法压缩摄像头画面')), 'image/jpeg', 0.6);
  });
}

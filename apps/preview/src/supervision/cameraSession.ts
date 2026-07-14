export class CameraSession {
  private stream?: MediaStream;

  constructor(private readonly mediaDevices: MediaDevices = navigator.mediaDevices) {}

  get active(): boolean { return Boolean(this.stream); }

  async start(): Promise<MediaStream> {
    this.stop();
    const stream = await this.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 360 } }, audio: false });
    this.stream = stream;
    return stream;
  }

  stop(): void {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = undefined;
  }
}

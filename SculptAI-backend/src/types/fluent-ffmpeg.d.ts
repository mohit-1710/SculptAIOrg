declare module 'fluent-ffmpeg' {
  interface FfmpegCommand {
    input(file: string): FfmpegCommand;
    inputOptions(options: string[]): FfmpegCommand;
    outputOptions(options: string[]): FfmpegCommand;
    output(file: string): FfmpegCommand;
    on(event: string, callback: (err?: Error, stdout?: string, stderr?: string) => void): FfmpegCommand;
    run(): FfmpegCommand;
  }

  interface FfmpegModule {
    (options?: any): FfmpegCommand;
    setFfmpegPath(path: string): void;
    ffprobe(file: string, callback: (err: Error | null, data: any) => void): void;
  }

  const ffmpeg: FfmpegModule;
  export default ffmpeg;
} 
declare module 'elevenlabs-node' {
  export interface VoiceSettings {
    stability: number;
    similarityBoost: number;
  }

  export interface Voice {
    // Add any Voice properties if needed
  }

  export interface TextToSpeechParams {
    voiceId: string;
    textInput: string;
    voiceSettings: VoiceSettings;
    outputFormat?: string;
  }

  export class ElevenLabs {
    constructor(config: { apiKey: string });
    textToSpeech(params: TextToSpeechParams): Promise<Buffer>;
  }
}

declare module 'fluent-ffmpeg' {
  interface FfmpegCommand {
    input(file: string): FfmpegCommand;
    inputOptions(options: string[]): FfmpegCommand;
    outputOptions(options: string[]): FfmpegCommand;
    output(file: string): FfmpegCommand;
    on(event: string, callback: (err?: any, stdout?: any, stderr?: any) => void): FfmpegCommand;
    run(): FfmpegCommand;
  }

  interface FfprobeData {
    format: {
      duration?: number;
    };
  }

  function ffprobe(file: string, callback: (err: Error | null, data: FfprobeData) => void): void;
  function setFfmpegPath(path: string): void;
  
  function ffmpeg(): FfmpegCommand;
  export = ffmpeg;
} 
export enum AppStatus {
  IDLE = 'IDLE',
  SELECTING_IMAGE = 'SELECTING_IMAGE',
  READY_TO_UPSCALE = 'READY_TO_UPSCALE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type UpscaleMode = 'standard' | '2x';
export type DetailLevel = 'low' | 'medium' | 'high';

export interface ImageData {
  url: string;
  base64: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface UpscaleOptions {
  mode: UpscaleMode;
  removeBackground: boolean;
  creativity: number; // 0.0 to 1.0
  detailLevel: DetailLevel;
}

export interface ProcessingStats {
  durationMs: number;
  originalSize: string;
}
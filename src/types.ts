export interface CapturedFile {
  id: string;
  name: string;
  type: "photo" | "video";
  dataUrl: string; // Base64 data url for preview and attachments
  timestamp: string;
}

export interface SmtpConfig {
  host: string;
  port: string;
  user: string;
  pass: string;
  secure: boolean;
}

export type ZoomLevel = 0.5 | 1.0 | 3.0 | 10.0 | 15.0;

export type CameraMode = "photo" | "video";

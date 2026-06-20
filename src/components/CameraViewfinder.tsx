import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { ZoomLevel, CameraMode, CapturedFile } from "../types";
import { Video, Award, AlertCircle, Camera, RefreshCw } from "lucide-react";

interface CameraViewfinderProps {
  zoom: ZoomLevel;
  mode: CameraMode;
  onMediaCaptured: (item: CapturedFile) => void;
  onStreamStatus?: (active: boolean) => void;
}

export interface CameraViewfinderRef {
  capturePhoto: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
  recordingSeconds: number;
}

export const CameraViewfinder = forwardRef<CameraViewfinderRef, CameraViewfinderProps>(
  ({ zoom, mode, onMediaCaptured, onStreamStatus }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
    const [activeFacingMode, setActiveFacingMode] = useState<"environment" | "user">("environment");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isIframe, setIsIframe] = useState<boolean>(false);

    useEffect(() => {
      setIsIframe(window.self !== window.top);
    }, []);

    const nativePhotoInputRef = useRef<HTMLInputElement | null>(null);
    const nativeVideoInputRef = useRef<HTMLInputElement | null>(null);

    const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: "photo" | "video") => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const timestamp = new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        onMediaCaptured({
          id: `${fileType}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: `${fileType === "photo" ? "Foto" : "Video"}_${new Date().toISOString().slice(0, 10)}_${timestamp.replace(/:/g, "-")}.${fileType === "photo" ? "jpg" : "mp4"}`,
          type: fileType,
          dataUrl,
          timestamp,
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    };

    // Initialize Camera Stream
    const initCamera = async (facing: "environment" | "user" = "environment") => {
      try {
        setError(null);
        // Stop any existing tracks
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          audio: false, // Request audio false by default to prevent blocking and slow loaded streams
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        setActiveFacingMode(facing);
        if (onStreamStatus) onStreamStatus(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setError(
          "Não foi possível acessar a câmera do dispositivo em tempo real devido a restrições do navegador ou do iframe."
        );
        if (onStreamStatus) onStreamStatus(false);
      }
    };

    // Auto start on mount
    useEffect(() => {
      initCamera("environment");
      return () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }, []);

    // Flip Camera handler
    const toggleCameraFacing = () => {
      const nextFacing = activeFacingMode === "environment" ? "user" : "environment";
      initCamera(nextFacing);
    };

    // Toggle recording timer
    useEffect(() => {
      if (isRecording) {
        setRecordingSeconds(0);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } else {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      }
      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }, [isRecording]);

    // Format seconds standard mm:ss
    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60).toString().padStart(2, "0");
      const s = (secs % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    };

    // Draw frame to canvas considering standard or digital zooms
    const captureFromStream = (): string | null => {
      const video = videoRef.current;
      if (!video || !stream) return null;

      // Create internal canvas with video's raw natural attributes
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const w = canvas.width;
      const h = canvas.height;

      // Handle custom zoom coordinates
      if (zoom === 1.0) {
        ctx.drawImage(video, 0, 0, w, h);
      } else if (zoom > 1.0) {
        // Zoom crop equations
        const sliceWidth = w / zoom;
        const sliceHeight = h / zoom;
        const sx = (w - sliceWidth) / 2;
        const sy = (h - sliceHeight) / 2;
        ctx.drawImage(video, sx, sy, sliceWidth, sliceHeight, 0, 0, w, h);
      } else if (zoom === 0.5) {
        // Digital 0.5x simulation by padding to center to mimic standard wide-angle view zoom-out
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, h);
        const paddingScale = 0.7; // Scale image target
        const tw = w * paddingScale;
        const th = h * paddingScale;
        const tx = (w - tw) / 2;
        const ty = (h - th) / 2;
        ctx.drawImage(video, 0, 0, w, h, tx, ty, tw, th);
      }

      return canvas.toDataURL("image/jpeg", 0.9);
    };

    // Export imperative camera functions to App or trigger controls
    useImperativeHandle(ref, () => ({
      capturePhoto: async () => {
        if (!stream) {
          if (nativePhotoInputRef.current) {
            nativePhotoInputRef.current.click();
          }
          return;
        }
        const dataUrl = captureFromStream();
        if (dataUrl) {
          const timestamp = new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          onMediaCaptured({
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: `Foto_${new Date().toISOString().slice(0, 10)}_${timestamp.replace(/:/g, "-")}.jpg`,
            type: "photo",
            dataUrl,
            timestamp,
          });
        }
      },
      startRecording: () => {
        if (!stream) {
          if (nativeVideoInputRef.current) {
            nativeVideoInputRef.current.click();
          }
          return;
        }
        recordingChunksRef.current = [];
        try {
          // Initialize media recorder
          const recorder = new MediaRecorder(stream, {
            mimeType: "video/webm;codecs=vp8,opus",
          });

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordingChunksRef.current.push(event.data);
            }
          };

          recorder.onstop = async () => {
            const blob = new Blob(recordingChunksRef.current, { type: "video/webm" });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              const base64data = reader.result as string;
              const timestamp = new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
              onMediaCaptured({
                id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: `Video_${new Date().toISOString().slice(0, 10)}_${timestamp.replace(/:/g, "-")}.webm`,
                type: "video",
                dataUrl: base64data,
                timestamp,
              });
            };
          };

          mediaRecorderRef.current = recorder;
          recorder.start();
          setIsRecording(true);
        } catch (e) {
          console.error("MediaRecorder start error, fallback:", e);
          // Fallback without audio config or simpler mime
          try {
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                recordingChunksRef.current.push(event.data);
              }
            };
            recorder.onstop = async () => {
              const blob = new Blob(recordingChunksRef.current);
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                const base64data = reader.result as string;
                const timestamp = new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                onMediaCaptured({
                  id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  name: `Video_${new Date().toISOString().slice(0, 10)}_${timestamp.replace(/:/g, "-")}.mp4`,
                  type: "video",
                  dataUrl: base64data,
                  timestamp,
                });
              };
            };
            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
          } catch (fallbackErr) {
            alert("Não foi possível iniciar a gravação de vídeo no seu navegador.");
          }
        }
      },
      stopRecording: () => {
        if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      },
      isRecording,
      recordingSeconds,
    }));

    // Interactive scale factor calculation for styling the viewfinder preview only
    const getScaleTransform = () => {
      if (zoom === 0.5) return "scale(0.7)";
      return `scale(${zoom})`;
    };

    return (
      <div id="viewfinder_viewport" className="absolute inset-0 w-full h-full overflow-hidden bg-stone-950 flex items-center justify-center z-0">
        {/* Hidden inputs always loaded in DOM to avoid React refs issues */}
        <input
          type="file"
          id="native_photo_input"
          ref={nativePhotoInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleNativeFileChange(e, "photo")}
        />
        <input
          type="file"
          id="native_video_input"
          ref={nativeVideoInputRef}
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleNativeFileChange(e, "video")}
        />

        {/* Error placeholder screen */}
        {error ? (
          <div id="camera_error_card" className="flex flex-col items-center justify-center p-6 text-center text-rose-200 z-10 max-w-md bg-stone-900/90 border border-stone-850 rounded-2xl mx-4 shadow-xl overflow-y-auto max-h-[90vh]">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3 animate-bounce shrink-0" id="err_icon" />
            <h3 className="text-sm font-bold text-white mb-1">Permissão de Câmera Bloqueada</h3>
            <p className="text-[11px] text-stone-300 font-sans mb-4 leading-relaxed">
              O navegador barrou o acesso à câmera devido a restrições de segurança do iframe.
            </p>

            {/* IFRAME DECTECTOR QUICK FIX */}
            {isIframe && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 mb-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] tracking-wider uppercase transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 border border-emerald-500 animate-pulse cursor-pointer"
              >
                <span>🚀 Abrir em Nova Aba (Celular)</span>
              </a>
            )}

            {/* Iframed environment special note */}
            <div className="bg-amber-550/10 border border-amber-500/20 p-3 rounded-lg text-left text-amber-205 text-[10.5px] leading-relaxed mb-4 space-y-1.5">
              <strong className="block text-[11px] text-amber-305 font-bold">⚠️ Correção Rápida para Celular:</strong>
              <p>
                Nenhum app consegue acessar a câmera de verdade dentro deste painel simulado.
              </p>
              <p className="font-semibold text-white">
                Abra o app em tela cheia clicando no botão verde acima ou no ícone de "Nova Aba" no canto superior direito do seu painel!
              </p>
            </div>

            <div className="text-left w-full space-y-1.5 border-t border-stone-800 pt-3 mb-4">
              <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-widest block">Como liberar em tela cheia:</span>
              <p className="text-[10px] text-stone-300 leading-normal font-sans">
                Quando abrir em Nova Aba, o dispositivo perguntará: <strong>"Deseja permitir que este app use sua câmera?"</strong>. Basta tocar em <strong>"Permitir"</strong>!
              </p>
            </div>

            <div className="text-left w-full space-y-1.5 mb-3">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest block font-mono">📸 Captura Direta Sem Permissão:</span>
              <p className="text-[11px] text-stone-300 leading-normal font-sans">
                Você pode usar o seletor nativo do seu celular agora mesmo tocando abaixo:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full mb-4">
              <label
                id="native_photo_trigger_err"
                htmlFor="native_photo_input"
                className="py-3 bg-stone-800 hover:bg-stone-750 active:scale-95 text-white border border-stone-700 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" /> Tirar Foto
              </label>
              <label
                id="native_video_trigger_err"
                htmlFor="native_video_input"
                className="py-3 bg-stone-800 hover:bg-stone-750 active:scale-95 text-white border border-stone-700 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-rose-400" /> Gravar Vídeo
              </label>
            </div>

            <button
              id="retry_camera_btn"
              onClick={() => initCamera("environment")}
              className="w-full py-2 border border-stone-850 hover:bg-stone-800 text-stone-400 rounded-xl font-semibold text-[9px] tracking-wider uppercase transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Tentar Reconectar Câmera Real
            </button>
          </div>
        ) : (
          /* Live Viewfinder element with transitions */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              id="camera_feed_video"
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transition-transform duration-300 ease-out"
              style={{
                transform: getScaleTransform(),
                transformOrigin: "center center",
              }}
            />

            {/* Subtle camera frame grids overlays */}
            <div id="lines_grid" className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
              <div className="border-r border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-b border-white/10"></div>
              <div className="border-r border-white/10"></div>
              <div className="border-r border-white/10"></div>
              <div></div>
            </div>

            {/* Recording badge/clock */}
            {isRecording && (
              <div id="recording_timer_badge" className="absolute top-20 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-rose-600/90 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-lg border border-rose-500/30 flex items-center gap-2 animate-pulse z-15">
                <span className="w-2.5 h-2.5 rounded-full bg-white block"></span>
                <span>GRAVANDO {formatTime(recordingSeconds)}</span>
              </div>
            )}

            {/* Quick Switch Camera Button (Rear/Front toggle) */}
            {!isRecording && (
              <button
                id="camera_flip_toggle_btn"
                onClick={toggleCameraFacing}
                title="Inverter Câmera"
                className="absolute top-20 right-4 p-3 bg-black/60 backdrop-blur-md rounded-full text-slate-200 border border-white/15 active:scale-90 hover:text-emerald-400 hover:border-emerald-500/40 transition-all z-20"
              >
                <RefreshCw className="w-5 h-5" id="flip_icon" />
              </button>
            )}

            {/* Mode status indicator */}
            <div id="camera_active_mode_badge" className="absolute bottom-32 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-[11px] font-mono tracking-widest text-emerald-400 capitalize border border-emerald-500/20 z-15 flex items-center gap-1.5 shadow-sm">
              {mode === "video" ? (
                <>
                  <Video className="w-3 h-3 text-red-500 animate-pulse" />
                  Modo Vídeo
                </>
              ) : (
                <>
                  <Camera className="w-3 h-3 text-emerald-400" />
                  Modo Foto
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

CameraViewfinder.displayName = "CameraViewfinder";

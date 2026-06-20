import { useState, useEffect, useRef } from "react";
import { CameraViewfinder, CameraViewfinderRef } from "./components/CameraViewfinder";
import { Navbar } from "./components/Navbar";
import { SettingsPanel } from "./components/SettingsPanel";
import { CapturedFile, SmtpConfig, ZoomLevel, CameraMode } from "./types";
import { Camera, Image as ImageIcon, Video, CheckCircle, AlertTriangle, Info, Mail, Sparkles, Send } from "lucide-react";

export default function App() {
  const viewfinderRef = useRef<CameraViewfinderRef | null>(null);

  // Core configuration states (retrieved from localStorage or defaults)
  const [targetEmail, setTargetEmail] = useState<string>(() => {
    return localStorage.getItem("dm_target_email") || "jubabarkika1@gmail.com";
  });

  const [smtp, setSmtp] = useState<SmtpConfig>(() => {
    try {
      const saved = localStorage.getItem("dm_smtp_config");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read SMTP settings:", e);
    }
    return {
      host: "",
      port: "",
      user: "",
      pass: "",
      secure: false,
    };
  });

  // Action states
  const [capturedFiles, setCapturedFiles] = useState<CapturedFile[]>([]);
  const [zoom, setZoom] = useState<ZoomLevel>(1.0);
  const [mode, setMode] = useState<CameraMode>("photo");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [hasActiveStream, setHasActiveStream] = useState<boolean>(true);

  // Floating responsive notification banner
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | "local";
    text: string;
  } | null>(null);

  const showNotification = (text: string, type: "success" | "error" | "info" | "local" = "info") => {
    setNotification({ text, type });
  };

  // Dismiss notification after 4.5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle newly captured media file additions
  const handleMediaCaptured = (item: CapturedFile) => {
    setCapturedFiles((prev) => [item, ...prev]);

    // Animate custom viewport flash for photos
    if (item.type === "photo") {
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 150);
      showNotification(`Foto de alta resolução salva na lista!`, "success");
    } else {
      showNotification(`Vídeo gravado e adicionado à lista!`, "success");
    }
  };

  // Capture Photo/Video trigger button handler
  const handleCaptureTrigger = async () => {
    if (!viewfinderRef.current) return;

    if (mode === "photo") {
      await viewfinderRef.current.capturePhoto();
    } else {
      // Toggle video recording state
      if (viewfinderRef.current.isRecording) {
        viewfinderRef.current.stopRecording();
      } else {
        viewfinderRef.current.startRecording();
      }
    }
  };

  // Media Gallery quick-actions
  const handleDeleteFile = (id: string) => {
    setCapturedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleClearAll = () => {
    setCapturedFiles([]);
  };

  // Save Config to persistence
  const handleSaveConfig = (email: string, updatedSmtp: SmtpConfig) => {
    setTargetEmail(email);
    setSmtp(updatedSmtp);
    localStorage.setItem("dm_target_email", email);
    localStorage.setItem("dm_smtp_config", JSON.stringify(updatedSmtp));
  };

  // Send files action directly via Server API
  const handleSendFiles = async () => {
    if (capturedFiles.length === 0) {
      showNotification("Por favor, tire pelo menos uma foto ou vídeo para enviar.", "error");
      return;
    }

    if (!targetEmail || !targetEmail.includes("@")) {
      showNotification("Por favor, configure um e-mail de destino válido em Ajustes.", "error");
      setIsSettingsOpen(true);
      return;
    }

    setIsSending(true);
    showNotification("Preparando mídia e conectando ao servidor...", "info");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetEmail,
          files: capturedFiles,
          customSmtp: smtp.host && smtp.user ? smtp : null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.localSaved) {
          showNotification(data.message, "local");
        } else {
          showNotification(`E-mail com ${capturedFiles.length} mídia(s) enviado com sucesso para ${targetEmail}!`, "success");
          setCapturedFiles([]); // Clear queue on perfect send
        }
      } else {
        showNotification(data.error || "Erro desconhecido ao tentar despachar e-mail.", "error");
      }
    } catch (e: any) {
      console.error("Transmission Error:", e);
      showNotification(`Erro de conexão com o servidor: ${e.message || "Tente novamente."}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      id="root_camera_frame_wrapper"
      className="relative h-[100dvh] w-full bg-stone-950 overflow-hidden flex flex-col font-sans select-none"
    >
      {/* Viewport flash light screen simulation */}
      {shutterFlash && (
        <div
          id="camera_viewport_flash"
          className="absolute inset-0 bg-white z-50 transition-opacity duration-150 animate-pulse pointer-events-none"
        />
      )}

      {/* Floating dynamic notification banner alerts */}
      {notification && (
        <div
          id="toast_notification_banner"
          className="absolute top-20 left-4 right-4 z-45 animate-fade-in pointer-events-none"
        >
          <div
            className={`p-3.5 rounded-xl shadow-xl border flex items-start gap-3 pointer-events-auto max-w-md mx-auto ${
              notification.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-250"
                : notification.type === "error"
                ? "bg-rose-950/95 border-rose-500/30 text-rose-250"
                : notification.type === "local"
                ? "bg-blue-950/95 border-blue-500/30 text-blue-200"
                : "bg-stone-900/95 border-stone-800 text-stone-200"
            }`}
          >
            {notification.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {notification.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />}
            {notification.type === "local" && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
            {notification.type === "info" && <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />}
            <div className="flex-1">
              <span className="text-xs font-medium font-sans leading-relaxed">{notification.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* Glossy fixed top header navigation */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSend={handleSendFiles}
        filesCount={capturedFiles.length}
        isSending={isSending}
      />

      {/* 100% Full-height Camera viewport */}
      <CameraViewfinder
        ref={viewfinderRef}
        zoom={zoom}
        mode={mode}
        onMediaCaptured={handleMediaCaptured}
        onStreamStatus={(active) => setHasActiveStream(active)}
      />

      {/* Elegant overlays and translucent buttons at the bottom */}
      <div
        id="camera_bottom_panel"
        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent pt-12 pb-8 px-4 z-40 flex flex-col items-center gap-6"
      >
        {/* Dynamic Zoom, capture and mode container */}
        <div className="w-full max-w-md flex flex-col gap-4">
          
          {/* Main action bar row */}
          <div className="flex items-center justify-between gap-2 px-2">
            
            {/* LEFT BLOCK: Multi-Zoom option selectors */}
            <div className="flex flex-col items-start gap-1 flex-1">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-semibold">ZOOM</span>
              <div className="flex items-center bg-black/75 p-0.5 rounded-full border border-white/10 shadow-lg">
                {([0.5, 1.0, 3.0, 10.0, 15.0] as ZoomLevel[]).map((level) => (
                  <button
                    key={level}
                    id={`zoom_btn_${level}`}
                    onClick={() => {
                      if (viewfinderRef.current?.isRecording) return; // lock zoom changes during recording
                      setZoom(level);
                    }}
                    title={`Zoom de ${level}x`}
                    className={`w-9 h-7 rounded-full text-[10px] font-mono font-bold transition-all relative ${
                      viewfinderRef.current?.isRecording
                        ? "text-stone-600 cursor-not-allowed"
                        : zoom === level
                        ? "bg-emerald-600 text-white shadow-md font-extrabold scale-105"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    {level === 0.5 ? "0.5" : level}
                  </button>
                ))}
              </div>
            </div>

            {/* CENTER BLOCK: Custom Shutter button (Photo/Video behavior depending on settings) */}
            <div className="flex flex-col items-center shrink-0 mx-2">
              {!hasActiveStream ? (
                <label
                  htmlFor={mode === "photo" ? "native_photo_input" : "native_video_input"}
                  id="shutter_capture_btn"
                  title={mode === "photo" ? "Capturar Foto com Câmera Nativa" : "Capturar Vídeo com Câmera Nativa"}
                  className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-transparent relative active:scale-95 hover:scale-105 transition-all cursor-pointer shadow-lg z-20"
                >
                  {mode === "photo" ? (
                    <div className="w-13 h-13 bg-white rounded-full transition-colors hover:bg-stone-250 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-stone-900 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-13 h-13 bg-red-600 rounded-full transition-colors hover:bg-red-500 flex items-center justify-center">
                      <Video className="w-6 h-6 text-white animate-pulse" />
                    </div>
                  )}
                </label>
              ) : (
                <button
                  id="shutter_capture_btn"
                  onClick={handleCaptureTrigger}
                  title={
                    mode === "photo"
                      ? "Tirar Foto"
                      : viewfinderRef.current?.isRecording
                      ? "Parar Gravação"
                      : "Gravar Vídeo"
                  }
                  className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-transparent relative active:scale-90 transition-transform duration-100 cursor-pointer shadow-lg z-20"
                >
                  {mode === "photo" ? (
                    /* Outer white ring + solid white center */
                    <div className="w-13 h-13 bg-white rounded-full transition-colors hover:bg-stone-250" />
                  ) : viewfinderRef.current?.isRecording ? (
                    /* Recording square stop symbol */
                    <div className="w-6 h-6 bg-red-650 rounded-xs animate-pulse" />
                  ) : (
                    /* Record trigger red center */
                    <div className="w-13 h-13 bg-red-600 rounded-full transition-colors hover:bg-red-500" />
                  )}
                </button>
              )}
            </div>

            {/* RIGHT BLOCK: Photo/Video Mode toggler */}
            <div className="flex flex-col items-end gap-1 flex-1">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-semibold">MODO</span>
              <div className="flex items-center bg-black/75 p-0.5 rounded-full border border-white/10 shadow-lg">
                <button
                  id="mode_photo_btn"
                  onClick={() => {
                    if (viewfinderRef.current?.isRecording) return;
                    setMode("photo");
                  }}
                  title="Modo Fotografia"
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all ${
                    viewfinderRef.current?.isRecording
                      ? "text-stone-650 cursor-not-allowed"
                      : mode === "photo"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  FOTO
                </button>
                <button
                  id="mode_video_btn"
                  onClick={() => {
                    if (viewfinderRef.current?.isRecording) return;
                    setMode("video");
                  }}
                  title="Modo Captação Vídeo"
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all ${
                    viewfinderRef.current?.isRecording
                      ? "text-stone-650 cursor-not-allowed"
                      : mode === "video"
                      ? "bg-rose-600 text-white shadow"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  VIDEO
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic status indicators on environment */}
        <div id="footer_instructions" className="flex items-center gap-2 text-[10px] text-stone-500/80 font-mono tracking-wider">
          <Info className="w-3 h-3 text-stone-650" />
          <span>FOTOS SALVAS AUTOMATICAMENTE NA GALERIA ANTES DE ENVIAR</span>
        </div>
      </div>

      {/* Settings management panel slide up drawer overlay */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        capturedFiles={capturedFiles}
        onDeleteFile={handleDeleteFile}
        onClearAll={handleClearAll}
        targetEmail={targetEmail}
        onSaveConfig={handleSaveConfig}
        initialSmtp={smtp}
      />
    </div>
  );
}

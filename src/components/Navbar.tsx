import { Mail, Settings, Send, Camera } from "lucide-react";

interface NavbarProps {
  onOpenSettings: () => void;
  onSend: () => void;
  filesCount: number;
  isSending: boolean;
}

export function Navbar({ onOpenSettings, onSend, filesCount, isSending }: NavbarProps) {
  return (
    <header
      id="navbar_main_header"
      className="absolute top-0 inset-x-0 h-16 bg-stone-950/60 backdrop-blur-lg border-b border-white/10 z-40 flex items-center justify-between px-4"
    >
      {/* Small aesthetic modern logo */}
      <div id="navbar_logo" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
          <Camera className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xs font-semibold font-mono tracking-wider text-slate-100 flex items-center gap-1">
            DM<span className="text-emerald-400 font-sans">CAM</span>
          </h1>
          <span className="text-[8px] text-stone-400 font-sans block tracking-wider leading-none">DIRECT MAIL</span>
        </div>
      </div>

      {/* Action buttons (Green Send and White Settings) */}
      <div id="navbar_action_row" className="flex items-center gap-2">
        {/* Dynamic Green Send Button */}
        <button
          id="navbar_send_button"
          onClick={onSend}
          disabled={isSending || filesCount === 0}
          className={`h-9 px-4 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
            filesCount > 0
              ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow-lg hover:shadow-emerald-950/45 border border-emerald-500/20"
              : "bg-emerald-950/40 text-stone-500 border border-emerald-950/20 cursor-not-allowed"
          }`}
          title="Disparar arquivos por e-mail"
        >
          {isSending ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-305 border-t-emerald-600 animate-spin"></div>
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className={`w-3.5 h-3.5 ${filesCount > 0 ? "animate-pulse" : ""}`} />
              <span>Enviar {filesCount > 0 && `(${filesCount})`}</span>
            </>
          )}
        </button>

        {/* Configurations Gear Button */}
        <button
          id="navbar_settings_button"
          onClick={onOpenSettings}
          className="w-9 h-9 bg-stone-900 border border-white/10 hover:border-white/20 active:scale-95 text-stone-300 hover:text-white rounded-full flex items-center justify-center transition-all shadow cursor-pointer relative"
          title="Abrir Configurações"
        >
          <Settings className="w-4.5 h-4.5" />
          {filesCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-stone-950 animate-ping"></span>
          )}
        </button>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from "react";
import { CapturedFile, SmtpConfig } from "../types";
import { Trash2, X, Save, RefreshCw, Mail, Server, ShieldCheck, Image as ImageIcon, Video, Eye, Play } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  capturedFiles: CapturedFile[];
  onDeleteFile: (id: string) => void;
  onClearAll: () => void;
  targetEmail: string;
  onSaveConfig: (email: string, smtp: SmtpConfig) => void;
  initialSmtp: SmtpConfig;
}

export function SettingsPanel({
  isOpen,
  onClose,
  capturedFiles,
  onDeleteFile,
  onClearAll,
  targetEmail,
  onSaveConfig,
  initialSmtp,
}: SettingsPanelProps) {
  const [emailInput, setEmailInput] = useState<string>(targetEmail);
  const [smtpHost, setSmtpHost] = useState<string>(initialSmtp.host);
  const [smtpPort, setSmtpPort] = useState<string>(initialSmtp.port);
  const [smtpUser, setSmtpUser] = useState<string>(initialSmtp.user);
  const [smtpPass, setSmtpPass] = useState<string>(initialSmtp.pass);
  const [smtpSecure, setSmtpSecure] = useState<boolean>(initialSmtp.secure);
  const [activeTab, setActiveTab] = useState<"general" | "gallery">("general");

  // Selection for lightbox/video player modal preview
  const [previewItem, setPreviewItem] = useState<CapturedFile | null>(null);

  useEffect(() => {
    setEmailInput(targetEmail);
  }, [targetEmail]);

  useEffect(() => {
    setSmtpHost(initialSmtp.host);
    setSmtpPort(initialSmtp.port);
    setSmtpUser(initialSmtp.user);
    setSmtpPass(initialSmtp.pass);
    setSmtpSecure(initialSmtp.secure);
  }, [initialSmtp]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(emailInput, {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      secure: smtpSecure,
    });
    alert("Configurações salvas com sucesso!");
    onClose();
  };

  return (
    <div
      id="settings_overlay_wrapper"
      className="absolute inset-0 w-full h-[100dvh] bg-stone-950/95 backdrop-blur-md z-50 text-slate-100 flex flex-col animate-fade-in overflow-hidden"
    >
      {/* Header of Settings */}
      <header id="settings_header" className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-900/50 sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600/10 rounded-xl border border-emerald-500/20">
            <Server className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold font-sans tracking-tight text-white leading-tight">Configurações</h2>
            <p className="text-[10px] text-stone-400">Gerencie destino e mídias</p>
          </div>
        </div>
        <button
          id="close_settings_btn"
          onClick={onClose}
          className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition-colors active:scale-90"
          title="Fechar Ajustes"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Tabs navigation */}
      <div id="tabs_indicator" className="grid grid-cols-2 border-b border-stone-850 px-4 pt-2 shrink-0 bg-stone-900/20">
        <button
          id="tab_gen"
          onClick={() => setActiveTab("general")}
          className={`pb-3 pt-2 text-center text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
            activeTab === "general"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-stone-400 hover:text-stone-300"
          }`}
        >
          E-mail &amp; SMTP
        </button>
        <button
          id="tab_gal"
          onClick={() => setActiveTab("gallery")}
          className={`pb-3 pt-2 text-center text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === "gallery"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-stone-400 hover:text-stone-300"
          }`}
        >
          Galeria ({capturedFiles.length})
        </button>
      </div>

      {/* Scrollable Contents Workspace */}
      <div id="settings_content_scroll" className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {activeTab === "general" ? (
          <div className="space-y-6" id="general_tab_container">
            {/* Target Email Section */}
            <section id="target_email_section" className="space-y-3 bg-stone-900/40 p-4 border border-stone-800/60 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-sans">
                <Mail className="w-3.5 h-3.5" /> E-mail de Envio
              </h3>
              <p className="text-[11px] text-stone-400 leading-snug">
                As fotos e vídeos capturados serão compactados e enviados para o endereço de e-mail abaixo:
              </p>
              <div className="relative">
                <input
                  id="target_email_input"
                  type="email"
                  placeholder="exemplo@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-950 border border-stone-800 focus:border-emerald-500/60 text-white rounded-lg outline-none text-sm transition-all shadow-inner font-sans tracking-wide"
                />
              </div>
            </section>

            {/* Custom SMTP Credentials Section */}
            <section id="smtp_credentials_section" className="space-y-4 bg-stone-900/40 p-4 border border-stone-800/60 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-sans">
                  <Server className="w-3.5 h-3.5" /> Servidor SMTP Próprio
                </h3>
                <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> Opcional
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">
                Para enviar por e-mail real diretamente da aplicação móvel, preencha os parâmetros de envio do seu provedor (como Gmail, Outlook, Yahoo, SendGrid ou HostGator).
              </p>

              <div className="space-y-3.5 text-xs text-stone-300" id="smtp_inputs_grid">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-1">SMTP Host</label>
                    <input
                      id="smtp_host_field"
                      type="text"
                      placeholder="smtp.gmail.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 hover:border-stone-750 focus:border-emerald-600 rounded-md outline-none text-stone-200 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-1">Porta</label>
                    <input
                      id="smtp_port_field"
                      type="text"
                      placeholder="465"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 hover:border-stone-750 focus:border-emerald-600 rounded-md outline-none text-stone-200 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-1">Usuário / E-mail</label>
                  <input
                    id="smtp_user_field"
                    type="text"
                    placeholder="remetente@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-emerald-600 rounded-md outline-none text-stone-200 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-1">Senha (ou Senha de App)</label>
                  <input
                    id="smtp_pass_field"
                    type="password"
                    placeholder="••••••••••••••••"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-emerald-600 rounded-md outline-none text-stone-200 transition-all font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="smtp_secure_checkbox"
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-stone-950 border-stone-800 focus:ring-emerald-500 focus:ring-transparent focus:ring-offset-0"
                  />
                  <label htmlFor="smtp_secure_checkbox" className="text-[11px] text-stone-300 font-sans cursor-pointer hover:text-white transition-colors">
                    Requer Conexão SSL/TLS Segura (ex: Porta 465)
                  </label>
                </div>
              </div>

              {/* Informative Help Alert */}
              <div id="smtp_help_badge" className="p-3 bg-amber-500/15 border border-amber-500/25 rounded-md text-amber-200 text-[10.5px] leading-relaxed">
                ℹ️ <strong>Usa o Gmail?</strong> No SMTP Host use <code>smtp.gmail.com</code>, Porta <code>465</code> (Ative SSL) ou <code>587</code>, e gere uma <strong>"Senha de App"</strong> em sua Conta Google para usar no campo Senha.
              </div>
            </section>
          </div>
        ) : (
          /* Gallery View Mode */
          <div className="space-y-4" id="gallery_tab_container">
            <div className="flex items-center justify-between" id="gallery_header_bar">
              <span className="text-xs font-mono text-stone-400 uppercase tracking-widest">
                {capturedFiles.length} item(ns) capturado(s)
              </span>

              {capturedFiles.length > 0 && (
                <button
                  id="delete_all_files_btn"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja apagar permanentemente todas as mídias da galeria?")) {
                      onClearAll();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all active:scale-95 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Apagar Todas
                </button>
              )}
            </div>

            {capturedFiles.length === 0 ? (
              <div id="empty_gallery_view" className="flex flex-col items-center justify-center py-20 text-center text-stone-500">
                <ImageIcon className="w-12 h-12 text-stone-600 mb-2.5 stroke-[1.2]" />
                <p className="text-sm font-medium font-sans">Sua Galeria está vazia</p>
                <p className="text-[11px] text-stone-600 mt-1">Feche os ajustes para tirar novas fotos.</p>
              </div>
            ) : (
              /* Playable/deletable Gallery Grid */
              <div id="gallery_grid_layout" className="grid grid-cols-2 xs:grid-cols-3 gap-3.5">
                {capturedFiles.map((file) => (
                  <div
                    id={`file_card_${file.id}`}
                    key={file.id}
                    className="group relative aspect-video bg-stone-900 border border-stone-800 rounded-lg overflow-hidden flex items-center justify-center hover:border-emerald-500/30 transition-all shadow"
                  >
                    {/* Render visual image/video */}
                    {file.type === "photo" ? (
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      /* Video Canvas/Preview wrapper */
                      <div className="relative w-full h-full flex items-center justify-center">
                        <video
                          src={file.dataUrl}
                          className="w-full h-full object-cover opacity-85"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-all">
                          <Play className="w-7 h-7 text-white drop-shadow fill-white" />
                        </div>
                      </div>
                    )}

                    {/* Image metadata tag */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-xs px-2 py-1 text-[9px] text-stone-300 font-mono flex items-center justify-between border-t border-stone-900/60">
                      <span className="truncate max-w-[80px]">{file.name}</span>
                      <span>{file.timestamp}</span>
                    </div>

                    {/* Small Quick-Actions Overlays */}
                    <div className="absolute top-1 right-1 flex items-center gap-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {/* View Lightbox button */}
                      <button
                        title="Ver mídia"
                        id={`view_large_btn_${file.id}`}
                        onClick={() => setPreviewItem(file)}
                        className="p-1.5 bg-emerald-600/95 hover:bg-emerald-500 rounded-md text-white transition-all shadow active:scale-90"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Small Trash can icon */}
                      <button
                        title="Remover arquivo"
                        id={`del_file_btn_${file.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Deseja deletar este arquivo?")) {
                            onDeleteFile(file.id);
                          }
                        }}
                        className="p-1.5 bg-rose-600/95 hover:bg-rose-500 rounded-md text-white transition-all shadow active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Video/Image Badge */}
                    <div className="absolute top-1 left-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[8px] font-mono font-semibold uppercase text-stone-300 border border-white/10 z-10">
                      {file.type === "photo" ? "FOTO" : "VÍDEO"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Bar at the bottom containing Save/Back buttons */}
      <footer id="settings_footer" className="px-5 py-4 border-t border-stone-800 bg-stone-900/40 shrink-0 flex items-center gap-3">
        <button
          id="save_settings_btn_bottom"
          onClick={handleSave}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" /> Salvar Configurações
        </button>

        <button
          id="back_settings_btn_bottom"
          onClick={onClose}
          className="px-4 py-3 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 hover:text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
        >
          Voltar
        </button>
      </footer>

      {/* Lightbox / Video Player Modal Preview */}
      {previewItem && (
        <div id="lightbox_modal" className="fixed inset-0 bg-black/98 z-60 flex flex-col items-center justify-center p-4">
          <button
            id="close_lightbox_btn"
            onClick={() => setPreviewItem(null)}
            className="absolute top-5 right-5 p-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full transition-colors font-semibold shadow z-20"
          >
            <X className="w-6 h-6" />
          </button>

          <div id="lightbox_content_box" className="relative max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center">
            {previewItem.type === "photo" ? (
              <img
                src={previewItem.dataUrl}
                alt={previewItem.name}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain rounded-md"
              />
            ) : (
              <video
                src={previewItem.dataUrl}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-md bg-stone-950"
              />
            )}
          </div>

          <div id="lightbox_footer_info" className="mt-4 text-center">
            <h4 className="text-white text-sm font-semibold font-sans">{previewItem.name}</h4>
            <p className="text-stone-400 text-xs mt-1">Capturado às {previewItem.timestamp}</p>
          </div>
        </div>
      )}
    </div>
  );
}

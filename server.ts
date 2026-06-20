import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure JSON limit to support high-res Base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API: Enviar fotos/vídeos por e-mail
  app.post("/api/send-email", async (req, res) => {
    try {
      const { targetEmail, files, customSmtp } = req.body;

      if (!targetEmail) {
        return res.status(400).json({ error: "O e-mail de destino é obrigatório." });
      }

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Nenhuma foto ou vídeo para enviar." });
      }

      // Check if SMTP is configured
      const smtpHost = customSmtp?.host || process.env.SMTP_HOST;
      const smtpPort = customSmtp?.port || process.env.SMTP_PORT;
      const smtpUser = customSmtp?.user || process.env.SMTP_USER;
      const smtpPass = customSmtp?.pass || process.env.SMTP_PASS;
      const smtpSecureValue = customSmtp?.secure !== undefined ? customSmtp.secure : process.env.SMTP_SECURE;
      
      // Auto-detect secure state based on standard port convention to prevent wrong version SSL errors
      let smtpSecure = smtpSecureValue === true || smtpSecureValue === "true" || smtpSecureValue === "YES";
      const numericPort = parseInt(smtpPort || "");
      if (numericPort === 587 || numericPort === 25 || numericPort === 2525) {
        smtpSecure = false; // Port 587 requires STARTTLS (secure: false) in Nodemailer
      } else if (numericPort === 465) {
        smtpSecure = true;  // Port 465 requires SMTPS (secure: true) in Nodemailer
      }

      const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@example.com";

      const hasSmtp = smtpHost && smtpPort && smtpUser && smtpPass;

      // Prepare attachments
      const attachments = files.map((file: any) => {
        const parts = file.dataUrl.split(",");
        const meta = parts[0];
        const base64Data = parts[1];
        const mime = meta.split(":")[1].split(";")[0];
        return {
          filename: file.name,
          content: Buffer.from(base64Data, "base64"),
          contentType: mime,
        };
      });

      if (hasSmtp) {
        // Send actual email using Nodemailer
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false // avoids SSL blockages for custom self-signed/cheap configurations
          }
        });

        const mailOptions = {
          from: smtpFrom,
          to: targetEmail,
          subject: `📱 Câmera Direct Mail - ${files.length} mídia(s) capturada(s)`,
          text: `Olá!\n\nVocê está recebendo ${files.length} arquivo(s) de mídia tirados diretamente pelo aplicativo Câmera Direct Mail.\n\nData de envio: ${new Date().toLocaleString("pt-BR")}\n\nEnviado com sucesso via SMTP do Usuário.`,
          attachments,
        };

        await transporter.sendMail(mailOptions);

        return res.json({
          success: true,
          message: `E-mail enviado com sucesso para ${targetEmail} com ${files.length} anexo(s)!`
        });
      } else {
        // Fallback: Save to local directory on the server and alert the user
        const outputDir = path.join(process.cwd(), "sent_emails");
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const batchId = new Date().toISOString().replace(/[:.]/g, "-");
        const savedPaths: string[] = [];

        for (const file of files) {
          const parts = file.dataUrl.split(",");
          const base64Data = parts[1];
          const buffer = Buffer.from(base64Data, "base64");
          const safeName = `${batchId}_${file.name}`;
          const filePath = path.join(outputDir, safeName);
          fs.writeFileSync(filePath, buffer);
          savedPaths.push(filePath);
        }

        console.log(`[LOCAL SAVED] No SMTP configured. Saved ${files.length} files to ${outputDir}`);

        return res.json({
          success: true,
          localSaved: true,
          message: `Nenhum SMTP configurado. Salvamos localmente as ${files.length} fotos no servidor na pasta 'sent_emails/'. Para enviar e-mail real, adicione seus dados SMTP nas Configurações!`
        });
      }
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      return res.status(500).json({ error: error.message || "Erro interno do servidor ao processar o e-mail." });
    }
  });

  // Serve static UI assets using Vite in Dev or Express Static in Prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Camera Direct Mail Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

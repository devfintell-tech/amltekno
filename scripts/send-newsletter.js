import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Otomatik .env yükleyici
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALICI_MAIL = process.env.ALICI_MAIL || "orhaner1907@gmail.com";
const SENDER_EMAIL_PREF = process.env.SENDER_EMAIL || "AML Tekno Radar <bulten@aitrendleri.com>";
const FALLBACK_SENDER = "AML Tekno Radar <onboarding@resend.dev>";

/**
 * AML Raporunu Kurumsal HTML E-Posta Şablonuna Dönüştürür
 */
function buildAmlNewsletterHtml(report) {
  const dateStr = report.date || new Date().toLocaleDateString('tr-TR');
  const flash = report.morningBrief?.flashAlert || {};
  const ideas = report.newDevelopmentsAndIdeas || report.actionableIdeas || [];
  const talks = report.amlTalks || [];
  const authorities = report.authoritiesPulse || [];

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AML Tekno Radar - Günlük İstihbarat Bülteni</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 4px; border: 1px solid #cbd5e1; overflow: hidden; }
    .header { background: #721c24; padding: 24px 20px; border-bottom: 3px solid #5c0f1c; color: #ffffff; }
    .badge { display: inline-block; padding: 2px 8px; background: #5c0f1c; color: #ffffff; border-radius: 2px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-family: monospace; }
    .title { margin: 8px 0 4px 0; font-size: 20px; font-weight: 800; color: #ffffff; }
    .subtitle { margin: 0; font-size: 12px; color: #fecdd3; font-family: monospace; }
    .content { padding: 20px; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #721c24; border-radius: 3px; padding: 14px; margin-bottom: 16px; }
    .card-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; }
    .card-body { font-size: 12.5px; color: #334155; margin: 0; line-height: 1.5; }
    .code-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 3px; padding: 10px; font-family: monospace; font-size: 11.5px; color: #0f172a; overflow-x: auto; margin: 8px 0; white-space: pre-wrap; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; font-family: monospace; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">AML &amp; FinCrime İstihbaratı</span>
      <h1 class="title">AML Tekno Radar</h1>
      <p class="subtitle">${dateStr} • Günlük Yönetici ve Uyum Özeti</p>
    </div>
    <div class="content">
      <!-- Flaş Uyarı -->
      ${flash.title ? `
      <div class="card" style="border-left-color: #721c24; background: #fff8f8;">
        <span style="font-family: monospace; font-size: 10px; font-weight: 700; color: #721c24; text-transform: uppercase;">Günün Flaş Tehdidi</span>
        <h3 class="card-title" style="color: #721c24; margin-top: 4px;">${flash.title}</h3>
        <p class="card-body">${flash.description || ""}</p>
      </div>` : ""}

      <!-- Yönetici Özeti -->
      <h3 style="color: #0f172a; font-size: 14px; font-family: monospace; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px;">Yönetici Brifingi</h3>
      <p style="font-size: 12.5px; color: #334155; line-height: 1.6;">${(report.executiveSummary || "").replace(/\n/g, "<br><br>")}</p>

      <!-- Yeni Gelişmeler & Fikirler -->
      <h3 style="color: #0f172a; font-size: 14px; font-family: monospace; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">Yeni Gelişmeler &amp; Saha Çalışmaları</h3>
      ${ideas.map((idea, i) => `
        <div class="card">
          <div style="font-size: 10.5px; color: #721c24; font-weight: 700; font-family: monospace; text-transform: uppercase;">${idea.category || "İnovasyon"}</div>
          <h4 class="card-title" style="margin-top: 4px;">${idea.title}</h4>
          <p class="card-body">${idea.problem}</p>
          <p class="card-body" style="margin-top: 6px; color: #0f172a; font-weight: 500;">${idea.solution}</p>
          ${(idea.methodologyAndStudy || idea.promptOrLogic) ? `<div class="code-block">${idea.methodologyAndStudy || idea.promptOrLogic}</div>` : ""}
        </div>
      `).join("")}

      <!-- Otoritelerden Gelişmeler -->
      ${authorities.length > 0 ? `
      <h3 style="color: #0f172a; font-size: 14px; font-family: monospace; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">Otoritelerde Durum Nasıl?</h3>
      ${authorities.slice(0, 5).map(auth => `
        <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
          <div style="font-size: 11px; font-family: monospace; font-weight: 700; color: #721c24;">${auth.authority} • ${auth.country || ''} (${auth.date || ''})</div>
          <div style="font-size: 12.5px; font-weight: 600; color: #0f172a; margin: 2px 0;">${auth.title}</div>
          <div style="font-size: 12px; color: #475569;">${auth.summary}</div>
        </div>
      `).join("")}
      ` : ""}
    </div>
    <div class="footer">
      AML Tekno Radar © ${new Date().getFullYear()} • Açık Kaynak İstihbarat &amp; RegTech Analizi
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log("📬 AML Bülteni Hazırlanıyor...");

  const reportPath = path.join(__dirname, '../src/data/latest-aml-report.json');
  if (!fs.existsSync(reportPath)) {
    console.error("❌ latest-aml-report.json bulunamadı. Önce 'npm run crawl' çalıştırın.");
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const htmlContent = buildAmlNewsletterHtml(report);

  // Önizleme dosyasını kaydet
  const previewPath = path.join(__dirname, '../newsletter-preview.html');
  fs.writeFileSync(previewPath, htmlContent, 'utf8');
  console.log(`📄 Bülten HTML önizlemesi kaydedildi: ${previewPath}`);

  if (!RESEND_API_KEY) {
    console.log("⚠️ RESEND_API_KEY tanımlanmamış. Önizleme oluşturuldu ancak e-posta gönderilmedi.");
    return;
  }

  const sendEmailWithSender = async (sender) => {
    return await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: sender,
        to: [ALICI_MAIL],
        subject: `AML Tekno Radar: ${report.date || ''} Günlük İstihbarat & Gelişmeler`,
        html: htmlContent
      })
    });
  };

  try {
    console.log(`🚀 Resend üzerinden e-posta gönderiliyor: ${ALICI_MAIL} (Gönderen: ${SENDER_EMAIL_PREF})...`);
    let res = await sendEmailWithSender(SENDER_EMAIL_PREF);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`⚠️ İlk gönderen ile hata (${SENDER_EMAIL_PREF}): ${errText}`);
      console.log(`🔄 Güvenli yedek gönderici deneniyor: ${FALLBACK_SENDER}...`);
      res = await sendEmailWithSender(FALLBACK_SENDER);
    }

    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Bülten başarıyla gönderildi! Email ID: ${data.id}`);
    } else {
      const err = await res.text();
      console.warn(`❌ Resend HTTP ${res.status}: ${err}`);
    }
  } catch (err) {
    console.error("❌ E-posta gönderim hatası:", err.message);
  }
}

main().catch(console.error);

import React, { useState } from 'react';
import { Mail, Copy, Check, Download, Send, Sparkles, ExternalLink } from 'lucide-react';

export default function NewsletterPreview({ report }) {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const dateStr = report?.date || "22 Eylül 2026";
  const flash = report?.morningBrief?.flashAlert || {};
  const ideas = report?.actionableIdeas || [];
  const macros = report?.morningBrief?.macroDevelopments || [];
  const typologies = report?.threatAndTypologyMatrix || [];

  const generateMarkdown = () => {
    return `# AML TEKNO RADAR - GÜNLÜK İSTİHBARAT BÜLTENİ
**Tarih:** ${dateStr}
**Tehdit Skoru:** ${report?.threatMeter?.overallScore || 8.8}/10 (${report?.threatMeter?.level || "Yüksek"})

---

## GÜNÜN FLAŞ TEHDİDİ
**${flash.title}**
*Kategori:* ${flash.tag || "Kripto & FAST"}
${flash.description}

---

## YÖNETİCİ BRİFİNGİ
${report?.executiveSummary}

---

## AML EKİPLERİ İÇİN YENİ FİKİRLER & GELİŞMELER
${ideas.map((idea, i) => `
### #${i + 1} ${idea.title} [${idea.category}]
- **Problem:** ${idea.problem}
- **Önerilen Çözüm:** ${idea.solution}
- **Uygulama Metodolojisi & Saha Çözümü:** ${(idea.promptOrLogic || idea.methodologyAndStudy || '').replace(/[\r\n]+/g, ' ')}
- **Beklenen Etki:** ${idea.expectedImpact}
`).join("\n")}

---

## YÜKSELEN AKLAMA TİPOLOJİLERİ
| Tipoloji | Risk Skoru | Trend | Hedef Sektör |
| :--- | :--- | :--- | :--- |
${typologies.map(t => `| ${t.name} | ${t.riskScore}/10 | ${t.delta} | ${t.targetSector} |`).join("\n")}

---
*AML Tekno Radar © ${new Date().getFullYear()}*
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2500);
  };

  const handleDownloadHtml = () => {
    const element = document.getElementById("newsletter-html-container");
    if (!element) return;
    const blob = new Blob([element.innerHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aml-bulten-${report?.isoDate || 'latest'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Üst Eylemler Çubuğu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Mail className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">Dağıtım & Yayın Merkezi</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            AML Tekno Bülten Önizlemesi ({dateStr})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bu bülteni tek tıkla Markdown olarak kopyalayıp Substack/LinkedIn'de paylaşabilir veya HTML olarak indirebilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            {copiedMd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedMd ? "Markdown Kopyalandı!" : "Markdown Kopyala"}</span>
          </button>

          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4" />
            <span>HTML İndir</span>
          </button>
        </div>
      </div>

      {/* Önizleme Konteyneri (E-Posta Görünümü) */}
      <div 
        id="newsletter-html-container"
        className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 text-slate-200"
      >
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[11px] font-mono font-bold uppercase mb-3">
            🛡️ GÜNLÜK AML & REGTECH BÜLTENİ
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            AML TEKNO RADAR
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {dateStr} • Finansal Suçlarla Mücadele, Teknoloji ve Stratejik Fikirler
          </p>
        </div>

        {/* Flaş Uyarı */}
        {flash.title && (
          <div className="p-4 rounded-xl border border-rose-900/80 bg-rose-950/40">
            <span className="text-[10px] font-mono font-bold uppercase bg-rose-500 text-slate-950 px-2 py-0.5 rounded">
              FLAŞ TEHDİT
            </span>
            <h3 className="text-base font-bold text-rose-300 mt-2 mb-1">
              {flash.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {flash.description}
            </p>
          </div>
        )}

        {/* Yönetici Brifingi */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold font-mono text-sky-400 uppercase tracking-wider">
            Yönetici Brifingi
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
            {report?.executiveSummary}
          </p>
        </div>

        {/* Zekice Fikirler */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold font-mono text-emerald-400 uppercase tracking-wider">
            Yeni Gelişmeler &amp; Fikirler
          </h3>
          {ideas.map((idea, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] font-mono font-bold text-emerald-400">
                #{idx + 1} {idea.category} • {idea.badge}
              </div>
              <h4 className="text-sm font-bold text-white mt-1 mb-2">
                {idea.title}
              </h4>
              <p className="text-xs text-slate-300 mb-2">
                <strong>Zorluk:</strong> {idea.problem}
              </p>
              <p className="text-xs text-slate-300 mb-3">
                <strong>Çözüm:</strong> {idea.solution}
              </p>
              {(idea.promptOrLogic || idea.methodologyAndStudy) && (
                <div className="p-3 rounded-lg bg-slate-900/90 text-xs text-slate-300 border border-slate-800 leading-relaxed mb-2">
                  <span className="font-semibold text-emerald-400 block mb-1">📋 Saha Çözümü &amp; Metodoloji:</span>
                  {idea.promptOrLogic || idea.methodologyAndStudy}
                </div>
              )}
              <div className="text-[11px] font-mono text-slate-400">
                Beklenen Etki: {idea.expectedImpact}
              </div>
            </div>
          ))}
        </div>

        {/* Tipoloji Tablosu */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold font-mono text-amber-400 uppercase tracking-wider">
            Yükselen Aklama Tipolojileri
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2">Tipoloji</th>
                  <th className="py-2">Risk</th>
                  <th className="py-2">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {typologies.map((t, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-semibold text-white">{t.name}</td>
                    <td className="py-2.5 font-mono text-rose-400">{t.riskScore}/10</td>
                    <td className="py-2.5 font-mono text-emerald-400">{t.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500 font-mono">
          Bu bülten Reddit, Twitter ve arXiv açık kaynak verileri ile DeepSeek AI tarafından hazırlanmıştır.<br />
          © {new Date().getFullYear()} AML Tekno Radar
        </div>
      </div>

    </div>
  );
}

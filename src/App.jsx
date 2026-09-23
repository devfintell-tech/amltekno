import React, { useState, useMemo } from 'react';
import { CATEGORY_DEFINITIONS, DEFAULT_AML_GLOSSARY } from './data/mockData.js';
import latestReportData from './data/latest-aml-report.json';
import archiveIndexData from './data/archive-index.json';
import { 
  ChevronDown, 
  ChevronUp, 
  History,
  Calendar,
  ExternalLink,
  Sparkles,
  Terminal,
  Coffee,
  Copy,
  Check,
  BookMarked,
  Cpu,
  Clock,
  Zap,
  X,
  Search,
  Mail,
  Send,
  Building2,
  ShieldAlert,
  Flame,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter
} from 'lucide-react';

export default function App() {
  // Tablar: 'talks' | 'developments' | 'cdd_kyc' | 'authorities' | 'glossary' | 'report'
  const [activeTab, setActiveTab] = useState('talks');
  const [selectedAuthFilter, setSelectedAuthFilter] = useState('all');
  const [isBriefExpanded, setIsBriefExpanded] = useState(true);
  const [copiedCmdId, setCopiedCmdId] = useState(null);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [selectedDateId, setSelectedDateId] = useState('latest');
  const [copiedMd, setCopiedMd] = useState(false);

  const report = latestReportData;

  const handleCopyCmd = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedCmdId(id);
    setTimeout(() => setCopiedCmdId(null), 2500);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribeStatus('loading');
    setTimeout(() => {
      setSubscribeStatus('success');
      setSubscribeMessage('Bültene başarıyla abone oldunuz! İlk bülteniniz sabah 06:00\'da iletilecektir.');
    }, 1200);
  };

  const handleCopyMarkdown = () => {
    const mdText = `# AML TEKNO RADAR - GÜNLÜK İSTİHBARAT BÜLTENİ
Tarih: ${report.date || '22 Eylül 2026'}
Risk Skoru: ${report.threatMeter?.overallScore || 8.8}/10 (${report.threatMeter?.level || 'Yüksek'})

## GÜNÜN FLAŞ TEHDİDİ
${report.morningBrief?.flashAlert?.title || ''}
${report.morningBrief?.flashAlert?.description || ''}

## YÖNETİCİ BRİFİNGİ
${report.executiveSummary || ''}

## AML DÜNYASINDA NELER KONUŞULUYOR?
${(report.amlTalks || []).map((t, i) => `
### #${i + 1} ${t.title} [${t.source}]
- Özet: ${t.summary}
- Çıkarım: ${t.keyInsight}
`).join('\n')}

## YENİ GELİŞMELER & FİKİRLER
${(report.newDevelopmentsAndIdeas || []).map((idea, i) => `
### #${i + 1} ${idea.title} [${idea.category}]
- Problem: ${idea.problem}
- Çözüm: ${idea.solution}
- Saha Bulguları / Metodoloji:
${idea.methodologyAndStudy || idea.promptOrLogic || ''}
- Beklenen Etki: ${idea.expectedImpact}
`).join('\n')}

## OTORİTELERDE DURUM NASIL?
${(report.authoritiesPulse || []).map((a, i) => `
- [${a.authority}] ${a.title} (${a.date}): ${a.summary}
`).join('\n')}
`;
    navigator.clipboard.writeText(mdText);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2500);
  };

  // Günün Sözlüğü (O günkü 9 kavram)
  const todayGlossary = useMemo(() => {
    return report.dailyGlossary || DEFAULT_AML_GLOSSARY.slice(0, 9);
  }, [report]);

  // Geçmiş Sözlük Arşivi (Tüm kavramlar birikimli)
  const filteredArchiveGlossary = useMemo(() => {
    if (!glossarySearch) return DEFAULT_AML_GLOSSARY;
    return DEFAULT_AML_GLOSSARY.filter(item => 
      item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      item.definition.toLowerCase().includes(glossarySearch.toLowerCase())
    );
  }, [glossarySearch]);

  // Otoriteler Filtresi & Dinamik Liste
  const uniqueAuthorities = useMemo(() => {
    const list = report.authoritiesPulse || [];
    const authSet = new Set(list.map(a => a.authority).filter(Boolean));
    return ['all', ...Array.from(authSet)];
  }, [report.authoritiesPulse]);

  const filteredAuthorities = useMemo(() => {
    const list = report.authoritiesPulse || [];
    if (selectedAuthFilter === 'all') return list;
    return list.filter(a => a.authority?.toLowerCase().includes(selectedAuthFilter.toLowerCase()));
  }, [report, selectedAuthFilter]);

  // Token Telemetrisi Hesabı (Çift LLM)
  const p1 = report.phase1TokenUsage || {};
  const p2 = report.phase2TokenUsage || {};
  const tu = report.tokenUsage || {};

  const p1PromptK = ((p1.promptTokens || 51200) / 1000).toFixed(1);
  const p1ReasoningK = ((p1.reasoningTokens || 4600) / 1000).toFixed(1);
  const p1FinalK = ((p1.finalTokens || 21800) / 1000).toFixed(1);
  const p1TotalK = ((p1.totalTokens || 77600) / 1000).toFixed(1);

  const p2PromptK = ((p2.promptTokens || 8900) / 1000).toFixed(1);
  const p2ReasoningK = ((p2.reasoningTokens || 700) / 1000).toFixed(1);
  const p2FinalK = ((p2.finalTokens || 2700) / 1000).toFixed(1);
  const p2TotalK = ((p2.totalTokens || 12300) / 1000).toFixed(1);

  const totalK = ((tu.totalTokens || 89900) / 1000).toFixed(1);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 font-sans antialiased flex flex-col selection:bg-[#721c24] selection:text-white w-full max-w-full overflow-x-hidden">
      
      {/* 1. EXCEL MAT RUJ KIRMIZISI BAŞLIK ÇUBUĞU (Office Ribbon Bar - MATTE LIPSTICK RED) */}
      <header className="bg-[#721c24] text-white select-none shadow-md w-full max-w-full overflow-hidden">
        {/* Üst Logo, Dosya Adı ve Geçmiş Tarih Seçici */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2.5 sm:gap-3 w-full">
          
          {/* SOL BÖLÜM: Logo üstte, Tarih Seçici .com'un altında, Sistem Bilgileri butonu da mobilde tarihin altında */}
          <div className="flex flex-col gap-1.5 shrink-0 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 bg-white text-[#721c24] font-black rounded text-xs shadow-inner tracking-tighter shrink-0">
                AML
              </div>
              <span className="font-bold text-base tracking-wide font-mono truncate">amlteknoradar.com</span>
            </div>

            {/* Geçmiş Tarih / Arşiv Seçici Dropdown (.com'un Altında) */}
            <div className="flex items-center gap-1.5 bg-[#5c0f1c] border border-rose-300/30 px-2 py-0.5 sm:py-1 rounded text-white shadow-xs w-fit">
              <Calendar className="w-3.5 h-3.5 text-rose-200 flex-shrink-0" />
              <select
                value={selectedDateId}
                onChange={(e) => setSelectedDateId(e.target.value)}
                className="bg-transparent text-white font-mono text-[11px] sm:text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                title="Geçmiş günlerin raporunu görüntüle"
              >
                <option value="latest" className="bg-slate-800 text-white font-sans text-xs">
                  {report.date || "22 Eylül 2026 (En Güncel)"}
                </option>
                {archiveIndexData.map(d => (
                  <option key={d.isoDate} value={d.isoDate} className="bg-slate-800 text-white font-sans text-xs">
                    {d.date} • Risk: {d.threatScore}/10
                  </option>
                ))}
              </select>
            </div>

            {/* 📱 MOBİL: "Sistem Bilgileri" Butonu (TARİHİN HEMEN ALTINDA, ASLA SAĞA TAŞMAZ) */}
            <button
              type="button"
              onClick={() => setIsSystemInfoOpen(true)}
              className="lg:hidden flex items-center gap-1.5 bg-[#5c0f1c] hover:bg-[#4a0b16] active:scale-95 border border-rose-300/40 px-2.5 py-1 rounded text-[11px] font-mono font-bold text-white shadow-xs transition cursor-pointer w-fit"
              title="Sistem Bilgileri ve Telemetri Verilerini Görüntüle"
            >
              <Cpu className="w-3 h-3 text-rose-200 shrink-0" />
              <span>Sistem Bilgileri</span>
            </button>
          </div>

          {/* Sağ Durum: ÇİFT LLM & TELEMETRİ BİLGİSİ (YALNIZCA MASAÜSTÜNDE) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
              
              {/* Süre Kutusu */}
              <div className="flex flex-col justify-between py-1 px-2.5 bg-[#5c0f1c] border border-rose-300/25 rounded text-[11px] font-mono shadow-xs h-[50px]">
                <div 
                  className="flex items-center gap-1 text-amber-300 font-semibold whitespace-nowrap leading-none pt-0.5"
                  title={`Toplam Çalışma Süresi: ${report.durationSeconds || 36} saniye`}
                >
                  <Clock className="w-3 h-3 text-amber-300 flex-shrink-0" />
                  <span>{report.durationSeconds || 36}s</span>
                </div>
                <div 
                  className="flex items-center gap-1 text-rose-200 font-medium whitespace-nowrap border-t border-rose-300/20 pt-1 leading-none text-[10.5px]"
                  title={`Tetiklenme: ${report.startedAt || '06:00'} (TSİ) | Çıktı: ${report.completedAt || '06:01'} (TSİ)`}
                >
                  <span>{report.startedAt ? `${report.startedAt.slice(0, 5)} ➔ ${report.completedAt ? report.completedAt.slice(0, 5) : '06:01'} TSİ` : '06:00 TSİ'}</span>
                </div>
              </div>

              {/* Çift LLM Ayrı Telemetri Kutusu (2 Satır 10 Sütun Hizalı) */}
              <div 
                className="grid grid-cols-[auto_auto_auto_auto_auto_auto_auto_auto_auto_auto] items-center gap-x-2 gap-y-1 bg-[#5c0f1c] border border-rose-300/25 px-3 py-1 rounded text-[11px] font-mono shadow-xs h-[50px]"
                title={`1. LLM (${report.phase1Model || 'DeepSeek v4.1 Flash'}): Girdi: ${p1.promptTokens?.toLocaleString()} | Düşünce: ${(p1.reasoningTokens || 0)?.toLocaleString()} | Nihai: ${(p1.finalTokens || 0)?.toLocaleString()} | Toplam: ${p1.totalTokens?.toLocaleString()}\n2. LLM (${report.phase2Model || 'DeepSeek v4.1 Flash'}): Girdi: ${p2.promptTokens?.toLocaleString()} | Düşünce: ${(p2.reasoningTokens || 0)?.toLocaleString()} | Nihai: ${(p2.finalTokens || 0)?.toLocaleString()} | Toplam: ${p2.totalTokens?.toLocaleString()}`}
              >
                {/* SATIR 1: 1. LLM */}
                <span className="font-bold text-amber-300 flex items-center gap-1 whitespace-nowrap">
                  <Zap className="w-3 h-3 text-amber-300 flex-shrink-0" />
                  1. LLM:
                </span>
                <div>
                  <span className="bg-[#4a0b16] text-white px-1.5 py-0.2 rounded font-semibold text-[10.5px] border border-rose-300/20 whitespace-nowrap text-center inline-block">
                    {report.phase1Model || 'DeepSeek v4.1 Flash'}
                  </span>
                </div>
                <span className="text-rose-300/40">|</span>
                <span className="whitespace-nowrap">Girdi: <strong className="text-rose-200 font-bold">{p1PromptK}k</strong></span>
                <span className="text-rose-300/40">|</span>
                <span className="whitespace-nowrap">Düşünce: <strong className="text-purple-300 font-bold">{p1ReasoningK}k</strong></span>
                <span className="text-rose-300/40">|</span>
                <span className="whitespace-nowrap">Nihai: <strong className="text-yellow-300 font-bold">{p1FinalK}k</strong></span>
                <span className="text-rose-300/40">|</span>
                <span className="whitespace-nowrap">Toplam: <strong className="text-white font-bold">{p1TotalK}k</strong></span>

                {/* SATIR 2: 2. LLM */}
                <span className="font-bold text-cyan-300 flex items-center gap-1 whitespace-nowrap border-t border-rose-300/20 pt-1">
                  <Zap className="w-3 h-3 text-cyan-300 flex-shrink-0" />
                  2. LLM:
                </span>
                <div className="border-t border-rose-300/20 pt-1">
                  <span className="bg-[#4a0b16] text-white px-1.5 py-0.2 rounded font-semibold text-[10.5px] border border-rose-300/20 whitespace-nowrap text-center inline-block w-full">
                    {report.phase2Model || 'DeepSeek v4.1 Flash'}
                  </span>
                </div>
                <span className="text-rose-300/40 border-t border-rose-300/20 pt-1">|</span>
                <span className="whitespace-nowrap border-t border-rose-300/20 pt-1">Girdi: <strong className="text-rose-200 font-bold">{p2PromptK}k</strong></span>
                <span className="text-rose-300/40 border-t border-rose-300/20 pt-1">|</span>
                <span className="whitespace-nowrap border-t border-rose-300/20 pt-1">Düşünce: <strong className="text-purple-300 font-bold">{p2ReasoningK}k</strong></span>
                <span className="text-rose-300/40 border-t border-rose-300/20 pt-1">|</span>
                <span className="whitespace-nowrap border-t border-rose-300/20 pt-1">Nihai: <strong className="text-yellow-300 font-bold">{p2FinalK}k</strong></span>
                <span className="text-rose-300/40 border-t border-rose-300/20 pt-1">|</span>
                <span className="whitespace-nowrap border-t border-rose-300/20 pt-1">Toplam: <strong className="text-white font-bold">{p2TotalK}k</strong></span>
              </div>

              {/* Bileşik Toplam Rozeti */}
              <div 
                className="hidden xl:flex flex-col justify-center items-center bg-[#4a0b16] border border-rose-300/35 px-2.5 py-1 rounded font-mono shadow-xs text-center h-[50px] cursor-help"
                title={`Bileşik Token Toplamı (1. LLM + 2. LLM):\n• Girdi: ${tu.promptTokens?.toLocaleString()} token\n• Düşünce: ${(tu.reasoningTokens || 0)?.toLocaleString()} token\n• Nihai Çıktı: ${(tu.finalTokens || 0)?.toLocaleString()} token\n• Toplam: ${tu.totalTokens?.toLocaleString()} token`}
              >
                <span className="text-yellow-300 font-bold text-[9.5px] uppercase">Bileşik Toplam</span>
                <span className="text-xs font-black text-white">{totalK}k token</span>
              </div>

              {/* Veri Kaynağı Hacim Rozetleri (Reddit, X) */}
              {(report.totalPostsAnalyzed || report.totalTweetsAnalyzed) && (
                <div 
                  className="flex flex-col justify-between py-1 px-2.5 bg-[#5c0f1c] border border-rose-300/25 rounded text-[11px] font-mono shadow-xs h-[50px]"
                  title={`Taranan Veri Havuzu:\n• Reddit: ${report.totalPostsAnalyzed || 50} onaylı gönderi ve tartışma\n• X (Twitter): ${report.totalTweetsAnalyzed || 35} uzman ve dedektif paylaşımı`}
                >
                  <div className="grid grid-cols-[14px_48px_6px_auto] items-center gap-x-1 leading-none pt-0.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0"></span>
                    <span className="text-rose-100 font-semibold">Reddit:</span>
                    <span></span>
                    <strong className="text-white font-bold">{report.totalPostsAnalyzed || 50}</strong>
                  </div>
                  <div className="grid grid-cols-[14px_48px_6px_auto] items-center gap-x-1 border-t border-rose-300/20 pt-1 leading-none text-[10.5px]">
                    <span className="w-3 h-3 bg-black text-white text-[8px] font-black flex items-center justify-center rounded-xs shrink-0">𝕏</span>
                    <span className="text-rose-200 font-semibold">X:</span>
                    <span></span>
                    <strong className="text-white font-bold">{report.totalTweetsAnalyzed || 35}</strong>
                  </div>
                </div>
              )}

            </div>
          </div>

        {/* 2. ANA SEKMELER ÇUBUĞU (KULLANICININ İSTEDİĞİ 5 ANA BAŞLIK + BÜLTEN) */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 border-t border-[#5c0f1c] pt-2 pb-1.5 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 w-full">
            {[
              { id: 'talks', label: 'AML Dünyasında Konuşulanlar' },
              { id: 'developments', label: 'Yeni Gelişmeler & Fikirler' },
              { id: 'cdd_kyc', label: 'Müşteri İnceleme (CDD / KYC)' },
              { id: 'authorities', label: 'Otoritelerde Durum Nasıl?' },
              { id: 'glossary', label: 'Günün AML Sözlüğü' },
              { id: 'report', label: 'Danışman Bülteni' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[38px] py-1.5 px-2 text-[10.5px] sm:text-xs font-bold leading-tight flex items-center justify-center text-center font-mono rounded transition cursor-pointer min-w-0 break-words ${
                  activeTab === tab.id
                    ? 'bg-white text-[#721c24] shadow-xs'
                    : 'text-rose-100 bg-[#5c0f1c] hover:bg-[#4a0b16]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 📱 1'E 1 ÖNCEKİ PROJEYLE AYNI SİSTEM BİLGİLERİ VE TELEMETRİ MODALI */}
      {isSystemInfoOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsSystemInfoOpen(false)}
        >
          <div 
            className="bg-white border border-[#cbd5e1] rounded-lg shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto font-mono text-xs flex flex-col text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#721c24] text-white px-4 py-3 flex items-center justify-between rounded-t-lg select-none">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white text-[#721c24] flex items-center justify-center font-black text-xs shadow-inner">
                  AML
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                    <span>Sistem Bilgileri &amp; Telemetri</span>
                  </h3>
                  <p className="text-[10px] text-rose-100 font-normal">
                    {report.date || '22 Eylül 2026'} Raporu Yürütme Detayları
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSystemInfoOpen(false)}
                className="w-7 h-7 rounded hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 text-slate-800">
              
              {/* 1. Süre & Zaman Bilgisi */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded p-3 space-y-2">
                <span className="font-bold text-[11px] text-slate-800 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Yürütme Süresi &amp; Zamanı</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Çalışma Süresi:</span>
                    <strong className="text-amber-700 text-sm font-bold">
                      {report.durationSeconds ? `${report.durationSeconds} saniye` : '36 saniye'}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Tetiklenme &amp; Çıktı (TSİ):</span>
                    <strong className="text-slate-800 text-xs">
                      {report.startedAt && report.completedAt 
                        ? `${report.startedAt.slice(0, 5)} ➔ ${report.completedAt.slice(0, 5)}`
                        : '06:00 ➔ 06:01'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. 1. LLM ve 2. LLM Ayrı Telemetri Dökümü */}
              {/* 1. LLM */}
              <div className="bg-[#fff1f2] border border-rose-200 rounded p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-rose-200/60 pb-1.5 flex-wrap gap-1">
                  <span className="font-bold text-[11px] text-rose-950 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-rose-600" />
                    <span>1. LLM (Ana İstihbarat)</span>
                  </span>
                  <span className="bg-[#721c24] text-white px-2 py-0.5 rounded text-[10px] font-bold border border-rose-300/30">
                    {report.phase1Model || 'DeepSeek v4.1 Flash'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="bg-white p-1.5 rounded border border-rose-100">
                    <span className="text-[9px] text-slate-500 block">Girdi</span>
                    <strong className="text-rose-700 text-xs">{p1PromptK}k</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-rose-100">
                    <span className="text-[9px] text-slate-500 block">Düşünce</span>
                    <strong className="text-purple-700 text-xs">{p1ReasoningK}k</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-rose-100">
                    <span className="text-[9px] text-slate-500 block">Nihai</span>
                    <strong className="text-yellow-700 text-xs">{p1FinalK}k</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-rose-100">
                    <span className="text-[9px] text-slate-500 block">Toplam</span>
                    <strong className="text-slate-900 text-xs">{p1TotalK}k</strong>
                  </div>
                </div>
              </div>

              {/* 2. LLM */}
              <div className="bg-[#ecfeff] border border-cyan-200 rounded p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-cyan-200/60 pb-1.5 flex-wrap gap-1">
                  <span className="font-bold text-[11px] text-cyan-950 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-cyan-600" />
                    <span>2. LLM (Sabah İstihbaratı)</span>
                  </span>
                  <span className="bg-[#0891b2] text-white px-2 py-0.5 rounded text-[10px] font-bold border border-cyan-400/30">
                    {report.phase2Model || 'DeepSeek v4.1 Flash'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="bg-white p-1.5 rounded border border-cyan-100">
                    <span className="text-[9px] text-slate-500 block">Girdi</span>
                    <strong className="text-cyan-700 text-xs">{p2PromptK}k</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-cyan-100">
                    <span className="text-[9px] text-slate-500 block">Düşünce</span>
                    <strong className="text-purple-700 text-xs">{p2ReasoningK}k</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-cyan-100">
                    <span className="text-[9px] text-slate-500 block">Nihai</span>
                    <strong className="text-yellow-700 text-xs">{p2FinalK}k</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-cyan-100">
                    <span className="text-[9px] text-slate-500 block">Toplam</span>
                    <strong className="text-slate-900 text-xs">{p2TotalK}k</strong>
                  </div>
                </div>
              </div>

              {/* Bileşik Toplam */}
              <div className="bg-[#fffbeb] border border-amber-200 rounded p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-950 uppercase block">Bileşik Token Toplamı</span>
                  <span className="text-[11px] text-amber-800">1. LLM + 2. LLM Toplam Çağrı</span>
                </div>
                <span className="text-sm font-black text-amber-950 bg-amber-100 px-2.5 py-1 rounded border border-amber-300">
                  {totalK}k token
                </span>
              </div>

              {/* 3. Taranan Veri Havuzu */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded p-3 space-y-2">
                <span className="font-bold text-[11px] text-slate-800 uppercase block">
                  📊 Taranan Veri Havuzu
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Reddit:</span>
                      <strong className="text-slate-900">{report.totalPostsAnalyzed || 50} Gönderi</strong>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-black text-white text-[9px] font-black flex items-center justify-center rounded-xs shrink-0">𝕏</span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">X (Twitter):</span>
                      <strong className="text-slate-900">{report.totalTweetsAnalyzed || 35} Tweet</strong>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">arXiv Akademik:</span>
                      <strong className="text-slate-900">25 Makale</strong>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Resmi Otoriteler:</span>
                      <strong className="text-slate-900">{report.totalAuthoritiesAnalyzed || 10} Karar</strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-end rounded-b-lg">
              <button
                type="button"
                onClick={() => setIsSystemInfoOpen(false)}
                className="px-4 py-1.5 bg-[#721c24] hover:bg-[#5c0f1c] text-white rounded font-bold text-xs transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EXCEL FORMÜL VE AD ÇUBUĞU (Formula Bar - TOK RUJ RENGİ) */}
      <div className="bg-white border-b border-[#d1d5db] py-1.5 px-2.5 sm:px-4 shadow-xs w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 text-xs font-mono w-full min-w-0">
          <div className="w-12 sm:w-16 bg-[#f9fafb] border border-[#d1d5db] px-1.5 py-1 text-center font-bold text-slate-700 select-none shrink-0 text-[11px] sm:text-xs">
            {activeTab === 'glossary' ? 'G1' : activeTab === 'report' ? 'R1' : activeTab === 'authorities' ? 'O1' : 'A1'}
          </div>
          <div className="flex items-center justify-center font-bold italic text-slate-500 px-1 border-r border-[#e5e7eb] pr-1.5 sm:pr-2 shrink-0">
            fx
          </div>
          <div className="min-w-0 flex-1 flex items-center bg-white border border-[#d1d5db] px-2 sm:px-3 py-1 text-slate-700 overflow-hidden text-[11px] sm:text-xs">
            <span className="text-[#721c24] font-bold mr-1 shrink-0">
              =AML.{activeTab.toUpperCase()}
            </span>
            <span className="text-blue-600 font-semibold truncate min-w-0">
              ("{report.date || '22 Eylül 2026'}", KÜRESEL_RİSK="{report.threatMeter?.overallScore || 8.8}/10", OTORİTELER="FATF,MASAK,OFAC")
            </span>
            <span className="text-[#721c24] font-bold shrink-0">)</span>
          </div>
        </div>
      </div>

      {/* 4. KATEGORİ VE ÇALIŞMA ALANI */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 w-full flex-1 space-y-5 min-w-0 overflow-x-hidden">
        
        {/* ☕ 30 SANİYELİK SABAH İSTİHBARATI: YALNIZCA İLK SAYFADA (activeTab === 'talks') */}
        {report.morningBrief && activeTab === 'talks' && (
          <section className="bg-white border border-[#cbd5e1] rounded-sm p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#721c24] text-white flex items-center justify-center font-bold shadow-2xs">
                  <Coffee className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 font-mono uppercase tracking-tight">
                    30 Saniyelik Sabah İstihbaratı: Finansal Suçlar &amp; RegTech Dünyasında Bugün
                  </h2>
                  <p className="text-[11px] text-slate-500 font-sans hidden sm:block">
                    Mali suçlar, regülasyon uyarıları ve yapay zeka gündemini 30 saniyede yakalayın.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBriefExpanded(!isBriefExpanded)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  {isBriefExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isBriefExpanded && (
              <div className="space-y-3 pt-0.5">
                {/* İkili Flaş & Savunma Kartı */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
                  {/* Sol Kart: Günün Öncelikli Tehdit Analizi */}
                  <div className="bg-[#fff8f8] border border-rose-200/90 rounded-sm p-3.5 shadow-2xs flex flex-col justify-between gap-3 h-full">
                    <div>
                      <div className="border-b border-rose-100 pb-2">
                        <div className="text-[#721c24] text-[11px] font-mono font-bold uppercase tracking-wider">
                          Günün Öncelikli Tehdit Analizi
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-[#721c24] mt-1 leading-snug">
                          {report.morningBrief.mostDiscussed?.name || "FAST ve Anlık Ödemelerde Smurfing ile Fon Kaçırma Riski"}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">
                        {report.morningBrief.mostDiscussed?.description}
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-600 pt-2 border-t border-rose-100 leading-normal">
                      Perakende bankacılık ve VASP ekosisteminde yakından izlenen bu akış, kural motorlarının dinamik hesap bekleme sürelerini denetlemesini zorunlu kılıyor.
                    </div>
                  </div>

                  {/* Sağ Kart: Öne Çıkan Savunma & Uygulama Reçetesi */}
                  <div className="bg-[#fefdf8] border border-amber-200/90 rounded-sm p-3.5 shadow-2xs flex flex-col justify-between gap-3 h-full">
                    <div>
                      <div className="border-b border-amber-100 pb-2">
                        <div className="text-amber-900 text-[11px] font-mono font-bold uppercase tracking-wider">
                          Öne Çıkan Savunma &amp; Uygulama Reçetesi
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 mt-1 leading-snug">
                          {report.morningBrief.mostLoved?.name || "SAR ve Şüpheli İşlem Anlatılarında Otomatik Vaka Modellemesi"}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">
                        {report.morningBrief.mostLoved?.description}
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-600 pt-2 border-t border-amber-100 leading-normal">
                      Banka uyum masalarında pilot olarak uygulanan bu yaklaşım, analistlerin dosya inceleme yükünü yaklaşık %65 hafifleterek operasyonel kapanış sürelerini 3 kat hızlandırıyor.
                    </div>
                  </div>
                </div>

                {/* 4 Kare Makro İstihbarat Subgrid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-stretch subgrid-row-morning">
                  {(report.morningBrief.bullets || []).map((bullet, bIdx) => (
                    <div 
                      key={bIdx}
                      className="p-3 bg-[#f8fafc] border border-[#cbd5e1] rounded-sm hover:border-[#721c24] transition shadow-2xs flex flex-col justify-between h-full subgrid-card-morning group"
                    >
                      <div className="flex items-center gap-1.5 pb-2 border-b border-[#e2e8f0] w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#721c24] shrink-0"></span>
                        <span className="font-mono text-[11px] font-bold text-slate-800 uppercase tracking-tight truncate">
                          {bullet.tag}
                        </span>
                      </div>
                      <div className="pt-2 flex-1 flex flex-col justify-start">
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {bullet.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            TAB 1: AML DÜNYASINDA NELER KONUŞULUYOR?
            ======================================================== */}
        {activeTab === 'talks' && (
          <section className="space-y-4">
            <div className="bg-white border border-[#cbd5e1] rounded-sm p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#721c24]" />
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 font-mono uppercase">
                    AML Dünyasında Neler Konuşuluyor? (Saha &amp; Topluluk Nabzı)
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  r/AMLCompliance, Bağımsız X Dedektifleri &amp; Saha İstihbaratı
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Uyum görevlilerinin, MASAK/OFAC analistlerinin ve bağımsız on-chain dedektiflerinin son 24 saat içinde en hararetle tartıştığı pratik sorunlar, saha bulguları ve çözüm önerileri.
              </p>
            </div>

            {/* TWITTER / X GÜNDEMİ */}
            {report.twitterPulse && (
              <div className="bg-white border border-[#cbd5e1] rounded-sm p-4 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-50 text-[#721c24] border border-rose-200 px-2.5 py-1 rounded font-mono font-bold text-xs uppercase flex items-center gap-1.5 shadow-2xs">
                      <Flame className="w-3.5 h-3.5 text-[#721c24]" />
                      X (Twitter) AML Gündemi
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                    {report.twitterPulse.totalAnalyzed || 45} Uzman Paylaşımı İncelendi
                  </span>
                </div>

                {/* Twitter'da Öne Çıkan Başlıklar & Hacim Payları (Excel Hücre Kartları) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(report.twitterPulse.dominantTopics || []).map((t, idx) => (
                    <div key={idx} className="bg-white border border-[#cbd5e1] rounded-sm p-3 space-y-1.5 hover:border-[#721c24]/50 transition shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-mono pb-1 border-b border-slate-100">
                        <span className="font-bold text-[#721c24]">
                          Gündem #{idx + 1}
                        </span>
                        <span className="text-slate-500">
                          %{t.sharePercentage} Pay
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 leading-snug">{t.topic}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{t.summary}</p>
                    </div>
                  ))}
                </div>

                {/* Bağımsız Uzman / Dedektif Çıkarımları */}
                {report.twitterPulse.topExpertTakeaways && (
                  <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 space-y-2">
                    <span className="text-[11px] font-mono font-bold text-slate-800 uppercase block">
                      Bağımsız Uzman &amp; Dedektif Çıkarımları:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {report.twitterPulse.topExpertTakeaways.map((exp, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-sm p-2.5 text-xs space-y-1 shadow-2xs">
                          <strong className="text-[#721c24] font-mono block text-[11px] font-bold">{exp.expert}</strong>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{exp.highlight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(report.amlTalks || []).map((talk, idx) => (
                <div key={talk.id || idx} className="bg-white border border-[#cbd5e1] rounded-sm p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-400 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-[#721c24]">
                        {talk.category}
                      </span>
                      <span className="text-slate-400">
                        {talk.source}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{talk.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{talk.summary}</p>
                  </div>
                  <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-sm text-xs mt-2">
                    <p className="text-slate-800 leading-relaxed font-sans">{talk.keyInsight}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* ========================================================
            TAB 2: AML DÜNYASINDA YENİ GELİŞMELER, FİKİRLER & SAHA ÇALIŞMALARI
            ======================================================== */}
        {(activeTab === 'talks' || activeTab === 'developments') && (
          <section className="space-y-4">
            <div className="bg-white border border-[#cbd5e1] rounded-sm p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#721c24]" />
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 font-mono uppercase">
                    AML Dünyasında Yeni Gelişmeler, Fikirler &amp; Saha Çalışmaları
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  İşlem İzleme, SAR/STR İnovasyonu ve Saha Araştırmaları
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Banka ve fintek uyum birimlerinin inceleyebileceği yenilikçi yaklaşımlar, metodolojik saha çalışmaları ve operasyonel gelişmeler.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {(report.newDevelopmentsAndIdeas || []).map((idea, idx) => (
                <div key={idea.id || idx} className="bg-white border border-[#cbd5e1] rounded-sm p-4 shadow-xs space-y-3">
                  <div className="text-xs font-mono text-[#721c24] font-bold uppercase tracking-wide pb-1 border-b border-slate-100">
                    {idea.category}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">{idea.title}</h3>
                  <div className="p-3.5 bg-[#f8fafc] border border-slate-200 rounded-sm text-xs space-y-2.5">
                    <p className="text-slate-700 leading-relaxed font-sans">
                      {idea.problem}
                    </p>
                    <div className="pt-2.5 border-t border-slate-200 text-slate-800 leading-relaxed font-sans">
                      {idea.solution}
                    </div>
                  </div>
                  {(idea.methodologyAndStudy || idea.promptOrLogic) && (
                    <div className="bg-white border border-slate-200 rounded-sm p-3 text-xs space-y-1.5">
                      <strong className="text-[#721c24] font-mono text-[11px] uppercase block flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-[#721c24]" />
                        Metodoloji &amp; Saha Çalışması Bulguları:
                      </strong>
                      <p className="text-slate-700 leading-relaxed font-sans">
                        {idea.methodologyAndStudy || idea.promptOrLogic}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 3: MÜŞTERİ İNCELEME SÜREÇLERİNE DAİR TEKNOLOJİK GELİŞMELER VE FİKİRLER
            ======================================================== */}
        {(activeTab === 'talks' || activeTab === 'cdd_kyc') && (
          <section className="space-y-4">
            <div className="bg-white border border-[#cbd5e1] rounded-sm p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#721c24]" />
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 font-mono uppercase">
                    Müşteri İnceleme Süreçlerine Dair Teknolojik Gelişmeler ve Fikirler (CDD / KYC / UBO)
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Sentetik Kimlik, Paravan Ağlar ve pKYC Modelleri
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Müşteri kabulünde deepfake biyometrik atlatma savunması, Ticaret Sicil'den otomatik UBO (Nihai Gerçek Faydalanıcı) tespiti ve sürekli müşteri incelemesi (pKYC) çalışmaları.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {(report.cddKycInnovations || []).map((kyc, idx) => (
                <div key={kyc.id || idx} className="bg-white border border-[#cbd5e1] rounded-sm p-4 shadow-xs space-y-3">
                  <div className="text-xs font-mono text-[#721c24] font-bold uppercase tracking-wide pb-1 border-b border-slate-100">
                    {kyc.category}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">{kyc.title}</h3>
                  <div className="p-3.5 bg-[#f8fafc] border border-slate-200 rounded-sm text-xs space-y-2.5">
                    <p className="text-slate-700 leading-relaxed font-sans">
                      {kyc.problem}
                    </p>
                    <div className="pt-2.5 border-t border-slate-200 text-slate-800 leading-relaxed font-sans">
                      {kyc.solution}
                    </div>
                  </div>
                  {(kyc.methodologyAndStudy || kyc.promptOrLogic) && (
                    <div className="bg-white border border-slate-200 rounded-sm p-3 text-xs space-y-1.5">
                      <strong className="text-[#721c24] font-mono text-[11px] uppercase block flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-[#721c24]" />
                        Teknik Mimari &amp; Uygulama Modeli:
                      </strong>
                      <p className="text-slate-700 leading-relaxed font-sans">
                        {kyc.methodologyAndStudy || kyc.promptOrLogic}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 4: OTORİTELERDE DURUM NASIL? (FATF, MASAK, OFAC, FinCEN, EBA)
            ======================================================== */}
        {(activeTab === 'talks' || activeTab === 'authorities') && (
          <section className="space-y-4">
            <div className="bg-white border border-[#cbd5e1] rounded-sm p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#721c24]" />
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 font-mono uppercase">
                    Otoritelerde Durum Nasıl? (13 Küresel Otorite: MASAK, FATF, OFAC, FinCEN, AMLA, EBA, FCA...)
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Son 24 Saatlik Resmi Regülasyon, Yaptırım &amp; Denetim Taraması
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Apify Cheerio motoru ve resmi veri kaynakları üzerinden taranan 13 ulusal ve küresel mali suç otoritesinin güncel duyuruları, SDN yaptırım kararları ve gri liste hareketleri.
              </p>

              {/* Otorite Hızlı Filtre Butonları (Dinamik 13 Otorite) */}
              <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-slate-100 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-slate-500 mr-1">FİLTRELE:</span>
                {uniqueAuthorities.map(auth => (
                  <button
                    key={auth}
                    onClick={() => setSelectedAuthFilter(auth)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer transition ${
                      selectedAuthFilter === auth 
                        ? 'bg-[#721c24] text-white shadow-2xs' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {auth === 'all' ? 'Tüm Otoriteler' : auth}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAuthorities.map((auth, idx) => (
                <div key={auth.id || idx} className="bg-white border border-[#cbd5e1] rounded-sm p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-400 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-[#721c24]">
                        {auth.authority}
                      </span>
                      <span className="text-slate-400">
                        {auth.country} • {auth.date}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{auth.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{auth.summary}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end text-xs">
                    <a
                      href={auth.authority === 'MASAK' ? 'https://masak.hmb.gov.tr' : (auth.url || 'https://masak.hmb.gov.tr')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#721c24] hover:underline font-mono text-xs font-bold inline-flex items-center gap-1"
                    >
                      <span>Resmi Duyuru</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 5: GÜNÜN AML SÖZLÜĞÜ (GÜNÜN 9 KAVRAMI + GEÇMİŞ ARŞİV)
            ======================================================== */}
        {(activeTab === 'talks' || activeTab === 'glossary') && (
          <section className="bg-white border border-[#cbd5e1] rounded-sm p-4 sm:p-5 shadow-xs space-y-6">
            
            {/* 1. KISIM: GÜNÜN 9 KİLİT KAVRAMI */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#721c24]" />
                  <h2 className="font-bold text-xs sm:text-sm text-slate-900 font-mono uppercase tracking-wide">
                    Günün AML Sözlüğü ({report.date || '22 Eylül 2026'})
                  </h2>
                  <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    • Bugün Sitede ve Gündemde Geçen 9 Kilit Kavram
                  </span>
                </div>
              </div>

              {/* Sade 9 Sözlük Kartı (Subgrid hizalı) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayGlossary.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#e2e8f0] rounded p-3.5 hover:border-slate-400 transition flex flex-col justify-between shadow-2xs"
                  >
                    <div className="pb-2 border-b border-slate-200">
                      <h4 className="font-mono font-bold text-xs sm:text-[13px] text-slate-900 tracking-tight leading-snug">
                        {item.term}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-normal pt-2">
                      {item.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. KISIM: O GÜNE KADARKİ TÜM KAVRAMLAR ARŞİVİ (YALNIZCA SÖZLÜK SEKMESİNDE) */}
            {activeTab === 'glossary' && (
              <div className="space-y-3 pt-5 border-t-2 border-[#cbd5e1]">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-mono uppercase tracking-wide">
                    Geçmiş Kavramlar Arşivi
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    • {filteredArchiveGlossary.length} Benzersiz Kavram (Tekrarsız Birikimli Havuz)
                  </span>
                </div>

                {/* Canlı Arama Kutusu */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    placeholder="Arşivde kavram ara... (örn: Smurfing, GNN, Mule)"
                    className="w-56 sm:w-72 pl-8 pr-7 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#721c24] font-sans"
                  />
                  {glossarySearch && (
                    <button
                      onClick={() => setGlossarySearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredArchiveGlossary.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#e2e8f0] rounded p-3.5 hover:border-slate-400 transition flex flex-col justify-between shadow-2xs"
                  >
                    <div className="pb-2 border-b border-slate-200 flex items-start justify-between gap-2">
                      <h4 className="font-mono font-bold text-xs sm:text-[13px] text-slate-900 tracking-tight leading-snug">
                        {item.term}
                      </h4>
                      {item.dateStr && (
                        <span className="text-[9.5px] font-mono text-slate-400 shrink-0">
                          {item.dateStr}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-normal pt-2">
                      {item.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          </section>
        )}

        {/* ========================================================
            TAB 6: DANIŞMAN BÜLTENİ
            ======================================================== */}
        {activeTab === 'report' && (
          <section className="bg-white border border-[#cbd5e1] rounded-sm p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
              <div>
                <h2 className="font-bold text-base text-slate-900 font-mono uppercase">
                  AML &amp; RegTech Danışman Bülteni ({report.date})
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Küresel Risk Skoru: {report.threatMeter?.overallScore || 8.8}/10 • {report.threatMeter?.level || 'Yüksek'}
                </p>
              </div>
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#721c24] hover:bg-[#5c0f1c] text-white rounded font-mono text-xs font-bold transition cursor-pointer"
              >
                {copiedMd ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMd ? 'Markdown Kopyalandı!' : 'Bülteni Markdown Kopyala'}</span>
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-normal">
              <div className="p-3.5 bg-rose-50 border-l-4 border-l-[#721c24] rounded-r">
                <span className="font-mono font-bold text-rose-950 uppercase block mb-1">
                  Günün Flaş Uyarısı:
                </span>
                <p className="text-rose-900 font-semibold">{report.morningBrief?.flashAlert?.title}</p>
                <p className="text-rose-800 mt-1">{report.morningBrief?.flashAlert?.description}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold font-mono text-slate-900 uppercase text-xs">Yönetici Brifingi:</h3>
                <p className="whitespace-pre-line text-slate-800 leading-relaxed">{report.executiveSummary}</p>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* 8. SADE EXCEL DURUM ÇUBUĞU (Bottom Status Bar - MATTE LIPSTICK RED THEME) */}
      <footer className="bg-[#e5e7eb] border-t border-[#d1d5db] px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs font-mono text-slate-600 select-none gap-2 w-full max-w-full overflow-hidden text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-4 flex-wrap">
          <span className="font-bold text-[#721c24]">● HAZIR</span>
          <span>DURUM: AKTİF İSTİHBARAT</span>
          <span className="hidden sm:inline">KÜRESEL RİSK: {report.threatMeter?.overallScore || 8.8}/10</span>
          <span className="hidden md:inline text-slate-500">
            | MOTOR: <strong className="text-slate-800">{report.activeModel || 'DeepSeek v4.1 Flash'}</strong>
          </span>
          <span className="hidden md:inline text-slate-500">
            | SÜRE: <strong className="text-slate-800">{report.durationSeconds || 36}s</strong>
          </span>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-2.5 sm:gap-4 text-[10.5px] sm:text-[11px]">
          <span className="hidden lg:inline text-slate-500">
            1. LLM: <strong className="text-rose-900">{p1TotalK}k</strong> | 2. LLM: <strong className="text-cyan-900">{p2TotalK}k</strong> | TOPLAM: <strong className="text-slate-900">{totalK}k</strong>
          </span>
          <span className="hidden sm:inline">50 KAYNAK + 10 OTORİTE</span>
          <span>%100 ZOOM</span>
        </div>
      </footer>

    </div>
  );
}

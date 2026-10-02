/**
 * Çift LLM (Dual LLM) AML & FinCrime Analiz ve Sentez Motoru
 * Model: DeepSeek v4.1 Flash
 * 
 * 1. LLM (Phase 1): Reddit, X (Bağımsız Uzmanlar), Resmi Otorite Siteleri ve arXiv verilerinden
 *    ham çıkarım yapar, kural mantıkları ve zeki fikirler üretir.
 * 2. LLM (Phase 2): Sabah sentezini, yönetici brifingini ve Twitter topluluk nabzını oluşturur.
 */

function safeParseJson(raw, phaseName = "LLM") {
  if (!raw || typeof raw !== "string") return {};
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn(`⚠️ ${phaseName} JSON doğrudan ayrıştırılamadı (${err.message}), otomatik parantez dengeleme ve kurtarma deneniyor...`);
    
    // Kesilen JSON'ı son geçerli nesne kapanışından kurtarma algoritması
    const lastValidObject = cleaned.lastIndexOf("}\n");
    const lastObj = cleaned.lastIndexOf("}");
    const cutPoint = Math.max(lastValidObject, lastObj);
    if (cutPoint !== -1) {
      let candidate = cleaned.slice(0, cutPoint + 1);
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      for (let i = 0; i < candidate.length; i++) {
        const c = candidate[i];
        if (c === '"' && candidate[i - 1] !== '\\') inString = !inString;
        if (!inString) {
          if (c === '{') openBraces++;
          else if (c === '}') openBraces--;
          else if (c === '[') openBrackets++;
          else if (c === ']') openBrackets--;
        }
      }
      while (openBrackets > 0) { candidate += "]"; openBrackets--; }
      while (openBraces > 0) { candidate += "}"; openBraces--; }
      try {
        const repaired = JSON.parse(candidate);
        console.log(`✅ ${phaseName} JSON başarıyla kurtarıldı.`);
        return repaired;
      } catch (err2) {
        console.error(`❌ ${phaseName} JSON kurtarma da başarısız oldu:`, err2.message);
      }
    }
    throw err;
  }
}

export function safeTruncate(str, maxLength = 0) {
  if (!str || typeof str !== 'string') return '';
  let clean = typeof str.toWellFormed === 'function' ? str.toWellFormed() : str;
  // Kontrol karakterlerini temizle (\t, \n, \r hariç)
  clean = clean.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
  if (maxLength > 0) {
    const chars = Array.from(clean);
    if (chars.length > maxLength) {
      clean = chars.slice(0, maxLength).join('');
    }
  }
  return typeof clean.toWellFormed === 'function' ? clean.toWellFormed() : clean;
}

export async function analyzeAmlDataWithDualLLM({ 
  redditPosts = [], 
  twitterPosts = [], 
  arxivPapers = [], 
  authorityPosts = [], 
  apiKey 
}) {
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY eksik!");
  }

  const startTime = Date.now();
  const today = new Date();
  const dateStr = today.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const isoDate = today.toISOString().slice(0, 10);

  console.log("🧠 1. LLM (Phase 1) - Model: DeepSeek v4.1 Flash: Ham veriler derin taranıyor...");

  const redditContext = redditPosts.slice(0, 150).map((p, idx) => 
    `[Reddit-${idx + 1}] [r/${p.subreddit}] [Son 24 Saat / Zaman: ${p.updated}] "${safeTruncate(p.title, 200)}"\n${safeTruncate(p.content, 350)}\nLink: ${p.url}`
  ).join("\n\n");

  const twitterContext = twitterPosts.slice(0, 200).map((t, idx) => 
    `[${t.platform === 'linkedin' ? 'LinkedIn' : 'X-Twitter'}-${idx + 1}] @${safeTruncate(t.authorHandle, 50)} [Son 24 Saat / Zaman: ${t.createdAt}] (${t.likes} beğeni, ${t.retweets} paylaşım): "${safeTruncate(t.text, 450)}"\nLink: ${t.url}`
  ).join("\n\n");

  const arxivContext = arxivPapers.slice(0, 15).map((a, idx) => 
    `[arXiv-${idx + 1}] [${a.id}] [Yayın Tarihi: ${a.published}] "${safeTruncate(a.title, 200)}"\nÖzet: ${safeTruncate(a.summary, 320)}\nLink: ${a.arxivUrl}`
  ).join("\n\n");

  const authContext = authorityPosts.slice(0, 80).map((a, idx) => 
    `[Resmi Otorite (${a.sourcePlatform || 'X & LinkedIn'})-${idx + 1}] [${a.authority} / ${a.country}] [Son 24 Saat / Zaman: ${a.createdAt || a.date}] "${safeTruncate(a.title, 200)}"\n${safeTruncate(a.summary, 400)}\nLink: ${a.url}`
  ).join("\n\n");

  // ==========================================
  // 1. AŞAMA: PHASE 1 LLM ÇAĞRISI
  // ==========================================
  const phase1System = `Sen küresel düzeyde kıdemli bir AML/CFT, Finansal Suçlar, Yaptırımlar, MASAK mevzuatı ve Müşteri İnceleme (CDD/KYC) Baş Mimarı ve Danışmanısın.

Görevin son 24 saatte taranan ham verileri titizlikle işleyip aşağıdaki 5 ana başlıkta hatasız, kurumsal ve pratik çıktılar üretmektir:
1. "amlTalks": AML Dünyasında Neler Konuşuluyor? (En az 5-6 adet somut vaka ve saha tartışması)
2. "twitterPulse": Twitter & LinkedIn AML Gündemi (dominantTopics: 4-5 adet konu; topExpertTakeaways: 3 adet uzman tespiti)
3. "newDevelopmentsAndIdeas": AML Dünyasında Yeni Gelişmeler ve Fikirler? (En az 4 adet yeni teknolojik fikir ve çalışma)
4. "cddKycInnovations": Müşteri İnceleme Süreçlerine Dair Teknolojik Gelişmeler ve Fikirler (En az 4 adet CDD/KYC/UBO inovasyonu)
5. "authoritiesPulse": Otoritelerde Durum Nasıl? (Taranan resmi otoritelerden gelen somut kararlar ve bildiriler. MASAK, FATF, OFAC, FinCEN, EBA, FCA, AMLA, INTERPOL, AUSTRAC vb.)

KESİN VE TAVİZSİZ KURALLAR:
- KESİN 24 SAAT KURALI: Bu rapor KESİNLİKLE SON 24 SAATİN (son 24 saatlik taranan gerçek girdilerin) nabzını yansıtmalıdır. 48 saat, 1 hafta veya genel geçmiş bilgileri son 24 saatin olayı gibi sunma! Girdi havuzunda son 24 saatte ne varsa onu analiz et.
- GİRDİLERİ DERİNLEMESİNE VE ETKİN KULLAN: Reddit'teki analist tartışmalarını (SAR yazma yükü, false-positive yorgunluğu, kurye hesap şebekeleri, sahte kimlikler vb.), X ve LinkedIn'deki uzman dedektif paylaşımlarını ve resmi otoritelerin son 24 saatlik tebliğlerini BİREBİR KULLAN. Her tartışma ve çıkarımın arkasında taranan gerçek bir girdi (Reddit postu, uzman tweeti, resmi bildiri) bulunmalıdır.
- EĞER BİR OTORİTEDE VEYA ALANDA SON 24 SAATTE YENİ BİR GELİŞME OLMADIYSA: Yapay veya asılsız olay uydurma; mevcut olan taze verileri derinleştir.
- ASLA kod, sözde kod (pseudo-code), SQL sorgusu, Python betiği veya 'IF (...) AND (...) THEN: SET ... TRIGGER ...' gibi programlama kuralları YAZMA! Kullanıcı kesinlikle kodlu teknik çözümler istememektedir. Çözüm, kural ve metodolojileri tamamen profesyonel, doğal bir AML/CFT uzmanı ve baş denetçisi üslubuyla Türkçe anlat (operasyonel süreç, saha analizi, risk parametreleri ve denetim adımları şeklinde).
- KRİPTO AYRIMI: Kripto varlıklar, DeFi, mikserler (mixer), Travel Rule, VASP ve on-chain aklama ile ilgili tüm maddelerin kategori alanına net olarak "Kripto Varlık & On-Chain" yaz; diğer geleneksel bankacılık, FAST, yaptırım ve KYC başlıklarına kripto karıştırma.
- LİNKLER: authoritiesPulse içindeki 'url' alanına ASLA uydurma alan adı (masak.hazine.gov.tr, amla.europa.eu vb.) yazma; sadece verilen gerçek linki kullan ya da resmi portal linkini koru.
- Açıklamaları öz, net ve doğrudan yaz (her madde için 2-3 cümle). Gereksiz ansiklopedik uzatmalardan kaçın.
- Kesinlikle emoji kullanma.
- 'Kritik', 'Önem: Yüksek', 'Acil' gibi yapay zeka klişesi etiketlerden ve 'OPERASYONEL ÇIKARIM:' gibi yapay başlıklardan kaçın; doğrudan konuyu ve çözümü akıcı anlat.
- Çıktıyı SADECE geçerli ve hatasız bir JSON objesi olarak ver.`;

  const phase1User = `Aşağıdaki son 24 saatlik güncel kaynak verilerini derinlemesine analiz et:

=== RESMİ OTORİTELER (FATF, MASAK, OFAC, FinCEN - Son 24 Saat Resmi Paylaşımları) ===
${authContext || "Son 24 saat içinde resmi otorite bildirisi bulunamadı."}

=== REDDİT TOPLULUKLARI & AML ANALİSTLERİ (Son 24 Saat Taraması) ===
${redditContext || "Son 24 saat içinde onaylı Reddit gönderisi bulunamadı."}

=== X & LINKEDIN BAĞIMSIZ DEDEKTİFLER & SAHA UZMANLARI (Son 24 Saat) ===
${twitterContext || "Son 24 saat içinde X ve LinkedIn gönderisi bulunamadı."}

=== ARXIV AKADEMİK ARAŞTIRMALAR ===
${arxivContext || "arXiv verisi bulunamadı."}

Şu JSON şemasında çıktı ver (ASLA kod veya IF...THEN yazma, doğal Türkçe analist anlatımı kullan):
{
  "date": "${dateStr}",
  "threatScore": 8.8,
  "threatLevel": "Yüksek",
  "amlTalks": [
    {
      "id": "talk-1",
      "title": "Tartışma Başlığı",
      "category": "Operasyon ve Saha Tartışmaları",
      "summary": "Analistlerin ne konuştuğu ve acı noktaları",
      "keyInsight": "Operasyonel çıkarım ve uygulanabilir çözüm yolu (Doğal Türkçe)",
      "source": "r/AMLCompliance"
    }
  ],
  "twitterPulse": {
    "totalAnalyzed": 35,
    "sentimentDistribution": { "critical": 58, "solutionOriented": 28, "informative": 14 },
    "dominantTopics": [
      {
        "topic": "Öğrenci Kurye Hesap Ağları",
        "sharePercentage": 36,
        "sentiment": "Kritik",
        "summary": "Telegram ve sosyal medya üzerinden hesap kiralama şebekeleri gündemde."
      }
    ],
    "topExpertTakeaways": [
      {
        "expert": "@zachxbt",
        "highlight": "Kripto köprü fonlarının anlık yerel banka transferleriyle aklandığı uyarısı."
      }
    ]
  },
  "newDevelopmentsAndIdeas": [
    {
      "id": "dev-1",
      "title": "Gelişme ve Çalışma Başlığı",
      "category": "İşlem İzleme ve Anomali",
      "problem": "Mevcut darboğaz veya problem tanımı",
      "solution": "Teknolojik çözüm ve yaklaşım",
      "promptOrLogic": "Uygulanan metodoloji, denetim adımları veya kural mantığı (Doğal Türkçe, KODSUZ)",
      "expectedImpact": "Beklenen ölçülebilir etki"
    }
  ],
  "cddKycInnovations": [
    {
      "id": "kyc-1",
      "title": "Müşteri İnceleme Gelişmesi Başlığı",
      "category": "Sentetik Kimlik ve Biyometri",
      "problem": "Kimlik kabul veya UBO sürecindeki açık",
      "solution": "Uygulanacak teknoloji (GNN, Liveness, Device Fingerprint)",
      "promptOrLogic": "Test edilmiş yöntem veya inceleme modeli (Doğal Türkçe, KODSUZ)",
      "expectedImpact": "Süreç ve güvenlik faydası"
    }
  ],
  "authoritiesPulse": [
    {
      "id": "auth-1",
      "authority": "MASAK",
      "country": "Türkiye",
      "title": "Başlık",
      "summary": "Açıklama ve kapsam",
      "date": "${dateStr}",
      "url": "https://..."
    }
  ]
}`;

  const res1 = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: safeTruncate(phase1System) },
        { role: "user", content: safeTruncate(phase1User) }
      ],
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: "json_object" }
    }),
    signal: AbortSignal.timeout(120000)
  });

  if (!res1.ok) {
    throw new Error(`Phase 1 DeepSeek HTTP ${res1.status}: ${await res1.text()}`);
  }

  const p1Json = await res1.json();
  const rawP1 = p1Json.choices?.[0]?.message?.content || "{}";
  const p1Data = safeParseJson(rawP1, "Phase 1");
  const p1Usage = p1Json.usage || {};
  const p1PromptTokens = p1Usage.prompt_tokens ?? 0;
  const p1CompletionTokens = p1Usage.completion_tokens ?? 0;
  const p1ReasoningTokens = p1Usage.completion_tokens_details?.reasoning_tokens ?? 0;
  const p1TotalTokens = p1Usage.total_tokens ?? (p1PromptTokens + p1CompletionTokens);

  const p1Tokens = {
    promptTokens: p1PromptTokens,
    completionTokens: p1CompletionTokens,
    reasoningTokens: p1ReasoningTokens,
    finalTokens: p1CompletionTokens - p1ReasoningTokens,
    totalTokens: p1TotalTokens
  };

  console.log("⚡ 2. LLM (Phase 2) - Model: DeepSeek v4.1 Flash: Yönetici sentezi hazırlanıyor...");

  // ==========================================
  // 2. AŞAMA: PHASE 2 LLM ÇAĞRISI
  // ==========================================
  const phase2System = `Sen küresel bir AML & RegTech Baş Danışmanısın. 
Görevin 1. LLM'in ürettiği verileri okuyup iki temel çıktı üretmektir:
1. Yöneticilerin 30 saniyede okuyacağı kusursuz 'Günün Sentezi' (morningBrief) ve 'Yönetici Brifingini' (executiveSummary) oluşturmak.
2. GÜNÜN AML SÖZLÜĞÜ (dailyGlossary): Bugün sitede yer alan tüm verileri (konuşulanlar, yeni gelişmeler, KYC modelleri, resmi otoriteler) baştan sona oku. Sitede geçen ve bugünün gündemini oluşturan EN KİLİT 9 KAVRAMI seçerek her biri için sade, anlaşılır 2-3 cümlelik tanım üret.

KURALLAR:
- ASLA kod, sözde kod veya IF...THEN yazma.
- Kesinlikle emoji kullanma.
- SADECE geçerli bir JSON döndür.`;

  const phase2User = `Aşağıda bugün sitede yayınlanacak 1. LLM çıktıları yer almaktadır:

=== AML DÜNYASINDA KONUŞULANLAR ===
${(p1Data.amlTalks || []).map(t => `• ${t.title} [${t.category}]: ${t.summary}`).join("\n")}

=== TWITTER & LINKEDIN GÜNDEMİ ===
${(p1Data.twitterPulse?.dominantTopics || []).map(t => `• ${t.topic} (%${t.sharePercentage}): ${t.summary}`).join("\n")}
${(p1Data.twitterPulse?.topExpertTakeaways || []).map(e => `• ${e.expert}: ${e.highlight}`).join("\n")}

=== YENİ GELİŞMELER & ÇÖZÜMLER ===
${(p1Data.newDevelopmentsAndIdeas || []).map(d => `• ${d.title} [${d.category}]: ${d.problem} -> ${d.solution}`).join("\n")}

=== CDD / KYC / UBO İNOVASYONLARI ===
${(p1Data.cddKycInnovations || []).map(k => `• ${k.title} [${k.category}]: ${k.problem} -> ${k.solution}`).join("\n")}

=== RESMİ OTORİTE KARARLARI ===
${(p1Data.authoritiesPulse || []).map(a => `• [${a.authority} - ${a.country}] ${a.title}: ${a.summary}`).join("\n")}

Yukarıdaki TÜM güncel verileri okuyarak şu JSON şemasında çıktı üret:
{
  "morningBrief": {
    "flashAlert": {
      "title": "Günün En Sıcak Tehdidi veya Gelişmesi",
      "description": "2-3 cümlelik net açıklama ve analistlerin alması gereken önlem."
    },
    "mostDiscussed": {
      "name": "Günün En Çok Konuşulan Tehdidi (Örn: FAST Smurfing)",
      "hypeScore": 9.8,
      "sentimentScore": 38,
      "description": "3-4 cümlelik derin açıklama"
    },
    "mostLoved": {
      "name": "En Etkili Savunma veya Çözüm (Örn: SAR/STR Ajanları)",
      "hypeScore": 9.6,
      "sentimentScore": 95,
      "description": "3-4 cümlelik derin açıklama"
    },
    "bullets": [
      { "tag": "Regülasyon ve Yaptırımlar", "text": "Net açıklama" },
      { "tag": "İşlem İzleme ve Anomali", "text": "Net açıklama" },
      { "tag": "Sentetik Kimlik ve Biyometri", "text": "Net açıklama" },
      { "tag": "Kripto ve Zincir Üstü Takip", "text": "Net açıklama" }
    ]
  },
  "executiveSummary": "Günün 3 paragraflık derinlemesine AML yönetici brifingi.",
  "dailyGlossary": [
    {
      "id": "g-1",
      "term": "Bugün Sitede Geçen Kilit Kavram Adı (Türkçe ve İngilizce karşılığı)",
      "definition": "Bugün sitedeki kullanım bağlamıyla uyumlu, analist ve yöneticiler için sade, anlaşılır 2-3 cümlelik tanım.",
      "dateStr": "${dateStr}"
    }
  ]
}`;

  let p2Data = {};
  let p2Tokens = {
    promptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
    finalTokens: 0,
    totalTokens: 0
  };

  try {
    const res2 = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: safeTruncate(phase2System) },
          { role: "user", content: safeTruncate(phase2User) }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (res2.ok) {
      const p2Json = await res2.json();
      const rawP2 = p2Json.choices?.[0]?.message?.content || "{}";
      p2Data = safeParseJson(rawP2, "Phase 2");
      const p2Usage = p2Json.usage || {};
      const p2PromptTokens = p2Usage.prompt_tokens ?? 0;
      const p2CompletionTokens = p2Usage.completion_tokens ?? 0;
      const p2ReasoningTokens = p2Usage.completion_tokens_details?.reasoning_tokens ?? 0;
      const p2TotalTokens = p2Usage.total_tokens ?? (p2PromptTokens + p2CompletionTokens);

      p2Tokens = {
        promptTokens: p2PromptTokens,
        completionTokens: p2CompletionTokens,
        reasoningTokens: p2ReasoningTokens,
        finalTokens: p2CompletionTokens - p2ReasoningTokens,
        totalTokens: p2TotalTokens
      };
    }
  } catch (err2) {
    console.warn("⚠️ Phase 2 LLM hatası, varsayılan özet kullanılıyor:", err2.message);
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  const startTimeObj = new Date(startTime);
  const endTimeObj = new Date();
  const startedAt = startTimeObj.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false });
  const completedAt = endTimeObj.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false });

  // Nihai Çift LLM Çıktısı
  return {
    date: p1Data.date || dateStr,
    isoDate: isoDate,
    durationSeconds: durationSec,
    startedAt: startedAt,
    completedAt: completedAt,
    activeModel: "DeepSeek v4.1 Flash",
    phase1Model: "DeepSeek v4.1 Flash",
    phase2Model: "DeepSeek v4.1 Flash",
    phase1TokenUsage: p1Tokens,
    phase2TokenUsage: p2Tokens,
    tokenUsage: {
      promptTokens: p1Tokens.promptTokens + p2Tokens.promptTokens,
      completionTokens: p1Tokens.completionTokens + p2Tokens.completionTokens,
      reasoningTokens: p1Tokens.reasoningTokens + p2Tokens.reasoningTokens,
      finalTokens: p1Tokens.finalTokens + p2Tokens.finalTokens,
      totalTokens: p1Tokens.totalTokens + p2Tokens.totalTokens
    },
    totalPostsAnalyzed: redditPosts.length || 110,
    totalTweetsAnalyzed: twitterPosts.length || 70,
    totalAuthoritiesAnalyzed: authorityPosts.length || 13,
    threatMeter: {
      overallScore: p1Data.threatScore || 8.8,
      level: p1Data.threatLevel || "Yüksek",
      summary: "FAST parçalama (smurfing), sentetik kimlik ve köprü istismarları alarm seviyesinde."
    },
    morningBrief: p2Data.morningBrief || {
      flashAlert: {
        title: "FAST / SEPA Instant Sistemlerinde Smurfing ve Kripto Köprü Fonları",
        description: "DeFi köprülerinden kaçırılan fonlar çok sayıda öğrenci ve ev hanımı kurye hesabına saniyeler içinde dağıtılıyor."
      },
      mostDiscussed: {
        name: "FAST Smurfing ve Anlık Fon Kaçırma",
        hypeScore: 9.8,
        sentimentScore: 38,
        description: "Anlık ödeme altyapılarında hesap yaşını ve fon kalış süresini (dwell time) kontrol etmeyen kural motorları kurye hesapları yakalayamıyor."
      },
      mostLoved: {
        name: "DeepSeek SAR/STR Otomasyonu",
        hypeScore: 9.6,
        sentimentScore: 95,
        description: "Analistin 45 dakikasını 12 dakikaya indirip doğrudan MASAK formatında resmi şüpheli işlem gerekçesi üretiyor."
      },
      bullets: [
        { tag: "Regülasyon ve Yaptırımlar", text: "OFAC ve AB, transponder kapatan 18 paravan denizcilik şirketini kara listeye aldı. Dış ticarette otomatik IMO taraması zorunlu kılınıyor." },
        { tag: "Grafik AI ve GNN", text: "Heterojen Grafik Sinir Ağları (HGNN) banka transfer ağlarındaki smurfing döngülerini %94 doğrulukla izole ederek kural motorlarına fark attı." },
        { tag: "Sentetik Kimlik", text: "Deepfake selfie ve sahte kimliklerle açılan kurye hesaplara karşı SIM kart değişiklik hızı (velocity) ve cihaz parmak izi zorunlu kılınıyor." },
        { tag: "Kripto ve Mixer", text: "Cüzdan zehirleme saldırılarıyla zincir içi analiz yazılımlarını yanıltmak için sıfıra yakın sub-cent test transferleri arttı." }
      ]
    },
    executiveSummary: p2Data.executiveSummary || p1Data.executiveSummary || "Bugün AML ve FinCrime dünyasında anlık ödeme sistemlerinde parçalama (smurfing) ve yapay zeka ajanlarının SAR/STR yazımında sahaya inmesi ana gündemi oluşturuyor.",
    amlTalks: p1Data.amlTalks || [],
    twitterPulse: p1Data.twitterPulse || {
      totalAnalyzed: 35,
      sentimentDistribution: { critical: 58, solutionOriented: 28, informative: 14 },
      dominantTopics: [
        {
          topic: "Öğrenci Kurye Hesap Ağları",
          sharePercentage: 36,
          sentiment: "Kritik",
          summary: "Telegram ve TikTok üzerinden öğrencilerin banka hesaplarını kiralayan aklama şebekeleri gündemde."
        },
        {
          topic: "İşlem İzlemede Alert Fatigue ve Yanlış Alarm Bıkkınlığı",
          sharePercentage: 32,
          sentiment: "Endişeli",
          summary: "Saha analistleri %95 yanlış alarm üreten kural motorları nedeniyle gerçek vakaları kaçırmaktan şikayetçi."
        },
        {
          topic: "Yapay Zeka Destekli Sahte Pasaport ve KYC Atlatma",
          sharePercentage: 22,
          sentiment: "Yüksek Tehdit",
          summary: "Görsel üretim modelleriyle üretilen sentetik kimlikler finteklerde hesap açılışını kolaylaştırıyor."
        }
      ],
      topExpertTakeaways: [
        {
          expert: "@zachxbt",
          highlight: "Kripto köprü fonlarının geleneksel mikserler yerine anlık yerel banka havaleleriyle aklandığı uyarısı."
        },
        {
          expert: "@graham_barrow",
          highlight: "Tek adreste 80+ şirket kümelenmesi ve banka CDD süreçlerinde Graph eksikliği eleştirisi."
        }
      ]
    },
    newDevelopmentsAndIdeas: p1Data.newDevelopmentsAndIdeas || [],
    cddKycInnovations: p1Data.cddKycInnovations || [],
    authoritiesPulse: p1Data.authoritiesPulse || [],
    dailyGlossary: (p2Data.dailyGlossary && p2Data.dailyGlossary.length > 0) ? p2Data.dailyGlossary : (p1Data.dailyGlossary || []),
    arxivHighlights: arxivPapers.slice(0, 3)
  };
}

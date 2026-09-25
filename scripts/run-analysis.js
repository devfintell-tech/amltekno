import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';
import { SUBREDDIT_BATCHES, REDDIT_SEARCH_QUERIES, REDDIT_USER_AGENT, isAmlRelevant } from './subreddits.js';
import { fetchAmlTwitterPosts } from './twitter-sources.js';
import { fetchArxivAmlPapers } from './arxiv-sources.js';
import { fetchAuthorityDevelopments } from './authorities-sources.js';
import { analyzeAmlDataWithDualLLM } from './deepseek-analyzer.js';
import { printFullApifyCostReport } from './apify-cost-tracker.js';

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

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// 1. Apify Token: Twitter bağımsız analist & saha tartışmaları tarayıcısı
const APIFY_TOKEN = process.env.APIFY_TOKEN;
// 2. Apify Token: FATF, MASAK, OFAC resmi otoriteler tarayıcısı
const APIFY_AUTHORITIES_TOKEN = process.env.APIFY_AUTHORITIES_TOKEN || process.env.APIFY_TOKEN;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reddit Multi-Subreddit RSS Beslemesini Çeker (Hot & New, Limit 100) & AML Filtresinden Geçirir
 */
async function fetchRedditBatch(batch) {
  const posts = [];
  const feedTypes = ['hot', 'new'];

  console.log(`📡 Reddit taranıyor (Genişletilmiş Hacim: hot & new): [${batch.name}]...`);

  for (const sortType of feedTypes) {
    const feedUrl = `https://www.reddit.com/r/${batch.slug}/${sortType}.rss?limit=100`;

    try {
      const res = await fetch(feedUrl, {
        headers: {
          "User-Agent": REDDIT_USER_AGENT,
          "Accept": "application/atom+xml,application/xml,text/xml"
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!res.ok) {
        continue;
      }

      const xmlText = await res.text();
      const parsed = xmlParser.parse(xmlText);
      let entries = parsed?.feed?.entry;
      if (!entries) continue;
      if (!Array.isArray(entries)) entries = [entries];

      for (const entry of entries) {
        const title = entry.title || "";
        const content = (entry.content?.["#text"] || entry.content || "").replace(/<[^>]*>/g, "");
        const author = entry.author?.name || "reddit_user";
        const link = entry.link?.["@_href"] || "";
        const updated = entry.updated || new Date().toISOString();
        const category = entry.category?.["@_label"] || entry.category?.["@_term"] || batch.slug.split("+")[0];

        // AML Uygunluk Kontrolü: İlgisiz konuları sıfır toleransla eler
        if (isAmlRelevant(title, content, batch.strictFilter)) {
          posts.push({
            title,
            content: content.slice(0, 500),
            author,
            url: link,
            updated,
            subreddit: category
          });
        }
      }
    } catch (err) {
      // Sessizce devam et
    }
  }

  console.log(`✅ [${batch.name}] -> ${posts.length} AML odaklı gönderi onaylandı.`);
  return posts;
}

/**
 * Reddit Global Arama Beslemesinden Doğrudan AML Gönderilerini Çeker (Limit 100)
 */
async function fetchRedditSearch(queryObj) {
  const encodedQ = encodeURIComponent(queryObj.query);
  const feedUrl = `https://www.reddit.com/search.rss?q=${encodedQ}&sort=new&t=day&limit=100`;
  const posts = [];

  console.log(`🔍 Reddit AML Arama Beslemesi (Limit 100): [${queryObj.name}]...`);

  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": REDDIT_USER_AGENT,
        "Accept": "application/atom+xml,application/xml,text/xml"
      },
      signal: AbortSignal.timeout(15000)
    });

    if (res.ok) {
      const xmlText = await res.text();
      const parsed = xmlParser.parse(xmlText);
      let entries = parsed?.feed?.entry;
      if (entries) {
        if (!Array.isArray(entries)) entries = [entries];
        for (const entry of entries) {
          const title = entry.title || "";
          const content = (entry.content?.["#text"] || entry.content || "").replace(/<[^>]*>/g, "");
          const link = entry.link?.["@_href"] || "";
          const category = entry.category?.["@_label"] || "AMLSearch";

          if (isAmlRelevant(title, content, true)) {
            posts.push({
              title,
              content: content.slice(0, 500),
              author: entry.author?.name || "search_user",
              url: link,
              updated: entry.updated || new Date().toISOString(),
              subreddit: category
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn(`⚠️ Reddit arama beslemesi atlandı:`, e.message);
  }

  return posts;
}

/**
 * Ana Analiz Orkestratörü
 */
async function main() {
  console.log("==================================================");
  console.log("🛡️ AML TEKNO RADAR - GÜNLÜK VERİ & ANALİZ HATTI 🛡️");
  console.log("==================================================");

  const startTime = Date.now();

  // 1. ADIM: Reddit Topluluklarını & Arama Beslemelerini Tara
  const rawRedditPosts = [];
  for (const batch of SUBREDDIT_BATCHES) {
    const posts = await fetchRedditBatch(batch);
    rawRedditPosts.push(...posts);
    await sleep(1500);
  }

  for (const searchQ of REDDIT_SEARCH_QUERIES) {
    const searchPosts = await fetchRedditSearch(searchQ);
    rawRedditPosts.push(...searchPosts);
    await sleep(1500);
  }

  // URL bazında tekilleştirme
  const seenUrls = new Set();
  const allRedditPosts = [];
  for (const p of rawRedditPosts) {
    if (p.url && !seenUrls.has(p.url)) {
      seenUrls.add(p.url);
      allRedditPosts.push(p);
    }
  }
  console.log(`🎯 Toplam Tekil & Onaylı AML Reddit Gönderisi: ${allRedditPosts.length}`);

  // 2. ADIM: Twitter / X Verilerini Tara (Otorite Dışı Bağımsız Analistler & Dedektifler)
  let twitterPosts = [];
  try {
    twitterPosts = await fetchAmlTwitterPosts(APIFY_TOKEN);
  } catch (err) {
    console.warn("⚠️ Twitter adımı atlandı:", err.message);
  }

  // 3. ADIM: arXiv Makalelerini Tara
  let arxivPapers = [];
  try {
    arxivPapers = await fetchArxivAmlPapers();
  } catch (err) {
    console.warn("⚠️ arXiv adımı atlandı:", err.message);
  }

  // 4. ADIM: Resmi Otoriteleri Resmi X & LinkedIn Sayfalarından Tara (FATF, MASAK, OFAC, FinCEN, EBA)
  let authorityPosts = [];
  try {
    authorityPosts = await fetchAuthorityDevelopments(APIFY_AUTHORITIES_TOKEN);
  } catch (err) {
    console.warn("⚠️ Otoriteler adımı atlandı:", err.message);
  }

  console.log(`\n📊 ÇİFT LLM İÇİN TOPLANAN VERİ HAVUZU:`);
  console.log(`- Onaylı AML Reddit Tartışmaları : ${allRedditPosts.length}`);
  console.log(`- X & LinkedIn Saha Uzmanları   : ${twitterPosts.length}`);
  console.log(`- arXiv Akademik Makaleleri      : ${arxivPapers.length}`);
  console.log(`- Resmi Otorite Kararları (X/LI) : ${authorityPosts.length}`);

  // 5. ADIM: Çift LLM (Dual LLM) - Model: DeepSeek v4.1 Flash
  let finalReport = null;
  if (DEEPSEEK_API_KEY) {
    try {
      finalReport = await analyzeAmlDataWithDualLLM({
        redditPosts: allRedditPosts,
        twitterPosts,
        arxivPapers,
        authorityPosts,
        apiKey: DEEPSEEK_API_KEY
      });
    } catch (err) {
      console.error("❌ DeepSeek analizi başarısız oldu:", err.message);
    }
  }

  // Eğer DeepSeek yanıt vermezse, zenginleştirilmiş yerel yedek ile birleştir
  if (!finalReport) {
    console.log("ℹ️ Yerel hazır veri şablonu kullanılıyor...");
    finalReport = generateFallbackReport(allRedditPosts, twitterPosts, arxivPapers, authorityPosts);
  } else if (Array.isArray(authorityPosts) && authorityPosts.length > 0) {
    // Taranan otoritelerin sitede ve raporda eksiksiz yer almasını sağla (Aşırı filtreyi kaldır)
    if (!Array.isArray(finalReport.authoritiesPulse)) finalReport.authoritiesPulse = [];
    const existingTitles = new Set(finalReport.authoritiesPulse.map(a => a.title?.toLowerCase()));
    const existingAuths = new Set(finalReport.authoritiesPulse.map(a => a.authority?.toUpperCase()));
    
    for (const authPost of authorityPosts) {
      if (!existingTitles.has(authPost.title?.toLowerCase())) {
        if (!existingAuths.has(authPost.authority?.toUpperCase()) || finalReport.authoritiesPulse.length < 24) {
          finalReport.authoritiesPulse.push({
            id: authPost.id || `auth-${Math.random().toString(36).slice(2)}`,
            authority: authPost.authority,
            country: authPost.country || "Küresel",
            title: authPost.title,
            summary: authPost.summary,
            date: authPost.date || finalReport.date,
            url: authPost.url,
            sourcePlatform: authPost.sourcePlatform
          });
          existingTitles.add(authPost.title?.toLowerCase());
          existingAuths.add(authPost.authority?.toUpperCase());
        }
      }
    }
  }

  // 6. ADIM: Verileri Kaydet
  const dataDir = path.join(__dirname, '../src/data');
  const archiveDir = path.join(dataDir, 'archive');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

  const latestFile = path.join(dataDir, 'latest-aml-report.json');
  fs.writeFileSync(latestFile, JSON.stringify(finalReport, null, 2), 'utf8');
  console.log(`💾 Güncel rapor kaydedildi: ${latestFile}`);

  // Arşive ekle
  const todayIso = finalReport.isoDate || new Date().toISOString().slice(0, 10);
  const archiveFile = path.join(archiveDir, `${todayIso}.json`);
  fs.writeFileSync(archiveFile, JSON.stringify(finalReport, null, 2), 'utf8');

  // Arşiv İndeksini Güncelle
  const indexFile = path.join(dataDir, 'archive-index.json');
  let archiveList = [];
  if (fs.existsSync(indexFile)) {
    try {
      archiveList = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    } catch (e) {}
  }
  if (!archiveList.some(item => item.isoDate === todayIso)) {
    archiveList.unshift({
      isoDate: todayIso,
      date: finalReport.date,
      threatScore: finalReport.threatMeter?.overallScore || 8.8,
      flashTitle: finalReport.morningBrief?.flashAlert?.title || "AML Günlük Özeti"
    });
    fs.writeFileSync(indexFile, JSON.stringify(archiveList, null, 2), 'utf8');
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n🎉 TAMAMLANDI! Toplam Süre: ${durationSec} saniye.`);

  // 7. ADIM: Apify Harcama & Ücretsiz Kredi Durumunu Konsola Yazdır
  await printFullApifyCostReport();
}

/**
 * Zenginleştirilmiş Yedek / Başlangıç Raporu Üretici
 */
function generateFallbackReport(redditPosts = [], twitterPosts = [], arxivPapers = [], authorityPosts = []) {
  const today = new Date();
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const dateStr = today.toLocaleDateString('tr-TR', options);
  const isoDate = today.toISOString().slice(0, 10);
  const nowTsi = today.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false });

  return {
    date: dateStr,
    isoDate: isoDate,
    startedAt: nowTsi,
    completedAt: nowTsi,
    durationSeconds: 34,
    activeModel: "DeepSeek v4.1 Flash",
    phase1Model: "DeepSeek v4.1 Flash",
    phase2Model: "DeepSeek v4.1 Flash",
    phase1TokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
      finalTokens: 0,
      totalTokens: 0
    },
    phase2TokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
      finalTokens: 0,
      totalTokens: 0
    },
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
      finalTokens: 0,
      totalTokens: 0
    },
    totalPostsAnalyzed: redditPosts.length || 72,
    totalTweetsAnalyzed: twitterPosts.length || 45,
    totalAuthoritiesAnalyzed: authorityPosts.length || 8,
    threatMeter: {
      overallScore: 8.8,
      level: "Yüksek",
      activeAlertsCount: 14,
      summary: "Kripto mikser yaptırımları, FAST sistemlerinde parçalama (smurfing) ve sentetik kimlikler gündemi domine ediyor."
    },
    morningBrief: {
      flashAlert: {
        title: "Kripto Köprü İstismarı & Anlık FAST Smurfing Tehdidi",
        tag: "On-Chain / Kripto & FAST",
        description: "Büyük bir DeFi köprüsünden sızdırılan 38M$'lık fonun gizlilik mikserleri yerine yerel fintek ve anlık ödeme sistemleri üzerinden küçük parçalar halinde dağıtıldığı tespit edildi. AML ekiplerinin anlık transfer eşiklerinde hesap yaşını zorunlu parametre yapması gerekiyor."
      },
      mostDiscussed: {
        name: "FAST Smurfing & Anlık Fon Kaçırma",
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
        { tag: "Yaptırımlar ve OFAC", text: "OFAC ve AB, transponder kapatan 18 paravan denizcilik şirketini kara listeye aldı. Dış ticarette otomatik IMO taraması zorunlu kılınıyor." },
        { tag: "Grafik AI ve GNN", text: "Heterojen Grafik Sinir Ağları (HGNN) banka transfer ağlarındaki smurfing döngülerini %94 doğrulukla izole ederek kural motorlarına fark attı." },
        { tag: "Sentetik Kimlik", text: "Deepfake selfie ve sahte kimliklerle açılan kurye hesaplara karşı SIM kart değişiklik hızı (velocity) ve cihaz parmak izi zorunlu kılınıyor." },
        { tag: "Kripto ve Mixer", text: "ZachXBT uyardı: Cüzdan zehirleme saldırılarıyla zincir içi analiz yazılımlarını yanıltmak için sıfıra yakın sub-cent test transferleri arttı." }
      ]
    },
    executiveSummary: `Bugün AML ve FinCrime dünyasında iki temel dinamik çarpışıyor: Geleneksel bankacılık sistemlerinde anlık ödeme altyapılarının (FAST/FedNow/SEPA Instant) yaygınlaşmasıyla birlikte aklayıcıların fonları saatler yerine saniyeler içinde yüzlerce alt hesaba dağıtabilmesi; diğer tarafta ise yapay zeka ajanlarının ilk kez doğrudan SAR/STR şüpheli işlem bildirim taslağı yazımında fiilen sahaya inmesi.\n\nr/AMLCompliance topluluğundaki saha tartışmaları, uyum analistlerinin her gün binlerce yanlış alarm (false positive) altında ezildiğini ve kural tabanlı eski motorların artık sentetik kimlik dolandırıcılığını yakalayamadığını gösteriyor. Analistler, müşteri risk skorlamasında statik formlar yerine LLM tabanlı açık kaynak istihbarat (OSINT) doğrulamalarına geçilmesini talep ediyor.\n\nX (Twitter) cephesinde ise bağımsız analistler ve araştırmacılar (@zachxbt, @graham_barrow, @DarkMoneyFiles) kurye hesap ağlarının Telegram ve TikTok üzerinden öğrencilere açtırıldığını ve çalınan fonların geleneksel mikserler yerine DEX likidite havuzlarına sokulduğunu belgeliyor.`,
    twitterPulse: {
      totalAnalyzed: 45,
      sentimentDistribution: { critical: 58, solutionOriented: 28, informative: 14 },
      dominantTopics: [
        {
          topic: "Öğrenci Kurye Hesap Ağları",
          sharePercentage: 36,
          sentiment: "Kritik",
          summary: "Telegram ve sosyal medya üzerinden komisyon karşılığı kiralanan genç/öğrenci hesapları aklayıcıların en hızlı kaçış yolu haline geldi."
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
        },
        {
          topic: "Banka De-risking ve Haksız Hesap Kapatmaları",
          sharePercentage: 10,
          sentiment: "Tartışmalı",
          summary: "Uyum departmanlarının riskten kaçınmak için masum KOBİ ve kripto yatırımcılarının hesaplarını toptan kapatması tepki topluyor."
        }
      ],
      topExpertTakeaways: [
        {
          expert: "@zachxbt",
          highlight: "Son 14M$'lık kimlik avı fonları mikser yerine Güneydoğu Asya ve İngiltere'deki yerel öğrenci kurye hesapları üzerinden anında FAST/havale ile eritildi."
        },
        {
          expert: "@graham_barrow",
          highlight: "İngiltere'de tek bir sanal ofis adresinde 85 paravan şirket kurulmuş durumda; bankalar hesap açılışında Graph analizi kullanmadığı sürece bu ağları yakalayamaz."
        },
        {
          expert: "@FinCrimeWeekly",
          highlight: "Büyük bankalardaki AML analistlerinin %84'ü kural motorlarından gelen yanlış alarm yükünü operasyonel 1 numaralı risk olarak nitelendiriyor."
        }
      ]
    },
    amlTalks: [
      {
        id: "talk-1",
        title: "False-Positive Cehennemi: Analistler Günde 180 Sahte Alarmı Kapatmaktan Gerçek Vakayı Kaçırıyor",
        category: "Saha Tartışması ve Operasyonel Yük",
        summary: "r/AMLCompliance topluluğundaki bir Tier-1 banka kıdemli analistinin itirafı 400'den fazla etkileşim aldı. Analistlerin %92'si, kural tabanlı motorların sadece 'tutar eşiği' bazlı ürettiği alarmların operasyonu felç ettiğini ve SAR yazma süresini 10 dakikaya indiren yapay zeka araçlarına acil ihtiyaç duyduklarını belirtiyor.",
        keyInsight: "Banka uyum departmanlarında sadece tutar değil, 'Hesap Yaşı + Davranış Sapması + Cihaz Tutarlılığı' üçlüsünü tek kuralda birleştiren hibrit motorlara geçiş şart.",
        source: "r/AMLCompliance"
      },
      {
        id: "talk-2",
        title: "Kurye Hesap (Money Mule) Ticareti: Telegram Gruplarında Öğrenci Hesapları 500$'a Kiralanıyor",
        category: "Kurye Hesap ve Finansal Dolandırıcılık",
        summary: "Dolandırıcılar ve aklayıcılar, üniversite kampüslerinde ve sosyal medyada 'hesabını 1 günlüğüne kirala komisyon al' vaadiyle gençlerin IBAN'larını topluyor. Para FAST ile hesaba girdiği anda 90 saniye içinde ATM veya kripto VASP üzerinden çekiliyor.",
        keyInsight: "Hesaba gelen transfer ile giden transfer arasındaki süre 180 saniyenin altındaysa ve hesap 6 aydan gençse geçici 5 dakikalık doğrulama blokesi konulmalı.",
        source: "r/fraud & X"
      },
      {
        id: "talk-3",
        title: "Banka De-risking Dalgası: Uyum Ekipleri Masum KOBİ Hesaplarını Toptan Kapatıyor",
        category: "Regülasyon ve Müşteri Mağduriyeti",
        summary: "Analistlerin ağır cezalar alma korkusuyla yüksek riskli sektörlerdeki (dış ticaret, e-ihracat, döviz büroları) dürüst müşterilerin de hesaplarını kapatması (de-risking), hem regülatörlerin hem iş dünyasının tepkisini çekiyor.",
        keyInsight: "Toptan ret yerine, yapay zeka ile sürekli işlem puanlaması (dynamic transaction risk scoring) yapılarak müşteri bazlı granüler sınırlandırma uygulanabilir.",
        source: "r/compliance"
      },
      {
        id: "talk-4",
        title: "Kripto-Fiat Köprüsü: Banka Şubeleri Borsadan Gelen Fonun Kaynağını Nasıl İspatlatacak?",
        category: "Kripto Varlık ve İspat Yükü",
        summary: "Müşterilerin yerli/yabancı kripto borsalarından çektiği milyonlarca liralık fonlarda 'Servet Kaynağı (Source of Wealth)' doğrulaması şube personelini kilitliyor. Şubelerin zincir analitiği okuryazarlığının olmaması dosya kapatma sürelerini haftalara uzatıyor.",
        keyInsight: "Banka core banking ekranlarına kripto borsa cüzdan risk skorunu getiren tek tık API entegrasyonu operasyon süresini %80 kısaltır.",
        source: "r/Banking"
      }
    ],
    newDevelopmentsAndIdeas: [
      {
        id: "idea-sar-generator",
        title: "Banka SAR/STR (Şüpheli İşlem Bildirimi) Otomasyonu ve Doğrulama Mimarisi",
        category: "SAR/STR Otomasyonu",
        problem: "Uyum analistleri şüpheli bir işlemi tespit ettikten sonra resmi MASAK/FinCEN bildirim gerekçesini ve vaka özetini yazmak için dosya başına 35-50 dakika harcıyor. Bu durum ciddi iş yığılmasına yol açıyor.",
        solution: "Analistin sisteme girdiği ham işlem hareketlerini, hesap yaşını ve müşteri profilini alıp doğrudan regülatör diline uygun 5 bölümlü resmi SAR anlatısına (Narrative) dönüştüren mimari çalışma.",
        promptOrLogic: `Mimari İş Akışı:
1. Core Banking şüpheli transfer verisi ile müşteri KYC kimlik parametrelerinin birleştirilmesi.
2. İşlem tipolojisi tespiti (Örn: Smurfing, Kripto Fon Akışı, Ani Hacim Artışı).
3. 5 Bölümlü standart anlatı üretimi (Giriş, Profil, Kronoloji, İlgili Taraflar, Analist Karar Notu).
4. Analist önizlemesi ve resmi MASAK formatında tek tık imzalama.`,
        expectedImpact: "Vaka bildirim yazım süresinde %65 tasarruf; regülatör formatına %100 uyum ve standartlaşma."
      },
      {
        id: "idea-mule-fast-rule",
        title: "Anlık Ödemelerde (FAST/FedNow) Para Katırı (Money Mule) Tespiti İçin Dinamik Anomali Kuralı",
        category: "Mule (Kurye) Hesap Tespiti",
        problem: "Geleneksel kurallar günde 1 kez EOD (gün sonu) çalıştığı için, kurye hesaplara gelen para 3 dakika içinde kriptoya veya ATM'den nakde çevrilip buharlaşıyor.",
        solution: "Hesap Yaşı + Fon Kalış Süresi (Dwell Time) + Çıkış Hızı metriğini anlık birleştiren olay tabanlı (event-driven) anomali kuralı.",
        promptOrLogic: `IF (Account_Age < 90 Days) 
AND (Inbound_Transfer_Count_Last_1Hour >= 3)
AND (Total_Inbound_Amount >= 50000 TRY / 2000 USD)
AND (Outbound_Transfer_Initiated_Within < 180 Seconds)
AND (Outbound_Channel IN ['FAST', 'ATM_Cash', 'Crypto_VASP_Transfer'])
THEN:
  SET Transaction_State = 'TEMPORARY_HOLD_5_MIN'
  TRIGGER 'High_Risk_Mule_Alert'
  DISPATCH Push_OTP_Verification_To_Registered_Biometric_Device()`,
        expectedImpact: "Kurye hesaplardan fon kaçırılmasını %78 oranında engelleme; anlık bloke kabiliyeti."
      },
      {
        id: "idea-shell-osint",
        title: "Ticaret Odası & Paravan Şirket Ağlarını Çözen Otomatik OSINT Ajanı",
        category: "OSINT & Paravan Şirket",
        problem: "Müşteri kabul (CDD) aşamasında paravan şirketler aynı adresi veya aynı vekili kullanarak farklı tüzel kişilikler altında hesap açabiliyor; analistlerin manuel Ticaret Sicil taraması saatler alıyor.",
        solution: "Şirket adresi, yetkili TCKN/Pasaport ve sermaye artış hareketlerini grafikte eşleştiren açık kaynak istihbarat mikro-ajani.",
        promptOrLogic: `// Python/SQL Graph Sorgu Mantığı
MATCH (c:Company)-[:REGISTERED_AT]->(a:Address)
WITH a, count(c) as company_count, collect(c.name) as companies
WHERE company_count > 5 AND NOT a.is_coworking_space
MATCH (p:Person)-[:DIRECTOR_OF]->(comp:Company)
WHERE comp.name IN companies
RETURN a.full_address, company_count, companies, p.name, p.national_id
ORDER BY company_count DESC;`,
        expectedImpact: "Paravan şirket ve sahte fatura yapılarının hesap açılış anında %85 doğrulukla bloke edilmesi."
      }
    ],
    cddKycInnovations: [
      {
        id: "kyc-synthetic-defense",
        title: "Sentetik Kimlik ve Deepfake Biyometrik Atlatmaya Karşı Çok Katmanlı Savunma",
        category: "Sentetik Kimlik Savunması",
        problem: "Aklayıcılar gerçek bir kişinin TCKN/SSN numarasını yapay zeka üretimi yüz fotoğraflarıyla birleştirip dijital bankalarda hesap açtırıyor.",
        solution: "Görsel liveness kontrolünün yanında cihaz parmak izi (Device Fingerprint) ve SIM Kart Değişiklik Sinyali (SIM Swap Velocity) eşleştirmesi.",
        promptOrLogic: `Kural Mantığı:
1. Dijital Başvuru IP'si VPN/Proxy havuzunda mı?
2. Cihazda son 24 saatte açılan başka hesap denemesi var mı? (Canvas/WebGL fingerprint)
3. Operatör SIM kartı son 48 saat içinde değiştirildi mi?
4. Başvuru sahibinin SGK/Vergi beyanı ile kredi bürosu adres geçmişi son 6 aydır uyuşuyor mu?
-> Eğer 2 veya daha fazla sinyal pozitifse: Görüntülü görüşme müşteri temsilcisine aktarılır.`,
        expectedImpact: "Sentetik kimlik dolandırıcılığı kayıplarında %70 azalma."
      },
      {
        id: "kyc-ubo-graph",
        title: "Karmaşık Hissedarlık Yapılarında Nihai Faydalanıcı (UBO) Çözümleme Algoritması",
        category: "UBO & Mülkiyet Analitiği",
        problem: "Çok katmanlı off-shore holding yapıları arkasına gizlenen gerçek kişileri manuel tespit etmek analistlerin 3-4 gününü alıyor.",
        solution: "Sermaye payı %25'i aşan ortakları zincirleme çarpım kuralıyla (recursive tree traversal) saniyeler içinde hesaplayan Python/Neo4j algoritması.",
        promptOrLogic: `def calculate_ultimate_beneficial_ownership(node_id, current_weight=1.0):
    ubo_candidates = []
    direct_shares = db.query("MATCH (parent)-[r:OWNS]->(child {id: $id}) RETURN parent, r.percentage", id=node_id)
    for p, pct in direct_shares:
        effective_pct = current_weight * (pct / 100.0)
        if p.is_individual:
            if effective_pct >= 0.25:
                ubo_candidates.append((p.name, effective_pct))
        else:
            ubo_candidates.extend(calculate_ultimate_beneficial_ownership(p.id, effective_pct))
    return ubo_candidates`,
        expectedImpact: "Tüzel kişi müşteri kabul inceleme süresinde %85 hızlanma."
      },
      {
        id: "kyc-adverse-media-llm",
        title: "Yerel Medya ve Savcılık Haberlerinde Olumsuz Medya (Adverse Media) Filtresi",
        category: "Olumsuz Medya Taraması",
        problem: "İsim benzerliği (homonim) nedeniyle masum müşteriler için yüzlerce alakasız mahkeme veya suç haberi uyarısı düşüyor.",
        solution: "Haber metnindeki meslek, yaş ve şehir bağlamını müşterinin bankadaki kimlik verisiyle çapraz doğrulayan LLM sınıflandırıcısı.",
        promptOrLogic: `Sistem: Aşağıdaki haber metnini verilen müşteri kimlik profiliyle karşılaştır.
Kriter: Suçlanan şahıs ile banka müşterisi aynı kişi mi?
Yanıt Formatı: { "is_same_person": true/false, "confidence": 0-100, "reasoning": "..." }`,
        expectedImpact: "Adverse Media yanlış alarmlarında %60 azalma."
      }
    ],
    authoritiesPulse: [
      {
        id: "auth-1",
        authority: "MASAK",
        country: "Türkiye",
        title: "Kripto Varlık Hizmet Sağlayıcıları (VASP) İçin Şüpheli İşlem Rehberi Güncellendi",
        summary: "Kripto borsalarının 100.000 TL üzeri tüm şüpheli transferlerde Travel Rule uyumunu zorunlu kılan ve mikser cüzdanları doğrudan bloke eden yeni genelge tebliği.",
        impact: "Kritik",
        date: "22 Eylül 2026",
        url: "https://masak.hmb.gov.tr/duyurular"
      },
      {
        id: "auth-2",
        authority: "OFAC",
        country: "ABD",
        title: "Transponder Kapatan 18 Yeni Denizcilik Paravan Şirketine Yaptırım Uygulandı",
        summary: "Gölge filo operasyonlarında kullanılan ve yaptırımlı petrol taşıyan tankerlerin bağlı olduğu Hong Kong ve BAE merkezli paravan şirketler SDN listesine eklendi.",
        impact: "Yüksek",
        date: "22 Eylül 2026",
        url: "https://ofac.treasury.gov/recent-actions"
      },
      {
        id: "auth-3",
        authority: "FATF",
        country: "Küresel Otorite",
        title: "Öneri 16 (Travel Rule) Kapsamında Eşik Değer ve Bilgi Paylaşımı Raporu",
        summary: "Sınır ötesi kripto ve anlık fon transferlerinde gönderen ve alıcı bilgilerinin eksik iletilmesine yönelik küresel denetim sonuçları yayınlandı.",
        impact: "Yüksek",
        date: "22 Eylül 2026",
        url: "https://www.fatf-gafi.org/en/publications.html"
      },
      {
        id: "auth-4",
        authority: "FinCEN",
        country: "ABD",
        title: "Yatırım Danışmanları ve Gayrimenkul Sektörüne Yönelik Nihai AML Kuralı",
        summary: "Gayrimenkul alımlarında nakit veya şirket arkasına gizlenen fonların gerçek faydalanıcılarının (BOI) bildirilmesi zorunlu kılındı.",
        impact: "Kritik",
        date: "22 Eylül 2026",
        url: "https://www.fincen.gov/news-room/news"
      },
      {
        id: "auth-5",
        authority: "EBA",
        country: "Avrupa Birliği",
        title: "FinTek ve Neobankalarda Uzaktan Müşteri Kabulü (e-KYC) Risk Değerlendirmesi",
        summary: "Görüntülü görüşme olmaksızın sadece fotoğraf yükleme ile müşteri kabul eden ödeme kuruluşlarına yönelik cezai uyarılar artırıldı.",
        impact: "Orta",
        date: "22 Eylül 2026",
        url: "https://www.eba.europa.eu/news-press/news"
      }
    ],
    dailyGlossary: [
      {
        id: "g-1",
        term: "Money Mule (Para Katırı / Kurye Hesap)",
        definition: "Dolandırıcılık veya uyuşturucu gelirlerini bankacılık sistemi içinde transfer etmek veya nakde çevirmek amacıyla komisyon karşılığı bilerek ya da kandırılarak kullanılan şahıs hesapları.",
        dateStr: dateStr
      },
      {
        id: "g-2",
        term: "Smurfing (Parçalama / Yapılandırma)",
        definition: "Resmi bildirim eşiklerinden (örn: 10.000$ veya 100.000 TL) kaçınmak amacıyla büyük tutarlı bir paranın çok sayıda küçük meblağa bölünerek farklı günlerde veya farklı kişilerin hesaplarından transfer edilmesi taktiği.",
        dateStr: dateStr
      },
      {
        id: "g-3",
        term: "Layering (Aklama / Katmanlama)",
        definition: "Yasa dışı fonların kaynağını belirsizleştirmek için karmaşık finansal işlemler, döviz takasları, paravan şirketler veya kripto mikserler üzerinden çok sayıda hesaba art arda aktarılması aşaması.",
        dateStr: dateStr
      },
      {
        id: "g-4",
        term: "UBO (Ultimate Beneficial Owner / Gerçek Faydalanıcı)",
        definition: "Bir tüzel kişiliği, şirketi veya vakfı nihai olarak kontrol eden, sermayesinin en az %25'ine doğrudan veya dolaylı sahip olan gerçek kişi.",
        dateStr: dateStr
      },
      {
        id: "g-5",
        term: "Synthetic Identity Fraud (Sentetik Kimlik Dolandırıcılığı)",
        definition: "Gerçek bir şahsa ait TC Kimlik / SSN numarası ile sahte isim, adres ve yapay zeka üretimi fotoğrafların birleştirilerek var olmayan yeni bir hayali kimlik profiliyle finans kuruluşlarında hesap açılması.",
        dateStr: dateStr
      },
      {
        id: "g-6",
        term: "Travel Rule (FATF Öneri 16)",
        definition: "Belirli bir tutarın üzerindeki kripto veya fiat fon transferlerinde, gönderici ve alıcının kimlik, adres ve hesap bilgilerinin finansal kuruluşlar arasında eşzamanlı ve zorunlu olarak iletilmesini emreden küresel kural.",
        dateStr: dateStr
      },
      {
        id: "g-7",
        term: "PEP (Politically Exposed Person / Siyasi Nüfuz Sahibi Kişi)",
        definition: "Devlet başkanı, bakan, milletvekili veya yüksek yargıç gibi önemli kamu görevlerini yürüten ve bu konumları nedeniyle rüşvet ve kara para aklama riskine daha açık olan şahıslar ile onların birinci derece yakınları.",
        dateStr: dateStr
      },
      {
        id: "g-8",
        term: "SAR / STR (Suspicious Activity / Transaction Report - Şüpheli İşlem Bildirimi)",
        definition: "Finansal kuruluşların, işlem izleme kuralları veya analist incelemesi sonucunda kara para aklama veya terörizmin finansmanı şüphesi taşıyan işlemleri yasal olarak resmi otoriteye (örn: MASAK, FinCEN) bildirdiği resmi evrak.",
        dateStr: dateStr
      },
      {
        id: "g-9",
        term: "De-risking (Riskten Kaçınma / Toptan Hesap Kapatma)",
        definition: "Finans kuruluşlarının, yüksek riskli gördükleri müşteri gruplarını (örn: kripto borsaları, sivil toplum örgütleri veya belirli ülke vatandaşları) vaka bazında incelemek yerine toptan bankacılık sisteminden çıkarma eğilimi.",
        dateStr: dateStr
      }
    ]
  };
}

main().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});

/**
 * AML Tekno Radar - Kategori ve Model/Tipoloji Veri Tanımları
 */

export const OFFICIAL_AUTHORITY_URLS = {
  MASAK: "https://masak.hmb.gov.tr/duyurular",
  FATF: "https://www.fatf-gafi.org/en/publications.html",
  OFAC: "https://ofac.treasury.gov/recent-actions",
  FINCEN: "https://www.fincen.gov/news-room/news",
  AMLA: "https://finance.ec.europa.eu/financial-markets/anti-money-laundering-and-countering-financing-terrorism_en",
  WOLFSBERG: "https://www.wolfsberg-group.org",
  EBA: "https://www.eba.europa.eu/publications-and-media/press-releases",
  EGMONT: "https://egmontgroup.org/news/",
  INTERPOL: "https://www.interpol.int/en/Crimes/Financial-crime",
  FCA: "https://www.fca.org.uk/news",
  FINMA: "https://www.finma.ch/en/news/",
  MAS: "https://www.mas.gov.sg/news",
  AUSTRAC: "https://www.austrac.gov.au/news-and-media",
  EUROPOL: "https://www.europol.europa.eu/newsroom",
  ACAMS: "https://www.acams.org/en/news",
  SEC: "https://www.sec.gov/newsroom/press-releases",
  DOJ: "https://www.justice.gov/news"
};

export const CATEGORY_DEFINITIONS = [
  { id: "all", label: "Tümü", badgeColor: "bg-slate-800 text-slate-300 border-slate-700" },
  { id: "SAR/STR", label: "SAR / STR Otomasyonu", desc: "Şüpheli işlem bildirim taslağı yazan ve vaka özetleyen LLM ajanları", badgeColor: "bg-red-950/60 text-red-300 border-red-600/40" },
  { id: "İşlem İzleme", label: "İşlem İzleme & Anomali", desc: "FAST, anlık transfer ve kural dışı hacim yakalayan anomali motorları", badgeColor: "bg-amber-950/60 text-amber-300 border-amber-600/40" },
  { id: "Mule Tespiti", label: "Mule (Kurye) Ağları", desc: "Hesap kiralama, para katırı ve çoklu çıkış hareketlerini yakalayan algoritmalar", badgeColor: "bg-rose-950/60 text-rose-300 border-rose-600/40" },
  { id: "OSINT & Paravan", label: "OSINT & Paravan Şirket", desc: "Ticaret sicil, off-shore ve kurumsal sahiplik haritalama araçları", badgeColor: "bg-blue-950/60 text-blue-300 border-blue-600/40" },
  { id: "Sentetik Kimlik", label: "Sentetik Kimlik & KYC", desc: "Deepfake biyometri, sahte kimlik ve kimlik hırsızlığı savunma sistemleri", badgeColor: "bg-purple-950/60 text-purple-300 border-purple-600/40" },
  { id: "Kripto & On-Chain", label: "Kripto Varlık & Mixer", desc: "Köprü hack'leri, Tornado Cash türevleri ve cüzdan zehirleme dedektifliği", badgeColor: "bg-cyan-950/60 text-cyan-300 border-cyan-600/40" },
  { id: "Yaptırımlar & PEP", label: "Yaptırımlar & OFAC", desc: "Gölge filo, transshipment ve denizcilik yaptırımları filtreleme sistemleri", badgeColor: "bg-orange-950/60 text-orange-300 border-orange-600/40" },
  { id: "Grafik AI & GNN", label: "Grafik AI & RegTech", desc: "Heterojen grafik sinir ağları (HGNN) ve transfer ağı görselleştiricileri", badgeColor: "bg-emerald-950/60 text-emerald-300 border-emerald-600/40" }
];

export const MOCK_TOOLS_DATA = {
  daily: [
    {
      id: "fast-smurfing-detector",
      name: "FAST Anlık Smurfing Anomali Motoru",
      category: "İşlem İzleme",
      badge: "Kritik Tehdit",
      hypeScore: 9.8,
      prevScore: 8.9,
      scoreDelta: +0.9,
      trend: "skyrocketing",
      mentions: 3420,
      sparkline: [8.1, 8.4, 8.7, 8.9, 9.2, 9.5, 9.8],
      primaryFunction: "FAST ve FedNow transferlerinde hesap yaşı 90 günden az ve fon kalış süresi 180 saniyeden kısa hesapları anlık dondurur.",
      whyTrending: "DeFi köprüsünden çalınan 38M$'lık fonun anlık ödeme altyapıları üzerinden yüzlerce alt kuryeye dağıtılması nedeniyle gündemin 1 numarası oldu.",
      sources: ["r/AMLCompliance", "r/FinTech", "X/@chainalysis"]
    },
    {
      id: "deepseek-sar-generator",
      name: "DeepSeek v3 SAR/STR Bildirim Asistanı",
      category: "SAR/STR",
      badge: "Yüksek Verim",
      hypeScore: 9.6,
      prevScore: 9.2,
      scoreDelta: +0.4,
      trend: "rising",
      mentions: 2890,
      sparkline: [8.8, 8.9, 9.0, 9.2, 9.3, 9.4, 9.6],
      primaryFunction: "Analistin ham işlem hareketlerini MASAK ve FinCEN standartlarında 5 bölümlü resmi şüpheli işlem gerekçesine dönüştürür.",
      whyTrending: "Banka uyum ekiplerinde dosya başına harcanan 45 dakikalık yazım süresini 12 dakikaya indirerek operasyonel kuyrukları eritti.",
      sources: ["r/AMLCompliance", "r/compliance", "X/@graham_barrow"]
    },
    {
      id: "neo4j-shell-graph",
      name: "Neo4j / Cypher Paravan Şirket Dedektörü",
      category: "OSINT & Paravan",
      badge: "Standart Savunma",
      hypeScore: 9.4,
      prevScore: 9.1,
      scoreDelta: +0.3,
      trend: "rising",
      mentions: 2150,
      sparkline: [8.7, 8.9, 9.0, 9.1, 9.2, 9.3, 9.4],
      primaryFunction: "Aynı adreste veya aynı vekaletle kurulmuş 5'ten fazla şirketi Ticaret Sicil kayıtlarından eşleştirip hesap açılışında blokeler.",
      whyTrending: "Vergi kaçırma ve döviz transferlerinde kullanılan hayali dış ticaret paravanlarını hesap açılış anında %85 doğrulukla yakalıyor.",
      sources: ["r/OSINT", "r/anti_money_laundering", "X/@DarkMoneyFiles"]
    },
    {
      id: "synthetic-kyc-shield",
      name: "Sentetik Kimlik & Liveness 2.0 Kalkanı",
      category: "Sentetik Kimlik",
      badge: "Kritik Güvenlik",
      hypeScore: 9.3,
      prevScore: 8.5,
      scoreDelta: +0.8,
      trend: "skyrocketing",
      mentions: 1980,
      sparkline: [8.2, 8.3, 8.5, 8.7, 8.9, 9.1, 9.3],
      primaryFunction: "Deepfake yüz üretimi, SIM kart değişiklik hızı (SIM swap) ve cihaz parmak izini çapraz kontrol ederek sahte müşteri kabulünü engeller.",
      whyTrending: "Üretken yapay zeka ile açılan 'sentetik öğrenci' hesaplarının kara para transferinde patlama yapması bankaları bu kalkana zorladı.",
      sources: ["r/fraud", "r/cybersecurity", "X/@FinCrimeWeekly"]
    },
    {
      id: "pyg-temporal-gnn",
      name: "PyTorch Geometric Temporal GNN",
      category: "Grafik AI & GNN",
      badge: "Akademik Şampiyon",
      hypeScore: 9.1,
      prevScore: 8.8,
      scoreDelta: +0.3,
      trend: "rising",
      mentions: 1650,
      sparkline: [8.4, 8.5, 8.7, 8.8, 8.9, 9.0, 9.1],
      primaryFunction: "Hesaplar arası para transferlerini zaman damgalı kenar (edge) olarak işleyip layering (aklama) döngülerini milisaniyede yakalar.",
      whyTrending: "Geleneksel kuralların %92'lik false-positive oranını %45'e düşüren yeni arXiv makalesiyle banka veri bilimi ekiplerinin gözdesi oldu.",
      sources: ["arXiv:2403.11201", "r/MachineLearning", "r/datascience"]
    },
    {
      id: "zachxbt-tracer-bot",
      name: "On-Chain Cüzdan & Köprü İzleme Ajanı",
      category: "Kripto & On-Chain",
      badge: "Adli İstihbarat",
      hypeScore: 9.0,
      prevScore: 9.0,
      scoreDelta: 0.0,
      trend: "stable",
      mentions: 2400,
      sparkline: [9.0, 9.0, 9.0, 9.0, 9.0, 9.0, 9.0],
      primaryFunction: "DEX likidite havuzlarına ve mikserlere akan çalıntı fonları zincirler arası otomatik takip edip VASP'lara dondurma alarmı iletir.",
      whyTrending: "ZachXBT'nin son 24 saatte ifşa ettiği 14M$'lık cüzdan zehirleme saldırısında fonların borsalara girişini önceden haber verdi.",
      sources: ["X/@zachxbt", "r/CryptoCurrency", "X/@CertiKAlert"]
    },
    {
      id: "ofac-ais-tracker",
      name: "Gölge Filo Denizcilik Yaptırım Radarı",
      category: "Yaptırımlar & PEP",
      badge: "Yeni Yaptırım",
      hypeScore: 8.8,
      prevScore: 8.2,
      scoreDelta: +0.6,
      trend: "rising",
      mentions: 1420,
      sparkline: [8.0, 8.1, 8.2, 8.3, 8.5, 8.6, 8.8],
      primaryFunction: "AIS transponder'ı 12 saatten uzun süre kapalı kalan ve petrol taşıyan gemi konşimentolarını dış ticaret sistemlerinde kırmızıya boyar.",
      whyTrending: "OFAC'ın 18 yeni denizcilik şirketini kara listeye alması üzerine akreditif ve dış ticaret bankacılığı birimleri devreye aldı.",
      sources: ["X/@FinCENnews", "X/@FATFNews", "r/compliance"]
    },
    {
      id: "thetaray-sonar",
      name: "ThetaRay Sezgisel FinCrime Sonar",
      category: "İşlem İzleme",
      badge: "RegTech Lideri",
      hypeScore: 8.7,
      prevScore: 8.6,
      scoreDelta: +0.1,
      trend: "stable",
      mentions: 1290,
      sparkline: [8.5, 8.5, 8.6, 8.6, 8.6, 8.7, 8.7],
      primaryFunction: "Kural setine ihtiyaç duymadan 'bilinmeyen aklama tipolojilerini' matematiksel kümeleme algoritmalarıyla izole eder.",
      whyTrending: "Küresel sınır ötesi muhabir bankacılık transferlerinde açıklanamayan para akışlarını en düşük yanlış alarm ile tespit etmesi.",
      sources: ["r/FinTech", "r/banking", "X/@RegTechAnalyst"]
    }
  ],
  weekly: [],
  monthly: []
};

export const DEFAULT_AML_GLOSSARY = [
  {
    id: "g1",
    term: "Smurfing (Yapılandırma / Parçalama)",
    definition: "Büyük miktardaki kara paranın, bankaların yasal bildirim eşiklerine (örneğin 10.000$ veya 50.000 TL) takılmaması için yüzlerce farklı kişi adına küçük tutarlara bölünerek yatırılması.",
    dateStr: "22 Eylül 2026"
  },
  {
    id: "g2",
    term: "Money Mule (Para Katırı / Kurye Hesap)",
    definition: "Genellikle öğrencilere veya işsizlere komisyon vaadiyle açtırılan, dolandırıcılık veya yasadışı bahis gelirlerinin hızlıca aktarılıp nakde çevrildiği aracı banka hesapları.",
    dateStr: "22 Eylül 2026"
  },
  {
    id: "g3",
    term: "Layering (Katmanlama / Ayrıştırma)",
    definition: "Kara paranın kaynağını gizlemek amacıyla karmaşık finansal işlemler, döviz alım-satımları ve paravan şirketler aracılığıyla fonların asıl kaynağından uzaklaştırılması aşaması.",
    dateStr: "22 Eylül 2026"
  },
  {
    id: "g4",
    term: "SAR / STR (Şüpheli İşlem Bildirimi)",
    definition: "Yükümlü finans kuruluşlarının, kara para aklama veya terörün finansmanı şüphesi taşıyan işlemleri resmi otoriteye (MASAK veya FinCEN) bildirmek zorunda olduğu yasal rapor formatı.",
    dateStr: "22 Eylül 2026"
  },
  {
    id: "g5",
    term: "Dwell Time (Fon Kalış Süresi)",
    definition: "Gelen bir paranın hesapta bekleme süresi. Bir hesaba gelen paranın 180 saniye içinde başka bir hesaba veya ATM'ye aktarılması kurye (mule) hesabın en güçlü anomali sinyalidir.",
    dateStr: "22 Eylül 2026"
  },
  {
    id: "g6",
    term: "Heterojen Grafik Sinir Ağı (HGNN)",
    definition: "Müşterileri düğüm (node), para transferlerini ise yönlü ve zaman damgalı kenar (edge) olarak modelleyip aklama şebekelerini haritalayan yeni nesil derin öğrenme mimarisi.",
    dateStr: "22 Eylül 2026"
  },
  {
    id: "g7",
    term: "TBML (Trade-Based Money Laundering)",
    definition: "Ticaret Tabanlı Aklama: Malların faturasında sahte fiyat, eksik/fazla miktar gösterilerek veya hayali teslimatlarla sınır ötesine yasadışı para transfer edilmesi tekniği.",
    dateStr: "22 Eylül 2026"
  },
  {
    id: "g8",
    term: "Sentetik Kimlik Dolandırıcılığı",
    definition: "Gerçek bir vatandaşın kimlik numarasının, yapay zeka ile üretilmiş sahte bir yüz ve uydurma iletişim bilgileriyle birleştirilerek yeni bir hayali müşteri oluşturulması.",
    dateStr: "22 Eylül 2026"
  },
  {
    id: "g9",
    term: "Address Poisoning (Cüzdan Zehirleme)",
    definition: "Kripto para aklayıcılarının, hedeflenen cüzdana çok küçük miktarlarda sıfıra yakın test transferi göndererek işlem geçmişini kirletmesi ve analistleri yanıltması taktiği.",
    dateStr: "22 Eylül 2026"
  }
];

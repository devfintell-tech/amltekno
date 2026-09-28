/**
 * AML, Finansal Suçlar & RegTech Odaklı Reddit Topluluk & Arama Havuzu
 * Yalnızca AML, FinCrime, Yaptırımlar, KYC/CDD ve Dolandırıcılık odaklı topluluklar taranır.
 * İlgisiz genel teknoloji veya kripto gürültüsü kesinlikle elenir.
 */

export const REDDIT_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 AMLTechRadar/2.0";

// 1. Doğrudan AML ve FinCrime Topluluk Kümeleri
export const SUBREDDIT_BATCHES = [
  {
    name: "Doğrudan AML & Uyum Analistleri Topluluğu",
    slug: "AMLCompliance+anti_money_laundering+FinCrime+compliance",
    description: "İşlem izleme kuralları, SAR/STR bildirimleri, false-positive yorgunluğu ve regülasyon denetimleri.",
    icon: "ShieldAlert",
    strictFilter: false // Zaten %100 AML topluluğu
  },
  {
    name: "Finansal Dolandırıcılık, Sentetik Kimlik & RegTech",
    slug: "fraud+identitytheft+regtech+FinancialCareers",
    description: "Sentetik kimlik tespiti, deepfake liveness bypass, kimlik hırsızlığı ve RegTech çözümleri.",
    icon: "CreditCard",
    strictFilter: true // Bankacılık/kariyer içinden sadece AML konuları filtrelenir
  },
  {
    name: "Bankacılık Operasyonları, Şüpheli İşlemler & Mevzuat",
    slug: "Banking+BankingCompliance",
    description: "Banka şubeleri ve genel müdürlük işlem izleme, bloke hesaplar, CTR/SAR ve BSA uygulamaları.",
    icon: "Building",
    strictFilter: true
  },
  {
    name: "Açık Kaynak İstihbarat (OSINT) & Varlık/Paravan Takibi",
    slug: "OSINT+forensics+investigation",
    description: "Paravan şirket haritalama, off-shore hesap tespiti, UBO doğrulaması ve uluslararası varlık takibi.",
    icon: "Search",
    strictFilter: true
  },
  {
    name: "Kripto Kara Para Aklama, Mixer & Kurye Dolandırıcılığı",
    slug: "CryptoScams+Scams",
    description: "Para katırı (money mule) ağları, kripto mikserleri, DeFi köprü aklamaları ve zincir üstü tuzaklar.",
    icon: "Coins",
    strictFilter: true
  }
];

// 2. Canlı Reddit Global Arama Beslemeleri (Son 24 saatte doğrudan AML tartışılan her gönderi)
export const REDDIT_SEARCH_QUERIES = [
  {
    name: "Küresel AML & Finansal Suç Tartışmaları",
    query: 'title:(AML OR "anti-money laundering" OR "money laundering" OR "FinCEN" OR "MASAK" OR "OFAC" OR "SAR narrative" OR "smurfing" OR "money mule")',
    limit: 100
  },
  {
    name: "İşlem İzleme & Müşteri İnceleme (CDD/KYC) Zorlukları",
    query: 'title:("transaction monitoring" OR "KYC remediation" OR "beneficial ownership" OR "alert fatigue" OR "false positive" OR "PEP screening")',
    limit: 100
  },
  {
    name: "Sentetik Kimlik, Paravan Şirketler & Yaptırımlar",
    query: 'title:("synthetic identity" OR "deepfake liveness" OR "sanctions evasion" OR "shadow fleet" OR "shell company" OR "wire fraud")',
    limit: 100
  },
  {
    name: "Kripto Fon Aklama, Mikser & Travel Rule",
    query: 'title:("crypto mixer" OR "tornado cash" OR "travel rule" OR "unhosted wallet" OR "chain analysis" OR "crypto laundering")',
    limit: 100
  }
];

export const AML_KEYWORDS = [
  "anti-money laundering", "money laundering", "kara para", "aklama",
  "fincen", "fatf", "masak", "ofac", "sanctions", "yaptırım", "yaptırımlar",
  "beneficial owner", "gerçek faydalanıcı",
  "şüpheli işlem", "suspicious activity",
  "smurfing", "structuring", "money mule", "kurye hesap", "para katırı",
  "layering", "placement", "integration", "politically exposed",
  "transaction monitoring", "işlem izleme", "anomali", "alert fatigue",
  "false positive", "yanlış alarm", "synthetic identity", "sentetik kimlik",
  "deepfake liveness", "trade-based money laundering",
  "crypto mixer", "tornado cash", "de-risking", "regtech", "wire fraud",
  "shell company", "paravan şirket", "source of funds", "source of wealth",
  "travel rule", "unhosted wallet", "sanction evasion", "asset tracing",
  "fraud", "scam", "phishing", "forensics", "investigation", "compliance",
  "regulatory", "laundering", "sepa", "swift", "bribery", "corruption"
];

// Kısa kısaltmalar: 'necessary' veya 'string' gibi alakasız kelimelerin içinde sahte eşleşme yapmaması için
// tam kelime sınırı (\b) ile aranır.
export const SHORT_AML_ACRONYMS = [
  "aml", "cdd", "edd", "kyc", "ubo", "pep", "sar", "str", "ctr", "bsa", "fiu", "tbml", "vasp", "fast", "mule"
];

/**
 * Gönderinin AML ile doğrudan ilişkili olup olmadığını denetler
 * (Aşırı filtreleme yapmaz; AML/FinCrime ile ilgiliyse kabul eder, sahte alakasız kelimeleri eler)
 */
export function isAmlRelevant(title = "", content = "", isStrict = true) {
  if (!isStrict) return true;
  const haystack = `${title} ${content}`.toLowerCase();

  // 1. Kısa AML kısaltmaları için kelime sınırı kontrolü (\b)
  for (const acr of SHORT_AML_ACRONYMS) {
    const rx = new RegExp(`\\b${acr}\\b`, 'i');
    if (rx.test(haystack)) return true;
  }

  // 2. Uzun AML terimleri ve çok kelimeli kavramlar
  for (const kw of AML_KEYWORDS) {
    if (haystack.includes(kw.toLowerCase())) return true;
  }

  return false;
}

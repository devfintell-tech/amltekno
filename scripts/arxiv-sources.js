import { XMLParser } from 'fast-xml-parser';
import { safeTruncate } from './deepseek-analyzer.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str.replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ")
            .replace(/&apos;/g, "'")
            .replace(/\s+/g, " ")
            .trim();
}

/**
 * arXiv Açık API'sinden Finansal Suç & AML/RegTech Odaklı En Son Makaleleri Çeker
 */
export async function fetchArxivAmlPapers() {
  console.log("📚 arXiv açık API taranıyor (AML, GNN, Anomali Tespiti ve FinCrime)...");
  
  // arXiv sorgusu: AML, Finansal Suç, İşlem İzleme, Sahte Kimlik, Grafik Sinir Ağları
  const query = 'all:"anti-money laundering" OR all:"money laundering" OR all:"financial crime" OR all:"fraud detection" OR all:"transaction monitoring" OR all:"synthetic identity"';
  const encodedQuery = encodeURIComponent(query);
  const url = `https://export.arxiv.org/api/query?search_query=${encodedQuery}&sortBy=submittedDate&sortOrder=descending&max_results=25`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "AMLTechRadar/1.0 (academic-researcher; mailto:orhaner1907@gmail.com)"
      },
      signal: AbortSignal.timeout(25000)
    });

    if (!res.ok) {
      console.warn(`⚠️ arXiv HTTP ${res.status} döndü`);
      return [];
    }

    const xmlData = await res.text();
    const parsed = parser.parse(xmlData);

    let entries = parsed?.feed?.entry;
    if (!entries) return [];
    if (!Array.isArray(entries)) entries = [entries];

    const papers = entries.map(entry => {
      const fullId = entry.id || "";
      const rawId = fullId.replace("http://arxiv.org/abs/", "").replace("https://arxiv.org/abs/", "").trim();
      const title = safeTruncate(decodeHtmlEntities(entry.title || "Başlıksız Makale"), 250);
      const summary = safeTruncate(decodeHtmlEntities(entry.summary || "Özet bulunamadı."), 800);
      
      let authors = [];
      if (Array.isArray(entry.author)) {
        authors = entry.author.map(a => a.name || "").filter(Boolean);
      } else if (entry.author?.name) {
        authors = [entry.author.name];
      }

      let pdfUrl = "";
      if (Array.isArray(entry.link)) {
        const pdfLink = entry.link.find(l => l["@_title"] === "pdf" || l["@_type"] === "application/pdf");
        if (pdfLink) pdfUrl = pdfLink["@_href"];
      }

      return {
        id: rawId,
        title: title,
        summary: summary,
        authors: authors.slice(0, 4),
        published: entry.published ? entry.published.slice(0, 10) : new Date().toISOString().slice(0, 10),
        arxivUrl: `https://arxiv.org/abs/${rawId}`,
        pdfUrl: pdfUrl || `https://arxiv.org/pdf/${rawId}.pdf`
      };
    });

    console.log(`✅ arXiv'den ${papers.length} güncel finansal suç & AI makalesi çekildi.`);
    return papers;
  } catch (err) {
    console.error("❌ arXiv çekme hatası:", err.message);
    return [];
  }
}

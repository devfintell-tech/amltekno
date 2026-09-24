/**
 * Apify Ücretsiz Maliyet & Kredi Takip Modülü
 * 
 * Soru: Apify hangi apiyi kullandığında ne kadar dolar harcadı bunu ücretsiz öğrenebiliyor mu?
 * Cevap: EVET! Apify'ın /v2/users/me ve /v2/actor-runs API'leri %100 ÜCRETSİZDİR ve hesap bakiyesinden
 * hiçbir kredi düşmez. Her actor çalışmasının (Twitter scraper, Cheerio scraper vb.) kuruşu kuruşuna
 * ne kadar USD harcadığı (usageTotalUsd) şeffaf şekilde listelenir.
 */

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

/**
 * Belirli bir Apify token'ının hesap bakiyesini ve son actor harcamalarını çeker
 */
export async function getApifyUsageReport(token, tokenLabel = "Apify Hesabı") {
  if (!token) {
    return { error: "Token bulunamadı" };
  }

  try {
    // 1. Hesap & Plan Bilgisi (Ücretsiz API)
    const userRes = await fetch(`https://api.apify.com/v2/users/me?token=${token}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!userRes.ok) {
      return { error: `HTTP ${userRes.status}` };
    }
    const userData = await userRes.json();
    const user = userData.data || {};
    const plan = user.plan || {};
    const monthlyCreditUsd = plan.monthlyUsageCreditsUsd || 5.0;

    // 2. Son Çalıştırılan Actor'lerin Harcama Dökümü (Ücretsiz API)
    const runsRes = await fetch(`https://api.apify.com/v2/actor-runs?token=${token}&limit=10&desc=true`, {
      signal: AbortSignal.timeout(10000)
    });
    const runsData = await runsRes.json();
    const items = runsData.data?.items || [];

    let totalSpentUsd = 0;
    const runsSummary = [];

    for (const run of items) {
      const cost = run.usageTotalUsd || 0;
      totalSpentUsd += cost;

      const startedAt = run.startedAt ? new Date(run.startedAt).toLocaleString('tr-TR') : '-';
      const durationSec = (run.startedAt && run.finishedAt) 
        ? ((new Date(run.finishedAt) - new Date(run.startedAt)) / 1000).toFixed(1) + 's' 
        : '-';

      runsSummary.push({
        runId: run.id,
        actId: run.actId,
        status: run.status,
        startedAt,
        duration: durationSec,
        costUsd: cost,
        costFormatted: `$${cost.toFixed(4)}`
      });
    }

    const remainingCreditUsd = Math.max(0, monthlyCreditUsd - totalSpentUsd);

    return {
      label: tokenLabel,
      username: user.username || user.profile?.name || "Kullanıcı",
      email: user.email || "-",
      plan: plan.id || "FREE",
      monthlyCreditUsd: `$${monthlyCreditUsd.toFixed(2)}`,
      totalSpentUsd: `$${totalSpentUsd.toFixed(4)}`,
      remainingCreditUsd: `$${remainingCreditUsd.toFixed(4)}`,
      recentRunsCount: items.length,
      runs: runsSummary
    };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Konsola renkli ve okunaklı özet rapor basar
 */
export async function printFullApifyCostReport() {
  console.log("\n=======================================================");
  console.log("💰 APİFY ÜCRETSİZ MALİYET & DOLAR HARCAMA RAPORU");
  console.log("=======================================================");

  const tokens = [
    {
      label: "1. Apify Token (Gündem Analizcisi: X & LinkedIn Scraper)",
      token: process.env.APIFY_TOKEN
    },
    {
      label: "2. Apify Token (Resmi Otoriteler: X & LinkedIn Scraper)",
      token: process.env.APIFY_AUTHORITIES_TOKEN || process.env.APIFY_TOKEN
    }
  ];

  for (const item of tokens) {
    const report = await getApifyUsageReport(item.token, item.label);
    console.log(`\n📌 ${item.label}:`);
    if (report.error) {
      console.log(`   ⚠️ Hata: ${report.error}`);
      continue;
    }

    console.log(`   • Kullanıcı      : ${report.username} (${report.email})`);
    console.log(`   • Plan Türü      : ${report.plan} (Aylık ${report.monthlyCreditUsd} Ücretsiz Kredi)`);
    console.log(`   • Toplam Harcanan: ${report.totalSpentUsd}`);
    console.log(`   • Kalan Kredi    : ${report.remainingCreditUsd}`);
    console.log(`   • Son Çalışmalar :`);

    if (report.runs.length === 0) {
      console.log(`     (Henüz bu hesapta actor çalıştırılmadı, 0.00$ harcama)`);
    } else {
      for (const run of report.runs) {
        console.log(`     - [${run.status}] ${run.startedAt} (${run.duration}) -> Harcama: ${run.costFormatted} (Run: ${run.runId})`);
      }
    }
  }

  console.log("=======================================================\n");
}

// Doğrudan çalıştırıldığında raporu yazdır
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  printFullApifyCostReport();
}

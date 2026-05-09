#!/usr/bin/env node
/**
 * campaign_state_check.js
 *
 * Lv.2 SSOT 自動チェッカー。
 * - config.js から CAMPAIGN を読み込み、現在日と endDate を比較
 * - 期限到達時:
 *     autoExtendDays > 0 かつ extensionsUsed < maxExtensions
 *       → endDate += autoExtendDays、extensionsUsed++、commit + extension-notify
 *     それ以外
 *       → ended-notify のみ（HTML 側 JS が自動切替）
 * - notifyDaysBefore に該当する日 → upcoming-notify
 *
 * 環境変数:
 *   RESEND_API_KEY  - Resend API キー（メール送信時必須）
 *   DRY_RUN         - 'true' なら commit/email を行わずログ出力のみ
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(REPO_ROOT, 'config.js');

const DRY_RUN = (process.env.DRY_RUN || 'false').toLowerCase() === 'true';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// ----- config.js パース -----
function readConfig() {
  const src = fs.readFileSync(CONFIG_PATH, 'utf8');
  const get = (key, type) => {
    type = type || 'string';
    let re;
    if (type === 'string') re = new RegExp('\\b' + key + ':\\s*"([^"]*)"');
    else if (type === 'int') re = new RegExp('\\b' + key + ':\\s*(\\d+)');
    else if (type === 'bool') re = new RegExp('\\b' + key + ':\\s*(true|false)');
    else if (type === 'array') re = new RegExp('\\b' + key + ':\\s*\\[([^\\]]*)\\]');
    const m = src.match(re);
    if (!m) return null;
    if (type === 'int') return parseInt(m[1], 10);
    if (type === 'bool') return m[1] === 'true';
    if (type === 'array') return m[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    return m[1];
  };
  return {
    src: src,
    startDate:        get('startDate', 'string'),
    endDate:          get('endDate', 'string'),
    autoExtendDays:   get('autoExtendDays', 'int') || 0,
    maxExtensions:    get('maxExtensions', 'int') || 0,
    extensionsUsed:   get('extensionsUsed', 'int') || 0,
    autoRevertOnEnd:  get('autoRevertOnEnd', 'bool'),
    notifyDaysBefore: get('notifyDaysBefore', 'array') || [],
    notifyEmail:      get('notifyEmail', 'string'),
  };
}

function writeConfig(src, updates) {
  let out = src;
  if (updates.endDate) {
    out = out.replace(/(\bendDate:\s*)"[^"]*"/, '$1"' + updates.endDate + '"');
  }
  if (typeof updates.extensionsUsed === 'number') {
    out = out.replace(/(\bextensionsUsed:\s*)\d+/, '$1' + updates.extensionsUsed);
  }
  fs.writeFileSync(CONFIG_PATH, out, 'utf8');
}

// ----- 日付ユーティリティ -----
function todayJst() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(fromIso, toIso) {
  const a = new Date(fromIso + 'T00:00:00Z').getTime();
  const b = new Date(toIso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / (24 * 3600 * 1000));
}

// ----- Resend メール送信 -----
function sendEmail(to, subject, html) {
  if (DRY_RUN) {
    console.log('[DRY_RUN] would send email:', { to: to, subject: subject });
    return Promise.resolve({ ok: true, dryRun: true });
  }
  if (!RESEND_API_KEY) {
    console.warn('[campaign_check] RESEND_API_KEY not set; skipping email.');
    return Promise.resolve({ ok: false, reason: 'no_api_key' });
  }
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: 'AI Visibility Index <noreply@ai-visibility-index.com>',
      to: [to],
      subject: subject,
      html: html,
    });
    const req = https.request({
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        console.log('[campaign_check] resend response:', res.statusCode, body.slice(0, 200));
        resolve({ ok: ok, status: res.statusCode, body: body });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ----- HTML 書き換え (Phase 3: 静的クローラー対応) -----
const HTML_FILES = [
  'campaign.html',
  'pricing.html',
  'legal.html',
  'index.html',
];

function formatJp(iso) {
  const parts = iso.split('-');
  return parseInt(parts[1], 10) + '月' + parseInt(parts[2], 10) + '日';
}
function formatShort(iso) {
  const parts = iso.split('-');
  return parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10);
}
function formatJpDay(iso) {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const d = new Date(iso + 'T00:00:00+09:00');
  return formatJp(iso) + '（' + days[d.getDay()] + '）';
}

/**
 * HTML ファイルを新 endDate で書き換える。
 * - data-* markup された span 内のテキスト
 * - meta description / og:description / twitter:description の "M/Dまで" / "M月D日まで"
 * - JSON-LD ブロック内の同パターン
 * 戻り値: { changed: bool, content: string }
 */
function rewriteHtmlForCampaign(filepath, endDateIso) {
  const fullPath = path.join(REPO_ROOT, filepath);
  if (!fs.existsSync(fullPath)) {
    return { changed: false, content: null, missing: true };
  }
  const original = fs.readFileSync(fullPath, 'utf8');
  let html = original;

  const short = formatShort(endDateIso);
  const jp = formatJp(endDateIso);
  const jpDay = formatJpDay(endDateIso);

  // 1. data-* span 内のテキスト書き換え
  html = html.replace(
    /(<span\s+data-campaign-end-date-short[^>]*>)[^<]*(<\/span>)/g,
    '$1' + short + '$2'
  );
  html = html.replace(
    /(<span\s+data-campaign-end-date-jp-day[^>]*>)[^<]*(<\/span>)/g,
    '$1' + jpDay + '$2'
  );
  html = html.replace(
    /(<span\s+data-campaign-end-iso[^>]*>)[^<]*(<\/span>)/g,
    '$1' + endDateIso + '$2'
  );
  // data-campaign-end-date は -short / -jp-day / -iso と被らないよう負の lookahead
  html = html.replace(
    /(<span\s+data-campaign-end-date(?!-)[^>]*>)[^<]*(<\/span>)/g,
    '$1' + jp + '$2'
  );

  // 2. meta description 系
  ['name="description"', 'property="og:description"', 'name="twitter:description"'].forEach(function (sel) {
    const re = new RegExp(
      '(<meta[^>]*\\s' + sel.replace(/"/g, '"').replace(/=/g, '=') + '[^>]*\\scontent=")([^"]*)(")',
      'gi'
    );
    html = html.replace(re, function (_m, p1, content, p3) {
      let c = content;
      c = c.replace(/\b\d{1,2}\/\d{1,2}まで/g, short + 'まで');
      c = c.replace(/\b\d{1,2}月\d{1,2}日まで/g, jp + 'まで');
      return p1 + c + p3;
    });
  });
  // 順序違いの content="" pattern も吸収（content の前に sel が来るパターン）
  html = html.replace(
    /(<meta[^>]*\bcontent=")([^"]*)("\s+(?:name|property)="(?:description|og:description|twitter:description)")/gi,
    function (_m, p1, content, p3) {
      let c = content;
      c = c.replace(/\b\d{1,2}\/\d{1,2}まで/g, short + 'まで');
      c = c.replace(/\b\d{1,2}月\d{1,2}日まで/g, jp + 'まで');
      return p1 + c + p3;
    }
  );

  // 3. JSON-LD ブロック
  html = html.replace(
    /(<script\s+type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,
    function (_m, p1, body, p3) {
      let b = body;
      b = b.replace(/\b\d{1,2}\/\d{1,2}まで/g, short + 'まで');
      b = b.replace(/\b\d{1,2}月\d{1,2}日まで/g, jp + 'まで');
      return p1 + b + p3;
    }
  );

  return { changed: html !== original, content: html, missing: false };
}

function applyHtmlRewrites(endDateIso) {
  const summary = [];
  HTML_FILES.forEach(function (f) {
    const result = rewriteHtmlForCampaign(f, endDateIso);
    if (result.missing) {
      summary.push({ file: f, status: 'missing' });
      return;
    }
    if (!result.changed) {
      summary.push({ file: f, status: 'no_change' });
      return;
    }
    if (DRY_RUN) {
      summary.push({ file: f, status: 'would_update' });
    } else {
      fs.writeFileSync(path.join(REPO_ROOT, f), result.content, 'utf8');
      summary.push({ file: f, status: 'updated' });
    }
  });
  return summary;
}

// ----- メイン処理 -----
async function main() {
  const cfg = readConfig();
  const today = todayJst();
  const daysToEnd = diffDays(today, cfg.endDate);
  console.log('[campaign_check]', JSON.stringify({
    today: today,
    endDate: cfg.endDate,
    daysToEnd: daysToEnd,
    autoExtendDays: cfg.autoExtendDays,
    extensionsUsed: cfg.extensionsUsed,
    maxExtensions: cfg.maxExtensions,
    autoRevertOnEnd: cfg.autoRevertOnEnd,
    dryRun: DRY_RUN,
  }, null, 2));

  if (daysToEnd <= 0) {
    if (cfg.autoExtendDays > 0 && cfg.extensionsUsed < cfg.maxExtensions) {
      const newEndDate = addDays(cfg.endDate, cfg.autoExtendDays);
      const newExtCount = cfg.extensionsUsed + 1;
      console.log('[campaign_check] AUTO-EXTEND:', cfg.endDate, '→', newEndDate);
      if (!DRY_RUN) {
        writeConfig(cfg.src, { endDate: newEndDate, extensionsUsed: newExtCount });
      }
      // Phase 3: 静的クローラー対応 — HTML ファイル群も新 endDate で書き換え
      const htmlSummary = applyHtmlRewrites(newEndDate);
      console.log('[campaign_check] HTML rewrite summary:', JSON.stringify(htmlSummary, null, 2));
      const htmlSummaryHtml = '<ul>' + htmlSummary.map(function (s) {
        return '<li>' + s.file + ': ' + s.status + '</li>';
      }).join('') + '</ul>';
      await sendEmail(
        cfg.notifyEmail,
        '[AI Visibility Index] キャンペーン自動延長: ' + newEndDate + ' まで',
        '<p>キャンペーンが自動延長されました。</p>' +
        '<ul>' +
          '<li>旧終了日: ' + cfg.endDate + '</li>' +
          '<li>新終了日: ' + newEndDate + '</li>' +
          '<li>延長日数: ' + cfg.autoExtendDays + '</li>' +
          '<li>延長回数: ' + newExtCount + ' / ' + cfg.maxExtensions + '</li>' +
        '</ul>' +
        '<p>config.js + HTML ファイルが自動コミットされ、Cloudflare Pages が再デプロイされます。</p>' +
        '<p><strong>HTML 書き換え結果:</strong></p>' +
        htmlSummaryHtml
      );
      return;
    } else {
      console.log('[campaign_check] CAMPAIGN ENDED, no auto-extend');
      await sendEmail(
        cfg.notifyEmail,
        '[AI Visibility Index] キャンペーン終了: ' + cfg.endDate,
        '<p>キャンペーン期間が終了しました。</p>' +
        '<ul>' +
          '<li>終了日: ' + cfg.endDate + '</li>' +
          '<li>autoExtendDays: ' + cfg.autoExtendDays + ' (0=延長なし)</li>' +
          '<li>extensionsUsed: ' + cfg.extensionsUsed + ' / ' + cfg.maxExtensions + '</li>' +
          '<li>autoRevertOnEnd: ' + cfg.autoRevertOnEnd + '</li>' +
        '</ul>' +
        '<p>HTML 側の campaign_renderer.js が自動的に通常価格表示に切替済みです。</p>' +
        '<p>延長したい場合は config.js の autoExtendDays を編集してください。</p>'
      );
      return;
    }
  }

  if (cfg.notifyDaysBefore.indexOf(daysToEnd) >= 0) {
    console.log('[campaign_check] UPCOMING NOTIFY:', daysToEnd, 'days before');
    await sendEmail(
      cfg.notifyEmail,
      '[AI Visibility Index] キャンペーン終了まであと ' + daysToEnd + ' 日',
      '<p>キャンペーン終了が近づいています。</p>' +
      '<ul>' +
        '<li>残り日数: ' + daysToEnd + ' 日</li>' +
        '<li>終了日: ' + cfg.endDate + '</li>' +
        '<li>autoExtendDays: ' + cfg.autoExtendDays + ' (0=延長なし)</li>' +
      '</ul>' +
      '<p>延長する場合は config.js の autoExtendDays を 31 等に変更してください。</p>'
    );
    return;
  }

  console.log('[campaign_check] no action needed.');
}

main().catch((err) => {
  console.error('[campaign_check] fatal:', err);
  process.exit(1);
});

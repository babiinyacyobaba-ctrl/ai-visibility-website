/**
 * campaign_renderer.js — Campaign State Single Source of Truth Renderer
 *
 * 機能:
 *   1. config.js の CAMPAIGN / PRICING_CAMPAIGN / PRICING_NORMAL を読み込み
 *   2. 現在時刻と CAMPAIGN.endDate を比較してキャンペーン期間中かを判定
 *   3. data-* 属性で markup された要素を動的に書き換え
 *
 * HTML 側マーキング規約:
 *   <span data-campaign-end-date></span>            → "5月31日"
 *   <span data-campaign-end-iso></span>             → "2026-05-31"
 *   <div  data-show-when="campaign-active">...</div>  → 期間中のみ表示
 *   <div  data-show-when="campaign-ended">...</div>   → 終了後のみ表示
 *   <span data-price="spotBasic"></span>            → "¥0" or "¥2,980"
 *   <span data-price-normal="spotBasic"></span>     → "¥2,980"（line-through 用）
 *   <span data-price-suffix="spotBasic"></span>     → "5/31まで無料" or "1回・税込"
 *   <span data-price-unit="spotBasic"></span>       → unit 文字列
 *
 * 読み込み順序:
 *   <script src="/config.js"></script>
 *   <script defer src="/assets/campaign_renderer.js"></script>
 */
(function () {
  'use strict';

  // config.js が未読み込みなら早期 return
  if (typeof CAMPAIGN === 'undefined' ||
      typeof PRICING_CAMPAIGN === 'undefined' ||
      typeof PRICING_NORMAL === 'undefined') {
    console.warn('[campaign_renderer] config.js not loaded; skipping render.');
    return;
  }

  // --- キャンペーン期間判定 ---
  var now = new Date();
  var endDateIso = CAMPAIGN.endDate; // "YYYY-MM-DD"
  var endDate = new Date(endDateIso + 'T23:59:59+09:00');
  var isActive = now < endDate;
  var pricing = isActive ? PRICING_CAMPAIGN : PRICING_NORMAL;

  // --- 日付フォーマッタ ---
  function formatJpDate(iso) {
    var parts = iso.split('-');
    return parseInt(parts[1], 10) + '月' + parseInt(parts[2], 10) + '日';
  }

  // --- 1. 日付プレースホルダー ---
  // M月D日 形式: <span data-campaign-end-date></span> → "5月31日"
  document.querySelectorAll('[data-campaign-end-date]').forEach(function (el) {
    el.textContent = formatJpDate(endDateIso);
  });
  // M/D 形式: <span data-campaign-end-date-short></span> → "5/31"
  document.querySelectorAll('[data-campaign-end-date-short]').forEach(function (el) {
    var parts = endDateIso.split('-');
    el.textContent = parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10);
  });
  // YYYY-MM-DD 形式: <span data-campaign-end-iso></span> → "2026-05-31"
  document.querySelectorAll('[data-campaign-end-iso]').forEach(function (el) {
    el.textContent = endDateIso;
  });
  // 曜日付き: <span data-campaign-end-date-jp-day></span> → "5月31日（日）"
  document.querySelectorAll('[data-campaign-end-date-jp-day]').forEach(function (el) {
    var d = new Date(endDateIso + 'T00:00:00+09:00');
    var days = ['日', '月', '火', '水', '木', '金', '土'];
    el.textContent = formatJpDate(endDateIso) + '（' + days[d.getDay()] + '）';
  });

  // --- 2. 表示制御 ---
  document.querySelectorAll('[data-show-when="campaign-active"]').forEach(function (el) {
    if (!isActive) el.style.display = 'none';
  });
  document.querySelectorAll('[data-show-when="campaign-ended"]').forEach(function (el) {
    if (isActive) el.style.display = 'none';
  });

  // --- 3. 価格注入 ---
  function injectPrice(selector, fieldKey) {
    document.querySelectorAll(selector).forEach(function (el) {
      var key = el.getAttribute('data-' + (
        fieldKey === 'price' ? 'price' :
        fieldKey === 'normal' ? 'price-normal' :
        fieldKey === 'suffix' ? 'price-suffix' :
        'price-unit'
      ));
      if (!key || !pricing[key]) return;
      var value = pricing[key][fieldKey];
      if (value !== null && value !== undefined) {
        el.textContent = value;
      } else {
        el.style.display = 'none';
      }
    });
  }
  injectPrice('[data-price]', 'price');
  injectPrice('[data-price-normal]', 'normal');
  injectPrice('[data-price-suffix]', 'suffix');
  injectPrice('[data-price-unit]', 'unit');

  // --- 4. SEO meta タグ動的書き換え（クローラー対策、JS 実行可能なクローラー向け） ---
  // 静的クローラーは古い日付を見る可能性あり（既知の制限、docs/CAMPAIGN_AUTOMATION.md 参照）。
  // 確実な対応は GHA cron による HTML 再生成（Phase 3）。
  function rewriteMetaDate(selector, attrName) {
    document.querySelectorAll(selector).forEach(function (el) {
      var content = el.getAttribute(attrName);
      if (!content) return;
      // "M/D" 形式の日付パターンを置換（例: "5/31" → endDate 由来の "M/D"）
      var newLabel = formatJpDate(endDateIso); // "M月D日"
      var shortLabel = parseInt(endDateIso.split('-')[1], 10) + '/' + parseInt(endDateIso.split('-')[2], 10);
      // "X/Yまで無料" や "X/Yまで限定" 等のパターンを置換（汎用 4-31）
      content = content.replace(/\b(\d{1,2})\/(\d{1,2})まで/g, shortLabel + 'まで');
      content = content.replace(/\b(\d{1,2})月(\d{1,2})日まで/g, newLabel + 'まで');
      el.setAttribute(attrName, content);
    });
  }
  rewriteMetaDate('meta[name="description"]', 'content');
  rewriteMetaDate('meta[property="og:description"]', 'content');
  rewriteMetaDate('meta[name="twitter:description"]', 'content');

  // --- 5. JSON-LD 動的書き換え（offer description 等の日付） ---
  document.querySelectorAll('script[type="application/ld+json"]').forEach(function (el) {
    try {
      var json = JSON.parse(el.textContent);
      var raw = JSON.stringify(json);
      var shortLabel = parseInt(endDateIso.split('-')[1], 10) + '/' + parseInt(endDateIso.split('-')[2], 10);
      var jpLabel = formatJpDate(endDateIso);
      raw = raw.replace(/\b(\d{1,2})\/(\d{1,2})まで/g, shortLabel + 'まで');
      raw = raw.replace(/\b(\d{1,2})月(\d{1,2})日まで/g, jpLabel + 'まで');
      el.textContent = raw;
    } catch (e) {
      // JSON parse 失敗 = 空 or 既に書き換え済み等。スキップ
    }
  });

  // --- 6. デバッグ補助 ---
  window.__campaignState = {
    isActive: isActive,
    endDate: endDateIso,
    now: now.toISOString(),
    extensionsUsed: CAMPAIGN.extensionsUsed,
    maxExtensions: CAMPAIGN.maxExtensions
  };
})();

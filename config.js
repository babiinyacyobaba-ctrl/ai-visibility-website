// config.js — public lead capture and contact settings
//
// 外部フォームは Google Forms / Apps Script / Formspree 等を想定しています。
// method は "GET" または "POST" を指定してください。
// 未設定の場合はメール問い合わせへフォールバックします。
//
// ※ このファイルはパブリックに配信されます。
//    シークレットキーは絶対に記載しないでください。

const CONTACT_EMAIL = "ai-visibility-index@protonmail.com";

const LEAD_FORMS = {
  freeScan: {
    url: "https://forms.gle/UCBE67C5x8GdMyTE7",
    embeddedUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeBhpdu63jZZINhCEe4Lu4pM1pZ5ip0BNC7ID5TsRl4r6cjzw/viewform?embedded=true",
    method: "GET",
  },
  // Starter プラン (旧 Starter β) — 2026-04-12 に Stripe Payment Link 直結へ切替。
  // - キャンペーン価格: ¥9,800／月（税込）
  // - 通常価格: ¥19,800／月（税込）
  // - 決済完了 → Cloudflare Worker webhook → 10 分以内にパスコードメール
  // - LP 側は consent modal 経由でのみ遷移（Sage §4 同意取得要件）
  // 旧 Payment Link (¥3,980/月) は Stripe Dashboard で Archive 済 (Founder 対応)。
  starter: {
    url: "https://buy.stripe.com/eVq7sL0nugwzd747AHaR203",
    method: "GET",
  },
  // 後方互換: 旧 starterBeta キーを残して、万一のキャッシュ済み古い HTML でも壊れないようにする。
  // 次回クリーンアップ PR で削除する。
  starterBeta: {
    url: "https://buy.stripe.com/eVq7sL0nugwzd747AHaR203",
    method: "GET",
  },
  proInquiry: {
    url: "https://forms.gle/R3HXcUo84myV4zT18",
    method: "GET",
  },
  // スポットレポート（1回買い切り）— Phase B (2026-04-12)
  // Stripe Payment Link。custom_fields: URL, company, industry。
  // キャンペーン価格 ¥3,980（通常 ¥6,980）— 2026-04-13 改定
  // ¥3,980 Payment Link 作成済 (2026-04-13)
  spotDetailed: {
    url: "https://buy.stripe.com/28E3cvb28bcf2sq2gnaR206",
    method: "GET",
  },
  // Spot Basic: 5/31まで無料キャンペーン（通常 ¥2,980）— 2026-05-10 改定
  // 方針A: 無料期間中は Free 診断フォーム経由で PDF 自動配信（決済不要）
  // キャンペーン終了後に ¥2,980 Payment Link を作成して差し替え
  spotBasic: {
    url: "#free-scan",
    method: "GET",
  },
};

// Starter プランの価格（consent modal と pricing.html で表示）。
// キャンペーン期間終了時は PRICING.starter.campaign を null にする。
const PRICING = {
  starter: {
    campaign: "¥9,800",
    normal:   "¥19,800",
    currency: "JPY",
    unit:     "月額・税込",
  },
  spotDetailed: {
    price:    "¥3,980",
    normal:   "¥6,980",
    currency: "JPY",
    unit:     "1回・税込・キャンペーン価格",
  },
  spotBasic: {
    price:    "¥0",
    normal:   "¥2,980",
    currency: "JPY",
    unit:     "5/31まで無料キャンペーン",
    campaignEnd: "2026-05-31",
  },
};

const FREE_SCAN_CAMPAIGN = {
  limit: 20,
  acceptedCount: 0,
  status: "active", // active | waitlist | closed
};

// ============================================================
// CAMPAIGN STATE — Single Source of Truth (Lv.2 SSOT)
// ============================================================
// このオブジェクトがキャンペーン日付・価格表示の唯一の真実です。
// HTML 側は data-* 属性で参照し、campaign_renderer.js が動的に注入します。
// 期限到達時の自動延長／自動切替は GHA cron (campaign-state-check.yml) が担当。
//
// 編集ルール:
//  - endDate を変更したら他の場所は触らない（cron が SSOT を維持）
//  - 延長したい場合は autoExtendDays > 0 に事前設定して放置
//  - 即時終了したい場合は endDate を過去日に変更
//
// 編集ログ:
//  - 2026-04-13: 初版（4/14〜4/30）
//  - 2026-05-10: 5/31 まで延長、Lv.2 SSOT 化（Issue #42 hotfix）
const CAMPAIGN = {
  // 期間
  startDate: "2026-04-14",
  endDate:   "2026-05-31",

  // 自動延長（事前設定）
  autoExtendDays:   0,    // 0 = 延長しない / 31 = 1ヶ月延長 / 7 = 1週間延長
  maxExtensions:   12,    // 延長回数上限（暴走防止、12回 ≈ 1年）
  extensionsUsed:   0,    // cron が自動加算

  // 終了時動作
  autoRevertOnEnd: true,  // true = endDate 経過後は通常価格表示に自動切替

  // 通知（Resend）
  notifyDaysBefore: [7, 3, 1, 0],
  notifyEmail: "ai-visibility-index@protonmail.com",
};

// キャンペーン期間中の価格（HTML から data-price 等で参照）
const PRICING_CAMPAIGN = {
  spotBasic: {
    price:    "¥0",
    normal:   "¥2,980",
    suffix:   "5/31まで無料",
    unit:     "1回・税込・キャンペーン価格",
  },
  spotDetailed: {
    price:    "¥3,980",
    normal:   "¥6,980",
    suffix:   "キャンペーン価格",
    unit:     "1回・税込・キャンペーン価格",
  },
  starter: {
    price:    "¥9,800",
    normal:   "¥19,800",
    suffix:   "/月（キャンペーン価格）",
    unit:     "月額・税込・キャンペーン価格",
  },
};

// キャンペーン終了後の通常価格（自動切替先）
const PRICING_NORMAL = {
  spotBasic: {
    price:    "¥2,980",
    normal:   null,
    suffix:   "1回・税込",
    unit:     "1回・税込",
  },
  spotDetailed: {
    price:    "¥6,980",
    normal:   null,
    suffix:   "1回・税込",
    unit:     "1回・税込",
  },
  starter: {
    price:    "¥19,800",
    normal:   null,
    suffix:   "/月",
    unit:     "月額・税込",
  },
};

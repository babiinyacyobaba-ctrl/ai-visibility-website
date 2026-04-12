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
  // 一般ユーザー向け: ¥4,980（税込）詳細レポート
  spotDetailed: {
    url: "https://buy.stripe.com/6oU6oH3zGdkn6IGf39aR204",
    method: "GET",
  },
  // Starter加入者向け: ¥2,980（税込）ベーシックレポート
  spotBasic: {
    url: "https://buy.stripe.com/eVq4gzc6cdkn8QO08faR205",
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
    price:    "¥4,980",
    currency: "JPY",
    unit:     "1回・税込",
  },
  spotBasic: {
    price:    "¥2,980",
    currency: "JPY",
    unit:     "1回・税込（Starter加入者価格）",
  },
};

const FREE_SCAN_CAMPAIGN = {
  limit: 20,
  acceptedCount: 0,
  status: "active", // active | waitlist | closed
};

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
  // Spot Basic: 4/30まで無料キャンペーン（通常 ¥2,980）— 2026-04-13 改定
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
    unit:     "4/30まで無料キャンペーン",
    campaignEnd: "2026-04-30",
  },
};

const FREE_SCAN_CAMPAIGN = {
  limit: 20,
  acceptedCount: 0,
  status: "active", // active | waitlist | closed
};

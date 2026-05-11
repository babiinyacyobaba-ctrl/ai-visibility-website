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
  // Starter は先行案内として扱います。
  // 公開LPでは即時決済・割引価格として見せず、提供条件は個別案内します。
  starter: {
    url: "https://forms.gle/S4bFwFQiU9LDbnFj9",
    method: "GET",
  },
  // 後方互換: 旧 starterBeta キーを残す。
  starterBeta: {
    url: "https://forms.gle/S4bFwFQiU9LDbnFj9",
    method: "GET",
  },
  proInquiry: {
    url: "https://forms.gle/R3HXcUo84myV4zT18",
    method: "GET",
  },
  // スポットレポートは現在、個別案内扱いです。
  spotDetailed: {
    url: "#contact",
    method: "GET",
  },
  spotBasic: {
    url: "#free-scan",
    method: "GET",
  },
};

// 公開価格表示用。即時決済・割引訴求は使わず、個別案内を基本にします。
const PRICING = {
  starter: {
    campaign: null,
    normal:   null,
    currency: "JPY",
    unit:     "提供条件は個別案内",
  },
  spotDetailed: {
    price:    "個別案内",
    normal:   null,
    currency: "JPY",
    unit:     "1回・個別案内",
  },
  spotBasic: {
    price:    "¥0",
    normal:   null,
    currency: "JPY",
    unit:     "1社・1URL",
    campaignEnd: null,
  },
};

const FREE_SCAN_CAMPAIGN = {
  limit: null,
  acceptedCount: null,
  status: "active", // active | waitlist | closed
};

// ============================================================
// OFFER STATE — Single Source of Truth
// ============================================================
// 現在、公開LPでは期限付き割引を表示しません。
// 旧campaign_renderer互換のため、期限をnullで保持します。
//
// 編集ルール:
const CAMPAIGN = {
  startDate: null,
  endDate:   null,

  // 自動延長（事前設定）
  autoExtendDays:   0,    // 0 = 延長しない / 31 = 1ヶ月延長 / 7 = 1週間延長
  maxExtensions:   12,    // 延長回数上限（暴走防止、12回 ≈ 1年）
  extensionsUsed:   0,    // cron が自動加算

  // 終了時動作
  autoRevertOnEnd: false,

  // 通知（Resend）
  notifyDaysBefore: [7, 3, 1, 0],
  notifyEmail: "ai-visibility-index@protonmail.com",
};

const PRICING_CAMPAIGN = {
  spotBasic: {
    price:    "¥0",
    normal:   null,
    suffix:   "1社・1URL",
    unit:     "1社・1URL",
  },
  spotDetailed: {
    price:    "個別案内",
    normal:   null,
    suffix:   "個別案内",
    unit:     "1回・個別案内",
  },
  starter: {
    price:    "先行案内",
    normal:   null,
    suffix:   "提供条件は個別案内",
    unit:     "提供条件は個別案内",
  },
};

// 通常表示用の互換設定
const PRICING_NORMAL = {
  spotBasic: {
    price:    "¥0",
    normal:   null,
    suffix:   "1社・1URL",
    unit:     "1社・1URL",
  },
  spotDetailed: {
    price:    "個別案内",
    normal:   null,
    suffix:   "個別案内",
    unit:     "1回・個別案内",
  },
  starter: {
    price:    "先行案内",
    normal:   null,
    suffix:   "提供条件は個別案内",
    unit:     "提供条件は個別案内",
  },
};

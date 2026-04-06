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
    prefillUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeBhpdu63jZZINhCEe4Lu4pM1pZ5ip0BNC7ID5TsRl4r6cjzw/viewform",
    method: "GET",
    entries: {
      company: "1317056138",
      service: "221172601",
      url: "340436159",
      email: "2038978171",
      industry: "1509246321",
      note: "1741963716",
      starterBetaOptIn: "437044494",
    },
  },
  starterBeta: {
    url: "https://forms.gle/S4bFwFQiU9LDbnFj9",
    method: "GET",
  },
  proInquiry: {
    url: "https://forms.gle/R3HXcUo84myV4zT18",
    method: "GET",
  },
};

const FREE_SCAN_CAMPAIGN = {
  limit: 20,
  acceptedCount: 0,
  status: "active", // active | waitlist | closed
};

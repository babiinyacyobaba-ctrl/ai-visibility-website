// config.js — public lead capture and contact settings
//
// 外部フォームは Google Forms / Apps Script / Formspree 等を想定しています。
// method は "GET" または "POST" を指定してください。
// 未設定の場合はメール問い合わせへフォールバックします。
//
// ※ このファイルはパブリックに配信されます。
//    シークレットキーは絶対に記載しないでください。

const CONTACT_EMAIL = "babiinya.cyobaba@protonmail.com";

const LEAD_FORMS = {
  freeScan: {
    url: "",
    method: "POST",
  },
  starterBeta: {
    url: "",
    method: "POST",
  },
  proInquiry: {
    url: "",
    method: "POST",
  },
};

const FREE_SCAN_CAMPAIGN = {
  limit: 20,
  acceptedCount: 0,
  status: "active", // active | waitlist | closed
};

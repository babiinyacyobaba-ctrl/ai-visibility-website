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
  starterBeta: {
    // Starter β 申込フォーム (Google Forms)
    // 仕様: operations/beta_signup_form_spec.md (Mira/Sage APPROVED 2026-04-11)
    // 導線: Founder が内容確認 → 24h 以内に Stripe 決済リンクをメール案内
    url: "https://forms.gle/nyCsrtvaisLByAPw6",
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

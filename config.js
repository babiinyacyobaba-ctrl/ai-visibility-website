// config.js — Stripe Payment Links
//
// Stripe の Payment Links ページ (https://dashboard.stripe.com/payment-links)
// で発行した URL をここに貼り付けてください。
//
// 例: "https://buy.stripe.com/xxxxxxxxxx"
//
// ※ このファイルはパブリックに配信されます。
//    シークレットキーは絶対に記載しないでください。
//    Payment Link URL は公開されても問題ありません。

const STRIPE_LINKS = {
  // スポット診断 ¥9,800
  spot: "https://buy.stripe.com/REPLACE_WITH_SPOT_LINK",

  // 業界ランキング ¥49,800
  ranking: "https://buy.stripe.com/REPLACE_WITH_RANKING_LINK",
};

// お問い合わせ先メールアドレス（カスタム調査プランで使用）
const CONTACT_EMAIL = "babiinya.cyobaba@protonmail.com";

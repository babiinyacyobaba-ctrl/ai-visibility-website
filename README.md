# ai-visibility-website

AI Visibility Index の Cloudflare Pages 用 Website。

## Current Funnel

- 主入口: 無料診断
- 次の一手: Starter（月額 ¥9,800 キャンペーン / ¥19,800 通常、Stripe Payment Link 直結）
- 高単価導線: Pro 相談

## Required Public Settings

`config.js` に以下を設定します。

- `CONTACT_EMAIL`
- `LEAD_FORMS.freeScan.url` — Google Forms
- `LEAD_FORMS.starter.url` — Stripe Payment Link
- `LEAD_FORMS.proInquiry.url` — Google Forms
- `PRICING.starter.{campaign,normal}` — 表示用の価格文字列

未設定時はメール導線にフォールバックします。
`starterBeta` キーは後方互換のため残していますが、新規コードは `starter` を参照してください。

## Security Notes

- `config.js` は公開配信されるため、秘密情報を入れない
- 外部フォームは顧客情報を扱うため、公開前に Security Lead 承認が必要
- Starter は consent modal 経由でのみ遷移させる（Sage §4 同意取得要件）
- 取得項目は `company / url / email / industry / note` の範囲に留める

## External links
- Free診断フォーム: https://forms.gle/UCBE67C5x8GdMyTE7
- Starter 決済 (Stripe Payment Link): https://buy.stripe.com/eVq7sL0nugwzd747AHaR203
- Pro相談フォーム: https://forms.gle/R3HXcUo84myV4zT18

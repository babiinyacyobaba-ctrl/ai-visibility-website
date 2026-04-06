# ai-visibility-website

AI Visibility Index の Cloudflare Pages 用 Website。

## Current Funnel

- 主入口: 無料診断
- 次の一手: Starter β 先行案内
- 高単価導線: Pro 相談

## Required Public Settings

`config.js` に以下を設定します。

- `CONTACT_EMAIL`
- `LEAD_FORMS.freeScan.url`
- `LEAD_FORMS.starterBeta.url`
- `LEAD_FORMS.proInquiry.url`

未設定時はメール導線にフォールバックします。

## Security Notes

- `config.js` は公開配信されるため、秘密情報を入れない
- 外部フォームは顧客情報を扱うため、公開前に Security Lead 承認が必要
- 取得項目は `company / url / email / industry / note / wants_starter` の範囲に留める

## Google Forms
Free診断フォーム: https://forms.gle/UCBE67C5x8GdMyTE7
Starter βフォーム: https://forms.gle/S4bFwFQiU9LDbnFj9
Pro相談フォーム: https://forms.gle/R3HXcUo84myV4zT18

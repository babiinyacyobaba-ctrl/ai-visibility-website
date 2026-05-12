# ai-visibility-website

> **Sunset 2026-05-06**: このプロジェクトは 2026年5月6日にサービス休止（mothball）状態に移行しました。
> 詳細・撤退理由・再利用可能資産については `wellbeing-infrastructure-ops/logs/sunset_2026-05-06.md` を参照してください。
> LP 全ページに休止バナーを追加し、Cloudflare Pages 上で表示されています。

AI Visibility Index の Cloudflare Pages 用 Website。

## Current Funnel

- 主入口: 無料診断
- 次の一手: Starter 先行案内（正式価格と提供条件は個別案内）
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
- Starter: 先行案内フォームまたは個別案内
- Pro相談フォーム: https://forms.gle/R3HXcUo84myV4zT18

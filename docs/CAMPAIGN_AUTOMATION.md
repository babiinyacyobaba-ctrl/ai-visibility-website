# Campaign Automation (Lv.2 SSOT)

**作成**: 2026-05-10
**目的**: キャンペーン期間終了時の不整合（4/30 期限切れ表記が販売継続中の LP に残る等）を再発防止する。

## 概要

`config.js` の `CAMPAIGN` を Single Source of Truth として、以下を自動化:

1. **クライアント側自動切替** — HTML が `data-*` 属性で markup されていれば、`endDate` を過ぎたら通常価格表示に自動切替（`assets/campaign_renderer.js`）
2. **GHA cron 自動延長** — `autoExtendDays > 0` なら期限到達時に自動延長して config.js を更新コミット
3. **GHA cron 通知** — `notifyDaysBefore` に該当する日に Resend でメール通知

## 編集ルール（Founder 用）

### キャンペーン延長したい

- 終了日を直接書き換える: `config.js` の `CAMPAIGN.endDate` を更新
- **または**: 事前に `autoExtendDays: 31` 等を設定 → 期限到達時に cron が自動延長

### キャンペーン終了させたい

- `autoExtendDays: 0` のまま → 終了日に自動的に通常価格表示に切替（HTML markup されている要素のみ）

### 即時終了させたい

- `endDate` を過去日（例: 昨日）に変更してコミット → 即反映

## HTML マーキング規約（追加していく）

`config.js` の値を反映させたい場所に以下属性を追加:

```html
<!-- 日付プレースホルダー -->
<span data-campaign-end-date></span>            <!-- "5月31日" -->
<span data-campaign-end-iso></span>             <!-- "2026-05-31" -->

<!-- 表示制御 -->
<div data-show-when="campaign-active">...</div>  <!-- 期間中のみ表示 -->
<div data-show-when="campaign-ended">...</div>   <!-- 終了後のみ表示 -->

<!-- 価格 (key = "spotBasic" | "spotDetailed" | "starter") -->
<span data-price="spotBasic"></span>             <!-- ¥0 or ¥2,980 -->
<span data-price-normal="spotBasic"></span>      <!-- 通常価格（line-through 用、終了後は非表示） -->
<span data-price-suffix="spotBasic"></span>      <!-- "5/31まで無料" or "1回・税込" -->
<span data-price-unit="spotBasic"></span>        <!-- unit 文字列 -->
```

`config.js` を読み込んで `assets/campaign_renderer.js` を `defer` 読み込みすれば自動レンダリング。

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `config.js` | SSOT。`CAMPAIGN` / `PRICING_CAMPAIGN` / `PRICING_NORMAL` を定義 |
| `assets/campaign_renderer.js` | クライアント側 DOM 注入。期間中/終了後で表示切替 |
| `.github/workflows/campaign_state_check.yml` | 毎日 00:00 JST cron + workflow_dispatch |
| `.github/scripts/campaign_state_check.js` | チェック本体（auto-extend / auto-notify） |

## 動作確認

ローカルでテスト:

```bash
DRY_RUN=true node .github/scripts/campaign_state_check.js
```

期限到達シミュレーション:

```bash
# config.js の endDate を昨日に変えて DRY_RUN
DRY_RUN=true node .github/scripts/campaign_state_check.js
```

GHA で手動実行: Actions → campaign-state-check → Run workflow → dry_run=true

## CAMPAIGN 設定リファレンス

| フィールド | 型 | 説明 |
|---------|-----|------|
| `startDate` | `"YYYY-MM-DD"` | 開始日（参考表示） |
| `endDate` | `"YYYY-MM-DD"` | 終了日（cron が自動更新） |
| `autoExtendDays` | `int` | 期限到達時の自動延長日数（0=延長しない） |
| `maxExtensions` | `int` | 延長回数上限（暴走防止） |
| `extensionsUsed` | `int` | 延長済み回数（cron が自動加算） |
| `autoRevertOnEnd` | `bool` | 終了後に通常価格表示に切替するか |
| `notifyDaysBefore` | `[int...]` | 終了 N 日前に通知（例: `[7, 3, 1, 0]`） |
| `notifyEmail` | `"<addr>"` | 通知先メール |

## 関連リポジトリの SSOT 連携（追加 PR で対応予定）

- `ai-visibility-index` (Streamlit β): `streamlit secrets` 経由で `CAMPAIGN_END_DATE` 読み込み
- `wellbeing-infrastructure-ops` (KPI script): 環境変数 `CAMPAIGN_END_DATE` で同様の参照

## ロールバック手順

万一問題発生時:

```bash
# config.js を旧値に戻す
git revert <commit-sha>

# または cron だけ無効化
# .github/workflows/campaign_state_check.yml の schedule をコメントアウト
```

## 既知の制限

1. ~~HTML 内に **`data-*` markup されていない 4/30 / 5/31 の文字列** は自動切替されない~~ → **Phase 2 完了 (PR #45)**: 主要4 LPs の date 参照は全て data-* markup 済
2. ~~SEO meta タグ・JSON-LD・OGP は静的なのでクローラーは古い日付を見る可能性~~ → **Phase 3 完了**: GHA cron auto-extend 時に HTML ファイル群（meta/JSON-LD含む）を regex 自動書き換え + コミット → Cloudflare Pages 再デプロイ → クローラーは新日付を取得
3. `config.js` regex パースは形式変更に脆弱。フィールド追加時は `.github/scripts/campaign_state_check.js` の `readConfig()` も更新が必要。
4. SVG asset (`assets/campaign_banner_spot_updated.svg`) の date 文字列は自動更新対象外（OGP は PNG `campaign_banner.png` 使用のため影響軽微）。

## Phase 3 実装詳細（2026-05-10）

GHA cron が auto-extend で `endDate` を更新する際、以下も同時に書き換え + コミット:

| 対象 | 書き換え内容 |
|------|------------|
| `campaign.html` / `pricing.html` / `legal.html` / `index.html` | data-* span 内テキスト + meta description/og/twitter + JSON-LD 内の "M/Dまで" / "M月D日まで" パターン |
| `config.js` | `endDate` + `extensionsUsed` |

これにより、JS 非対応の静的クローラー（archive.org、旧 Bingbot、SNS unfurler の一部）も最新日付を取得できる。

## 参考

- 起票: Issue #42 (LP 整合性 hotfix)
- 設計: Lv.2 仕様（Founder 確定 2026-05-10）
- 関連 PR: #43 (hotfix 4/30→5/31)

# =====================================================
# AI Visibility Website - CSP修正 Push スクリプト
# Google Forms iframe が表示されない問題の修正
# 実行方法: PowerShellを開き、このスクリプトを実行
# =====================================================

$repoPath = "C:\Users\babii\AI Visibility Index\codex\Company\cloned-website"
$remoteUrl = "https://github.com/babiinyacyobaba-ctrl/ai-visibility-website.git"
# Authentication: configure once via `gh auth login` or Git Credential Manager.
# NEVER embed a PAT in this file — it is committed to the repository.

Write-Host "=== CSP修正 Push (Google Forms iframe) ===" -ForegroundColor Cyan
Write-Host "対象フォルダ: $repoPath" -ForegroundColor Yellow

Set-Location $repoPath

# ユーザー設定
git config user.email "babiinya.cyobaba@gmail.com"
git config user.name  "babiinyacyobaba-ctrl"

# リモートURLを設定（認証は gh auth login または Credential Manager 経由）
git remote set-url origin $remoteUrl

# 変更をステージング
Write-Host "`nステージング中..." -ForegroundColor Green
git add _headers

# 変更内容を表示
Write-Host "`n--- 変更内容 ---" -ForegroundColor Cyan
git diff --cached _headers

# コミット
Write-Host "`nコミット中..." -ForegroundColor Green
git commit -m "Fix: Add docs.google.com to CSP frame-src to allow embedded Google Forms"

# プッシュ
Write-Host "`nGitHub にプッシュ中..." -ForegroundColor Green
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "completed Push!" -ForegroundColor Green
    Write-Host "Cloudflare Pages が自動で再デプロイされます。" -ForegroundColor Yellow
    Write-Host "サイト: https://ai-visibility-website.pages.dev/#free-scan" -ForegroundColor Cyan
} else {
    Write-Host "Push failed. Please check the error." -ForegroundColor Red
}

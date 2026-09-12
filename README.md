# AI Office

AI社員へ仕事を渡し、Vercel Workflowで耐久実行し、Postgresへ履歴と成果物を残す個人向けバーチャルオフィスです。

## AI社員
- **Chief** — 分解・委任・統合・最終判断
- **Scout** — Web調査・一次情報・反証
- **Draft** — 記事・企画書・編集
- **Audit** — 前提・誤り・リスク監査
- **Metric** — 比較・計算・意思決定
- **Forge** — ソフトウェア設計・コードレビュー

## 本番設計
- Next.js App Router + React
- AI SDK `ToolLoopAgent` + Vercel AI Gateway
- Vercel Workflowでブラウザの接続寿命からAI処理を分離
- Neon/Postgresをタスク台帳と成果物の正本にする
- `OFFICE_ACCESS_KEY` からHMACセッションを作成し、HttpOnly / SameSite=Strict Cookieで保護
- 状態変更APIは同一Originを確認
- AI社員ごとにツールを分離し、Web検索はScoutのみ
- `stepCountIs`、出力上限、タイムアウトで暴走を制限
- AI GatewayへZDRを要求し、実行tagを付与
- プロンプト全文をconsole logへ出さない

## 必要な環境変数
`.env.example` を参照してください。

- `OFFICE_ACCESS_KEY` — 必須。十分長いランダム値
- `DATABASE_URL` — 必須。VercelのNeon Integration推奨
- `AI_GATEWAY_API_KEY` — ローカルでは必須。Vercel OIDCを使える構成では省略可能
- `AI_MODEL` — 既定値 `openai/gpt-5.6-sol`

## 初回セットアップ
```bash
npm install
npm run db:init
npm run typecheck
npm run build
npm run dev
```

## Vercelへ出す順番
1. このGitHubリポジトリをVercel Projectへ接続
2. Vercel MarketplaceからNeonを接続
3. `OFFICE_ACCESS_KEY` をPreview / Productionへ登録
4. AI Gatewayを有効化
5. 本番DBに対して一度 `npm run db:init` を実行
6. Previewでログイン→タスク起動→完了→再読み込み後の履歴復元を確認
7. CIが通った同じ成果物をProductionへpromote

## 権限境界
現在、メール送信、SNS投稿、GitHub write、削除、購入、課金、公開デプロイなどの外部変更ツールは意図的に与えていません。外部副作用ツールを追加するときは、人間承認と監査ログを同時に追加してください。AI SDKのtool approvalまたはVercel Workflow hookを使う前提です。

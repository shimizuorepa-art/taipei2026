# Rotary v2 Vercel Preview Runbook

## Overview

このパッケージは確認専用コピーです。本体データ（`qr-app-v2/src/wireframe`）は編集していません。

## Build

```bash
npm run build
```

`src/wireframe` → `dist/` にコピーされます。

## Output Directory

`dist`

## Vercel Routes

| URL | 画面 |
|-----|------|
| `/` | 地区ナイト（index.html） |
| `/district-night` | 地区ナイト（index.html） |
| `/input` | 入力画面（name-input.html） |

## Dev Switch

通常アクセスでは非表示です。

### 表示方法

URLに `?dev=1` を付ける: `https://your-preview.vercel.app/?dev=1`

### ツールバー

画面下部に黒い半透明バーが出ます:

- **地区ナイト** — 地区ナイト画面へ移動
- **入力画面** — 入力画面へ移動
- **データ再読込** — 地区ナイト画面で氏名APIを再取得
- **OFF** — dev switchを非表示にする

### 永続化

`?dev=1` で一度開くと `localStorage.rotary_dev_switch=1` が保存され、以後はパラメータなしでもツールバーが表示されます。OFFボタンで解除できます。

## 入力更新の反映

### 同一ブラウザ内

入力画面で登録成功すると、自動的に地区ナイト画面へ通知されます（`BroadcastChannel` + `storage` event）。地区ナイト画面が `memberList`、`venue`、`checkin` を表示中であれば自動再描画されます。

### 別端末・別ブラウザ

自動通知は届きません。地区ナイト画面でdev toolbarの「データ再読込」を押すか、ページを再読み込みしてください。

## データソース

- 氏名データ: Cloud Functions上の既存データをそのまま使用
- Cloud Functions URL: コード内にハードコードされた既存URLを変更していません
- チェックイン: `localStorage` の `rotary_checkin_v1`（ブラウザローカル）

## セキュリティ注意

入力画面（`/input`、`/name-input.html`）はCloud Functionsへ実データを書き込みます。

`?dev=1` のdev switchは隠す機能であり、アクセス制御ではありません。

Vercel確認URLを第三者に共有する場合は、以下を検討してください:

- Vercel Preview Protection（認証付きプレビュー）
- Vercel Password Protection
- アクセス範囲の制限

## GitHubへのアップロード

このパッケージだけを独立repoとして扱ってください。

- `ai-dev-lab` 全体をpushしないこと
- 本体の作業notes（`qr-app-v2/notes/`）をpushしないこと
- このパッケージのルートを新規Git repoのルートにする

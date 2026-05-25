---
id: spreadsheet-sandbox-preview-db-20260525
title: Spreadsheet Sandbox Preview DB Design
date: 2026-05-25
type: design_note
scope: preview_only
---

# Spreadsheet Sandbox Preview DB Design

## Overview

Vercel preview用のデータストアとして、Google Spreadsheet + Apps Script Web App を使用する。本番のCloud Functionsとは完全に分離されたサンドボックス環境。

## Proposed Spreadsheet

- **Name**: `Rotary District Night Preview Sandbox 20260525`
- **Created URL**: https://docs.google.com/spreadsheets/d/1f9u0pLReRFhhGqR--6tD0jvxPuCTHUQ2dVnVHvzJIS4/edit
- **Spreadsheet ID**: `1f9u0pLReRFhhGqR--6tD0jvxPuCTHUQ2dVnVHvzJIS4`
- **Access**: オーナーのGoogleアカウントで管理
- **Sharing**: Apps Script Web Appのみがアクセス（ブラウザから直接Spreadsheetにはアクセスしない）

## Provisioning Status

- Spreadsheet file: created by Codex Google Drive connector.
- Tabs: `person_names`, `checkins`, `meta` created.
- Headers: created.
- Apps Script template: `tools/apps_script/preview_spreadsheet_api/Code.gs` now has the real `SPREADSHEET_ID`.
- Apps Script Web App: deployed by owner.
- Web App URL: https://script.google.com/macros/s/AKfycbyNNHtS2yW0fOTIoPN3f1G43kHUeqzdNmWk2LGw2IXal6mhnzPTUZmSPXABhd-rXm5hRw/exec
- Vercel preview config: wired in `src/wireframe/preview-config.js`, pushed to GitHub, and verified on public Vercel.
- Browser-origin API check: GET/POST/delete passed against the preview-only Spreadsheet; final test row cleanup confirmed empty state.

## Required Tabs

### `person_names`

| Column | Type | Description |
|--------|------|-------------|
| `event_id` | string | `district-night-2026-preview` |
| `table_id` | string | テーブル番号 (e.g. `19`, `S1`) |
| `seat` | integer | 席番号 (1-10) |
| `surname` | string | 姓 |
| `given` | string | 名 |
| `person` | string | 表示名 (`姓 名`) |
| `club` | string | クラブ名スナップショット (optional) |
| `updated_at` | string | ISO 8601 timestamp |
| `updated_by` | string | 更新元 (optional) |

### `checkins`

| Column | Type | Description |
|--------|------|-------------|
| `event_id` | string | `district-night-2026-preview` |
| `table_id` | string | テーブル番号 |
| `seat` | integer | 席番号 |
| `status` | string | `checked_in` / `not_checked_in` |
| `club` | string | クラブ名スナップショット |
| `person` | string | 氏名スナップショット |
| `registered_at` | string | チェックイン登録時刻 |
| `cancelled_at` | string | 取消時刻 (nullable) |
| `updated_at` | string | 最終更新時刻 |

### `meta`

| Column | Type | Description |
|--------|------|-------------|
| `key` | string | config key |
| `value` | string | config value |

## API Contract (Apps Script Web App)

### GET (person names)

Request:
```
GET https://<apps-script-web-app-url>?action=get_names
```

Response (same shape as production):
```json
{
  "version": 1,
  "generated_at": "2026-05-25T12:00:00Z",
  "tables": {
    "19": [
      { "seat": 3, "surname": "テスト", "given": "太郎", "person": "テスト 太郎" }
    ]
  }
}
```

### POST (person names upsert)

Request:
```
POST https://<apps-script-web-app-url>
Content-Type: application/json

{
  "action": "upsert_names",
  "event_id": "district-night-2026-preview",
  "club": "あま",
  "tables": {
    "19": [{ "seat": 3, "surname": "テスト", "given": "太郎", "person": "テスト 太郎" }]
  }
}
```

### DELETE (person name)

Request:
```
POST https://<apps-script-web-app-url>
Content-Type: application/json

{
  "action": "delete_name",
  "table": "19",
  "seat": 3
}
```

Note: Apps Script Web App does not support HTTP DELETE method directly. Use POST with `action: "delete_name"`.

### GET (checkins) — future

```
GET https://<apps-script-web-app-url>?action=get_checkins&event_id=district-night-2026-preview
```

Response shape: same as backend handoff memo proposal.

## Deployment Notes

1. Created spreadsheetを開く: https://docs.google.com/spreadsheets/d/1f9u0pLReRFhhGqR--6tD0jvxPuCTHUQ2dVnVHvzJIS4/edit
2. メニュー `拡張機能` → `Apps Script` を開く
3. `tools/apps_script/preview_spreadsheet_api/Code.gs` の内容をApps Scriptエディタに貼り付け
4. Web Appとしてデプロイ（実行ユーザー: 自分、アクセス: 全員）
5. 初回承認画面で、このpreview sandbox用Apps Scriptの権限を承認
6. デプロイURLを `preview-config.js` の `PREVIEW_APPS_SCRIPT_URL` に設定
7. Vercel preview再デプロイ

Current deployed URLs:

- Input: https://taipei2026.vercel.app/input?dev=1
- District Night: https://taipei2026.vercel.app/district-night?dev=1

Deployment commits:

- `7062c58` — Connect preview to Spreadsheet sandbox.
- `ea6055b` — Harden Apps Script preview POST.

## Security Notes

- Preview sandboxは本番データと完全に分離
- Apps Script Web Appは「全員がアクセス可能」設定だが、preview URLを知らない限りアクセス不可
- Spreadsheetの共有設定はオーナーのみ
- テストデータは自由に入力・削除可能

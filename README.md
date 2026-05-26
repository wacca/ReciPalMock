# ReciPalMock

React + Vite + MUI 製の経費・勤怠・休暇申請モックアプリ（プロダクト名: Recrova）。  
画面遷移・申請ワークフロー・ロール別表示制御の検証用フロントエンドです。バックエンドは持たず、すべてフロントのモック状態で動きます。

公開デモ: <https://wacca.github.io/ReciPalMock>

> エンドユーザー向けの機能説明は [USAGE.md](USAGE.md) を参照してください。

---

## 必要環境

- Node.js 18 以上を推奨
- npm 9 以上

## セットアップ

```bash
npm install
```

## 開発サーバ起動

```bash
npm run dev
```

Vite の HMR 付き開発サーバが起動します。デフォルトは <http://localhost:5173>。

## ビルド

```bash
npm run build       # dist/ に静的ファイルを出力
npm run preview     # ビルド成果物をローカルでプレビュー
```

## Lint

```bash
npm run lint
```

## GitHub Pages へのデプロイ

`package.json` の `homepage`（`https://wacca.github.io/ReciPalMock`）と `gh-pages` を利用します。

```bash
npm run deploy      # predeploy で build → dist/ を gh-pages ブランチに publish
```

本番ビルドでは `vite.config.js` の `base: '/ReciPalMock/'` と `BrowserRouter` の `basename` を揃え、GitHub Pages のサブパス配信でアプリ内遷移と静的アセット参照が同じ配下を向くようにしています。

---

## ディレクトリ構成

```
src/
├── App.jsx                     # ルーティング・メニュー定義・ロールガード
├── main.jsx                    # エントリポイント
├── App.css / index.css         # グローバルスタイル
├── features/                   # 業務機能ごとに分割
│   ├── auth/                   # ログイン画面
│   ├── dashboard/              # ダッシュボード
│   ├── expense/                # 経費 申請 / 履歴 / 承認 / 承認フロー設定 / 検索
│   ├── leave/                  # 勤怠申請（休暇等） 申請 / 履歴 / 承認 / 承認フロー設定 / 検索
│   ├── attendance/             # 月次タイムシートの入力 / 承認 / 管理
│   └── settings/               # アカウント / マスタ / 祝日 / 権限 / アラート / フロー設定メニュー
└── shared/
    ├── ui/                     # 横断 UI コンポーネント（PageScaffold / Section / StatusChip 等）
    │   ├── SideRail.jsx        # 左サイドレール（PC）
    │   ├── BottomNav.jsx       # 下部ナビ（モバイル）
    │   ├── TopStrip.jsx        # ヘッダ／パンくず／ロール切替／表示設定
    │   ├── CommandPalette.jsx  # Ctrl/⌘+K のコマンドパレット
    │   ├── PageScaffold.jsx    # eyebrow / title / actions の標準ページ枠
    │   ├── Section.jsx         # トーン付きセクション枠
    │   ├── StatusChip.jsx      # 申請ステータス共通チップ
    │   ├── createAppTheme.js   # MUI テーマ
    │   ├── tokens.js           # デザイントークン
    │   └── ...
    ├── components/             # 横断ダイアログ / 監査タイムライン
    │   ├── AdminConfirmDialog.jsx
    │   ├── ApplicationHistoryTimeline.jsx  # 操作履歴の時系列表示
    │   ├── ReceiptPreviewDialog.jsx        # 領収書プレビュー（画像 / PDF）
    │   └── UnapproveDialog.jsx             # 承認取消ダイアログ
    └── utils/
        ├── permissions.js          # ROLES / PERMISSIONS / hasPermission
        ├── userDirectory.js        # デモユーザー定義
        ├── applicationHistory.js   # 積み上げ式 操作履歴ユーティリティ
        ├── holidayStore.js         # 祝日マスタの永続化 / キャッシュ
        ├── holidays.js             # 祝日判定の参照ヘルパー
        ├── csvHelpers.js
        └── dateRangeHelpers.js
```

### 機能の追加方法

1. `src/features/<feature>/` に画面コンポーネントを追加。
2. `App.jsx` の `lazy(...)` でインポートし、`menuGroups` に項目を追加。`permissions` プロパティで表示要件を指定。
3. 必要なら `shared/utils/permissions.js` の `PERMISSIONS` に新しい権限を追加し、`ROLE_PERMISSIONS` に割り当てる。

### ルーティング・認可

- `react-router-dom` を使用。すべて `App.jsx` で集約定義。
- `<Guard role={...} permission={...}>` で経路ごとの権限チェックを行い、権限がなければ `/dashboard` にリダイレクト。
- メニュー側も `hasAnyPermission` で同じ権限定義に基づき動的に絞り込み。

### 状態管理

- 各 feature 配下の `*Store.js`（例: `expenseApplicationStore.js`、`leaveApplicationStore.js`、`attendanceStore.js`）にモック状態を保持。
- 永続化は `localStorage` を一部利用（コマンドパレットの履歴など）。

### スタイル

- MUI v6 + Emotion。
- 色・余白・影は `src/shared/ui/tokens.js` と CSS カスタムプロパティ（`var(--surface-base)` 等）で集約管理。

---

## 主要依存

- React 18
- Vite 8
- MUI v6（`@mui/material` / `@mui/icons-material`）
- Emotion 11
- React Router v7
- gh-pages（デプロイ）

## ライセンス

[LICENSE](LICENSE) を参照。

# Recrova デザイン判断ログ

> このドキュメントは **モック開発と並行して育てる** 軽量ガイドライン。
> 完成後の本格 Design System(Figma/Storybook 等) の **下書き** にもなる。
> 判断には常に **why** を残すこと。例外は許容するが、その場合も理由を書き足す。

---

## 1. 基本原則

1. **判断の根拠を残す**: なぜそうしたかをコード or このドキュメントに書く
2. **既存パターンを優先**: 同じ機能が既にあれば真似る。違うやり方が必要なら理由を本ドキュメントに追記
3. **密度より一貫性**: 「ここだけ詰めたい」は禁物。コンテキスト単位で揃える
4. **ハードコード禁止**: 色・余白・角丸はトークンで指定する

---

## 2. デザイントークン

### 2.1 色

| 用途 | トークン | ソフト背景 | 主な意味 |
|---|---|---|---|
| プライマリ | `--accent-primary` | `--accent-primary-soft` | アクション・選択中 |
| iris(青紫) | `--accent-iris` | `--accent-iris-soft` | 申請中・土曜・装飾 |
| leaf(緑) | `--accent-leaf` | `--accent-leaf-soft` | 承認済・正の差分 |
| amber(黄橙) | `--accent-amber` | `--accent-amber-soft` | 警告・残業・下書き |
| rose(赤) | `--accent-rose` | `--accent-rose-soft` | 差戻し・祝日・日曜・負の差分 |
| slate(灰) | `--accent-slate` | `--accent-slate-soft` | 取消・無効・未作成 |

### 2.2 面・文字

- 背景: `--surface-base`(ページ) / `--surface-raised`(カード) / `--surface-sunken`(凹) の3段
- 文字: `--ink-primary`(本文) / `--ink-secondary`(補助) / `--ink-tertiary`(注釈)

### 2.3 形

- 角丸: `--radius-md` / `--radius-lg` / `--radius-pill`
- 影: `--shadow-1`(カード標準) / `--shadow-2`(ホバー・sticky) / `--shadow-3`(モーダル)

### 2.4 ハードコード禁止例

```jsx
// NG
sx={{ background: '#F0F4FF', borderRadius: 12, color: '#9CA3AF' }}

// OK
sx={{ background: 'var(--accent-iris-soft)', borderRadius: 'var(--radius-md)', color: 'var(--ink-tertiary)' }}
```

---

## 3. ステータス表示

### 3.1 必ず `StatusChip` を使う

[src/shared/ui/StatusChip.jsx](src/shared/ui/StatusChip.jsx) に承認状態の単一実装あり。

```jsx
import StatusChip from '../../shared/ui/StatusChip';
<StatusChip status="申請中" size="sm" />
```

自前で Chip を組まないこと。理由: 色・アイコン・ラベルが画面ごとにバラついた過去がある。

### 3.2 状態の色対応

| 状態 | キー | 色 |
|---|---|---|
| 申請中 | `pending` | iris |
| 承認済 | `approved` | leaf |
| 差戻し | `rejected` | rose |
| 取消 | `cancelled` | slate |
| 下書き | `draft` | sunken/tertiary |

---

## 4. フォーム

### 4.1 helperText の使い分け

[ここは現状未統一だがコンテキスト別で運用する]

| コンテキスト | 方式 | 例 |
|---|---|---|
| テーブル/グリッド内のインライン編集 | **エラー時のみ表示** | 月次タイムシート、各種承認画面 |
| 独立フォーム | **空白スペース予約**(' ' helperText) | Login, ReminderSettings, LeaveApplication |
| 常時ガイダンスが意味あるフィールド | **常時メッセージ**(エラー時に文言差替) | UnapproveDialog, 時間休のhours欄 |

理由: テーブルは密度優先(31行×20pxシフトは大きい)、フォームはレイアウト安定優先。

### 4.2 エラー表示

- フィールド単位: `error` prop + helperText(コンテキスト別)
- 画面トップ: 件数バッジ付き Alert + 該当行ジャンプボタン (例: 月次タイムシート)
- リアルタイムバリデーション必須。submit時に初めて出さない

### 4.3 時刻入力

- `type="time"` + `inputProps={{ step: 60 }}` を基本
- 良く使う時刻は **クイックチップ** で補助 (モバイル/長フォーム): `09:00 / 09:30 / 10:00` 等

### 4.4 オートセーブ

下書きステータス時のみ・2秒デバウンス・エラー時はスキップ・`beforeunload` 警告を併用。
保存タイミングは Snackbar かステータスバナーで明示する。

---

## 5. テーブル

### 5.1 既定列を絞り、列表示トグルを置く

12列を初期表示しない。よく使う列だけ表示し、`列表示` メニューで詳細列を切り替える。
状態は localStorage に保存(キーは `<feature>VisibleColumns_v1`)。

### 5.2 行高

- インライン編集セルの helperText は常時スペース確保しない(行が肥大化する)
- multiline TextField は既定 `maxRows={1}`、フォーカス時に `maxRows={3}` 展開
- `size="small"` の Table を採用

### 5.3 行アクション

- 行末に `⋮` IconButton で Menu を出す
- メニュー項目は最大 5 個まで。それ以上は別画面 or ダイアログへ

### 5.4 sticky 要素

- Header: `Table stickyHeader` を使う
- フッタ集計: テーブルではなく **画面下部の sticky サマリーバー** で。`Section` の外、最下層に置く

### 5.5 今日マーカー / 期間マーカー

- 該当行に左ボーダー + `今日` Chip
- 初回マウントで `scrollIntoView({ block: 'center' })`

---

## 6. レイアウト

### 6.1 ページ構造

`PageScaffold` でラップする。eyebrow / title / subtitle / actions が標準スロット。

```jsx
<PageScaffold eyebrow="勤怠" title="月次タイムシート" subtitle="..." actions={<>...</>}>
    <Section padded>...</Section>
</PageScaffold>
```

### 6.2 Section の使い方

- `padded` がデフォルト ON
- `tone` で `raised | sunken | primary | iris | amber | leaf` を選ぶ
- Section をネストしない(余白がうるさくなる)

### 6.3 レスポンシブ

- 中〜大画面(md以上): テーブル
- 小画面(md未満): カード表示にフォールバック
- `display: { xs: 'none', md: 'block' }` のような切り替え方を統一して使う

---

## 7. ナビゲーション

### 7.1 メニュー追加の判断

新メニューを足す前に、**画面内ナビで解決できないか** を検討する。

例: 月次勤怠の「履歴」は独立メニューにせず、画面内の「年内12ヶ月ステータス帯」で完結させた。

### 7.2 命名

- 「**◯◯入力**」より「**◯◯**」(入力と参照を兼ねるなら入力を冠さない)
- 検索キーワードに **日本語別名** を含める (例: `keywords: 'holiday 祝日 休業日'`)
- subtitle で **何ができるか** を1行で

### 7.3 期間操作

- 日付入力(`type=date`)より **ペジネーター** (`◀ 期間 ▶` + 「今へ」ボタン) を優先
- 月次系画面では年/月ペジネーターを必ず置く

---

## 8. 確認ダイアログ

`AdminConfirmDialog` を使う。直接 MUI Dialog を組まない。

- 不可逆操作(削除/クリア/締め変更): `confirmColor="warning"`
- 通常の確認(申請/承認): `confirmColor="primary"`
- メッセージで **何が起きるか** と **元に戻せるか** を必ず明示

---

## 9. 通知

- 成功・警告・情報: `Snackbar + Alert`(2.5秒自動消失)
- 永続的な状態: `Section` 内 or ページトップの `Alert`
- Toast の連発は避ける(複数操作をまとめて 1 件で報告)

---

## 10. アクセシビリティ

- アイコンのみのボタンは `aria-label` 必須
- ステータス帯など複数要素のグループには `role="group"` + `aria-label`
- 連続した同種要素(月チップなど)は `Tooltip` で詳細補足
- フォーカス可能な要素は外周に視認できるアウトラインを残す(MUIデフォルトを潰さない)

---

## 11. データ永続化

### 11.1 localStorage

- モックの暫定保存先
- キーは `<feature>_v<n>` 形式 (例: `attendanceTimesheets_v2`)
- スキーマ変更時はキー番号を bump して旧データを破棄
- 個人情報を入れない(モック前提でもクセを付けない)

### 11.2 マスタ系データ

- 静的データから始める → ストア化 → 管理画面 → DB/API へ段階移行
- ストアレイヤを必ず挟む(`src/shared/utils/<feature>Store.js`)
- レコードに `source` フィールドを持たせる(例: 祝日マスタの `legal | company | adjusted`)

---

## 12. 数値表現

- 数値・時刻は `fontVariantNumeric: 'tabular-nums'` で等幅化
- 時間は `HH:MM` 表示(`8:00` のように先頭ゼロを省く場合もあるが画面内で混在禁止)
- 日時は `toLocaleString()` 任せ(JPロケール想定)
- 差分・増減は **符号と色** を両方使う(色だけだと色覚多様性に弱い)

---

## 13. 「やらないこと」リスト

- 絵文字を UI 内に出さない(ステータス・通知・コピーで気を抜かない)
- 自前 z-index の手書き禁止(レイヤトークンを定義したらそれを使う)
- 既存画面の余白パターンを破らない(`Section` の padded を勝手にオフにしない)
- `<Section>` をネストしない
- 「Loading…」スピナーで覆い隠さない。可能なら Skeleton を使う
- 確認ダイアログを 2 段重ねしない
- 色だけでステータスを伝えない(必ずラベルかアイコン併用)
- TextField を ` ` で擬似的にスペース確保する → コンテキスト別に決める(§4.1)
- 自前で `StatusChip` 相当を組まない(§3.1)

---

## 14. 例外を入れたとき

例外を作るときは:
1. このドキュメントの該当節に **追記** する
2. なぜその例外が必要かを書く
3. PR 説明に「DESIGN_NOTES.md 更新」と書く

例外が3つを超えたら、原則の方を見直すサイン。

---

## 改訂履歴

- 初版: 2026-05-26 — モック開発中の判断を初期化(月次タイムシート/祝日マスタ実装後)

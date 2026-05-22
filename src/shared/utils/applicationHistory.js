// 申請のライフサイクル監査用：積み上げ式（追記のみ）の履歴ユーティリティ。
// 既存エントリは UPDATE / DELETE せず、状態変化のたびに 1 件追加する。

export const HISTORY_EVENTS = {
    SUBMIT: 'submit',         // 申請者が提出
    APPROVE: 'approve',       // 承認者が承認
    REJECT: 'reject',         // 承認者が差戻し（mock では差戻し=拒否を兼ねる）
    SENDBACK: 'sendback',     // 承認者が修正依頼で差戻し（reject の別名扱い）
    WITHDRAW: 'withdraw',     // 申請者が取り下げ
    UNAPPROVE: 'unapprove',   // 承認の取消（誤承認のリカバリ）
    EDIT: 'edit',             // 申請者が内容を修正
};

const EVENT_LABELS = {
    submit: '申請を提出しました',
    approve: '申請を承認しました',
    reject: '申請を差戻しました',
    sendback: '申請を差戻しました',
    withdraw: '申請を取り下げました',
    unapprove: '承認を取り消しました',
    edit: '申請内容を修正しました',
};

export const getHistoryEventLabel = (eventType) => EVENT_LABELS[eventType] || eventType;

/**
 * 履歴エントリを生成する。実 DB では別テーブルへの INSERT 相当。
 *
 * @param {Object} input
 * @param {string} input.eventType   HISTORY_EVENTS のいずれか
 * @param {string} input.actorLabel  実行者の表示名（例: "由引 安人(ubiast@univa.tech)"）
 * @param {string} [input.actorRole] 実行時点のロール（後でロールが変わっても証跡として残す）
 * @param {string} [input.fromStatus] 遷移前ステータス
 * @param {string} [input.toStatus]   遷移後ステータス
 * @param {string} [input.comment]    理由・コメント
 */
export const createHistoryEntry = ({
    eventType,
    actorLabel,
    actorRole = '',
    fromStatus = '',
    toStatus = '',
    comment = '',
}) => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    eventType,
    actorLabel: actorLabel || '',
    actorRole,
    fromStatus,
    toStatus,
    comment: comment || '',
    at: new Date().toISOString(),
});

/**
 * 履歴配列に追記する純粋関数。既存エントリは絶対に変更しない。
 */
export const appendHistory = (history, entry) => {
    const list = Array.isArray(history) ? history : [];
    return [...list, entry];
};

/**
 * 配列を時系列（昇順）でソートして返す。表示用。
 */
export const sortHistoryAsc = (history) => (
    [...(history || [])].sort((a, b) => (a.at || '').localeCompare(b.at || ''))
);

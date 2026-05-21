import { useState, useEffect } from 'react';
import {
    TextField, Button, Typography, Box, MenuItem,
    Dialog, DialogContent, Snackbar, Alert, IconButton, Tooltip, Stack,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import {
    EXPENSE_CATEGORIES,
    PAYMENT_METHODS,
    buildExpenseApplication,
    emptyExpenseRow,
    formatYen,
    getExpenseApplicationTotal,
    loadExpenseApplications,
    normalizeExpenseRow,
    saveExpenseApplications,
} from './expenseApplicationStore';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip from './ui/StatusChip.jsx';

const hasExpenseRowInput = (row = {}) =>
    ['date', 'description', 'destination', 'category', 'amount', 'receiptName', 'receiptPreview']
        .some((field) => String(row[field] ?? '').trim() !== '');

function ApplicationForm({ userId }) {
    const location = useLocation();
    const [formDataList, setFormDataList] = useState([emptyExpenseRow()]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [drafts, setDrafts] = useState([]);
    const [selectedDraftId, setSelectedDraftId] = useState('new');
    const [mode, setMode] = useState('list');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('expenseDrafts') || '[]');
        setDrafts(saved);
    }, []);

    useEffect(() => {
        if (!location.state?.startNew) return;
        setSelectedDraftId('new');
        setFormDataList([emptyExpenseRow()]);
        setMode('edit');
    }, [location.state]);

    const handleChange = (index, e) => {
        const { name, value } = e.target;
        const next = [...formDataList];
        next[index][name] = value;
        setFormDataList(next);
    };

    const deleteFieldsAt = (i) => {
        const next = formDataList.filter((_, x) => x !== i);
        setFormDataList(next.length > 0 ? next : [emptyExpenseRow()]);
        setSnackbar({ open: true, message: '明細行を削除しました' });
    };
    const handleDeleteFields = (i) => {
        if (hasExpenseRowInput(formDataList[i])) setDeleteTargetIndex(i);
        else deleteFieldsAt(i);
    };
    const handleDeleteFieldsConfirm = () => {
        if (deleteTargetIndex === null) return;
        deleteFieldsAt(deleteTargetIndex);
        setDeleteTargetIndex(null);
    };

    const handleReceiptUpload = (i, e) => {
        const file = e.target.files[0];
        if (file) {
            const next = [...formDataList];
            next[i].receiptName = file.name;
            next[i].receiptPreview = URL.createObjectURL(file);
            setFormDataList(next);
        }
    };

    const handleSaveDraft = () => {
        const id = selectedDraftId === 'new' ? `draft_${Date.now()}` : selectedDraftId;
        const newDraft = { id, formDataList: formDataList.map(normalizeExpenseRow), updated: new Date().toISOString() };
        const next = selectedDraftId === 'new' ? [...drafts, newDraft] : drafts.map((d) => (d.id === id ? newDraft : d));
        setDrafts(next);
        localStorage.setItem('expenseDrafts', JSON.stringify(next));
        setSelectedDraftId(id);
        setSnackbar({ open: true, message: '下書きを保存しました' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const app = buildExpenseApplication({ rows: formDataList, draftId: selectedDraftId, applicantId: userId });
        const apps = loadExpenseApplications();
        saveExpenseApplications([app, ...apps]);
        if (selectedDraftId !== 'new') {
            const next = drafts.filter((d) => d.id !== selectedDraftId);
            setDrafts(next);
            localStorage.setItem('expenseDrafts', JSON.stringify(next));
        }
        setSelectedDraftId('new');
        setFormDataList([emptyExpenseRow()]);
        setSnackbar({ open: true, message: '経費申請を送信しました' });
        setMode('list');
    };

    const handleSelectDraft = (id) => {
        setSelectedDraftId(id);
        setMode('edit');
        const draft = drafts.find((d) => d.id === id);
        if (draft) {
            setFormDataList(draft.formDataList.map((r) => ({
                ...emptyExpenseRow(),
                ...r,
                paymentMethod: r.paymentMethod || draft.paymentType || '個人立替払用',
            })));
        }
    };

    const handleNew = () => {
        setSelectedDraftId('new');
        setFormDataList([emptyExpenseRow()]);
        setMode('edit');
    };

    const handleAddRow = () => {
        const last = formDataList[formDataList.length - 1];
        const inheritedPaymentMethod = last?.paymentMethod || '個人立替払用';
        setFormDataList([...formDataList, { ...emptyExpenseRow(), paymentMethod: inheritedPaymentMethod }]);
    };

    const currentTotal = getExpenseApplicationTotal({ details: formDataList });
    const filledCount = formDataList.filter(hasExpenseRowInput).length;

    if (mode === 'list') {
        return (
            <PageScaffold
                eyebrow="申請"
                title="経費申請の下書き"
                subtitle="作成中の下書きを編集・送信します。送信後は経費履歴・承認画面に反映されます。"
                actions={(
                    <Button variant="contained" color="primary" startIcon={<AddRoundedIcon />} onClick={handleNew}>
                        新規作成
                    </Button>
                )}
            >
                <Section padded>
                    {drafts.length === 0 ? (
                        <Box sx={{ paddingBlock: 4, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
                            <ReceiptLongRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                            <Typography variant="body2" sx={{ mt: 1 }}>下書きはありません。</Typography>
                            <Typography variant="caption">右上の「新規作成」から始めましょう。</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1.25}>
                            {drafts.map((draft) => (
                                <Box
                                    key={draft.id}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: '160px 140px 1fr auto' },
                                        gap: 1.5,
                                        alignItems: 'center',
                                        paddingInline: 2,
                                        paddingBlock: 1.5,
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--surface-sunken)',
                                        transition: 'var(--motion-fast)',
                                        '&:hover': { background: 'var(--accent-primary-soft)' },
                                    }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <StatusChip status="draft" size="sm" />
                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                            {draft.updated ? new Date(draft.updated).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                        {Array.from(new Set((draft.formDataList || []).map((r) => r.paymentMethod).filter(Boolean))).join(' / ') || draft.paymentType || '-'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'var(--ink-primary)' }}>
                                        {draft.formDataList?.[0]?.description || '(内容未入力)'}
                                    </Typography>
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <Tooltip title="編集">
                                            <IconButton onClick={() => handleSelectDraft(draft.id)}><EditRoundedIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Section>
                <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                    <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
                </Snackbar>
            </PageScaffold>
        );
    }

    return (
        <PageScaffold
            eyebrow="申請"
            title="経費申請"
            subtitle="領収書と明細を入力します。下書き保存して、後でまとめて送信も可能です。"
            actions={(
                <>
                    <Button variant="text" startIcon={<ArrowBackRoundedIcon />} onClick={() => setMode('list')} sx={{ color: 'var(--ink-tertiary)' }}>
                        一覧に戻る
                    </Button>
                    <Button variant="outlined" color="primary" startIcon={<SaveRoundedIcon />} onClick={handleSaveDraft}>
                        下書き保存
                    </Button>
                    <Button form="expense-form" type="submit" variant="contained" color="primary" startIcon={<SendRoundedIcon />}>
                        送信
                    </Button>
                </>
            )}
        >
            <Box
                sx={{
                    position: 'sticky',
                    top: 'var(--top-strip-h)',
                    zIndex: 5,
                    paddingInline: 2,
                    paddingBlock: 1.25,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-overlay)',
                    boxShadow: 'var(--shadow-1)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={3} flexWrap="wrap">
                    <Stat label="明細" value={`${formDataList.length}件`} tone="primary" />
                    <Stat label="入力済み" value={`${filledCount}件`} tone="leaf" />
                    <Stat label="合計" value={formatYen(currentTotal)} tone="iris" wide />
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', maxWidth: 280, textAlign: 'right' }}>
                        送信後は経費履歴・承認画面に反映されます。
                    </Typography>
                </Stack>
            </Box>

            <Box component="form" id="expense-form" onSubmit={handleSubmit}>
                <Stack spacing={1.5}>
                    {formDataList.map((formData, index) => (
                        <Section
                            key={index}
                            padded
                            sx={{ background: 'var(--surface-raised)', animation: 'recrovaFloatIn 200ms cubic-bezier(.2,.8,.2,1)' }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 'var(--radius-pill)',
                                        background: 'var(--surface-sunken)',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: 'var(--ink-tertiary)',
                                        flexShrink: 0,
                                    }}
                                >
                                    {index + 1}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {formData.description || '内容未入力'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                        {formData.date || '日付未入力'} ・ {formData.category || 'カテゴリ未選択'}
                                    </Typography>
                                </Box>
                                {formData.amount && (
                                    <Typography sx={{ fontWeight: 700, color: 'var(--accent-iris)' }} className="tabular-nums">
                                        {formatYen(formData.amount)}
                                    </Typography>
                                )}
                                <TextField
                                    select
                                    label="支払方法"
                                    name="paymentMethod"
                                    value={formData.paymentMethod || '個人立替払用'}
                                    onChange={(e) => handleChange(index, e)}
                                    size="small"
                                    sx={{ minWidth: 180 }}
                                >
                                    {PAYMENT_METHODS.map((method) => (
                                        <MenuItem key={method} value={method}>
                                            {method}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Tooltip title="この行を削除">
                                    <IconButton color="error" size="small" onClick={() => handleDeleteFields(index)}>
                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: '1fr 1fr',
                                        md: 'repeat(6, minmax(0, 1fr))',
                                    },
                                    gap: 1.5,
                                }}
                            >
                                <Box sx={{ gridColumn: { md: 'span 1' } }}>
                                    <TextField fullWidth label="日付" type="date" InputLabelProps={{ shrink: true }} name="date" value={formData.date} onChange={(e) => handleChange(index, e)} required />
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 2' } }}>
                                    <TextField fullWidth label="内容" name="description" value={formData.description} onChange={(e) => handleChange(index, e)} required />
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 2' } }}>
                                    <TextField fullWidth label="用途・行き先" name="destination" value={formData.destination} onChange={(e) => handleChange(index, e)} required />
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 1' } }}>
                                    <TextField fullWidth select label="費目" name="category" value={formData.category} onChange={(e) => handleChange(index, e)} required>
                                        {EXPENSE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </TextField>
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 2' } }}>
                                    <TextField
                                        fullWidth
                                        label="金額"
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={(e) => handleChange(index, e)}
                                        required
                                        InputProps={{ sx: { fontVariantNumeric: 'tabular-nums', fontWeight: 600 } }}
                                    />
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 4' } }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Button variant="outlined" component="label" startIcon={<UploadFileRoundedIcon />} sx={{ borderStyle: 'dashed', maxWidth: 360, width: '100%' }}>
                                            {formData.receiptName ? '領収書を変更' : '領収書をアップロード'}
                                            <input type="file" hidden onChange={(e) => handleReceiptUpload(index, e)} />
                                        </Button>
                                        {formData.receiptPreview && (
                                            <Box
                                                onClick={() => { setSelectedReceipt(formData.receiptPreview); setOpenDialog(true); }}
                                                sx={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 'var(--radius-md)',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    boxShadow: 'var(--shadow-1)',
                                                    transition: 'var(--motion-fast)',
                                                    '&:hover': { transform: 'scale(1.05)', boxShadow: 'var(--shadow-2)' },
                                                }}
                                            >
                                                <img src={formData.receiptPreview} alt="領収書プレビュー" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </Box>
                                        )}
                                    </Stack>
                                    {formData.receiptName && (
                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', mt: 0.5, display: 'block' }}>
                                            {formData.receiptName}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Section>
                    ))}
                </Stack>
                <Button
                    variant="outlined"
                    startIcon={<AddRoundedIcon />}
                    onClick={handleAddRow}
                    sx={{ borderStyle: 'dashed', width: '100%', paddingBlock: 1.5, mt: 2, color: 'var(--ink-tertiary)' }}
                >
                    明細行を追加
                </Button>
            </Box>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogContent>
                    {selectedReceipt && <img src={selectedReceipt} alt="領収書拡大表示" style={{ width: '100%', height: 'auto' }} />}
                </DialogContent>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={deleteTargetIndex !== null}
                title="明細行を削除しますか？"
                message={`#${deleteTargetIndex + 1} の明細行を削除します。入力内容も失われます。`}
                confirmLabel="削除"
                onCancel={() => setDeleteTargetIndex(null)}
                onConfirm={handleDeleteFieldsConfirm}
            />
        </PageScaffold>
    );
}

const Stat = ({ label, value, tone = 'primary', wide = false }) => {
    const tones = { primary: 'var(--accent-primary)', leaf: 'var(--accent-leaf)', iris: 'var(--accent-iris)' };
    return (
        <Box sx={{ minWidth: wide ? 120 : 'auto' }}>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', lineHeight: 1 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: wide ? 22 : 22, color: tones[tone], lineHeight: 1.1 }} className="tabular-nums">
                {value}
            </Typography>
        </Box>
    );
};

export default ApplicationForm;

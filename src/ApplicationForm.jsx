import { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Box, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Dialog, DialogContent, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert, Chip, IconButton, Tooltip } from '@mui/material';
import { useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
    EXPENSE_CATEGORIES,
    buildExpenseApplication,
    emptyExpenseRow,
    formatYen,
    getExpenseApplicationTotal,
    loadExpenseApplications,
    normalizeExpenseRow,
    saveExpenseApplications,
} from './expenseApplicationStore';
import AdminConfirmDialog from './components/AdminConfirmDialog';

const hasExpenseRowInput = (row = {}) => (
    ['date', 'description', 'destination', 'category', 'amount', 'receiptName', 'receiptPreview']
        .some(field => String(row[field] ?? '').trim() !== '')
);

function ApplicationForm() {
    const location = useLocation();
    const [formDataList, setFormDataList] = useState([emptyExpenseRow()]);
    const [paymentType, setPaymentType] = useState('個人立替払用');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [drafts, setDrafts] = useState([]);
    const [selectedDraftId, setSelectedDraftId] = useState('new');
    const [mode, setMode] = useState('list'); // 'list' or 'edit'
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);

    useEffect(() => {
        const savedDrafts = JSON.parse(localStorage.getItem('expenseDrafts') || '[]');
        setDrafts(savedDrafts);
    }, []);

    useEffect(() => {
        if (!location.state?.startNew) return;
        setSelectedDraftId('new');
        setFormDataList([emptyExpenseRow()]);
        setPaymentType('個人立替払用');
        setMode('edit');
    }, [location.state]);

    const handleChange = (index, e) => {
        const { name, value } = e.target;
        const newFormDataList = [...formDataList];
        newFormDataList[index][name] = value;
        setFormDataList(newFormDataList);
    };

    const handleAddFields = () => {
        setFormDataList([...formDataList, emptyExpenseRow()]);
    };

    const deleteFieldsAt = (index) => {
        const newFormDataList = formDataList.filter((_, i) => i !== index);
        setFormDataList(newFormDataList.length > 0 ? newFormDataList : [emptyExpenseRow()]);
        setSnackbar({ open: true, message: '明細行を削除しました' });
    };

    const handleDeleteFields = (index) => {
        if (hasExpenseRowInput(formDataList[index])) {
            setDeleteTargetIndex(index);
            return;
        }
        deleteFieldsAt(index);
    };

    const handleDeleteFieldsConfirm = () => {
        if (deleteTargetIndex === null) return;
        deleteFieldsAt(deleteTargetIndex);
        setDeleteTargetIndex(null);
    };

    const handleReceiptUpload = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newFormDataList = [...formDataList];
            newFormDataList[index].receiptName = file.name;
            newFormDataList[index].receiptPreview = URL.createObjectURL(file);
            setFormDataList(newFormDataList);
        }
    };

    const handleOpenDialog = (receiptPreview) => {
        setSelectedReceipt(receiptPreview);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedReceipt(null);
    };

    const handleSaveDraft = () => {
        const id = selectedDraftId === 'new' ? `draft_${Date.now()}` : selectedDraftId;
        const newDraft = { id, formDataList: formDataList.map(normalizeExpenseRow), paymentType, updated: new Date().toISOString() };
        let newDrafts;
        if (selectedDraftId === 'new') {
            newDrafts = [...drafts, newDraft];
        } else {
            newDrafts = drafts.map(d => d.id === id ? newDraft : d);
        }
        setDrafts(newDrafts);
        localStorage.setItem('expenseDrafts', JSON.stringify(newDrafts));
        setSelectedDraftId(id);
        setSnackbar({ open: true, message: '下書きを保存しました' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newApplication = buildExpenseApplication({
            rows: formDataList,
            paymentType,
            draftId: selectedDraftId,
        });
        const applications = loadExpenseApplications();
        saveExpenseApplications([newApplication, ...applications]);
        if (selectedDraftId !== 'new') {
            const newDrafts = drafts.filter(draft => draft.id !== selectedDraftId);
            setDrafts(newDrafts);
            localStorage.setItem('expenseDrafts', JSON.stringify(newDrafts));
        }
        setSelectedDraftId('new');
        setFormDataList([emptyExpenseRow()]);
        setSnackbar({ open: true, message: '経費申請を送信しました' });
        setMode('list');
    };

    const handleSelectDraft = (draftId) => {
        setSelectedDraftId(draftId);
        setMode('edit');
        const draft = drafts.find(d => d.id === draftId);
        if (draft) {
            setFormDataList(draft.formDataList.map(row => ({ ...emptyExpenseRow(), ...row })));
            setPaymentType(draft.paymentType);
        }
    };

    const handleNew = () => {
        setSelectedDraftId('new');
        setFormDataList([emptyExpenseRow()]);
        setPaymentType('個人立替払用');
        setMode('edit');
    };

    const currentTotal = getExpenseApplicationTotal({ details: formDataList });

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {mode === 'list' && (
                <Box>
                    <Box className="pageHeaderRow">
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>経費申請 下書き一覧</Typography>
                        <Box className="pageActionBar">
                            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleNew}>新規作成</Button>
                        </Box>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 180 }}>作成日</TableCell>
                                    <TableCell sx={{ width: 300 }}>内容</TableCell>
                                    <TableCell sx={{ width: 120 }}>支払種別</TableCell>
                                    <TableCell sx={{ width: 120 }}>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {drafts.length === 0 && (
                                    <TableRow><TableCell colSpan={4}>下書きはありません</TableCell></TableRow>
                                )}
                                {drafts.map(draft => (
                                    <TableRow key={draft.id}>
                                        <TableCell>{draft.updated ? new Date(draft.updated).toLocaleString() : '-'}</TableCell>
                                        <TableCell>{draft.formDataList?.[0]?.description || '-'}</TableCell>
                                        <TableCell>{draft.paymentType}</TableCell>
                                        <TableCell>
                                            <Box className="tableActionGroup">
                                                <Tooltip title="編集">
                                                    <IconButton aria-label="下書きを編集" onClick={() => handleSelectDraft(draft.id)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            {mode === 'edit' && (
                <Box>
                    <Box sx={{ my: 4 }}>
                        <Typography variant="h6" component="h1" gutterBottom>
                            経費申請
                        </Typography>
                        <Box className="expenseSummaryStrip">
                            <Box>
                                <Typography variant="caption" color="text.secondary">明細数</Typography>
                                <Typography variant="subtitle1">{formDataList.length}件</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">合計金額</Typography>
                                <Typography variant="subtitle1">{formatYen(currentTotal)}</Typography>
                            </Box>
                            <Chip size="small" label="送信後は申請済・承認画面に反映" color="primary" variant="outlined" />
                        </Box>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">支払種別</FormLabel>
                            <RadioGroup
                                row
                                aria-label="paymentType"
                                name="paymentType"
                                value={paymentType}
                                onChange={(e) => setPaymentType(e.target.value)}
                            >
                                <FormControlLabel value="個人立替払用" control={<Radio />} label="個人立替払用" />
                                <FormControlLabel value="法人カード経費分" control={<Radio />} label="法人カード経費分" />
                            </RadioGroup>
                        </FormControl>
                        <form onSubmit={handleSubmit}>
                            {formDataList.map((formData, index) => (
                                <Box className="expenseDetailRow" key={index}>
                                    <Typography className="expenseDetailIndex" variant="subtitle2">#{index + 1}</Typography>
                                    <Box>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="日付"
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            name="date"
                                            value={formData.date}
                                            onChange={(e) => handleChange(index, e)}
                                            required
                                        />
                                    </Box>
                                    <Box>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="内容"
                                            name="description"
                                            value={formData.description}
                                            onChange={(e) => handleChange(index, e)}
                                            required
                                        />
                                    </Box>
                                    <Box>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="用途・行き先"
                                            name="destination"
                                            value={formData.destination}
                                            onChange={(e) => handleChange(index, e)}
                                            required
                                        />
                                    </Box>
                                    <Box>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            select
                                            label="費目"
                                            name="category"
                                            value={formData.category}
                                            onChange={(e) => handleChange(index, e)}
                                            required
                                        >
                                            {EXPENSE_CATEGORIES.map(category => (
                                                <MenuItem key={category} value={category}>{category}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Box>
                                    <Box>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="金額"
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={(e) => handleChange(index, e)}
                                            required
                                        />
                                    </Box>
                                    <Box className="expenseReceiptCell">
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<UploadFileIcon />}
                                        >
                                            領収書アップロード
                                            <input
                                                type="file"
                                                hidden
                                                onChange={(e) => handleReceiptUpload(index, e)}
                                            />
                                        </Button>
                                        {formData.receiptPreview && (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <img
                                                    src={formData.receiptPreview}
                                                    alt="領収書プレビュー"
                                                    style={{ width: '100px', height: '100px', cursor: 'pointer', marginTop: '8px' }}
                                                    onClick={() => handleOpenDialog(formData.receiptPreview)}
                                                />
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    {formData.receiptName}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    <Box className="expenseRowAction">
                                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteFields(index)}>
                                            削除
                                        </Button>
                                    </Box>
                                </Box>
                            ))}
                            <Box className="formActionBar">
                                <Button className="backAction" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => setMode('list')}>一覧に戻る</Button>
                                <Button variant="outlined" color="secondary" startIcon={<AddIcon />} onClick={handleAddFields}>行追加</Button>
                                <Button variant="outlined" color="primary" startIcon={<SaveIcon />} onClick={handleSaveDraft}>下書き保存</Button>
                                <Button variant="contained" color="primary" startIcon={<SendIcon />} type="submit">送信</Button>
                            </Box>
                        </form>
                    </Box>
                </Box>
            )}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogContent>
                    {selectedReceipt && (
                        <img
                            src={selectedReceipt}
                            alt="領収書拡大表示"
                            style={{ width: '100%', height: 'auto' }}
                        />
                    )}
                </DialogContent>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={deleteTargetIndex !== null}
                title="明細行を削除しますか？"
                message={`#${deleteTargetIndex + 1} の明細行を削除します。`}
                confirmLabel="削除"
                onCancel={() => setDeleteTargetIndex(null)}
                onConfirm={handleDeleteFieldsConfirm}
            />
        </Container>
    );
}

export default ApplicationForm;


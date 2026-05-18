import { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Box, Grid2 as Grid, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Dialog, DialogContent, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert } from '@mui/material';

function ApplicationForm() {
    const [formDataList, setFormDataList] = useState([{ date: '', description: '', destination: '', category: '', amount: '', receipt: null, receiptName: '', receiptPreview: '' }]);
    const [paymentType, setPaymentType] = useState('個人立替払用');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [drafts, setDrafts] = useState([]);
    const [selectedDraftId, setSelectedDraftId] = useState('new');
    const [mode, setMode] = useState('list'); // 'list' or 'edit'
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        const savedDrafts = JSON.parse(localStorage.getItem('expenseDrafts') || '[]');
        setDrafts(savedDrafts);
    }, []);

    const handleChange = (index, e) => {
        const { name, value } = e.target;
        const newFormDataList = [...formDataList];
        newFormDataList[index][name] = value;
        setFormDataList(newFormDataList);
    };

    const handleAddFields = () => {
        setFormDataList([...formDataList, { date: '', description: '', destination: '', category: '', amount: '', receipt: null, receiptName: '', receiptPreview: '' }]);
    };

    const handleDeleteFields = (index) => {
        if (!window.confirm('この明細行を削除しますか？')) return;
        const newFormDataList = formDataList.filter((_, i) => i !== index);
        setFormDataList(newFormDataList.length > 0 ? newFormDataList : [{ date: '', description: '', destination: '', category: '', amount: '', receipt: null, receiptName: '', receiptPreview: '' }]);
        setSnackbar({ open: true, message: '明細行を削除しました' });
    };

    const handleReceiptUpload = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newFormDataList = [...formDataList];
            newFormDataList[index].receipt = file;
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
        const newDraft = { id, formDataList, paymentType, updated: new Date().toISOString() };
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
        const newApplication = {
            applicationId: `A${Date.now()}`,
            applicationDate: new Date().toISOString().slice(0, 10),
            paymentType,
            details: formDataList.map(row => ({ ...row, status: '未承認' })),
        };
        const applications = JSON.parse(localStorage.getItem('expenseApplications') || '[]');
        localStorage.setItem('expenseApplications', JSON.stringify([...applications, newApplication]));
        setSnackbar({ open: true, message: '経費申請を送信しました' });
        setMode('list');
    };

    const handleSelectDraft = (draftId) => {
        setSelectedDraftId(draftId);
        setMode('edit');
        const draft = drafts.find(d => d.id === draftId);
        if (draft) {
            setFormDataList(draft.formDataList);
            setPaymentType(draft.paymentType);
        }
    };

    const handleNew = () => {
        setSelectedDraftId('new');
        setFormDataList([{ date: '', description: '', destination: '', category: '', amount: '', receipt: null, receiptName: '', receiptPreview: '' }]);
        setPaymentType('個人立替払用');
        setMode('edit');
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {mode === 'list' && (
                <Box>
                    <Box className="pageHeaderRow">
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>経費精算 下書き一覧</Typography>
                        <Box className="pageActionBar">
                            <Button variant="contained" color="primary" onClick={handleNew}>新規作成</Button>
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
                                                <Button size="small" variant="outlined" onClick={() => handleSelectDraft(draft.id)}>編集</Button>
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
                            経費精算申請
                        </Typography>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">支払方法</FormLabel>
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
                                <Grid container spacing={1} key={index} alignItems="center">
                                    <Grid item xs={2}>
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
                                            sx={{ width: 150 }}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="内容"
                                            name="description"
                                            value={formData.description}
                                            onChange={(e) => handleChange(index, e)}
                                            required
                                            sx={{ width: 200 }}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="用途・行き先"
                                            name="destination"
                                            value={formData.destination}
                                            onChange={(e) => handleChange(index, e)}
                                            required
                                            sx={{ width: 300 }}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            select
                                            label="費目"
                                            name="category"
                                            value={formData.category}
                                            onChange={(e) => handleChange(index, e)}
                                            required
                                            sx={{ width: 200 }}
                                        >
                                            <MenuItem value="旅費交通費">旅費交通費</MenuItem>
                                            <MenuItem value="会議費">会議費</MenuItem>
                                            <MenuItem value="接待交際費">接待交際費</MenuItem>
                                            <MenuItem value="消耗品※事務用品含">消耗品※事務用品含</MenuItem>
                                            <MenuItem value="新聞図書費">新聞図書費</MenuItem>
                                            <MenuItem value="送料※切手代含">送料※切手代含</MenuItem>
                                            <MenuItem value="その他">その他</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="金額"
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={(e) => handleChange(index, e)}
                                            required
                                            sx={{ width: 150 }}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Button variant="outlined" color="error" onClick={() => handleDeleteFields(index)} sx={{ mt: 2 }}>
                                            削除
                                        </Button>
                                    </Grid>
                                    <Grid item xs={2} container alignItems="flex-start">
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            sx={{ mb: 2 }}
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
                                    </Grid>
                                </Grid>
                            ))}
                            <Box className="formActionBar">
                                <Button className="backAction" variant="outlined" onClick={() => setMode('list')}>一覧に戻る</Button>
                                <Button variant="outlined" color="secondary" onClick={handleAddFields}>行追加</Button>
                                <Button variant="outlined" color="primary" onClick={handleSaveDraft}>下書き保存</Button>
                                <Button variant="contained" color="primary" type="submit">送信</Button>
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
        </Container>
    );
}

export default ApplicationForm;


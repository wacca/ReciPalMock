import { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Box, Grid2 as Grid, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Dialog, DialogContent, Select, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

function ApplicationForm({ username }) {
    const [formDataList, setFormDataList] = useState([{ date: '', description: '', destination: '', category: '', amount: '', receipt: null, receiptName: '', receiptPreview: '' }]);
    const [paymentType, setPaymentType] = useState('個人立替払用');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [drafts, setDrafts] = useState([]);
    const [selectedDraftId, setSelectedDraftId] = useState('new');
    const [mode, setMode] = useState('list'); // 'list' or 'edit'

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
        const newFormDataList = formDataList.filter((_, i) => i !== index);
        setFormDataList(newFormDataList);
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
        alert('下書きを保存しました');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Data Submitted:', formDataList, 'Payment Type:', paymentType);
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
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>経費精算 下書き一覧</Typography>
                    <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleNew}>新規作成</Button>
                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 180, fontSize: '1rem' }}>作成日</TableCell>
                                    <TableCell sx={{ width: 300, fontSize: '1rem' }}>内容</TableCell>
                                    <TableCell sx={{ width: 120, fontSize: '1rem' }}>支払種別</TableCell>
                                    <TableCell sx={{ width: 120, fontSize: '1rem' }}>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {drafts.length === 0 && (
                                    <TableRow><TableCell colSpan={4}>下書きはありません</TableCell></TableRow>
                                )}
                                {drafts.map(draft => (
                                    <TableRow key={draft.id}>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>{draft.updated ? new Date(draft.updated).toLocaleString() : '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>{draft.formDataList?.[0]?.description || '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>{draft.paymentType}</TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined" onClick={() => handleSelectDraft(draft.id)}>編集</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            {mode === 'edit' && (
                <Paper sx={{ p: 3, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>経費精算申請</Typography>
                        <Button variant="text" sx={{ ml: 3 }} onClick={() => setMode('list')}>← 一覧に戻る</Button>
                    </Box>
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
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
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 120, fontSize: '1rem' }}>日付</TableCell>
                                    <TableCell sx={{ width: 180, fontSize: '1rem' }}>内容</TableCell>
                                    <TableCell sx={{ width: 220, fontSize: '1rem' }}>用途・行き先</TableCell>
                                    <TableCell sx={{ width: 140, fontSize: '1rem' }}>費目</TableCell>
                                    <TableCell sx={{ width: 100, fontSize: '1rem' }}>金額</TableCell>
                                    <TableCell sx={{ width: 120, fontSize: '1rem' }}>領収書</TableCell>
                                    <TableCell sx={{ width: 80, fontSize: '1rem' }}>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formDataList.map((formData, index) => (
                                    <TableRow key={index}>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>
                                            <TextField
                                                fullWidth
                                                margin="none"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                name="date"
                                                value={formData.date}
                                                onChange={(e) => handleChange(index, e)}
                                                required
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>
                                            <TextField
                                                fullWidth
                                                margin="none"
                                                name="description"
                                                value={formData.description}
                                                onChange={(e) => handleChange(index, e)}
                                                required
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>
                                            <TextField
                                                fullWidth
                                                margin="none"
                                                name="destination"
                                                value={formData.destination}
                                                onChange={(e) => handleChange(index, e)}
                                                required
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>
                                            <TextField
                                                fullWidth
                                                margin="none"
                                                select
                                                name="category"
                                                value={formData.category}
                                                onChange={(e) => handleChange(index, e)}
                                                required
                                                size="small"
                                            >
                                                <MenuItem value="旅費交通費">旅費交通費</MenuItem>
                                                <MenuItem value="会議費">会議費</MenuItem>
                                                <MenuItem value="接待交際費">接待交際費</MenuItem>
                                                <MenuItem value="消耗品※事務用品含">消耗品※事務用品含</MenuItem>
                                                <MenuItem value="新聞図書費">新聞図書費</MenuItem>
                                                <MenuItem value="送料※切手代含">送料※切手代含</MenuItem>
                                                <MenuItem value="その他">その他</MenuItem>
                                            </TextField>
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>
                                            <TextField
                                                fullWidth
                                                margin="none"
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={(e) => handleChange(index, e)}
                                                required
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>
                                            <Button
                                                variant="outlined"
                                                component="label"
                                                size="small"
                                            >
                                                領収書
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
                                                        style={{ width: '60px', height: '60px', cursor: 'pointer', marginTop: '4px' }}
                                                        onClick={() => handleOpenDialog(formData.receiptPreview)}
                                                    />
                                                    <Typography variant="body2" sx={{ mt: 1, fontSize: '0.85rem' }}>
                                                        {formData.receiptName}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.98rem' }}>
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                onClick={() => handleDeleteFields(index)}
                                                size="small"
                                            >
                                                削除
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button variant="outlined" color="secondary" onClick={handleAddFields} sx={{ fontSize: '1rem', minWidth: 120 }}>
                            行追加
                        </Button>
                        <Button variant="contained" color="primary" type="submit" onClick={handleSubmit} sx={{ fontSize: '1rem', minWidth: 120 }}>
                            送信
                        </Button>
                        <Button variant="outlined" color="primary" onClick={handleSaveDraft} sx={{ fontSize: '1rem', minWidth: 120 }}>
                            下書き保存
                        </Button>
                    </Box>
                </Paper>
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
        </Container>
    );
}

export default ApplicationForm;


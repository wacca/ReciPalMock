import { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, MenuItem, FormControl, InputLabel, Select, Snackbar, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton, Tooltip } from '@mui/material';
import { useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import {
    LEAVE_TYPES,
    buildLeaveApplications,
    emptyLeaveRow,
    loadLeaveApplications,
    loadLeaveDrafts,
    normalizeLeaveRow,
    saveLeaveApplications,
    saveLeaveDrafts,
} from './leaveApplicationStore';
import AdminConfirmDialog from './components/AdminConfirmDialog';

const hasLeaveRowInput = (row = {}) => (
    row.leaveType !== emptyLeaveRow().leaveType
    || ['date', 'reason'].some(field => String(row[field] ?? '').trim() !== '')
);

function LeaveApplication() {
    const location = useLocation();
    const [leaveList, setLeaveList] = useState([]); // 下書き一覧
    const [mode, setMode] = useState('list'); // 'list' or 'edit'
    const [editId, setEditId] = useState('new');
    const [leaveRows, setLeaveRows] = useState([emptyLeaveRow()]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [deleteRowTargetIndex, setDeleteRowTargetIndex] = useState(null);

    useEffect(() => {
        loadLeaveApplications();
        setLeaveList(loadLeaveDrafts());
    }, []);

    useEffect(() => {
        if (!location.state?.startNew) return;
        setEditId('new');
        setLeaveRows([emptyLeaveRow()]);
        setMode('edit');
    }, [location.state]);

    const resetForm = () => {
        setEditId('new');
        setLeaveRows([emptyLeaveRow()]);
    };

    const handleEdit = (id) => {
        const draft = leaveList.find(d => d.id === id);
        if (draft) {
            setEditId(id);
            setLeaveRows(draft.details?.length ? draft.details : [emptyLeaveRow()]);
            setMode('edit');
        }
    };

    const handleDelete = (id) => {
        setDeleteTargetId(id);
    };

    const handleDeleteConfirm = () => {
        if (!deleteTargetId) return;
        const newList = leaveList.filter(d => d.id !== deleteTargetId);
        setLeaveList(newList);
        saveLeaveDrafts(newList);
        setDeleteTargetId(null);
        setSnackbar({ open: true, message: '下書きを削除しました' });
    };

    const handleRowChange = (index, field, value) => {
        const newRows = [...leaveRows];
        newRows[index] = { ...newRows[index], [field]: value };
        setLeaveRows(newRows);
    };

    const handleAddFields = () => {
        setLeaveRows([...leaveRows, emptyLeaveRow()]);
    };

    const deleteRowAt = (index) => {
        const newRows = leaveRows.filter((_, i) => i !== index);
        setLeaveRows(newRows.length > 0 ? newRows : [emptyLeaveRow()]);
        setSnackbar({ open: true, message: '申請行を削除しました' });
    };

    const handleDeleteRow = (index) => {
        if (hasLeaveRowInput(leaveRows[index])) {
            setDeleteRowTargetIndex(index);
            return;
        }
        deleteRowAt(index);
    };

    const handleDeleteRowConfirm = () => {
        if (deleteRowTargetIndex === null) return;
        deleteRowAt(deleteRowTargetIndex);
        setDeleteRowTargetIndex(null);
    };

    const handleSaveDraft = () => {
        const id = editId === 'new' ? `leave_${Date.now()}` : editId;
        const newDraft = {
            id,
            details: leaveRows.map(normalizeLeaveRow),
            status: '下書き',
            updated: new Date().toISOString(),
        };
        let newList;
        if (editId === 'new') {
            newList = [...leaveList, newDraft];
        } else {
            newList = leaveList.map(d => d.id === id ? newDraft : d);
        }
        setLeaveList(newList);
        saveLeaveDrafts(newList);
        setEditId(id);
        setMode('list');
        setSnackbar({ open: true, message: '下書きを保存しました' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newApps = buildLeaveApplications({ editId, rows: leaveRows });
        const prev = loadLeaveApplications();
        saveLeaveApplications([...newApps, ...prev]);
        const newList = leaveList.filter(d => d.id !== editId);
        setLeaveList(newList);
        saveLeaveDrafts(newList);
        setSnackbar({ open: true, message: `${newApps.length}件の休暇申請を送信しました` });
        resetForm();
        setMode('list');
    };
    const handleNew = () => {
        resetForm();
        setMode('edit');
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {mode === 'list' && (
                <Box>
                    <Box className="pageHeaderRow">
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>休暇申請 下書き一覧</Typography>
                        <Box className="pageActionBar">
                            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleNew}>新規作成</Button>
                        </Box>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 180 }}>更新日</TableCell>
                                    <TableCell sx={{ width: 120 }}>件数</TableCell>
                                    <TableCell>内容</TableCell>
                                    <TableCell sx={{ width: 120 }}>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leaveList.length === 0 && (
                                    <TableRow><TableCell colSpan={4}>下書きはありません</TableCell></TableRow>
                                )}
                                {leaveList.map(draft => {
                                    const firstRow = draft.details?.[0] || emptyLeaveRow();
                                    const summary = `${firstRow.date || '-'} / ${firstRow.leaveType}${draft.details?.length > 1 ? ` ほか${draft.details.length - 1}件` : ''}`;
                                    return (
                                        <TableRow key={draft.id}>
                                            <TableCell>{draft.updated ? new Date(draft.updated).toLocaleString() : '-'}</TableCell>
                                            <TableCell>{draft.details?.length || 0}件</TableCell>
                                            <TableCell>{summary}</TableCell>
                                            <TableCell>
                                                <Box className="tableActionGroup">
                                                    <Tooltip title="編集">
                                                        <IconButton aria-label="下書きを編集" onClick={() => handleEdit(draft.id)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="削除">
                                                        <IconButton aria-label="下書きを削除" color="error" onClick={() => handleDelete(draft.id)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            {mode === 'edit' && (
                <Box>
                    <Box sx={{ my: 4 }}>
                        <Typography variant="h6" component="h1" gutterBottom>
                            休暇申請
                        </Typography>
                        <Box className="expenseSummaryStrip">
                            <Box>
                                <Typography variant="caption" color="text.secondary">申請数</Typography>
                                <Typography variant="subtitle1">{leaveRows.length}件</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">入力済み</Typography>
                                <Typography variant="subtitle1">{leaveRows.filter(hasLeaveRowInput).length}件</Typography>
                            </Box>
                            <Chip size="small" label="送信後は申請済・承認画面に反映" color="primary" variant="outlined" />
                        </Box>
                        <form onSubmit={handleSubmit}>
                            {leaveRows.map((row, index) => (
                                <Box className="leaveDetailRow" key={index}>
                                    <Typography className="leaveDetailIndex" variant="subtitle2">#{index + 1}</Typography>
                                    <FormControl fullWidth>
                                        <InputLabel>申請種別</InputLabel>
                                        <Select
                                            value={row.leaveType}
                                            label="申請種別"
                                            onChange={e => handleRowChange(index, 'leaveType', e.target.value)}
                                            required
                                        >
                                            {LEAVE_TYPES.map(type => (
                                                <MenuItem key={type} value={type}>{type}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="日付"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        value={row.date}
                                        onChange={e => handleRowChange(index, 'date', e.target.value)}
                                        required
                                        fullWidth
                                    />
                                    <TextField
                                        label="理由・備考"
                                        multiline
                                        minRows={1}
                                        value={row.reason}
                                        onChange={e => handleRowChange(index, 'reason', e.target.value)}
                                        fullWidth
                                    />
                                    <Box className="leaveRowAction">
                                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteRow(index)}>
                                            削除
                                        </Button>
                                    </Box>
                                </Box>
                            ))}
                            <Box className="formActionBar">
                                <Button className="backAction" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => setMode('list')}>一覧に戻る</Button>
                                <Button variant="outlined" color="secondary" startIcon={<AddIcon />} onClick={handleAddFields}>行追加</Button>
                                <Button variant="outlined" color="primary" startIcon={<SaveIcon />} onClick={handleSaveDraft}>下書き保存</Button>
                                <Button type="submit" variant="contained" color="primary" startIcon={<SendIcon />}>送信</Button>
                            </Box>
                        </form>
                    </Box>
                </Box>
            )}
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(deleteTargetId)}
                title="下書きを削除しますか？"
                message="選択した休暇申請の下書きを削除します。"
                confirmLabel="削除"
                onCancel={() => setDeleteTargetId(null)}
                onConfirm={handleDeleteConfirm}
            />
            <AdminConfirmDialog
                open={deleteRowTargetIndex !== null}
                title="申請行を削除しますか？"
                message={`#${deleteRowTargetIndex + 1} の申請行を削除します。`}
                confirmLabel="削除"
                onCancel={() => setDeleteRowTargetIndex(null)}
                onConfirm={handleDeleteRowConfirm}
            />
        </Container>
    );
}

export default LeaveApplication;

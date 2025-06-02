import { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField } from '@mui/material';

function SubmittedApplications() {
    // 申請単位のデータ構造に変更
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editGroupIndex, setEditGroupIndex] = useState(null);
    const [editRowIndex, setEditRowIndex] = useState(null);
    const [editRow, setEditRow] = useState({});
    const [editGroupIndexAll, setEditGroupIndexAll] = useState(null);
    const [editGroupRows, setEditGroupRows] = useState([]);

    // データをサーバから取得する関数（モック）
    const fetchData = async () => {
        setLoading(true);
        try {
            // 申請単位でグループ化したモックデータ
            const response = [
                {
                    applicationId: 'A20240528001',
                    applicationDate: '2024-05-28',
                    details: [
                        { date: '2024-05-25', description: '出張電車代', destination: '東京-新大阪', category: '旅費交通費', amount: 13870, status: '未承認' },
                        { date: '2024-05-25', description: '〇〇（店名）', destination: '××社××様　会食', category: '接待交際費', amount: 19440, status: '未承認' },
                    ]
                },
                {
                    applicationId: 'A20240528002',
                    applicationDate: '2024-05-27',
                    details: [
                        { date: '2024-05-26', description: 'Amazon', destination: '業務PC用　ケーブル', category: '消耗品※事務用品含', amount: 970, status: '非承認' },
                    ],
                    remarks: '予算オーバーのため非承認'
                }
            ];
            setData(response);
        } catch (error) {
            console.error('データの取得に失敗しました:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (groupIdx, rowIdx) => {
        setEditGroupIndex(groupIdx);
        setEditRowIndex(rowIdx);
        setEditRow({ ...data[groupIdx].details[rowIdx] });
    };

    const handleResubmit = () => {
        const newData = [...data];
        newData[editGroupIndex].details[editRowIndex] = { ...editRow, status: '未承認' };
        setData(newData);
        setEditGroupIndex(null);
        setEditRowIndex(null);
    };

    const handleCancel = () => {
        setEditGroupIndex(null);
        setEditRowIndex(null);
    };

    const handleDelete = (groupIdx, rowIdx) => {
        const newData = [...data];
        newData[groupIdx].details = newData[groupIdx].details.filter((_, i) => i !== rowIdx);
        setData(newData);
    };

    const handleCancelGroup = (groupIdx) => {
        const newData = [...data];
        newData[groupIdx].details = newData[groupIdx].details.map(row => ({ ...row, status: '取消' }));
        setData(newData);
    };

    const handleEditGroup = (groupIdx) => {
        setEditGroupIndexAll(groupIdx);
        setEditGroupRows([...data[groupIdx].details]);
    };

    const handleEditGroupRowChange = (rowIdx, field, value) => {
        const newRows = [...editGroupRows];
        newRows[rowIdx] = { ...newRows[rowIdx], [field]: value };
        setEditGroupRows(newRows);
    };

    const handleEditGroupSave = () => {
        const newData = [...data];
        newData[editGroupIndexAll].details = editGroupRows;
        setData(newData);
        setEditGroupIndexAll(null);
        setEditGroupRows([]);
    };

    const handleEditGroupCancel = () => {
        setEditGroupIndexAll(null);
        setEditGroupRows([]);
    };

    return (
        <Container maxWidth="lg" sx={{ textAlign: 'left' }}>
            <Box sx={{ my: 4 }}>
                <Typography variant="h6" component="div" gutterBottom>
                    申請済
                </Typography>
                {data.map((group, groupIdx) => (
                    <Box key={group.applicationId} sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            申請ID: {group.applicationId}　申請日: {group.applicationDate}
                            <span
                                style={{
                                    marginLeft: 16,
                                    fontWeight: 'normal',
                                    fontSize: '1rem',
                                    color:
                                        group.details.every(row => row.status === '承認済') ? undefined :
                                        group.details.every(row => row.status === '非承認') ? 'red' :
                                        group.details.every(row => row.status === '取消') ? undefined :
                                        'green'
                                }}
                            >
                                {group.details.every(row => row.status === '承認済') ? '承認済' :
                                    group.details.every(row => row.status === '非承認') ? '非承認' :
                                    group.details.every(row => row.status === '取消') ? '取消' :
                                    '申請中'}
                            </span>
                            {group.details.every(row => row.status === '非承認') && group.remarks && (
                                <span style={{ marginLeft: 16, color: '#555', fontSize: '0.95rem' }}>備考: {group.remarks}</span>
                            )}
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: 150 }}>日付</TableCell>
                                        <TableCell sx={{ width: 200 }}>内容</TableCell>
                                        <TableCell sx={{ width: 300 }}>用途・行き先</TableCell>
                                        <TableCell sx={{ width: 200 }}>費目</TableCell>
                                        <TableCell sx={{ width: 150 }}>金額</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {group.details.map((row, rowIdx) => (
                                        <TableRow key={rowIdx}>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell>
                                                {editGroupIndexAll === groupIdx ? (
                                                    <TextField size="small" value={editGroupRows[rowIdx]?.description || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'description', e.target.value)} />
                                                ) : (
                                                    row.description
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editGroupIndexAll === groupIdx ? (
                                                    <TextField size="small" value={editGroupRows[rowIdx]?.destination || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'destination', e.target.value)} />
                                                ) : (
                                                    row.destination
                                                )}
                                            </TableCell>
                                            <TableCell>{row.category}</TableCell>
                                            <TableCell>{row.amount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                            {group.remarks && (
                                <Typography variant="body2" sx={{ ml: 2, color: '#555' }}>備考: {group.remarks}</Typography>
                            )}
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                            <Button variant="outlined" color="primary" onClick={() => handleEditGroup(groupIdx)}>
                                変更
                            </Button>
                            <Button variant="outlined" color="error" onClick={() => handleCancelGroup(groupIdx)}>
                                取消
                            </Button>
                            {group.details.every(row => row.status === '非承認') && (
                                <Button variant="contained" color="success" onClick={() => {/* 再申請処理をここに実装 */}}>
                                    再申請
                                </Button>
                            )}
                        </Box>
                        {editGroupIndexAll === groupIdx && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button variant="contained" color="primary" onClick={handleEditGroupSave}>保存</Button>
                                <Button variant="outlined" onClick={handleEditGroupCancel}>キャンセル</Button>
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>
        </Container>
    );
}

export default SubmittedApplications;


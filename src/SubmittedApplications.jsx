import { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField } from '@mui/material';

function SubmittedApplications() {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editIndex, setEditIndex] = useState(null);
    const [editRow, setEditRow] = useState({});

    // データをサーバから取得する関数（モック）
    const fetchData = async () => {
        setLoading(true);
        try {
            // サーバからのデータ取得を模倣
            const response = [
                { date: '2023-10-01', description: '出張電車代', destination: '東京-新大阪', category: '旅費交通費', amount: 13870, status: '未承認' },
                { date: '2023-10-02', description: '〇〇（店名）', destination: '××社××様　会食', category: '接待交際費', amount: 19440, status: '未承認' },
                { date: '2023-10-03', description: 'Amazon', destination: '業務PC用　ケーブル', category: '消耗品※事務用品含', amount: 970, status: '非承認' },
            ];
            setData(response);
        } catch (error) {
            console.error('データの取得に失敗しました:', error);
        } finally {
            setLoading(false);
        }
    };

    // コンポーネントのマウント時にデータを取得
    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (index) => {
        setEditIndex(index);
        setEditRow({ ...data[index] });
    };

    const handleResubmit = () => {
        const newData = [...data];
        newData[editIndex] = { ...newData[editIndex], ...editRow, status: '未承認' };
        setData(newData);
        setEditIndex(null);
    };

    const handleCancel = () => {
        setEditIndex(null);
    };

    const handleDelete = (index) => {
        const newData = data.filter((_, i) => i !== index);
        setData(newData);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case '承認済':
                return 'green';
            case '非承認':
                return 'red';
            case '未承認':
            default:
                return 'blue';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ textAlign: 'left' }}>
            <Box sx={{ my: 4 }}>
                <Typography variant="h6" component="div" gutterBottom>
                    申請済
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
                                <TableCell sx={{ width: 150 }}>ステータス</TableCell>
                                <TableCell>操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.date}</TableCell>
                                    <TableCell>
                                        {editIndex === index ? (
                                            <TextField
                                                value={editRow.description}
                                                onChange={(e) => setEditRow({ ...editRow, description: e.target.value })}
                                            />
                                        ) : (
                                            row.description
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editIndex === index ? (
                                            <TextField
                                                value={editRow.destination}
                                                onChange={(e) => setEditRow({ ...editRow, destination: e.target.value })}
                                            />
                                        ) : (
                                            row.destination
                                        )}
                                    </TableCell>
                                    <TableCell>{row.category}</TableCell>
                                    <TableCell>{row.amount}</TableCell>
                                    <TableCell sx={{ color: getStatusColor(row.status) }}>{row.status}</TableCell>
                                    <TableCell>
                                        {editIndex === index ? (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button variant="contained" color="primary" onClick={handleResubmit}>
                                                    申請
                                                </Button>
                                                <Button variant="outlined" color="secondary" onClick={handleCancel}>
                                                    戻る
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant="outlined"
                                                    disabled={row.status !== '未承認'}
                                                    color="secondary"
                                                    onClick={() => handleDelete(index)}
                                                >
                                                    取消
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    disabled={row.status === '承認済'}
                                                    color="primary"
                                                    onClick={() => handleEdit(index)}
                                                >
                                                    変更
                                                </Button>
                                            </Box>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Container>
    );
}

export default SubmittedApplications;
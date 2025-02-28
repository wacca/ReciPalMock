import { useState } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';

function SubmittedApplications() {
    // ダミーデータを状態として管理
    const [data, setData] = useState([
        { date: '2023-10-01', description: '出張電車代', destination: '東京-新大阪', category: '旅費交通費', amount: 13870, status: '未承認' },
        { date: '2023-10-02', description: '〇〇（店名）', destination: '××社××様　会食', category: '接待交際費', amount: 19440, status: '未承認' },
        { date: '2023-10-03', description: 'Amazon', destination: '業務PC用　ケーブル', category: '消耗品※事務用品含', amount: 970, status: '非承認' },
    ]);

    // 行を削除する関数
    const handleDelete = (index) => {
        const newData = data.filter((_, i) => i !== index);
        setData(newData);
    };

    // ステータスに応じて色を変更する関数
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
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell>{row.destination}</TableCell>
                                    <TableCell>{row.category}</TableCell>
                                    <TableCell>{row.amount}</TableCell>
                                    <TableCell sx={{ color: getStatusColor(row.status) }}>{row.status}</TableCell>
                                    <TableCell>
                                        <Button variant="outlined" disabled={row.status !== '未承認'} color="secondary" onClick={() => handleDelete(index)}>
                                            取消
                                        </Button>
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
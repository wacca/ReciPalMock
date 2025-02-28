import { useState } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

function SubmittedApplications() {
    // ダミーデータを状態として管理
    const [data, setData] = useState([
        { date: '2023-10-01', description: '出張電車代', destination: '東京-新大阪', category: '旅費交通費', amount: 13870, status: '未承認' },
        { date: '2023-10-02', description: '〇〇（店名）', destination: '××社××様　会食', category: '接待交際費', amount: 19440, status: '未承認' },
        { date: '2023-10-03', description: 'Amazon', destination: '業務PC用　ケーブル', category: '消耗品※事務用品含', amount: 970, status: '未承認' },
    ]);

    // ステータスを変更する関数
    const handleChangeStatus = (index, newStatus) => {
        const newData = data.map((row, i) => i === index ? { ...row, status: newStatus } : row);
        setData(newData);
    };

    return (
        <Container maxWidth="lg" sx={{ textAlign: 'left' }}>
            <Box sx={{ my: 4 }}>
                <Typography variant="h6" component="div" gutterBottom>
                    承認
                </Typography>
                <FormControl autoWidth={true} sx={{ mb: 2 }}>
                    <Select variant="outlined" value="user1">
                        <MenuItem value="user1">由引 安人(ubiast@univa.tech)</MenuItem>
                        <MenuItem value="user2">油ニ 和平(univapay@univa.tech)</MenuItem>
                    </Select>
                </FormControl>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 150 }}>日付</TableCell>
                                <TableCell sx={{ width: 200 }}>内容</TableCell>
                                <TableCell sx={{ width: 300 }}>用途・行き先</TableCell>
                                <TableCell sx={{ width: 200 }}>費目</TableCell>
                                <TableCell sx={{ width: 150 }}>金額</TableCell>
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
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button variant="outlined" color="primary"
                                                    onClick={() => handleChangeStatus(index, '承認済')}>
                                                承認
                                            </Button>
                                            <Button variant="outlined" color="error"
                                                    onClick={() => handleChangeStatus(index, '非承認')}
                                                    sx={{ whiteSpace: 'nowrap' }}>
                                                非承認
                                            </Button>
                                        </Box>
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
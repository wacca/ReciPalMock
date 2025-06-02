import { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, MenuItem, Select, FormControl, TextField } from '@mui/material';

function Approvals() {
    // 申請単位のデータ構造に変更
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentMap, setCommentMap] = useState({}); // 申請単位のコメント管理

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
                    ]
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

    // ステータスを変更する関数
    const handleChangeStatus = (groupIdx, rowIdx, newStatus) => {
        const newData = [...data];
        newData[groupIdx].details[rowIdx] = { ...newData[groupIdx].details[rowIdx], status: newStatus };
        setData(newData);
    };

    // 申請単位で承認・非承認
    const handleGroupStatus = (groupIdx, newStatus) => {
        const newData = [...data];
        newData[groupIdx].details = newData[groupIdx].details.map(row => ({ ...row, status: newStatus }));
        setData(newData);
        // ここでコメント(commentMap[group.applicationId])も利用可能
        // 例: サーバー送信など
        setCommentMap({ ...commentMap, [data[groupIdx].applicationId]: '' }); // コメント欄リセット
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
                {data.map((group, groupIdx) => (
                    <Box key={group.applicationId} sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            申請ID: {group.applicationId}　申請日: {group.applicationDate}
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
                                            <TableCell>{row.description}</TableCell>
                                            <TableCell>{row.destination}</TableCell>
                                            <TableCell>{row.category}</TableCell>
                                            <TableCell>{row.amount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TextField
                                label="備考"
                                size="small"
                                value={commentMap[group.applicationId] || ''}
                                onChange={e => setCommentMap({ ...commentMap, [group.applicationId]: e.target.value })}
                                sx={{ minWidth: 300 }}
                            />
                            <Button variant="contained" color="primary"
                                onClick={() => handleGroupStatus(groupIdx, '承認済')}
                                disabled={group.details.every(row => row.status === '承認済')}
                            >
                                承認
                            </Button>
                            <Button variant="contained" color="error"
                                onClick={() => handleGroupStatus(groupIdx, '非承認')}
                                disabled={group.details.every(row => row.status === '非承認')}
                            >
                                非承認
                            </Button>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Container>
    );
}

export default Approvals;





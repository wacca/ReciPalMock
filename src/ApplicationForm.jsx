import { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Grid2 as Grid, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Dialog, DialogContent } from '@mui/material';

function ApplicationForm({ username }) {
    const [formDataList, setFormDataList] = useState([{ date: '', description: '', destination: '', category: '', amount: '', receipt: null, receiptName: '', receiptPreview: '' }]);
    const [paymentType, setPaymentType] = useState('個人立替払用');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Data Submitted:', formDataList, 'Payment Type:', paymentType);
    };

    return (
        <Container maxWidth="xl" sx={{ textAlign: 'left' }}>
            <Box sx={{ my: 4 }}>
                <Typography variant="h6" component="h1" gutterBottom>
                    経費精算申請
                </Typography>
                <Box sx={{ width: 500, borderBottom: 1, borderColor: 'black', mb: 2 }} />
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
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => handleDeleteFields(index)}
                                    fullWidth
                                    sx={{ mt: 2 }}
                                >
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
                    <Button variant="outlined" color="secondary" onClick={handleAddFields} fullWidth sx={{ mt: 2 }}>
                        行追加
                    </Button>
                    <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 2 }}>
                        送信
                    </Button>
                </form>
            </Box>

            {/* 領収書拡大表示ダイアログ */}
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
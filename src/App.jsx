import { useState } from 'react';
import './App.css';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Grid2,
    MenuItem,
    FormControl,
    RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import Login from './Login';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [formDataList, setFormDataList] = useState([
        { date: '', description: '', destination: '', category: '', amount: '' }
    ]);
    const [paymentType, setPaymentType] = useState('個人立替払用');

    const handleLogin = (username) => {
        setUsername(username);
        setIsLoggedIn(true);
    };

    const handleChange = (index, e) => {
        const { name, value } = e.target;
        const newFormDataList = [...formDataList];
        newFormDataList[index][name] = value;
        setFormDataList(newFormDataList);
    };

    const handleAddFields = () => {
        setFormDataList([...formDataList, { date: '', description: '', destination: '', category: '', amount: '' }]);
    };

    const handleDeleteFields = (index) => {
        const newFormDataList = formDataList.filter((_, i) => i !== index);
        setFormDataList(newFormDataList);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Data Submitted:', formDataList, 'Payment Type:', paymentType);
        // Add logic here to send formDataList and paymentType to your server or API
    };

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }
    return (
        <Container maxWidth="xl" sx={{ textAlign: 'left' }}>
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    経費精算フォーム
                </Typography>
                <Typography variant="h6" component="div">
                    {username}
                </Typography>
                <Box sx={{ width: 500, borderBottom: 1, borderColor: 'black', mb: 2 }} />
                <FormControl component="fieldset">
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
                        <Grid2 container spacing={2} key={index} alignItems="center">
                            <Grid2 item xs={2}>
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
                            </Grid2>
                            <Grid2 item xs={2}>
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="内容"
                                    name="description"
                                    value={formData.description}
                                    onChange={(e) => handleChange(index, e)}
                                    required
                                />
                            </Grid2>
                            <Grid2 item xs={2}>
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
                            </Grid2>
                            <Grid2 item xs={2}>
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
                            </Grid2>
                            <Grid2 item xs={2}>
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
                            </Grid2>
                            <Grid2 item xs={2}>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => handleDeleteFields(index)}
                                    fullWidth
                                    sx={{ mt: 2 }}
                                >
                                    削除
                                </Button>
                            </Grid2>
                        </Grid2>
                    ))}
                    <Button variant="outlined" color="secondary" onClick={handleAddFields} fullWidth sx={{ mt: 2 }}>
                        行追加
                    </Button>
                    <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 2 }}>
                        送信
                    </Button>
                </form>
            </Box>
        </Container>
    );
}

export default App

import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Stack,
    Link,
    Alert
} from '@mui/material';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await api.post(`/Auth/Login`, formData);

            if (response.data) {
                login(response.data); // Prosledjivanje tokena u AuthContext
                navigate('/'); // Preusmeravanje
            }
        } catch (err: any) {
            const errorData = err.response?.data;
            const message = typeof errorData === 'string' 
                ? errorData 
                : (errorData?.title || 'Neuspešna prijava. Proverite korisničko ime i lozinku.');
            setError(message);
        }
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            <Navbar />
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 4 }}>

                        <Stack sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
                            <SportsBasketballIcon sx={{ color: '#1976d2', fontSize: 40 }} />
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Prijavi se na QOSH
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Unesi svoje podatke za pristup platformi
                            </Typography>
                        </Stack>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    fullWidth
                                    label="Korisničko ime (Username)"
                                    name="username"
                                    variant="outlined"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Lozinka"
                                    name="password"
                                    type="password"
                                    variant="outlined"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="large"
                                    sx={{ fontWeight: 'bold', py: 1.5, borderRadius: 2 }}
                                >
                                    Prijavi se
                                </Button>
                            </Stack>
                        </Box>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Nemaš nalog?{' '}
                                <Link
                                    component={RouterLink}
                                    to="/register"
                                    sx={{ fontWeight: 'bold', textDecoration: 'none', color: '#1976d2' }}
                                >
                                    Registruj se ovde
                                </Link>
                            </Typography>
                        </Box>

                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}
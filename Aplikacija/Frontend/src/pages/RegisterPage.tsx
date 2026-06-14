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

export default function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        firstName: '',
        lastName: '',
        dateOfBirth: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await api.post(`/Auth/Register`, formData);

            // Automatska prijava nakon registracije
            const loginResponse = await api.post(`/Auth/Login`, {
                username: formData.username,
                password: formData.password
            });

            if (loginResponse.data) {
                login(loginResponse.data);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data || 'Došlo je do greške prilikom registracije.');
        }
    };

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 6 }}>
            <Navbar />
            <Container maxWidth="sm" sx={{ mt: 5 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 4 }}>

                        <Stack sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
                            <SportsBasketballIcon sx={{ color: '#1976d2', fontSize: 40 }} />
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Napravi Korisnički Nalog
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Postani deo lige i digitalizuj svoj tim
                            </Typography>
                        </Stack>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Ime"
                                    name="firstName"
                                    variant="outlined"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Prezime"
                                    name="lastName"
                                    variant="outlined"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Datum rođenja"
                                    name="dateOfBirth"
                                    type="date"
                                    variant="outlined"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    required
                                    slotProps={{
                                        inputLabel: { shrink: true }
                                    }}
                                />
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
                                    label="Email adresa"
                                    name="email"
                                    type="email"
                                    variant="outlined"
                                    value={formData.email}
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
                                    sx={{ fontWeight: 'bold', py: 1.5, borderRadius: 2, mt: 1 }}
                                >
                                    Registruj se i prijavi me
                                </Button>
                            </Stack>
                        </Box>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Već imaš nalog?{' '}
                                <Link
                                    component={RouterLink}
                                    to="/login"
                                    sx={{ fontWeight: 'bold', textDecoration: 'none', color: '#1976d2' }}
                                >
                                    Prijavi se ovde
                                </Link>
                            </Typography>
                        </Box>

                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}
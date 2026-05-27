//otprilike sablon, dodat u app.tsx da se ucita odmah radi provere kako funkcionise React sa MUI
import React, { useState, type FormEvent } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    IconButton,
    InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import type { LoginCredentials } from '../types';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState<LoginCredentials>({
        username: '',
        password: ''
    });

    // Stanje za prikaz/skrivanje lozinke
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // Handler za promenu teksta u inputima
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handler za slanje forme
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        console.log("Podaci spremni za backend Login: ", formData);

        // Simulacija
        if (formData.username.trim() && formData.password.trim()) {
            onLoginSuccess();
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                }}
            >
                <Card elevation={4} sx={{ width: '100%', borderRadius: 3, p: 1 }}>
                    <CardContent>
                        {/* Logo i Naslov */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                mb: 3
                            }}
                        >
                            <SportsBasketballIcon color="primary" sx={{ fontSize: 45, mb: 1 }} />
                            <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 'bold' }}>
                                Qosh
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Ulogujte se na svoj nalog
                            </Typography>
                        </Box>

                        <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Korisničko ime"
                                name="username"
                                autoComplete="username"
                                autoFocus
                                value={formData.username}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Lozinka"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                                value={formData.password}
                                onChange={handleChange}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="promeni vidljivost lozinke"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                sx={{ mt: 3, mb: 2, borderRadius: 2, fontWeight: 'bold' }}
                            >
                                Uloguj se
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default Login;
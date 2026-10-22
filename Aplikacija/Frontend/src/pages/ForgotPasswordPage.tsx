import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await api.post('/Auth/Forgot-Password', { email });
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data || "Greška pri slanju zahteva.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            <Navbar />
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
                            <SportsBasketballIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Zaboravljena lozinka
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                Unesi svoju email adresu i poslaćemo ti link za resetovanje lozinke.
                            </Typography>
                        </Stack>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        {sent ? (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Poslat vam je email sa linkom za resetovanje lozinke. Proverite svoje sanduče.
                            </Alert>
                        ) : (
                            <Box component="form" onSubmit={handleSubmit}>
                                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <TextField
                                        fullWidth
                                        label="Email adresa"
                                        type="email"
                                        variant="outlined"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        size="large"
                                        disabled={loading}
                                        sx={{ fontWeight: 'bold', py: 1.5, borderRadius: 2 }}
                                    >
                                        {loading ? 'Slanje...' : 'Pošalji link'}
                                    </Button>
                                </Stack>
                            </Box>
                        )}

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Sećaš se lozinke?{' '}
                                <Link
                                    component={RouterLink}
                                    to="/login"
                                    sx={{ fontWeight: 'bold', textDecoration: 'none', color: '#1976d2' }}
                                >
                                    Prijavi se
                                </Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

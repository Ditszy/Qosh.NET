import { useState, useEffect } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
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
    Alert,
    CircularProgress
} from '@mui/material';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            return;
        }
        api.get('/Auth/Check-Reset-Token', { params: { token } })
            .then(res => setTokenValid(res.data.valid))
            .catch(() => setTokenValid(false));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Lozinke se ne poklapaju.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Lozinka mora imati najmanje 6 karaktera.");
            return;
        }

        if (!/\d/.test(newPassword)) {
            setError("Lozinka mora sadržati bar jedan broj.");
            return;
        }

        if (!/[^a-zA-Z0-9]/.test(newPassword)) {
            setError("Lozinka mora sadržati bar jedan specijalni karakter.");
            return;
        }

        setLoading(true);
        try {
            await api.post('/Auth/Reset-Password', { token, newPassword });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data || "Greška pri promeni lozinke.");
        } finally {
            setLoading(false);
        }
    };

    if (tokenValid === null) {
        return (
            <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                <Navbar />
                <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
                    <CircularProgress />
                </Container>
            </Box>
        );
    }

    if (!tokenValid) {
        return (
            <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                <Navbar />
                <Container maxWidth="sm" sx={{ mt: 8 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Stack sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
                                <SportsBasketballIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    Neispravan link
                                </Typography>
                            </Stack>
                            <Alert severity="error" sx={{ mb: 2 }}>
                                Link za resetovanje lozinke nije važeći ili je istekao.
                            </Alert>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link component={RouterLink} to="/forgot-password" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                    Zatraži novi link
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            <Navbar />
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
                            <SportsBasketballIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Nova lozinka
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                Unesi svoju novu lozinku.
                            </Typography>
                        </Stack>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        {success ? (
                            <>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Lozinka je uspešno promenjena!
                                </Alert>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Link component={RouterLink} to="/login" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                        Prijavi se sa novom lozinkom
                                    </Link>
                                </Box>
                            </>
                        ) : (
                            <Box component="form" onSubmit={handleSubmit}>
                                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <TextField
                                        fullWidth
                                        label="Nova lozinka"
                                        type="password"
                                        variant="outlined"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        label="Potvrdi lozinku"
                                        type="password"
                                        variant="outlined"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                        {loading ? 'Čuvanje...' : 'Promeni lozinku'}
                                    </Button>
                                </Stack>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

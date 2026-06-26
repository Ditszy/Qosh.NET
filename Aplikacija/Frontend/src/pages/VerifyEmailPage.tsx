import { useState, useEffect } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Stack,
    Link,
    Alert,
    CircularProgress
} from '@mui/material';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');

    useEffect(() => {
        if (!token) {
            setStatus('no-token');
            return;
        }

        api.post('/Auth/Verify-Email', { token })
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'));
    }, [token]);

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            <Navbar />
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
                            <SportsBasketballIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Verifikacija email adrese
                            </Typography>
                        </Stack>

                        {status === 'loading' && (
                            <Stack sx={{ alignItems: 'center', py: 4 }}>
                                <CircularProgress />
                                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                    Verifikacija u toku...
                                </Typography>
                            </Stack>
                        )}

                        {status === 'success' && (
                            <Stack sx={{ alignItems: 'center', gap: 2, py: 2 }}>
                                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />
                                <Alert severity="success" sx={{ width: '100%' }}>
                                    Email adresa je uspešno verifikovana!
                                </Alert>
                                <Box sx={{ textAlign: 'center', mt: 1 }}>
                                    <Link component={RouterLink} to="/login" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                        Prijavi se na nalog
                                    </Link>
                                </Box>
                            </Stack>
                        )}

                        {status === 'error' && (
                            <Stack sx={{ alignItems: 'center', gap: 2, py: 2 }}>
                                <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />
                                <Alert severity="error" sx={{ width: '100%' }}>
                                    Link za verifikaciju nije važeći ili je istekao.
                                </Alert>
                                <Box sx={{ textAlign: 'center', mt: 1 }}>
                                    <Link component={RouterLink} to="/" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                        Nazad na početnu
                                    </Link>
                                </Box>
                            </Stack>
                        )}

                        {status === 'no-token' && (
                            <Stack sx={{ alignItems: 'center', gap: 2, py: 2 }}>
                                <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />
                                <Alert severity="warning" sx={{ width: '100%' }}>
                                    Nije pronađen token za verifikaciju.
                                </Alert>
                                <Box sx={{ textAlign: 'center', mt: 1 }}>
                                    <Link component={RouterLink} to="/" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                        Nazad na početnu
                                    </Link>
                                </Box>
                            </Stack>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

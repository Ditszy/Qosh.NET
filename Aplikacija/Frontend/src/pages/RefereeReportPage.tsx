import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    TextField,
    Button,
    Divider,
    CircularProgress,
    IconButton
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import GavelIcon from '@mui/icons-material/Gavel';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function RefereeReportPage() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState<any>(null);
    const [reportText, setReportText] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const response = await api.get(`/Match/Match-Details/${matchId}`);
                setMatch(response.data);
                if (response.data.refereeReport) {
                    setReportText(response.data.refereeReport);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMatch();
    }, [matchId]);

    const handleSubmit = async () => {
        if (!reportText.trim()) return alert("Molimo unesite tekst izveštaja.");
        
        try {
            setSubmitting(true);
            await api.post(`/Match/Submit-Report/${matchId}`, {
                reportText: reportText
            });
            alert("Izveštaj je uspešno podnesen!");
            navigate('/referee');
        } catch (err: any) {
            alert(err.response?.data || "Greška pri podnošenju izveštaja.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="md" sx={{ mt: 5 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                    <ArrowBackIosNewIcon />
                </IconButton>

                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Podnesi izveštaj sudije
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Zvanični zapisnik sudije za utakmicu: {match?.homeTeamName} vs {match?.awayTeamName}
                    </Typography>
                </Stack>

                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                            <GavelIcon sx={{ color: '#1976d2' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Detalji izveštaja
                            </Typography>
                        </Stack>
                        <Divider sx={{ mb: 3 }} />

                        <Stack spacing={3}>
                            <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Utakmica</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                    {match?.homeTeamName} {match?.homeScore} : {match?.awayScore} {match?.awayTeamName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {match?.leagueName} • {match?.startTime}
                                </Typography>
                            </Box>

                            <TextField
                                label="Tekst izveštaja"
                                multiline
                                rows={10}
                                fullWidth
                                placeholder="Unesite zapažanja, incidente ili bilo koje važne informacije sa utakmice..."
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                                sx={{ bgcolor: '#fff' }}
                            />

                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleSubmit}
                                disabled={submitting}
                                sx={{ 
                                    py: 1.5, 
                                    fontWeight: 700, 
                                    textTransform: 'none',
                                    borderRadius: 2
                                }}
                            >
                                {submitting ? <CircularProgress size={24} color="inherit" /> : "Sačuvaj izveštaj"}
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

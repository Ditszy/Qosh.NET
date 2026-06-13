import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    Button,
    Divider,
    CircularProgress
} from '@mui/material';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import Navbar from '../components/Navbar';
import { matchStatusColor, matchStatusLabel } from '../utils/leagueFormat';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ScorerMatchesPage() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/Match/Get-My-Assigned-Matches`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                });
                setMatches(response.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchMatches();
    }, [user]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Zapisničar — Moji mečevi
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Upravljaj utakmicama koje su ti dodeljene i otvori zapisnik kada meč počne.
                    </Typography>
                </Stack>

                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                            <SportsScoreIcon sx={{ color: '#1976d2' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Dodeljene utakmice
                            </Typography>
                        </Stack>
                        <Divider sx={{ mb: 3 }} />

                        <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {matches.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    Trenutno nemate dodeljenih utakmica.
                                </Typography>
                            )}
                            {matches.map((match) => (
                                <Card key={match.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <CardContent>
                                        <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {match.homeTeamName} vs {match.awayTeamName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {match.leagueName} • {match.startTime}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={matchStatusLabel(match.status)}
                                                color={matchStatusColor(match.status)}
                                                size="small"
                                            />
                                        </Stack>

                                        <Box sx={{ mt: 2 }}>
                                            <Button
                                                component={RouterLink}
                                                to={`/scorer/matches/${match.id}`}
                                                variant="contained"
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            >
                                                Otvori zapisnik
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

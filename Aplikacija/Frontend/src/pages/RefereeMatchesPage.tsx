import { useState, useEffect, useMemo } from 'react';
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
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import HistoryIcon from '@mui/icons-material/History';
import Navbar from '../components/Navbar';
import { matchStatusColor, matchStatusLabel } from '../utils/leagueFormat';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MatchStatus } from '../types';

export default function RefereeMatchesPage() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const response = await api.get('/Match/Get-My-Assigned-Matches');
                setMatches(response.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchMatches();
    }, [user]);

    const activeMatches = useMemo(() => 
        matches.filter(m => [MatchStatus.Scheduled, MatchStatus.Live, MatchStatus.Paused].includes(m.status)),
        [matches]
    );

    const finishedMatches = useMemo(() => 
        matches.filter(m => [MatchStatus.Finished, MatchStatus.Canceled].includes(m.status)),
        [matches]
    );

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Sudija — Moji mečevi
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Pregledaj utakmice na kojima si delegiran kao sudija i podnesi izveštaj nakon završetka.
                    </Typography>
                </Stack>

                <Tabs 
                    value={tabValue} 
                    onChange={(_, val) => setTabValue(val)} 
                    sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Aktivne / Zakazane" icon={<GavelIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
                    <Tab label="Završene" icon={<HistoryIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
                </Tabs>

                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                            {tabValue === 0 ? <GavelIcon sx={{ color: '#1976d2' }} /> : <HistoryIcon sx={{ color: '#666' }} />}
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {tabValue === 0 ? 'Aktivne i zakazane utakmice' : 'Završene utakmice'}
                            </Typography>
                        </Stack>
                        <Divider sx={{ mb: 3 }} />

                        <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {(tabValue === 0 ? activeMatches : finishedMatches).length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    {tabValue === 0 ? 'Trenutno nemate aktivnih utakmica.' : 'Nemate završenih utakmica.'}
                                </Typography>
                            )}
                            {(tabValue === 0 ? activeMatches : finishedMatches).map((match) => (
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

                                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                            <Button
                                                component={RouterLink}
                                                to={`/matches/${match.id}`}
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            >
                                                Detalji meča
                                            </Button>
                                            {match.status === MatchStatus.Finished && (
                                                <Button
                                                    component={RouterLink}
                                                    to={`/referee/report/${match.id}`}
                                                    variant="contained"
                                                    size="small"
                                                    color="primary"
                                                    sx={{ fontWeight: 700 }}
                                                >
                                                    Podnesi izveštaj
                                                </Button>
                                            )}
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

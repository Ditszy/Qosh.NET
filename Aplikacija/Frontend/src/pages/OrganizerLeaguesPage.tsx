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
    Grid,
    CircularProgress
} from '@mui/material';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { matchTypeLabel } from '../utils/leagueFormat';

export default function OrganizerLeaguesPage() {
    const { user } = useAuth();
    const [leagues, setLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/User/My-Leagues`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                });
                setLeagues(res.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchLeagues();
    }, [user]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Moje lige</Typography>

                <Grid container spacing={3}>
                    {leagues.map((league) => (
                        <Grid size={{ xs: 12, md: 6 }} key={league.id}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{league.name}</Typography>
                                        <Chip label={matchTypeLabel(league.matchType)} color="primary" size="small" />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Sezona: {league.season} • Timovi: {league.teamCount}/{league.maxTeams}
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                                        <Button component={RouterLink} to={`/leagues/${league.id}`} variant="outlined" size="small">Pregledaj</Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {leagues.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body1" sx={{ textAlign: 'center', py: 5 }} color="text.secondary">
                                Još uvek niste kreirali nijednu ligu.
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Container>
        </Box>
    );
}
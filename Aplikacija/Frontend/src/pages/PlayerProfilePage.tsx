import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    Grid,
    Avatar,
    Divider,
    CircularProgress,
    Paper,
    Chip,
    TableContainer,
    Button
} from '@mui/material';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { MatchType, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

const StatBlock = ({ title, data }: { title: string, data: any }) => (
    <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
        <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>{title}</Typography>
            {!data ? (
                <Typography variant="body2" color="text.secondary">Nema podataka za ovaj format.</Typography>
            ) : (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Odigrano mečeva</Typography>
                        <Typography variant="h6">{data.gamesPlayed}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Avg. Poeni</Typography>
                        <Typography variant="h6">{data.avgPoints.toFixed(1)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">Skokovi</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{data.avgRebounds.toFixed(1)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">Asistencije</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{data.avgAssists.toFixed(1)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">Blokade</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{data.avgBlocks.toFixed(1)}</Typography>
                    </Grid>
                </Grid>
            )}
        </CardContent>
    </Card>
);

export default function PlayerProfilePage() {
    const { userId } = useParams();
    const { user: currentUser, hasRole } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [profileRes, statsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/User/${userId}/profile`),
                axios.get(`${import.meta.env.VITE_API_URL}/Statistics/Player-Stats/${userId}`)
            ]);
            setProfile(profileRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleToggleStatus = async () => {
        try {
            const endpoint = profile.isActive ? 'Deactivate-User' : 'Activate-User';
            await axios.put(`${import.meta.env.VITE_API_URL}/Admin/${endpoint}`, { username: profile.username }, {
                headers: { Authorization: `Bearer ${currentUser?.token}` }
            });
            fetchData();
        } catch (err) { alert("Greška pri promeni statusa."); }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const stats5x5 = stats?.statsByMatchType?.find((s: any) => s.matchType === MatchType.Classic_5x5);
    const stats3x3 = stats?.statsByMatchType?.find((s: any) => s.matchType === MatchType.Basket_3X3);

    const fullProfilePicUrl = profile?.profilePictureUrl ? (profile.profilePictureUrl.startsWith('http') ? profile.profilePictureUrl : `${apiBaseUrl}${profile.profilePictureUrl}`) : '';
    console.log("DEBUG: profile data:", profile, "Full URL:", fullProfilePicUrl);

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Grid container spacing={4}>
                    {/* Osnovni info */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ borderRadius: 3, textAlign: 'center', p: 3 }}>
                            <Avatar
                                sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '3rem' }}
                                src={fullProfilePicUrl}
                            >
                                {profile?.username?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>{profile?.firstName} {profile?.lastName}</Typography>
                            <Typography variant="body1" color="text.secondary">@{profile?.username}</Typography>
                            <Chip label={profile?.globalRole} size="small" color="primary" sx={{ mt: 1, fontWeight: 700 }} />

                            {hasRole(UserRole.Admin) && (
                                <Box sx={{ mt: 3, p: 2, bgcolor: '#fff5f5', borderRadius: 2, border: '1px solid #feb2b2' }}>
                                    <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 700, mb: 1 }}>Admin Akcije</Typography>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        color={profile?.isActive ? "error" : "success"}
                                        size="small"
                                        onClick={handleToggleStatus}
                                    >
                                        {profile?.isActive ? "Deaktiviraj nalog" : "Aktiviraj nalog"}
                                    </Button>
                                </Box>
                            )}

                            <Divider sx={{ my: 3 }} />

                            <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Timovi:</Typography>
                                    <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        {profile?.teams?.map((t: any) => (
                                            <Chip key={t.teamId} label={t.teamName} size="small" variant="outlined" />
                                        ))}
                                        {(!profile?.teams || profile.teams.length === 0) && <Typography variant="body2">Nema tima</Typography>}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>

                    {/* Statistika */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Statistika igrača</Typography>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StatBlock title="5x5 Prosek" data={stats5x5} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StatBlock title="3x3 Prosek" data={stats3x3} />
                            </Grid>
                        </Grid>

                        <Card sx={{ borderRadius: 3, mt: 4 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Istorija mečeva</Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Grid container sx={{ p: 2, bgcolor: '#f5f5f5', fontWeight: 700 }}>
                                        <Grid size={{ xs: 4 }}>Meč</Grid>
                                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>PTS</Grid>
                                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>REB</Grid>
                                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>AST</Grid>
                                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>Status</Grid>
                                    </Grid>
                                    {profile?.matchHistory?.map((m: any) => (
                                        <Grid container key={m.matchId} sx={{ p: 2, borderTop: '1px solid #eee' }}>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.homeTeamName} vs {m.awayTeamName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{new Date(m.startTime).toLocaleDateString()}</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>{m.points}</Grid>
                                            <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>{m.rebounds}</Grid>
                                            <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>{m.assists}</Grid>
                                            <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>
                                                <Chip label={m.matchStatus} size="small" variant="outlined" />
                                            </Grid>
                                        </Grid>
                                    ))}
                                    {(!profile?.matchHistory || profile.matchHistory.length === 0) && (
                                        <Typography variant="body2" sx={{ p: 3, textAlign: 'center' }} color="text.secondary">Nema odigranih mečeva.</Typography>
                                    )}
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    Divider,
    Grid,
    CircularProgress,
    Button,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Autocomplete
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Navbar from '../components/Navbar';
import BracketVisualization from '../components/BracketVisualization';
import RoundRobinView from '../components/RoundRobinView';
import { MatchType, UserRole } from '../types';
import type { UserDto } from '../types';
import { competitionSystemLabel, matchTypeLabel } from '../utils/leagueFormat';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function LeagueDetailsPage() {
    const { leagueId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [league, setLeague] = useState<any>(null);
    const [bracketRounds, setBracketRounds] = useState<any[]>([]);
    const [teamStats, setTeamStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingMatch, setEditingMatch] = useState<any>(null);
    const [editStartTime, setEditStartTime] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [userSearch, setUserSearch] = useState<UserDto[]>([]);
    const [referee, setReferee] = useState<UserDto | null>(null);
    const [scorer, setScorer] = useState<UserDto | null>(null);
    const [updating, setUpdating] = useState(false);

    const fetchData = async () => {
        try {
            const [leagueRes, bracketRes, statsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/Leagues/${leagueId}`),
                axios.get(`${import.meta.env.VITE_API_URL}/Leagues/Get-Bracket/${leagueId}`),
                axios.get(`${import.meta.env.VITE_API_URL}/Statistics/Team-Stats/${leagueId}`)
            ]);

            setLeague(leagueRes.data);
            setTeamStats(statsRes.data);

            const roundsData = bracketRes.data || {};
            const formattedRounds = Object.keys(roundsData).map(roundNum => ({
                title: `Kolo ${roundNum}`,
                matches: roundsData[roundNum].map((m: any) => ({
                    id: m.matchId,
                    homeTeam: m.homeTeamName,
                    awayTeam: m.awayTeamName,
                    homeScore: m.homeScore,
                    awayScore: m.awayScore,
                    startTime: new Date(m.startTime).toLocaleString(),
                    rawStartTime: m.startTime,
                    status: m.status === 'Live' ? 2 : (m.status === 'Finished' ? 3 : 1),
                    location: m.location || '',
                    refereeId: m.refereeId,
                    refereeName: m.refereeUsername,
                    scorerId: m.scorerId,
                    scorerName: m.scorerUsername
                }))
            }));
            setBracketRounds(formattedRounds);

        } catch (err) {
            console.error("Error fetching league details", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [leagueId]);

    const handleGenerateBracket = async () => {
        if (!league) return;
        setGenerating(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/Leagues/Generate-Bracket/${league.id}`, {}, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            await fetchData();
            alert("Bracket je uspešno generisan!");
        } catch (err: any) {
            alert(err.response?.data || "Greška pri generisanju bracket-a.");
        } finally {
            setGenerating(false);
        }
    };

    const handleOpenEdit = (match: any) => {
        setEditingMatch(match);
        const date = new Date(match.rawStartTime);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        setEditStartTime(localISOTime);
        setEditLocation(match.location || '');
        setReferee(match.refereeId ? { id: match.refereeId, username: match.refereeName } as any : null);
        setScorer(match.scorerId ? { id: match.scorerId, username: match.scorerName } as any : null);
        setOpenEditDialog(true);
    };

    const handleSearchUsers = async (query: string) => {
        if (!query) return;
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/User/Search?q=${query}`);
            setUserSearch(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateMatch = async () => {
        if (!editingMatch) return;
        setUpdating(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/Match/Update-Match`, {
                matchId: editingMatch.id,
                startTime: new Date(editStartTime).toISOString(),
                location: editLocation,
                refereeId: referee?.id || null,
                scorerId: scorer?.id || null
            }, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setOpenEditDialog(false);
            await fetchData();
            alert("Utakmica je uspešno ažurirana.");
        } catch (err: any) {
            alert(err.response?.data || "Greška pri ažuriranju.");
        } finally {
            setUpdating(false);
        }
    };

    const isKnockout = league?.matchType === MatchType.Basket_3X3;
    const isOrganizer = user && league && user.username === league.creatorUsername;

    const roundRobinData = useMemo(() => {
        if (isKnockout || !league) return null;
        const standings = teamStats.map(ts => ({
            id: ts.teamId,
            team: ts.teamName,
            played: ts.gamesPlayed,
            wins: 0,
            losses: 0,
            pointsFor: ts.totalPoints,
            pointsAgainst: 0,
            points: ts.gamesPlayed * 1 // Placeholder, treba da se menja svakako ovo sve
        }));
        const allMatches = bracketRounds.flatMap((r) => r.matches.map((m: any) => ({ ...m, round: parseInt(r.title.split(' ')[1]) })));
        return { standings, matches: allMatches };
    }, [league, teamStats, bracketRounds, isKnockout]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const isRegistrationOpen = new Date(league.registrationDeadline) > new Date();
    const minRequired = league.matchType === 2 ? 3 : 5;

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>{league.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sezona {league.season || '2026'} • Rok prijave: {new Date(league.registrationDeadline).toLocaleDateString()}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        {isOrganizer && bracketRounds.length === 0 && (
                            <Button
                                variant="contained"
                                color="secondary"
                                size="large"
                                startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                                onClick={handleGenerateBracket}
                                disabled={generating || league.teams?.length < 2}
                                sx={{ fontWeight: 700, borderRadius: 2 }}
                            >
                                Generiši takmičenje
                            </Button>
                        )}
                        {isAuthenticated && isRegistrationOpen && (
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<GroupsIcon />}
                                onClick={() => navigate('/team', { state: { leagueId: league.id } })}
                                sx={{ fontWeight: 700, borderRadius: 2 }}
                            >
                                Prijavi tim
                            </Button>
                        )}
                    </Stack>
                </Stack>

                <Card sx={{ borderRadius: 3, mb: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                            <Chip label={`Format: ${matchTypeLabel(league.matchType)}`} color="primary" />
                            <Chip label={competitionSystemLabel(league.matchType)} variant="outlined" />
                            <Chip label={isRegistrationOpen ? 'Prijave otvorene' : 'Prijave zatvorene'} color={isRegistrationOpen ? 'success' : 'error'} variant="outlined" />
                            <Chip label={`Prijavljeno: ${league.teams?.length || 0}/${league.maxTeams}`} variant="outlined" />
                            <Chip label={`Organizator: ${league.creatorUsername}`} variant="outlined" />
                        </Stack>
                    </CardContent>
                </Card>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1, mb: 2 }}>
                                    <EmojiEventsIcon sx={{ color: '#f59e0b' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {bracketRounds.length > 0 ? (isKnockout ? 'Bracket faza' : 'Tabela i rezultati') : 'Takmičenje u pripremi'}
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 3 }} />

                                {bracketRounds.length > 0 ? (
                                    isKnockout ? (
                                        <BracketVisualization
                                            rounds={bracketRounds}
                                            isOrganizer={isOrganizer}
                                            onEditMatch={handleOpenEdit}
                                        />
                                    ) : (
                                        <RoundRobinView
                                            data={roundRobinData!}
                                            isOrganizer={isOrganizer}
                                            onEditMatch={handleOpenEdit}
                                        />
                                    )
                                ) : (
                                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
                                        Takmičarski deo još nije počeo. {isOrganizer ? 'Pritisnite "Generiši takmičenje" kada budete spremni.' : 'Čekaju se prijave timova.'}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Prijavljeni timovi</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <List sx={{ width: '100%' }}>
                                    {league.teams?.map((team: any) => (
                                        <ListItem
                                            key={team.id}
                                            sx={{
                                                bgcolor: '#f8fafc',
                                                borderRadius: 2,
                                                mb: 1.5,
                                                border: team.isEligible ? '1px solid #e2e8f0' : '1px dashed #f87171'
                                            }}
                                        >
                                            <ListItemText
                                                primary={<Typography sx={{ fontWeight: 700 }}>{team.name}</Typography>}
                                                secondary={
                                                    <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                                        <Chip
                                                            label={`${team.memberCount}/${minRequired} igrača`}
                                                            size="small"
                                                            color={team.isEligible ? 'success' : 'warning'}
                                                            variant={team.isEligible ? 'filled' : 'outlined'}
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                        {!team.isEligible && (
                                                            <Typography variant="caption" sx={{ ml: 1, color: 'error.main', fontWeight: 600 }}>
                                                                Nepotpun
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                    {(!league.teams || league.teams.length === 0) && (
                                        <Typography variant="body2" color="text.secondary" align="center">Još uvek nema prijavljenih timova.</Typography>
                                    )}
                                </List>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
                                    * Tim je potvrđen kada ima najmanje {minRequired} aktivna igrača.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Za izmenu utakmice */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Izmeni utakmicu: {editingMatch?.homeTeam} vs {editingMatch?.awayTeam}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Vreme početka"
                            type="datetime-local"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Lokacija"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            fullWidth
                        />
                        <Autocomplete
                            value={referee}
                            options={userSearch.filter(u => u.globalRole === UserRole.Referee || u.globalRole === UserRole.Admin)}
                            getOptionLabel={(option) => `${option.username} (${option.firstName || ''} ${option.lastName || ''})`}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            onInputChange={(_, value) => handleSearchUsers(value)}
                            onChange={(_, value) => setReferee(value)}
                            renderInput={(params) => (
                                <TextField {...params} label="Pretraži sudiju" variant="outlined" />
                            )}
                        />
                        <Autocomplete
                            value={scorer}
                            options={userSearch.filter(u => u.globalRole === UserRole.Scorer || u.globalRole === UserRole.Admin)}
                            getOptionLabel={(option) => `${option.username} (${option.firstName || ''} ${option.lastName || ''})`}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            onInputChange={(_, value) => handleSearchUsers(value)}
                            onChange={(_, value) => setScorer(value)}
                            renderInput={(params) => (
                                <TextField {...params} label="Pretraži zapisničara" variant="outlined" />
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenEditDialog(false)}>Otkaži</Button>
                    <Button
                        onClick={handleUpdateMatch}
                        variant="contained"
                        color="primary"
                        disabled={updating}
                    >
                        {updating ? <CircularProgress size={24} color="inherit" /> : "Sačuvaj izmene"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
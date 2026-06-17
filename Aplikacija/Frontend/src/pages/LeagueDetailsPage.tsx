import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
    Autocomplete,
    useTheme,
    alpha,
    IconButton
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Navbar from '../components/Navbar';
import BracketVisualization from '../components/BracketVisualization';
import RoundRobinView from '../components/RoundRobinView';
import { MatchType, UserRole } from '../types';
import type { UserDto } from '../types';
import { competitionSystemLabel, matchTypeLabel } from '../utils/leagueFormat';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LeagueDetailsPage() {
    const { leagueId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
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
                api.get(`/Leagues/${leagueId}`),
                api.get(`/Leagues/Get-Bracket/${leagueId}`),
                api.get(`/Statistics/Team-Stats/${leagueId}`)
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
            await api.post(`/Leagues/Generate-Bracket/${league.id}`, {});
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
            const res = await api.get(`/User/Search?q=${query}`);
            setUserSearch(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateMatch = async () => {
        if (!editingMatch) return;
        setUpdating(true);
        try {
            await api.put('/Match/Update-Match', {
                matchId: editingMatch.id,
                startTime: new Date(editStartTime).toISOString(),
                location: editLocation,
                refereeId: referee?.id || null,
                scorerId: scorer?.id || null
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
        if (isKnockout || !league || !league.teams) return null;

        const standingsMap: Record<string, any> = {};
        league.teams.forEach((t: any) => {
            standingsMap[t.name] = {
                id: t.id,
                team: t.name,
                played: 0,
                wins: 0,
                losses: 0,
                pointsFor: 0,
                pointsAgainst: 0,
                points: 0
            };
        });

        const allMatches = bracketRounds.flatMap((r) =>
            r.matches.map((m: any) => ({
                ...m,
                round: parseInt(r.title.split(' ')[1])
            }))
        );

        allMatches.forEach((m: any) => {
            if (m.status === 3 && m.homeScore !== undefined && m.awayScore !== undefined) {
                const home = standingsMap[m.homeTeam];
                const away = standingsMap[m.awayTeam];

                if (home && away) {
                    home.played += 1;
                    away.played += 1;
                    home.pointsFor += m.homeScore;
                    home.pointsAgainst += m.awayScore;
                    away.pointsFor += m.awayScore;
                    away.pointsAgainst += m.homeScore;

                    if (m.homeScore > m.awayScore) {
                        home.wins += 1;
                        home.points += 2;
                        away.losses += 1;
                        away.points += 1;
                    } else if (m.awayScore > m.homeScore) {
                        away.wins += 1;
                        away.points += 2;
                        home.losses += 1;
                        home.points += 1;
                    } else {
                        home.points += 1;
                        away.points += 1;
                    }
                }
            }
        });

        const standings = Object.values(standingsMap).sort((a: any, b: any) => {
            if (b.points !== a.points) return b.points - a.points;
            const diffA = a.pointsFor - a.pointsAgainst;
            const diffB = b.pointsFor - b.pointsAgainst;
            return diffB - diffA;
        });

        return { standings, matches: allMatches };
    }, [league, bracketRounds, isKnockout]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    if (!league) {
        return (
            <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
                <Navbar />
                <Container sx={{ mt: 10, textAlign: 'center' }}>
                    <Typography variant="h5" color="error" sx={{ fontWeight: 700 }}>Takmičenje nije pronađeno</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>Moguće je da je liga obrisana ili da imate pogrešan link.</Typography>
                    <Button
                        component={RouterLink}
                        to="/leagues"
                        variant="contained"
                        sx={{ mt: 4, borderRadius: 2, fontWeight: 700 }}
                    >
                        Nazad na listu liga
                    </Button>
                </Container>
            </Box>
        );
    }

    const isRegistrationOpen = league.registrationDeadline ? new Date(league.registrationDeadline) > new Date() : false;
    const minRequired = league.matchType === 2 ? 3 : 5;

    return (
        <Box sx={{ bgcolor: '#fbfcfd', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Box sx={{
                background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, #1e293b 100%)`,
                color: 'white',
                pt: { xs: 4, md: 6 },
                pb: { xs: 8, md: 10 },
                mb: -6
            }}>
                <Container maxWidth="lg">
                    <Button
                        component={RouterLink}
                        to="/leagues"
                        startIcon={<ArrowBackIosNewIcon />}
                        sx={{ color: alpha('#fff', 0.7), mb: 3, textTransform: 'none', fontWeight: 600 }}
                    >
                        Sve lige
                    </Button>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ justifyContent: "space-between", alignItems: { xs: 'flex-start', md: 'center' } }}>
                        <Box>
                            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em' }}>
                                {league.name}
                            </Typography>
                            <Stack sx={{ direction: "row", spacing: 2, alignItems: "center" }}>
                                <Stack sx={{ direction: "row", spacing: 0.5, alignItems: "center", color: alpha('#fff', 0.7) }}>
                                    <EventIcon fontSize="small" />
                                    <Typography variant="body2">Sezona {league.season || '2026'}</Typography>
                                </Stack>
                                <Divider orientation="vertical" flexItem sx={{ bgcolor: alpha('#fff', 0.2) }} />
                                <Stack sx={{ direction: "row", spacing: 0.5, alignItems: "center", color: alpha('#fff', 0.7) }}>
                                    <LocationOnIcon fontSize="small" />
                                    <Typography variant="body2">Beograd, Srbija</Typography>
                                </Stack>
                            </Stack>
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
                                    sx={{
                                        fontWeight: 800,
                                        borderRadius: 3,
                                        px: 4,
                                        boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.3)}`
                                    }}
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
                                    sx={{
                                        fontWeight: 800,
                                        borderRadius: 3,
                                        px: 4,
                                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                                    }}
                                >
                                    Prijavi tim
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{
                            borderRadius: 4,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.03)',
                            overflow: 'visible'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack sx={{ direction: "row", flexWrap: "wrap", gap: 1.5 }}>
                                    <Chip
                                        label={`Format: ${matchTypeLabel(league.matchType)}`}
                                        color="primary"
                                        sx={{ fontWeight: 800, borderRadius: 2 }}
                                    />
                                    <Chip
                                        label={competitionSystemLabel(league.matchType)}
                                        variant="outlined"
                                        sx={{ fontWeight: 700, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                                    />
                                    <Chip
                                        label={isRegistrationOpen ? 'PRIJAVE OTVORENE' : 'PRIJAVE ZATVORENE'}
                                        color={isRegistrationOpen ? 'success' : 'error'}
                                        variant="filled"
                                        sx={{ fontWeight: 900, borderRadius: 2, px: 1 }}
                                    />
                                    <Chip
                                        label={`Popunjenost: ${league.teams?.length || 0}/${league.maxTeams}`}
                                        variant="outlined"
                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                    />
                                    <Chip
                                        label={`Organizator: ${league.creatorUsername}`}
                                        variant="outlined"
                                        sx={{ fontWeight: 700, borderRadius: 2, borderStyle: 'dashed' }}
                                    />
                                    <Chip
                                        label={`Kotizacija: ${league.entryFee ? `${league.entryFee.toLocaleString()} RSD` : 'Besplatno'}`}
                                        variant="filled"
                                        color="secondary"
                                        sx={{ fontWeight: 800, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.9) }}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {league.description && (
                        <Grid size={{ xs: 12 }}>
                            <Card sx={{
                                borderRadius: 4,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.03)',
                                bgcolor: alpha(theme.palette.primary.main, 0.02)
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>O takmičenju</Typography>
                                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                        {league.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{
                            borderRadius: 5,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(0,0,0,0.03)',
                            minHeight: 500
                        }}>
                            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                                <Stack sx={{ direction: "row", alignItems: "center", spacing: 1.5, mb: 3 }}>
                                    <Box sx={{ bgcolor: alpha('#f59e0b', 0.1), p: 1, borderRadius: 2 }}>
                                        <EmojiEventsIcon sx={{ color: '#f59e0b', display: 'block' }} />
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {bracketRounds.length > 0 ? (isKnockout ? 'Bracket faza' : 'Tabela i rezultati') : 'Takmičenje u pripremi'}
                                    </Typography>
                                </Stack>

                                <Divider sx={{ mb: 4, opacity: 0.6 }} />

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
                                    <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f8fafc', borderRadius: 4 }}>
                                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 700 }}>
                                            Još uvek nema generisanih mečeva
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {isOrganizer
                                                ? 'Sačekajte dovoljno prijava, a zatim pritisnite dugme "Generiši takmičenje".'
                                                : 'Organizator će generisati raspored čim se završe prijave.'}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card sx={{
                            borderRadius: 5,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(0,0,0,0.03)'
                        }}>
                            <CardContent sx={{ p: 4 }}>
                                <Stack sx={{ direction: "row", alignItems: "center", spacing: 1.5, mb: 3 }}>
                                    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), p: 1, borderRadius: 2 }}>
                                        <GroupsIcon sx={{ color: theme.palette.primary.main, display: 'block' }} />
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Prijavljeni timovi</Typography>
                                </Stack>

                                <Divider sx={{ mb: 3, opacity: 0.6 }} />

                                <List sx={{ width: '100%', p: 0 }}>
                                    {league.teams?.map((team: any) => (
                                        <ListItem
                                            key={team.id}
                                            sx={{
                                                bgcolor: '#f8fafc',
                                                borderRadius: 4,
                                                mb: 2,
                                                p: 2,
                                                border: team.isEligible ? '1px solid #eef2f6' : '1px dashed #f87171',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start'
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', mb: 1 }}>{team.name}</Typography>
                                            <Stack sx={{ direction: "row", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                                <Chip
                                                    label={`${team.memberCount}/${minRequired} igrača`}
                                                    size="small"
                                                    color={team.isEligible ? 'success' : 'warning'}
                                                    sx={{ fontWeight: 800, height: 24 }}
                                                />
                                                {!team.isEligible && (
                                                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 800 }}>
                                                        NEPOTPUN
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </ListItem>
                                    ))}
                                    {(!league.teams || league.teams.length === 0) && (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                Nema prijavljenih timova.
                                            </Typography>
                                        </Box>
                                    )}
                                </List>
                                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 3, border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                                    <Typography variant="caption" color="info.main" sx={{ display: 'block', fontWeight: 600, lineHeight: 1.4 }}>
                                        💡 Tim se smatra potvrđenim tek kada sakupi minimalno {minRequired} aktivna igrača u rosteru.
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Za izmenu utakmice */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="sm" sx={{ '& .MuiPaper-root': { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>
                    Izmeni utakmicu
                </DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Ažurirajte vreme, lokaciju ili delegirajte službena lica za meč: <br />
                        <strong>{editingMatch?.homeTeam} vs {editingMatch?.awayTeam}</strong>
                    </Typography>
                    <Stack spacing={3}>
                        <TextField
                            label="Vreme početka"
                            type="datetime-local"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            fullWidth
                            slotProps={{ inputLabel: { shrink: true } }}
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
                                <TextField {...params} label="Sudija" variant="outlined" />
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
                                <TextField {...params} label="Zapisničar" variant="outlined" />
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 4 }}>
                    <Button onClick={() => setOpenEditDialog(false)} sx={{ fontWeight: 700, textTransform: 'none' }}>Otkaži</Button>
                    <Button
                        onClick={handleUpdateMatch}
                        variant="contained"
                        color="primary"
                        disabled={updating}
                        sx={{ fontWeight: 800, px: 4, borderRadius: 2, textTransform: 'none' }}
                    >
                        {updating ? <CircularProgress size={24} color="inherit" /> : "Sačuvaj izmene"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Autocomplete,
    useTheme,
    alpha,
    IconButton,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    Tooltip
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import PanToolIcon from '@mui/icons-material/PanTool';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import BlockIcon from '@mui/icons-material/Block';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import Navbar from '../components/Navbar';
import BracketVisualization from '../components/BracketVisualization';
import RoundRobinView from '../components/RoundRobinView';
import { MatchType, UserRole } from '../types';
import type { UserDto } from '../types';
import { competitionSystemLabel, matchTypeLabel, formatDate, formatDateTime } from '../utils/leagueFormat';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { useConfirm } from '../components/ConfirmProvider';
import { LeagueMap } from '../components/LeagueMap';

import { LocationPicker } from '../components/LocationPicker';

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

export default function LeagueDetailsPage() {
    const { leagueId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { user, isAuthenticated, hasRole } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [league, setLeague] = useState<any>(null);
    const [bracketRounds, setBracketRounds] = useState<any[]>([]);
    const [teamStats, setTeamStats] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openCreateTeamDialog, setOpenCreateTeamDialog] = useState(false);
    const [openLeaderboardDialog, setOpenLeaderboardDialog] = useState(false);
    const [leaderboardTab, setLeaderboardTab] = useState(0);

    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamCity, setNewTeamCity] = useState('');
    const [creatingTeam, setCreatingTeam] = useState(false);

    const [editingMatch, setEditingMatch] = useState<any>(null);
    const [editStartTime, setEditStartTime] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [userHasTeamInLeague, setUserHasTeamInLeague] = useState(false);
    const [userSearch, setUserSearch] = useState<UserDto[]>([]);
    const [referee, setReferee] = useState<UserDto | null>(null);
    const [scorer, setScorer] = useState<UserDto | null>(null);
    const [updating, setUpdating] = useState(false);
    const [teamRosterDialog, setTeamRosterDialog] = useState<{ open: boolean; team: any; roster: any[] }>({ open: false, team: null, roster: [] });

    const [openEditLeagueDialog, setOpenEditLeagueDialog] = useState(false);
    const [editLeagueForm, setEditLeagueForm] = useState({
        matchType: 1 as MatchType,
        entryFee: 0,
        description: '',
        maxTeams: 16,
        location: '',
        latitude: 0,
        longitude: 0,
        startDate: ''
    });
    const [savingLeague, setSavingLeague] = useState(false);

    const fetchData = async () => {
        try {
            const [leagueRes, bracketRes, statsRes, leaderboardRes] = await Promise.all([
                api.get(`/Leagues/${leagueId}`),
                api.get(`/Leagues/Get-Bracket/${leagueId}`),
                api.get(`/Statistics/Team-Stats/${leagueId}`),
                api.get('/Statistics/leaderboard', { params: { leagueId } })
            ]);

            setLeague(leagueRes.data);
            setTeamStats(statsRes.data);
            setLeaderboard(leaderboardRes.data);

            const roundsData = bracketRes.data || {};
            const formattedRounds = Object.keys(roundsData).map(roundNum => ({
                title: `Kolo ${roundNum}`,
                matches: roundsData[roundNum].map((m: any) => ({
                    id: m.matchId,
                    homeTeam: m.homeTeamName,
                    awayTeam: m.awayTeamName,
                    homeScore: m.homeScore,
                    awayScore: m.awayScore,
                    startTime: formatDateTime(m.startTime),
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

    useEffect(() => {
        if (!isAuthenticated || !user || !leagueId) return;
        const checkUserTeam = async () => {
            try {
                const res = await api.get(`/User/${user.id}/profile`);
                const teams = res.data.teams || [];
                setUserHasTeamInLeague(teams.some((t: any) => t.leagueId === Number(leagueId)));
            } catch (err) {
                console.error("Greska kod provere user team", err);
            }
        };
        checkUserTeam();
    }, [isAuthenticated, user, leagueId]);

    const handleGenerateBracket = async () => {
        if (!league) return;
        setGenerating(true);
        try {
            await api.post(`/Leagues/Generate-Bracket/${league.id}`, {});
            await fetchData();
            showToast("Bracket je uspešno generisan!", 'success');
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri generisanju bracket-a.", 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleLockRegistrations = async () => {
        if (!league) return;
        if (!(await confirm({ message: 'Da li ste sigurni da želite da zaključate prijave? Ova akcija se ne može poništiti.', confirmText: 'Zaključaj', severity: 'warning' }))) return;
        try {
            await api.put(`/Leagues/Lock-Registrations/${league.id}`);
            await fetchData();
            showToast("Prijave su uspešno zaključane!", 'success');
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri zaključavanju prijava.", 'error');
        }
    };

    const handleDisbandTeam = async (teamId: number, teamName: string) => {
        if (!(await confirm({ message: `Da li ste sigurni da želite da uklonite tim "${teamName}" iz lige?`, confirmText: 'Ukloni', severity: 'error' }))) return;
        try {
            await api.delete(`/Team/Disband-Team/${teamId}`);
            await fetchData();
            showToast(`Tim "${teamName}" je uspešno uklonjen.`, 'success');
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri uklanjanju tima.", 'error');
        }
    };

    const handleOpenEditLeague = () => {
        if (!league) return;
        setEditLeagueForm({
            matchType: league.matchType,
            entryFee: league.entryFee || 0,
            description: league.description || '',
            maxTeams: league.maxTeams || 16,
            location: league.location || '',
            latitude: league.latitude,
            longitude: league.longitude,
            startDate: league.startDate ? new Date(league.startDate).toISOString().slice(0, 16) : ''
        });
        setOpenEditLeagueDialog(true);
    };

    const handleUpdateLeague = async () => {
        if (!league) return;
        setSavingLeague(true);
        try {
            await api.put(`/Leagues/Update-Rules/${league.id}`, {
                matchType: editLeagueForm.matchType,
                entryFee: Number(editLeagueForm.entryFee),
                description: editLeagueForm.description,
                maxTeams: Number(editLeagueForm.maxTeams),
                location: editLeagueForm.location,
                latitude: editLeagueForm.latitude,
                longitude: editLeagueForm.longitude,
                startDate: editLeagueForm.startDate || null
            });
            setOpenEditLeagueDialog(false);
            await fetchData();
            showToast("Liga je uspešno ažurirana.", 'success');
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri ažuriranju lige.", 'error');
        } finally {
            setSavingLeague(false);
        }
    };

    const handleFinishLeague = async () => {
        if (!league) return;
        if (!(await confirm({ message: 'Da li ste sigurni da želite da završite ligu? Svi mečevi moraju biti završeni. Ova akcija se ne može poništiti.', confirmText: 'Završi ligu', severity: 'warning' }))) return;
        try {
            await api.post(`/Leagues/${league.id}/finish`);
            await fetchData();
            showToast("Liga je uspešno završena!", 'success');
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri završavanju lige.", 'error');
        }
    };

    const handleOpenTeamRoster = async (team: any) => {
        try {
            const res = await api.get(`/Team/Get-Team-Roster/${team.id}`);
            setTeamRosterDialog({ open: true, team, roster: res.data || [] });
        } catch (err: any) {
            showToast("Greška pri učitavanju rostera tima.", 'error');
        }
    };

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        setCreatingTeam(true);
        try {
            await api.post('/Team/Create-Team', {
                name: newTeamName,
                city: newTeamCity,
                leagueId: Number(leagueId)
            });
            setOpenCreateTeamDialog(false);
            setNewTeamName('');
            setNewTeamCity('');
            await fetchData();
            showToast("Tim je uspešno kreiran i prijavljen!", 'success');
            navigate('/team');
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri kreiranju tima.", 'error');
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleOpenEdit = (match: any) => {
        setEditingMatch({
        ...match,
        latitude: match.latitude || 43.3247,
        longitude: match.longitude || 21.9033,
    });
        const date = new Date(match.rawStartTime);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toLocaleString('sr-RS').slice(0, 16);
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

    const handlePostponeMatch = async () => {
        if (!editingMatch) return;
        setUpdating(true);
        try {
            await api.put('/Leagues/Postpone', {
                matchId: editingMatch.id,
                newStartTime: new Date(editStartTime).toISOString(),
                newLocation: editingMatch.location
            });
            await fetchData();
            showToast("Utakmica je uspešno odložena.", 'success');
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri odlaganju utakmice.", 'error');
        } finally {
            setUpdating(false);
        }
    };
    const handleUpdateLocation = async () => {
        try {
            await api.put('/Leagues/Change-Match-Location', {
                matchId: editingMatch.id,
                latitude: editingMatch.latitude,
                longitude: editingMatch.longitude,
                location: editingMatch.location
            });
            showToast("Lokacija uspešno ažurirana!", 'success');
        } catch (err) {
            console.error(err);
            showToast("Greška pri ažuriranju lokacije.", 'error');
        }
    };

    const handleAssignOfficials = async () => {
        if (!editingMatch) return;
        setUpdating(true);
        try {
            await api.post('/Leagues/Assign-Officials', {
                matchId: editingMatch.id,
                refereeId: referee?.id || null,
                scorerId: scorer?.id || null
            });
            await fetchData();
            showToast("Službena lica su uspešno delegirana.", 'success');
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri delegiranju službenih lica.", 'error');
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

    const getActiveLeaderboardData = () => {
        if (!leaderboard) return [];
        switch (leaderboardTab) {
            case 0: return leaderboard.mvp;
            case 1: return leaderboard.topScorers;
            case 2: return leaderboard.topAssists;
            case 3: return leaderboard.topRebounders;
            case 4: return leaderboard.topStealers;
            case 5: return leaderboard.topBlockers;
            default: return [];
        }
    };

    const getCategoryLabel = () => {
        switch (leaderboardTab) {
            case 0: return 'MVP Score';
            case 1: return 'Poeni';
            case 2: return 'Asistencije';
            case 3: return 'Skokovi';
            case 4: return 'Ukradene lopte';
            case 5: return 'Blokade';
            default: return '';
        }
    };

    const getCategoryValue = (player: any) => {
        switch (leaderboardTab) {
            case 0: return player.mvpScore.toFixed(1);
            case 1: return player.points;
            case 2: return player.assists;
            case 3: return player.rebounds;
            case 4: return player.steals;
            case 5: return player.blocks;
            default: return 0;
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    if (!league) {
        return (
            <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                <Navbar />
                <Container sx={{ mt: 10, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: 'error.main', fontWeight: 700 }}>Takmičenje nije pronađeno</Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>Moguće je da je liga obrisana ili da imate pogrešan link.</Typography>
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

    const isRegistrationOpen = (league.leagueStatus === 1 || league.leagueStatus == null) && (league.registrationDeadline ? new Date(league.registrationDeadline) > new Date() : false);
    const minRequired = league.matchType === 2 ? 3 : 5;
    const activeLeaderboardData = getActiveLeaderboardData();

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
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

                    <Stack sx={{ flexDirection: { xs: 'column', md: 'row' }, gap: 3, justifyContent: "space-between", alignItems: { xs: 'flex-start', md: 'center' } }}>
                        <Box>
                            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em' }}>
                                {league.name}
                            </Typography>
                            <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
                                <Stack sx={{ flexDirection: "row", gap: 0.5, alignItems: "center", color: alpha('#fff', 0.7) }}>
                                    <EventIcon fontSize="small" />
                                    <Typography variant="body2">Sezona {league.season || '2026'}</Typography>
                                </Stack>
                                <Divider orientation="vertical" flexItem sx={{ bgcolor: alpha('#fff', 0.2) }} />
                                <Stack sx={{ flexDirection: "row", gap: 0.5, alignItems: "center", color: alpha('#fff', 0.7) }}>
                                    <LocationOnIcon fontSize="small" />
                                    <Typography variant="body2">{league.location || 'Beograd, Srbija'}</Typography>
                                </Stack>
                            </Stack>
                        </Box>

                        <Stack sx={{ flexDirection: "row", gap: 2, flexWrap: 'wrap' }}>
                            {(isOrganizer || hasRole(UserRole.Admin)) && bracketRounds.length === 0 && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={generating ? <CircularProgress size={20} sx={{ color: 'action.hover' }} /> : <AutoAwesomeIcon />}
                                    onClick={handleGenerateBracket}
                                    disabled={generating || league.teams?.length < 2}
                                    sx={{
                                        fontWeight: 800,
                                        borderRadius: 3,
                                        px: 4,
                                        boxShadow: `0 8px 20px text.primary`,
                                        color: 'text.primary'
                                    }}
                                >
                                    Generiši takmičenje
                                </Button>
                            )}
                            {(isOrganizer || hasRole(UserRole.Admin)) && isRegistrationOpen && (
                                <Button
                                    variant="outlined"
                                    size="large"
                                    color="warning"
                                    onClick={handleLockRegistrations}
                                    sx={{
                                        fontWeight: 800,
                                        borderRadius: 3,
                                        px: 4
                                    }}
                                >
                                    Zaključaj prijave
                                </Button>
                            )}
                            {(isOrganizer || hasRole(UserRole.Admin)) && isRegistrationOpen && (
                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<EditIcon />}
                                    onClick={handleOpenEditLeague}
                                    sx={{
                                        fontWeight: 800,
                                        borderRadius: 3,
                                        px: 4
                                    }}
                                >
                                    Izmeni ligu
                                </Button>
                            )}
                            {(isOrganizer || hasRole(UserRole.Admin)) && bracketRounds.length > 0 && league.leagueStatus !== 3 && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    color="success"
                                    onClick={handleFinishLeague}
                                    sx={{
                                        fontWeight: 800,
                                        borderRadius: 3,
                                        px: 4
                                    }}
                                >
                                    Završi ligu
                                </Button>
                            )}
                            {isAuthenticated && isRegistrationOpen && hasRole(UserRole.Player) && !userHasTeamInLeague && league.teams?.length < league.maxTeams && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<GroupsIcon />}
                                    onClick={() => setOpenCreateTeamDialog(true)}
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
                                <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1.5 }}>
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
                                    {league.leagueStatus === 3 ? (
                                        <Chip
                                            label="LIGA ZAVRŠENA"
                                            color="default"
                                            variant="filled"
                                            sx={{ fontWeight: 900, borderRadius: 2, px: 1, bgcolor: 'text.secondary', color: 'background.paper' }}
                                        />
                                    ) : (
                                        <Chip
                                            label={isRegistrationOpen ? 'PRIJAVE OTVORENE' : 'PRIJAVE ZATVORENE'}
                                            color={isRegistrationOpen ? 'success' : 'error'}
                                            variant="filled"
                                            sx={{ fontWeight: 900, borderRadius: 2, px: 1 }}
                                        />
                                    )}
                                    <Chip
                                        label={`Rok prijave: ${formatDate(league.registrationDeadline)}`}
                                        variant="outlined"
                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                    />
                                    {league.startDate && (
                                        <Chip
                                            label={`Početak: ${formatDateTime(league.startDate)}`}
                                            variant="outlined"
                                            color="primary"
                                            sx={{ fontWeight: 700, borderRadius: 2 }}
                                        />
                                    )}
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
                                        label={`Kotizacija: ${league.entryFee ? `${league.entryFee.toLocaleString('sr-RS')} RSD` : 'Besplatno'}`}
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
                                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
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
                                <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5, mb: 3 }}>
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
                                            isOrganizer={isOrganizer || hasRole(UserRole.Admin)}
                                            onEditMatch={handleOpenEdit}
                                        />
                                    ) : (
                                        <RoundRobinView
                                            data={roundRobinData!}
                                            isOrganizer={isOrganizer || hasRole(UserRole.Admin)}
                                            onEditMatch={handleOpenEdit}
                                        />
                                    )
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'action.hover', borderRadius: 4 }}>
                                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1, fontWeight: 700 }}>
                                            Još uvek nema generisanih mečeva
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {isOrganizer
                                                ? 'Sačekajte dovoljno prijava, a zatim pritisnite dugme "Generiši takmičenje".'
                                                : 'Organizator će generisati raspored čim se završe prijave.'}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                        {league.matchType === 2 && league.latitude && league.longitude && (
                            <Box sx={{ mt: 2, height: '300px', width: '100%', borderRadius: 3, overflow: 'hidden' }}>
                                <LeagueMap
                                    lat={league.latitude}
                                    lng={league.longitude}
                                    name={league.name}
                                />
                            </Box>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack sx={{ gap: 4 }}>
                            {leaderboard && (leaderboard.mvp?.length > 0 || leaderboard.topScorers?.length > 0) && (
                                <Card sx={{
                                    borderRadius: 5,
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                                    border: '1px solid rgba(0,0,0,0.03)',
                                    background: `linear-gradient(to bottom, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`
                                }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5, mb: 3 }}>
                                            <Box sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), p: 1, borderRadius: 2 }}>
                                                <AutoAwesomeIcon sx={{ color: theme.palette.warning.main, display: 'block' }} />
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 800 }}>Najbolji pojedinci</Typography>
                                        </Stack>

                                        <Divider sx={{ mb: 3, opacity: 0.6 }} />

                                        <Stack sx={{ gap: 3 }}>
                                            {leaderboard.mvp?.[0] && (
                                                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 4, border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}` }}>
                                                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'warning.main' }}>Trenutni MVP</Typography>
                                                    <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{leaderboard.mvp[0].username}</Typography>
                                                        <Chip label={`${leaderboard.mvp[0].mvpScore.toFixed(1)} pts`} size="small" color="warning" sx={{ fontWeight: 800 }} />
                                                    </Stack>
                                                </Box>
                                            )}

                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <EmojiEventsIcon fontSize="small" /> Najbolji poenteri
                                                </Typography>
                                                <Stack sx={{ gap: 1 }}>
                                                    {leaderboard.topScorers?.slice(0, 3).map((player: any, idx: number) => (
                                                        <Stack key={player.userId} sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", px: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {idx + 1}. {player.username}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                {player.points} <Box component="span" sx={{ fontWeight: 400, fontSize: '0.75rem', color: 'text.secondary' }}>({(player.points / player.gamesPlayed).toFixed(1)} avg)</Box>
                                                            </Typography>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <GroupsIcon fontSize="small" /> Najbolji asistenti
                                                </Typography>
                                                <Stack sx={{ gap: 1 }}>
                                                    {leaderboard.topAssists?.slice(0, 3).map((player: any, idx: number) => (
                                                        <Stack key={player.userId} sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", px: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {idx + 1}. {player.username}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                {player.assists} <Box component="span" sx={{ fontWeight: 400, fontSize: '0.75rem', color: 'text.secondary' }}>({(player.assists / player.gamesPlayed).toFixed(1)} avg)</Box>
                                                            </Typography>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            </Box>

                                            <Button
                                                onClick={() => setOpenLeaderboardDialog(true)}
                                                variant="text"
                                                fullWidth
                                                sx={{ fontWeight: 700, mt: 1 }}
                                            >
                                                Vidi celu rang listu
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}

                            {league.leagueStatus !== 3 && (
                            <Card sx={{
                                borderRadius: 5,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.03)'
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5, mb: 3 }}>
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
                                                    bgcolor: 'action.hover',
                                                    borderRadius: 4,
                                                    mb: 2,
                                                    p: 2,
                                                    border: team.isEligible ? '1px solid #eef2f6' : '1px dashed #f87171',
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-start',
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                                                }}
                                                onClick={() => handleOpenTeamRoster(team)}
                                            >
                                                <Stack sx={{ flexDirection: "row", justifyContent: "space-between", width: "100%", alignItems: "center", mb: 1 }}>
                                                    <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>{team.name}</Typography>
                                                    {(isOrganizer || hasRole(UserRole.Admin)) && isRegistrationOpen && (
                                                        <Tooltip title="Ukloni tim">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={(e) => { e.stopPropagation(); handleDisbandTeam(team.id, team.name); }}
                                                                sx={{ ml: 1 }}
                                                            >
                                                                <DeleteOutlineIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                                <Stack sx={{ flexDirection: "row", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
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
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                    Nema prijavljenih timova.
                                                </Typography>
                                            </Box>
                                        )}
                                    </List>
                                    <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 3, border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                                        <Typography variant="caption" sx={{ color: 'info.main', display: 'block', fontWeight: 600, lineHeight: 1.4 }}>
                                            💡 Tim se smatra potvrđenim tek kada sakupi minimalno {minRequired} igrača u rosteru.
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Container>


            {/* Za izmenu utakmice */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="sm" sx={{ '& .MuiPaper-root': { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>
                    Izmeni utakmicu
                </DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        <strong>{editingMatch?.homeTeam} vs {editingMatch?.awayTeam}</strong>
                    </Typography>
                    {league.matchType === 1 && (
                        <Card variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Postavi lokaciju utakmice</Typography>
                                <Stack>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Lokacija utakmice:
                                    </Typography>
                                    <LocationPicker 
                                        initialLat={editingMatch?.latitude}
                                        initialLng={editingMatch?.longitude}
                                        onLocationSelect={(lat: number, lng: number, address: string) => {
                                            setEditingMatch((prev: any) => ({
                                                ...prev,
                                                latitude: lat,
                                                longitude: lng,
                                                location: address
                                            }));
                                        }}
                                    />
                                    <Button
                                        onClick={handleUpdateLocation}
                                        variant="contained"
                                        color="primary"
                                        disabled={updating}
                                        sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none' }}
                                    >
                                        {updating ? <CircularProgress size={24} color="inherit" /> : "Sačuvaj lokaciju"}
                                    </Button>
                                </Stack>
                        </Card>
                    )} 
                    <Card variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Odloži utakmicu</Typography>
                        <Stack sx={{ gap: 2 }}>
                            <TextField
                                label="Novo vreme početka"
                                type="datetime-local"
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                                fullWidth
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            {league.matchType === 2 &&
                                <TextField
                                    label="Lokacija"
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    fullWidth
                                />
                            }
                            <Button
                                onClick={handlePostponeMatch}
                                variant="contained"
                                color="primary"
                                disabled={updating}
                                sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none' }}
                            >
                                {updating ? <CircularProgress size={24} color="inherit" /> : "Sačuvaj termin"}
                            </Button>
                        </Stack>
                    </Card>

                    <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Delegiraj službena lica</Typography>
                        <Stack sx={{ gap: 2 }}>
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
                            <Button
                                onClick={handleAssignOfficials}
                                variant="contained"
                                color="secondary"
                                disabled={updating}
                                sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none' }}
                            >
                                {updating ? <CircularProgress size={24} color="inherit" /> : "Delegiraj"}
                            </Button>
                        </Stack>
                    </Card>
                    
                </DialogContent>
                <DialogActions sx={{ p: 4 }}>
                    <Button onClick={() => setOpenEditDialog(false)} sx={{ fontWeight: 700, textTransform: 'none' }}>Zatvori</Button>
                </DialogActions>
            </Dialog>

            {/* Prijava tima */}
            <Dialog open={openCreateTeamDialog} onClose={() => setOpenCreateTeamDialog(false)} fullWidth maxWidth="xs" sx={{ '& .MuiPaper-root': { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>
                    Prijavi tim
                </DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Kreirajte svoj tim za ligu <strong>{league.name}</strong>. Postaćete kapiten tima.
                    </Typography>
                    <Stack sx={{ gap: 3 }}>
                        <TextField
                            label="Naziv tima"
                            variant="outlined"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Grad"
                            variant="outlined"
                            value={newTeamCity}
                            onChange={(e) => setNewTeamCity(e.target.value)}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 4 }}>
                    <Button onClick={() => setOpenCreateTeamDialog(false)} sx={{ fontWeight: 700, textTransform: 'none' }}>Odustani</Button>
                    <Button
                        onClick={handleCreateTeam}
                        variant="contained"
                        color="primary"
                        disabled={creatingTeam || !newTeamName.trim()}
                        sx={{ fontWeight: 800, px: 4, borderRadius: 2, textTransform: 'none' }}
                    >
                        {creatingTeam ? <CircularProgress size={24} color="inherit" /> : "Kreiraj i prijavi se"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Full Leaderboard */}
            <Dialog open={openLeaderboardDialog} onClose={() => setOpenLeaderboardDialog(false)} fullWidth maxWidth="md" sx={{ '& .MuiPaper-root': { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Rang lista - {league.name}
                    <IconButton onClick={() => setOpenLeaderboardDialog(false)} size="small">
                        <AutoAwesomeIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Tabs
                        value={leaderboardTab}
                        onChange={(_, v) => setLeaderboardTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                    >
                        <Tab icon={<StarIcon />} label="MVP" />
                        <Tab icon={<EmojiEventsIcon />} label="Poeni" />
                        <Tab icon={<SportsBasketballIcon />} label="Asistencije" />
                        <Tab icon={<PanToolIcon />} label="Skokovi" />
                        <Tab icon={<DirectionsRunIcon />} label="Ukradene" />
                        <Tab icon={<BlockIcon />} label="Blokade" />
                    </Tabs>

                    <Box sx={{ p: 0 }}>
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0, overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Igrač</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Uta.</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{getCategoryLabel()}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Prosek</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activeLeaderboardData.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                Nema podataka.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {activeLeaderboardData.map((player: any, index: number) => {
                                        const fullImageUrl = player.profilePictureUrl
                                            ? (player.profilePictureUrl.startsWith('http') ? player.profilePictureUrl : `${apiBaseUrl}${player.profilePictureUrl}`)
                                            : '';
                                        return (
                                            <TableRow key={player.userId} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${player.userId}`)}>
                                                <TableCell sx={{ fontWeight: 700 }}>{index + 1}</TableCell>
                                                <TableCell>
                                                    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar
                                                            src={fullImageUrl}
                                                            sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem', border: '1px solid #eee' }}
                                                        >
                                                            {player.username[0].toUpperCase()}
                                                        </Avatar>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{player.username}</Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="center">{player.gamesPlayed}</TableCell>
                                                <TableCell align="right">
                                                    <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                        {getCategoryValue(player)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                        {(getCategoryValue(player) / player.gamesPlayed).toFixed(1)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenLeaderboardDialog(false)} sx={{ fontWeight: 700 }}>Zatvori</Button>
                </DialogActions>
            </Dialog>

            {/* Tim Roster Dialog */}
            <Dialog
                open={teamRosterDialog.open}
                onClose={() => setTeamRosterDialog({ open: false, team: null, roster: [] })}
                fullWidth
                maxWidth="sm"
                sx={{ '& .MuiPaper-root': { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>
                    {teamRosterDialog.team?.name || 'Roster tima'}
                </DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    {teamRosterDialog.roster.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4, fontStyle: 'italic' }}>
                            Nema članova u ovom timu.
                        </Typography>
                    ) : (
                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Igrač</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Uloga</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {teamRosterDialog.roster.map((member: any, idx: number) => (
                                        <TableRow
                                            key={member.userId}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => { setTeamRosterDialog({ open: false, team: null, roster: [] }); navigate(`/profile/${member.userId}`); }}
                                        >
                                            <TableCell>{member.jerseyNumber != null ? member.jerseyNumber : '—'}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                {member.firstName || member.lastName
                                                    ? `${member.firstName || ''} ${member.lastName || ''} (${member.username})`
                                                    : `@${member.username}`}
                                            </TableCell>
                                            <TableCell>{member.role === 'Captain' ? 'Kapiten' : 'Igrač'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setTeamRosterDialog({ open: false, team: null, roster: [] })} sx={{ fontWeight: 700, textTransform: 'none' }}>
                        Zatvori
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Izmena Lige Dialog */}
            <Dialog open={openEditLeagueDialog} onClose={() => setOpenEditLeagueDialog(false)} fullWidth maxWidth="sm" sx={{ '& .MuiPaper-root': { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>
                    Izmeni ligu
                </DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Ažurirajte podataka o ligi <strong>{league.name}</strong>.
                    </Typography>
                    <Stack sx={{ gap: 3 }}>
                        <TextField
                            label="Format igre"
                            select
                            slotProps={{ select: { native: true } }}
                            value={editLeagueForm.matchType}
                            onChange={(e) => setEditLeagueForm({ ...editLeagueForm, matchType: Number(e.target.value) as MatchType })}
                            fullWidth
                        >
                            <option value={1}>5x5 Klasični</option>
                            <option value={2}>3x3 Basket</option>
                        </TextField>
                        <TextField
                            label="Kotizacija (RSD)"
                            type="number"
                            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                            value={editLeagueForm.entryFee}
                            onChange={(e) => setEditLeagueForm({ ...editLeagueForm, entryFee: Number(e.target.value) })}
                            fullWidth
                        />
                        <TextField
                            label="Maksimalan broj timova"
                            type="number"
                            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                            value={editLeagueForm.maxTeams}
                            onChange={(e) => setEditLeagueForm({ ...editLeagueForm, maxTeams: Number(e.target.value) })}
                            fullWidth
                        />
                        <TextField
                            label="Lokacija"
                            value={editLeagueForm.location}
                            onChange={(e) => setEditLeagueForm({ ...editLeagueForm, location: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Opis"
                            multiline
                            minRows={3}
                            value={editLeagueForm.description}
                            onChange={(e) => setEditLeagueForm({ ...editLeagueForm, description: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Početak"
                            type="datetime-local"
                            value={editLeagueForm.startDate}
                            onChange={(e) => setEditLeagueForm({ ...editLeagueForm, startDate: e.target.value })}
                            fullWidth
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        {editLeagueForm.matchType === 2 &&
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                Lokacija utakmice:
                            </Typography>
                            <LocationPicker 
                                initialLat={editLeagueForm?.latitude}
                                initialLng={editLeagueForm?.longitude}
                                onLocationSelect={(lat: number, lng: number, address: string) => {
                                setEditLeagueForm((prev: any) => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng,
                                    location: address
                                    }));
                                }}
                            />
                        </Box>
                        
                        }
                        
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 4 }}>
                    <Button onClick={() => setOpenEditLeagueDialog(false)} sx={{ fontWeight: 700, textTransform: 'none' }}>Otkaži</Button>
                    <Button
                        onClick={handleUpdateLeague}
                        variant="contained"
                        color="primary"
                        disabled={savingLeague}
                        sx={{ fontWeight: 800, px: 4, borderRadius: 2, textTransform: 'none' }}
                    >
                        {savingLeague ? <CircularProgress size={24} color="inherit" /> : "Sačuvaj izmene"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

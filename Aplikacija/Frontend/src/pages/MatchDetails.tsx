import { useState, useEffect } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Navbar from '../components/Navbar';
import { MatchStatus } from '../types';
import { matchStatusLabel, matchStatusColor } from '../utils/leagueFormat';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';

const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

const EMPTY_MATCH = {
    id: 0,
    leagueName: '',
    homeTeamName: '',
    awayTeamName: '',
    homeScore: 0,
    awayScore: 0,
    status: MatchStatus.Scheduled,
    startTime: '',
    location: '',
    refereeName: '',
    scorerName: '',
    homeRoster: [] as any[],
    awayRoster: [] as any[],
    plays: [] as any[],
};

export default function MatchDetails() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const numericId = Number(matchId);

    const [match, setMatch] = useState<any>(EMPTY_MATCH);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    useEffect(() => {
        if (!numericId || isNaN(numericId)) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                const [detailsRes, boxRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/Match/Match-Details/${numericId}`),
                    axios.get(`${import.meta.env.VITE_API_URL}/Match/Match-BoxScore/${numericId}`)
                ]);

                const details = detailsRes.data || {};
                const box = boxRes.data || {};

                const combined = {
                    ...EMPTY_MATCH,
                    ...details,
                    homeRoster: box.homeRoster || [],
                    awayRoster: box.awayRoster || [],
                    plays: details.plays || []
                };

                if (mounted) setMatch(combined);
            } catch (err) {
                console.error('Error fetching match data', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [numericId]);

    useEffect(() => {
        if (!numericId) return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/matchHub`)
            .withAutomaticReconnect()
            .build();

        connection.on('ReceiveStatusUpdate', (data: any) => {
            const id = data.matchId ?? data.MatchId;
            if (Number(id) !== numericId) return;
            setMatch((prev: any) => ({
                ...prev,
                status: data.status ?? data.Status ?? prev.status,
                homeScore: data.homeScore ?? data.HomeScore ?? prev.homeScore,
                awayScore: data.awayScore ?? data.AwayScore ?? prev.awayScore
            }));
        });

        connection.on('ReceiveMatchUpdate', (data: any) => {
            const userId = data.userId ?? data.UserId;
            setMatch((prev: any) => {
                if (!prev) return prev;

                const updatePlayer = (p: any) => {
                    if (p.id === userId) {
                        return {
                            ...p,
                            points: data.points ?? data.Points ?? p.points,
                            fouls: data.fouls ?? data.Fouls ?? p.fouls,
                            assists: data.assists ?? data.Assists ?? p.assists,
                            rebounds: data.rebounds ?? data.Rebounds ?? p.rebounds,
                            twoPointsMade: data.twoPointersMade ?? data.TwoPointersMade ?? p.twoPointersMade,
                            twoPointsAttempted: data.twoPointersAttempted ?? data.TwoPointersAttempted ?? p.twoPointersAttempted,
                            threePointsMade: data.threePointersMade ?? data.ThreePointersMade ?? p.threePointersMade,
                            threePointsAttempted: data.threePointersAttempted ?? data.ThreePointersAttempted ?? p.threePointersAttempted,
                            freeThrowsMade: data.freeThrowsMade ?? data.FreeThrowsMade ?? p.freeThrowsMade,
                            freeThrowsAttempted: data.freeThrowsAttempted ?? data.FreeThrowsAttempted ?? p.freeThrowsAttempted,
                        };
                    }
                    return p;
                };

                const newHome = (prev.homeRoster || []).map(updatePlayer);
                const newAway = (prev.awayRoster || []).map(updatePlayer);

                const newPlays = data.newPlay ? [data.newPlay, ...(prev.plays || [])] : (prev.plays || []);

                return {
                    ...prev,
                    homeRoster: newHome,
                    awayRoster: newAway,
                    homeScore: data.homeScore ?? data.HomeScore ?? prev.homeScore,
                    awayScore: data.awayScore ?? data.AwayScore ?? prev.awayScore,
                    plays: newPlays
                };
            });
        });

        let isConnected = true;

        const startConnection = async () => {
            try {
                await connection.start();
                if (isConnected) {
                    await connection.invoke('JoinMatchGroup', numericId.toString());
                }
            } catch (err) {
                console.error('SignalR greska:', err);
            }
        };

        startConnection();

        return () => {
            isConnected = false;
            connection.stop();
        };
    }, [numericId]);

    if (loading) {
        return (
            <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!match || match.id === 0) {
        return (
            <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
                <Navbar />
                <Container maxWidth="md" sx={{ mt: 6 }}>
                    <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
                        Nazad
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Meč nije pronađen.
                    </Typography>
                </Container>
            </Box>
        );
    }

    const calculateTeamTotals = (roster: any[]) => {
        return roster.reduce(
            (acc: any, player: any) => ({
                totalPoints: acc.totalPoints + (player.points || 0),
                totalRebounds: acc.totalRebounds + (player.rebounds || 0),
                totalAssists: acc.totalAssists + (player.assists || 0),
                totalFouls: acc.totalFouls + (player.fouls || 0),
                total2PM: acc.total2PM + (player.twoPointsMade || 0),
                total2PA: acc.total2PA + (player.twoPointsAttempted || 0),
                total3PM: acc.total3PM + (player.threePointsMade || 0),
                total3PA: acc.total3PA + (player.threePointsAttempted || 0),
                totalFTM: acc.totalFTM + (player.freeThrowsMade || 0),
                totalFTA: acc.totalFTA + (player.freeThrowsAttempted || 0),
            }),
            { totalPoints: 0, totalRebounds: 0, totalAssists: 0, totalFouls: 0, total2PM: 0, total2PA: 0, total3PM: 0, total3PA: 0, totalFTM: 0, totalFTA: 0 }
        );
    };

    const homeTeamStats = calculateTeamTotals(match.homeRoster);
    const awayTeamStats = calculateTeamTotals(match.awayRoster);

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
                    Nazad
                </Button>

                <Card sx={{ borderRadius: 3, mb: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                            {match.leagueName}
                        </Typography>

                        <Grid container spacing={3} sx={{ alignItems: 'center', my: 1 }}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Stack spacing={0.5} sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1976d2' }}>
                                        {match.homeTeamName}
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                                        {match.homeScore}
                                    </Typography>
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Stack spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                                    <Chip label={matchStatusLabel(match.status)} color={matchStatusColor(match.status)} sx={{ fontWeight: 700 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {match.status === MatchStatus.Live ? 'Uživo praćenje rezultata' : 'Detalji meča'}
                                    </Typography>
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Stack spacing={0.5} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#f44336' }}>
                                        {match.awayTeamName}
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                                        {match.awayScore}
                                    </Typography>
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                    <AccessTimeIcon sx={{ color: '#1976d2' }} />
                                    <Typography variant="caption" color="text.secondary">Vreme</Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'center' }}>
                                        {match.startTime}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                    <LocationOnIcon sx={{ color: '#f59e0b' }} />
                                    <Typography variant="caption" color="text.secondary">Lokacija</Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
                                        {match.location}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                    <PeopleIcon sx={{ color: '#4caf50' }} />
                                    <Typography variant="caption" color="text.secondary">Sudija</Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{match.refereeName}</Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                    <PeopleIcon sx={{ color: '#9c27b0' }} />
                                    <Typography variant="caption" color="text.secondary">Zapisničar</Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{match.scorerName}</Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <Tabs value={activeTab} onChange={handleTabChange} centered indicatorColor="primary" textColor="primary" variant="fullWidth">
                        <Tab icon={<AssessmentIcon />} iconPosition="start" label="Box Score" sx={{ fontWeight: 700 }} />
                        <Tab icon={<SportsBasketballIcon />} iconPosition="start" label="Play-by-Play" sx={{ fontWeight: 700 }} />
                    </Tabs>
                </Box>

                {activeTab === 0 && (
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', mb: 2 }}>
                                        {match.homeTeamName}
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                    <TableCell sx={{ fontWeight: 700 }}>Igrač</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>2PM - 2PA</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>3PM - 3PA</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>FTM - FTA</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Reb</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Ast</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Fls</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Pts</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {match.homeRoster.map((player: any) => (
                                                    <TableRow key={player.id}>
                                                        <TableCell sx={{ fontWeight: 500 }}>{player.name}</TableCell>
                                                        <TableCell align="center">{`${player.twoPointsMade || 0} - ${player.twoPointsAttempted || 0}`}</TableCell>
                                                        <TableCell align="center">{`${player.threePointsMade || 0} - ${player.threePointsAttempted || 0}`}</TableCell>
                                                        <TableCell align="center">{`${player.freeThrowsMade || 0} - ${player.freeThrowsAttempted || 0}`}</TableCell>
                                                        <TableCell align="center">{player.rebounds || 0}</TableCell>
                                                        <TableCell align="center">{player.assists || 0}</TableCell>
                                                        <TableCell align="center">{player.fouls || 0}</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 700 }}>{player.points || 0}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                                    <TableCell sx={{ fontWeight: 700 }}>UKUPNO</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{`${homeTeamStats.total2PM} - ${homeTeamStats.total2PA}`}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{`${homeTeamStats.total3PM} - ${homeTeamStats.total3PA}`}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{`${homeTeamStats.totalFTM} - ${homeTeamStats.totalFTA}`}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{homeTeamStats.totalRebounds}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{homeTeamStats.totalAssists}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{homeTeamStats.totalFouls}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700, color: '#1976d2' }}>{homeTeamStats.totalPoints}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f44336', mb: 2 }}>
                                        {match.awayTeamName}
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                    <TableCell sx={{ fontWeight: 700 }}>Igrač</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>2PM - 2PA</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>3PM - 3PA</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>FTM - FTA</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Reb</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Ast</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Fls</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Pts</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {match.awayRoster.map((player: any) => (
                                                    <TableRow key={player.id}>
                                                        <TableCell sx={{ fontWeight: 500 }}>{player.name}</TableCell>
                                                        <TableCell align="center">{`${player.twoPointsMade || 0} - ${player.twoPointsAttempted || 0}`}</TableCell>
                                                        <TableCell align="center">{`${player.threePointsMade || 0} - ${player.threePointsAttempted || 0}`}</TableCell>
                                                        <TableCell align="center">{`${player.freeThrowsMade || 0} - ${player.freeThrowsAttempted || 0}`}</TableCell>
                                                        <TableCell align="center">{player.rebounds || 0}</TableCell>
                                                        <TableCell align="center">{player.assists || 0}</TableCell>
                                                        <TableCell align="center">{player.fouls || 0}</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 700 }}>{player.points || 0}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                                    <TableCell sx={{ fontWeight: 700 }}>UKUPNO</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{`${awayTeamStats.total2PM} - ${awayTeamStats.total2PA}`}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{`${awayTeamStats.total3PM} - ${awayTeamStats.total3PA}`}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{`${awayTeamStats.totalFTM} - ${awayTeamStats.totalFTA}`}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{awayTeamStats.totalRebounds}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{awayTeamStats.totalAssists}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{awayTeamStats.totalFouls}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700, color: '#f44336' }}>{awayTeamStats.totalPoints}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 1 && (
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Tok Utakmice (Uživo dešavanja)
                            </Typography>
                            <Divider sx={{ mb: 1 }} />

                            {match.plays && match.plays.length > 0 ? (
                                <List>
                                    {match.plays.map((play: any) => (
                                        <ListItem
                                            key={play.id}
                                            sx={{
                                                px: 2,
                                                py: 1,
                                                borderBottom: '1px solid #eee'
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography sx={{
                                                        fontWeight: 700,
                                                        fontSize: '0.875rem',
                                                        color: play.team === 'home' ? 'primary.main' : 'error.main'
                                                    }}>
                                                        {play.text}
                                                    </Typography>
                                                }
                                                secondary={`${play.time} • Rezultat: ${play.score}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
                                    Nema zabeleženih akcija za ovaj meč.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                )}
            </Container>
        </Box>
    );
}
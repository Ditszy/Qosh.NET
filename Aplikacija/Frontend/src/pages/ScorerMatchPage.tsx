import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Navbar from '../components/Navbar';
import { MatchStatus } from '../types';
import { matchStatusColor, matchStatusLabel } from '../utils/leagueFormat';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import * as signalR from '@microsoft/signalr';

interface PlayerRow {
    id: number;
    name: string;
    team: 'home' | 'away';
    points: number;
    rebounds: number;
    assists: number;
    fouls: number;
    steals: number;
    blocks: number;
}

export default function ScorerMatchPage() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [matchDetails, setMatchDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<MatchStatus>(MatchStatus.Scheduled);
    const [isPaused, setIsPaused] = useState(false);
    const [players, setPlayers] = useState<PlayerRow[]>([]);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [plays, setPlays] = useState<any[]>([]);

    const statusLabel = isPaused ? 'Pauza' : matchStatusLabel(status);
    const statusColor = isPaused ? 'warning' : matchStatusColor(status);

    const homePlayers = useMemo(() => players.filter((player) => player.team === 'home'), [players]);
    const awayPlayers = useMemo(() => players.filter((player) => player.team === 'away'), [players]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [detailsRes, boxRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/Match/Match-Details/${matchId}`),
                    axios.get(`${import.meta.env.VITE_API_URL}/Match/Match-BoxScore/${matchId}`)
                ]);

                setMatchDetails(detailsRes.data);
                setStatus(detailsRes.data.status);
                setHomeScore(detailsRes.data.homeScore || 0);
                setAwayScore(detailsRes.data.awayScore || 0);
                setPlays(detailsRes.data.plays || []);

                const home = (boxRes.data.homeRoster || []).map((p: any) => ({
                    id: Number(p.id),
                    name: p.name,
                    team: 'home',
                    points: Number(p.points ?? p.Points ?? 0),
                    rebounds: Number(p.rebounds ?? p.Rebounds ?? 0),
                    assists: Number(p.assists ?? p.Assists ?? 0),
                    fouls: Number(p.fouls ?? p.Fouls ?? 0),
                    steals: Number(p.steals ?? p.Steals ?? 0),
                    blocks: Number(p.blocks ?? p.Blocks ?? 0)
                }));

                const away = (boxRes.data.awayRoster || []).map((p: any) => ({
                    id: Number(p.id),
                    name: p.name,
                    team: 'away',
                    points: Number(p.points ?? p.Points ?? 0),
                    rebounds: Number(p.rebounds ?? p.Rebounds ?? 0),
                    assists: Number(p.assists ?? p.Assists ?? 0),
                    fouls: Number(p.fouls ?? p.Fouls ?? 0),
                    steals: Number(p.steals ?? p.Steals ?? 0),
                    blocks: Number(p.blocks ?? p.Blocks ?? 0)
                }));

                setPlayers([...home, ...away]);
            } catch (err) {
                console.error("Error fetching match data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // SignalR veza
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${import.meta.env.VITE_API_URL.replace('/api', '')}/matchHub`)
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                connection.invoke("JoinMatchGroup", matchId);

                connection.on("ReceiveMatchUpdate", (update: any) => {
                    const mId = update.matchId ?? update.MatchId;
                    if (Number(mId) !== Number(matchId)) return;

                    setHomeScore(Number(update.homeScore ?? update.HomeScore ?? homeScore));
                    setAwayScore(Number(update.awayScore ?? update.AwayScore ?? awayScore));

                    const uId = update.userId ?? update.UserId;
                    setPlayers(prev => prev.map(p => {
                        if (Number(p.id) !== Number(uId)) return p;
                        return {
                            ...p,
                            points: Number(update.points ?? update.Points ?? p.points),
                            fouls: Number(update.fouls ?? update.Fouls ?? p.fouls),
                            rebounds: Number(update.rebounds ?? update.Rebounds ?? p.rebounds),
                            assists: Number(update.assists ?? update.Assists ?? p.assists),
                            steals: Number(update.steals ?? update.Steals ?? p.steals),
                            blocks: Number(update.blocks ?? update.Blocks ?? p.blocks)
                        };
                    }));

                    const newPlay = update.newPlay ?? update.NewPlay;
                    if (newPlay) {
                        setPlays(prev => [newPlay, ...prev]);
                    }
                });

                connection.on("ReceiveStatusUpdate", (update: any) => {
                    const mId = update.matchId ?? update.MatchId;
                    if (Number(mId) !== Number(matchId)) return;

                    const newStatus = update.status ?? update.Status;

                    if (newStatus === 2 || newStatus === "Live") {
                        setStatus(MatchStatus.Live);
                        setIsPaused(false);
                    } else if (newStatus === 3 || newStatus === "Finished") {
                        setStatus(MatchStatus.Finished);
                        setIsPaused(false);
                    } else if (newStatus === 5 || newStatus === "Paused") {
                        setStatus(5 as any);
                        setIsPaused(true);
                    } else if (newStatus === 1 || newStatus === "Scheduled") {
                        setStatus(MatchStatus.Scheduled);
                        setIsPaused(false);
                    }

                    if (update.homeScore !== undefined || update.HomeScore !== undefined) {
                        setHomeScore(Number(update.homeScore ?? update.HomeScore));
                    }
                    if (update.awayScore !== undefined || update.AwayScore !== undefined) {
                        setAwayScore(Number(update.awayScore ?? update.AwayScore));
                    }
                });
            })
            .catch(err => console.error("SignalR Connection Error: ", err));

        return () => {
            connection.stop();
        };
    }, [matchId]);

    const addAction = async (playerId: number, type: number) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/Statistics/Add-Action`, {
                matchId: Number(matchId),
                userId: playerId,
                actionType: type
            }, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
        } catch (err) {
            console.error("Error adding action", err);
        }
    };

    const handleStart = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/Match/Start-Match/${matchId}`, {}, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setStatus(MatchStatus.Live);
            setIsPaused(false);
        } catch (err) { console.error(err); }
    };

    const handlePause = async () => {
        if (status === MatchStatus.Live) {
            try {
                await axios.post(`${import.meta.env.VITE_API_URL}/Match/Pause-Match/${matchId}`, {}, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                });
                setIsPaused(true);
                setStatus(5 as any);
            } catch (err) { console.error(err); }
        } else if (isPaused) {
            handleStart();
        }
    };

    const handleFinish = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/Match/End-Match/${matchId}`, {}, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setStatus(MatchStatus.Finished);
            setIsPaused(false);
        } catch (err) { console.error(err); }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const PlayerActions = ({ player }: { player: PlayerRow }) => (
        <Stack sx={{ gap: '4px', width: '100%' }}>
            <Stack sx={{ flexDirection: 'row', gap: '4px', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                <Button size="small" variant="contained" color="primary" onClick={() => addAction(player.id, 0)} sx={{ minWidth: 32, px: 1, height: 26, fontSize: '0.75rem', fontWeight: 700 }}>+1</Button>
                <Button size="small" variant="contained" color="primary" onClick={() => addAction(player.id, 2)} sx={{ minWidth: 32, px: 1, height: 26, fontSize: '0.75rem', fontWeight: 700 }}>+2</Button>
                <Button size="small" variant="contained" color="primary" onClick={() => addAction(player.id, 4)} sx={{ minWidth: 32, px: 1, height: 26, fontSize: '0.75rem', fontWeight: 700 }}>+3</Button>
                <Button size="small" variant="outlined" color="primary" onClick={() => addAction(player.id, 1)} sx={{ minWidth: 32, px: 0.5, height: 26, fontSize: '0.7rem' }}>-1</Button>
                <Button size="small" variant="outlined" color="primary" onClick={() => addAction(player.id, 3)} sx={{ minWidth: 32, px: 0.5, height: 26, fontSize: '0.7rem' }}>-2</Button>
                <Button size="small" variant="outlined" color="primary" onClick={() => addAction(player.id, 5)} sx={{ minWidth: 32, px: 0.5, height: 26, fontSize: '0.7rem' }}>-3</Button>
            </Stack>
            <Stack sx={{ flexDirection: 'row', gap: '4px', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                <Button size="small" variant="outlined" color="inherit" sx={{ minWidth: 36, px: 0, height: 24, fontSize: '0.65rem', color: 'text.secondary' }} onClick={() => addAction(player.id, 6)}>REB</Button>
                <Button size="small" variant="outlined" color="inherit" sx={{ minWidth: 36, px: 0, height: 24, fontSize: '0.65rem', color: 'text.secondary' }} onClick={() => addAction(player.id, 7)}>AST</Button>
                <Button size="small" variant="outlined" color="inherit" sx={{ minWidth: 36, px: 0, height: 24, fontSize: '0.65rem', color: 'text.secondary' }} onClick={() => addAction(player.id, 9)}>STL</Button>
                <Button size="small" variant="outlined" color="inherit" sx={{ minWidth: 36, px: 0, height: 24, fontSize: '0.65rem', color: 'text.secondary' }} onClick={() => addAction(player.id, 10)}>BLK</Button>
                <Button size="small" variant="contained" color="error" sx={{ minWidth: 32, px: 0, height: 24, fontSize: '0.7rem', fontWeight: 700 }} onClick={() => addAction(player.id, 8)}>F</Button>
            </Stack>
        </Stack>
    );

    return (
        <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', pb: 6 }}>
            <Navbar />

            <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 } }}>
                <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => navigate(-1)} sx={{ mb: 2, fontWeight: 600 }}>
                    Nazad
                </Button>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', m: -1.5 }}>
                    <Box sx={{ p: 1.5, width: { xs: '100%', lg: '33.3333%' } }}>
                        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '1rem', color: 'text.secondary' }}>
                                    {matchDetails?.leagueName || 'Zapisnik'}
                                </Typography>

                                <Box sx={{ textAlign: 'center', my: 2 }}>
                                    <Typography variant="h2" sx={{ fontWeight: 900, color: '#101010', letterSpacing: 1, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                                        {homeScore} : {awayScore}
                                    </Typography>
                                    <Chip
                                        label={statusLabel}
                                        color={statusColor as any}
                                        size="small"
                                        sx={{ mt: 1, fontWeight: 700, px: 1 }}
                                    />
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifyContent: 'center' }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleStart}
                                        disabled={status !== MatchStatus.Scheduled && !isPaused}
                                        sx={{ fontWeight: 700, py: 1 }}
                                    >
                                        {isPaused ? 'Nastavi' : 'Start'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={handlePause}
                                        disabled={status !== MatchStatus.Live && !isPaused}
                                        sx={{ fontWeight: 700, py: 1 }}
                                    >
                                        {isPaused ? 'Nastavi' : 'Pauza'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        color="error"
                                        onClick={handleFinish}
                                        disabled={status === MatchStatus.Finished}
                                        sx={{ fontWeight: 700, py: 1 }}
                                    >
                                        Kraj
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 3, maxHeight: { xs: 300, lg: 450 }, display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #edf2f7' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    Poslednje akcije
                                </Typography>
                            </Box>
                            <CardContent sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
                                <List dense sx={{ py: 0 }}>
                                    {plays.map((play, index) => (
                                        <ListItem key={play.id || index} divider={index < plays.length - 1} sx={{ py: 1, px: 2 }}>
                                            <ListItemText
                                                primary={
                                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>
                                                        {play.text}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography color="primary" sx={{ fontSize: '0.7rem', fontWeight: 700, mt: 0.5 }}>
                                                        {play.score}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                    {plays.length === 0 && (
                                        <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center', fontStyle: 'italic' }}>
                                            Nema zabeleženih akcija.
                                        </Typography>
                                    )}
                                </List>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ p: 1.5, width: { xs: '100%', lg: '66.6667%' } }}>
                        <Stack sx={{ gap: 3 }}>
                            {[
                                { title: matchDetails?.homeTeamName || 'Domaći', players: homePlayers, color: '#1976d2' },
                                { title: matchDetails?.awayTeamName || 'Gosti', players: awayPlayers, color: '#dc004e' }
                            ].map((team, idx) => (
                                <Card key={idx} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                                    <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '2px solid', borderBottomColor: team.color, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                            {team.title}
                                        </Typography>
                                        <Chip label={`${team.players.length} igrača`} size="small" variant="outlined" />
                                    </Box>

                                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Igrač</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>PTS</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>REB</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>AST</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>STL</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>BLK</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>F</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', pr: 2 }}>Zapisnik akcija</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {team.players.map((player) => (
                                                        <TableRow key={player.id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, height: 48 }}>
                                                            <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{player.name}</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 800, color: team.color, fontSize: '0.9rem' }}>{player.points}</TableCell>
                                                            <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{player.rebounds}</TableCell>
                                                            <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{player.assists}</TableCell>
                                                            <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{player.steals}</TableCell>
                                                            <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{player.blocks}</TableCell>
                                                            <TableCell align="center" sx={{ color: player.fouls >= 5 ? 'error.main' : 'text.primary', fontWeight: player.fouls >= 5 ? 800 : 500, fontSize: '0.85rem' }}>
                                                                {player.fouls}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ py: 0.5, pr: 2 }}>
                                                                <PlayerActions player={player} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                            {team.players.map((player, pIdx) => (
                                                <Box
                                                    key={player.id}
                                                    sx={{
                                                        p: 2,
                                                        borderBottom: pIdx < team.players.length - 1 ? '1px solid #edf2f7' : 'none',
                                                        bgcolor: player.fouls >= 5 ? '#fff5f5' : 'transparent'
                                                    }}
                                                >
                                                    <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                                                            {player.name}
                                                        </Typography>

                                                        <Stack sx={{ flexDirection: 'row', gap: 1.5 }}>
                                                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}><span style={{ color: '#718096', fontWeight: 400 }}>P:</span> {player.points}</Typography>
                                                            <Typography sx={{ fontSize: '0.8rem' }}><span style={{ color: '#718096' }}>R:</span> {player.rebounds}</Typography>
                                                            <Typography sx={{ fontSize: '0.8rem' }}><span style={{ color: '#718096' }}>A:</span> {player.assists}</Typography>
                                                            <Typography sx={{ fontSize: '0.8rem', fontWeight: player.fouls >= 5 ? 800 : 400, color: player.fouls >= 5 ? '#e53e3e' : 'inherit' }}>
                                                                <span style={{ color: '#718096', fontWeight: 400 }}>F:</span> {player.fouls}
                                                            </Typography>
                                                        </Stack>
                                                    </Stack>

                                                    <Box sx={{ bgcolor: '#f8fafc', p: 1, borderRadius: 2 }}>
                                                        <PlayerActions player={player} />
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
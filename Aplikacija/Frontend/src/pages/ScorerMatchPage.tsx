import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    Paper
} from '@mui/material';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import Navbar from '../components/Navbar';
import { MatchStatus } from '../types';
import { matchStatusColor, matchStatusLabel } from '../utils/leagueFormat';

interface PlayerRow {
    id: number;
    name: string;
    team: 'home' | 'away';
    points: number;
    fouls: number;
}

const initialPlayers: PlayerRow[] = [
    { id: 1, name: 'Marko Jović', team: 'home', points: 0, fouls: 0 },
    { id: 2, name: 'Dušan Ilić', team: 'home', points: 0, fouls: 0 },
    { id: 3, name: 'Nikola Savić', team: 'home', points: 0, fouls: 0 },
    { id: 4, name: 'Luka Pavić', team: 'away', points: 0, fouls: 0 },
    { id: 5, name: 'Miloš Petrović', team: 'away', points: 0, fouls: 0 },
    { id: 6, name: 'Stefan Ristić', team: 'away', points: 0, fouls: 0 },
];

export default function ScorerMatchPage() {
    const { matchId } = useParams();
    const [status, setStatus] = useState<MatchStatus>(MatchStatus.Scheduled);
    const [isPaused, setIsPaused] = useState(false);
    const [players, setPlayers] = useState<PlayerRow[]>(initialPlayers);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);

    const statusLabel = isPaused ? 'Pauza' : matchStatusLabel(status);
    const statusColor = isPaused ? 'warning' : matchStatusColor(status);

    const homePlayers = useMemo(() => players.filter((player) => player.team === 'home'), [players]);
    const awayPlayers = useMemo(() => players.filter((player) => player.team === 'away'), [players]);

    const updatePlayer = (playerId: number, updater: (player: PlayerRow) => PlayerRow) => {
        setPlayers((prev) => prev.map((player) => (player.id === playerId ? updater(player) : player)));
    };

    const addPoints = (playerId: number, points: number) => {
        const target = players.find((player) => player.id === playerId);
        if (!target) return;
        updatePlayer(playerId, (player) => ({ ...player, points: player.points + points }));
        if (target.team === 'home') {
            setHomeScore((prev) => prev + points);
        } else {
            setAwayScore((prev) => prev + points);
        }
    };

    const addFoul = (playerId: number) => {
        updatePlayer(playerId, (player) => ({ ...player, fouls: player.fouls + 1 }));
    };

    const handleStart = () => {
        setStatus(MatchStatus.Live);
        setIsPaused(false);
    };

    const handlePause = () => {
        if (status === MatchStatus.Live) {
            setIsPaused((prev) => !prev);
        }
    };

    const handleFinish = () => {
        setStatus(MatchStatus.Finished);
        setIsPaused(false);
    };

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Zapisnik utakmice #{matchId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Uređivanje rezultata i statistike igrača u realnom vremenu.
                    </Typography>
                </Stack>

                <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Stack sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: 'space-between' }}>
                            <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                <SportsScoreIcon sx={{ color: '#1976d2' }} />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Kontrola meča
                                </Typography>
                                <Chip label={statusLabel} color={statusColor} size="small" />
                            </Stack>
                            <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    sx={{ fontWeight: 700 }}
                                    onClick={handleStart}
                                    disabled={status !== MatchStatus.Scheduled}
                                >
                                    Start
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ fontWeight: 700 }}
                                    onClick={handlePause}
                                    disabled={status !== MatchStatus.Live}
                                >
                                    {isPaused ? 'Nastavi' : 'Pauza'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    sx={{ fontWeight: 700 }}
                                    onClick={handleFinish}
                                    disabled={status === MatchStatus.Finished}
                                >
                                    Kraj
                                </Button>
                            </Stack>
                        </Stack>

                        <Divider sx={{ my: 3 }} />

                        <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                KK Marinos
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1976d2' }}>
                                {homeScore} : {awayScore}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                KK Andrija
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>

                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Statistika — domaćin
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Igrač</TableCell>
                                            <TableCell align="right">PTS</TableCell>
                                            <TableCell align="right">FOUL</TableCell>
                                            <TableCell align="right">Akcije</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {homePlayers.map((player) => (
                                            <TableRow key={player.id}>
                                                <TableCell>{player.name}</TableCell>
                                                <TableCell align="right">{player.points}</TableCell>
                                                <TableCell align="right">{player.fouls}</TableCell>
                                                <TableCell align="right">
                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'flex-end' }}>
                                                        <Button size="small" variant="outlined" onClick={() => addPoints(player.id, 1)}>
                                                            +1
                                                        </Button>
                                                        <Button size="small" variant="outlined" onClick={() => addPoints(player.id, 2)}>
                                                            +2
                                                        </Button>
                                                        <Button size="small" variant="outlined" onClick={() => addPoints(player.id, 3)}>
                                                            +3
                                                        </Button>
                                                        <Button size="small" variant="text" color="error" onClick={() => addFoul(player.id)}>
                                                            Faul
                                                        </Button>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Statistika — gost
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Igrač</TableCell>
                                            <TableCell align="right">PTS</TableCell>
                                            <TableCell align="right">FOUL</TableCell>
                                            <TableCell align="right">Akcije</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {awayPlayers.map((player) => (
                                            <TableRow key={player.id}>
                                                <TableCell>{player.name}</TableCell>
                                                <TableCell align="right">{player.points}</TableCell>
                                                <TableCell align="right">{player.fouls}</TableCell>
                                                <TableCell align="right">
                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'flex-end' }}>
                                                        <Button size="small" variant="outlined" onClick={() => addPoints(player.id, 1)}>
                                                            +1
                                                        </Button>
                                                        <Button size="small" variant="outlined" onClick={() => addPoints(player.id, 2)}>
                                                            +2
                                                        </Button>
                                                        <Button size="small" variant="outlined" onClick={() => addPoints(player.id, 3)}>
                                                            +3
                                                        </Button>
                                                        <Button size="small" variant="text" color="error" onClick={() => addFoul(player.id)}>
                                                            Faul
                                                        </Button>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Stack>
            </Container>
        </Box>
    );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Stack,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    Tabs,
    Tab,
    Tooltip,
    alpha,
    useTheme
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import PanToolIcon from '@mui/icons-material/PanTool';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import BlockIcon from '@mui/icons-material/Block';
import Navbar from '../components/Navbar';
import api from '../services/api';

interface PlayerLeaderboardItem {
    userId: number;
    username: string;
    profilePictureUrl?: string;
    gamesPlayed: number;
    points: number;
    assists: number;
    rebounds: number;
    steals: number;
    blocks: number;
    mvpScore: number;
}

interface LeaderboardData {
    leagueId: number | null;
    topScorers: PlayerLeaderboardItem[];
    topAssists: PlayerLeaderboardItem[];
    topRebounders: PlayerLeaderboardItem[];
    topStealers: PlayerLeaderboardItem[];
    topBlockers: PlayerLeaderboardItem[];
    mvp: PlayerLeaderboardItem[];
}

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

export default function LeaderboardPage() {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const theme = useTheme();

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/Statistics/leaderboard', {
                params: { leagueId: null }
            });
            setLeaderboard(response.data);
        } catch (err) {
            console.error("Error fetching leaderboard", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const getActiveData = () => {
        if (!leaderboard) return [];
        switch (tabValue) {
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
        switch (tabValue) {
            case 0: return 'MVP Score';
            case 1: return 'Poeni';
            case 2: return 'Asistencije';
            case 3: return 'Skokovi';
            case 4: return 'Ukradene lopte';
            case 5: return 'Blokade';
            default: return '';
        }
    };

    const getValue = (player: PlayerLeaderboardItem) => {
        switch (tabValue) {
            case 0: return player.mvpScore.toFixed(1);
            case 1: return player.points;
            case 2: return player.assists;
            case 3: return player.rebounds;
            case 4: return player.steals;
            case 5: return player.blocks;
            default: return 0;
        }
    };

    const activeData = getActiveData();

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Globalna rang lista
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        Pregledaj najbolje igrače iz svih aktivnih takmičenja i sezona.
                    </Typography>
                </Stack>

                <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 4 }}>
                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            *MVP rezultat se računa na osnovu svih statističkih parametara (poeni, skokovi, asistencije, ukradene lopte i blokade).
                        </Typography>
                    </Box>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            '& .MuiTab-root': {
                                py: 2,
                                fontWeight: 700,
                                minWidth: 120
                            }
                        }}
                    >
                        <Tab icon={<StarIcon />} label="MVP" />
                        <Tab icon={<EmojiEventsIcon />} label="Poeni" />
                        <Tab icon={<SportsBasketballIcon />} label="Asistencije" />
                        <Tab icon={<PanToolIcon />} label="Skokovi" />
                        <Tab icon={<DirectionsRunIcon />} label="Ukradene" />
                        <Tab icon={<BlockIcon />} label="Blokade" />
                    </Tabs>

                    <Box sx={{ p: 0 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, width: 80 }}>Pozicija</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Igrač</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700 }}>Utakmice</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>{getCategoryLabel()}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Detalji</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {activeData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                                        Nema podataka za prikaz.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {activeData.map((player, index) => {
                                            const fullImageUrl = player.profilePictureUrl 
                                                ? (player.profilePictureUrl.startsWith('http') ? player.profilePictureUrl : `${apiBaseUrl}${player.profilePictureUrl}`) 
                                                : '';
                                            return (
                                            <TableRow
                                                key={player.userId}
                                                sx={{
                                                    '&:hover': { bgcolor: 'action.hover' },
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => navigate(`/profile/${player.userId}`)}
                                            >
                                                <TableCell>
                                                    <Box
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: index < 3 ? (index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#b45309') : 'transparent',
                                                            color: index < 3 ? 'white' : 'inherit',
                                                            fontWeight: 700
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                        <Avatar 
                                                            src={fullImageUrl}
                                                            sx={{ width: 40, height: 40, bgcolor: 'primary.main', border: '1px solid #eee' }}
                                                        >
                                                            {player.username[0].toUpperCase()}
                                                        </Avatar>
                                                        <Typography sx={{ fontWeight: 600 }}>{player.username}</Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="center">{player.gamesPlayed}</TableCell>
                                                <TableCell align="right">
                                                    <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.1rem' }}>
                                                        {getValue(player)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack sx={{ display: 'flex', flexDirection: "row", gap: 1, justifyContent: "flex-end" }}>
                                                        <Tooltip title={
                                                            <Box sx={{ p: 0.5 }}>
                                                                <Typography variant="caption" sx={{ display: 'block' }}>Ukupno:</Typography>
                                                                <Typography variant="caption" sx={{ display: 'block' }}>Poeni: {player.points}</Typography>
                                                                <Typography variant="caption" sx={{ display: 'block' }}>Asistencije: {player.assists}</Typography>
                                                                <Typography variant="caption" sx={{ display: 'block' }}>Skokovi: {player.rebounds}</Typography>
                                                                <Typography variant="caption" sx={{ display: 'block' }}>Ukradene: {player.steals}</Typography>
                                                                <Typography variant="caption" sx={{ display: 'block' }}>Blokade: {player.blocks}</Typography>
                                                            </Box>
                                                        }>
                                                            <Box sx={{
                                                                display: 'grid',
                                                                gridTemplateColumns: 'repeat(2, 1fr)',
                                                                gap: 0.5,
                                                                textAlign: 'left',
                                                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                                                p: 1,
                                                                borderRadius: 1.5,
                                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                                            }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.65rem' }}>
                                                                    P: <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{(player.points / player.gamesPlayed).toFixed(1)}</Box>
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.65rem' }}>
                                                                    A: <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{(player.assists / player.gamesPlayed).toFixed(1)}</Box>
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.65rem' }}>
                                                                    S: <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{(player.rebounds / player.gamesPlayed).toFixed(1)}</Box>
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.65rem' }}>
                                                                    UL: <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{(player.steals / player.gamesPlayed).toFixed(1)}</Box>
                                                                </Typography>
                                                            </Box>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

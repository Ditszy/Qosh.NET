import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    TextField,
    InputAdornment,
    Divider,
    Grid,
    CircularProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Paper,
    useTheme,
    alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [activeLeagues, setActiveLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const leaguesRes = await api.get('/Leagues/Get-Active-Leagues');
                const leaguesList = leaguesRes.data.items || [];
                setActiveLeagues(leaguesList.slice(0, 4));
                setLoading(false);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                try {
                    const res = await api.get(`/User/Search?q=${searchQuery}`);
                    setSearchResults(res.data);
                } catch (err) { console.error(err); }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    return (
        <Box sx={{ bgcolor: '#fbfcfd', minHeight: '100vh', pb: 10 }}>
            <Navbar />

            <Box sx={{
                background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, #1e293b 100%)`,
                color: 'white',
                pt: { xs: 8, md: 12 },
                pb: { xs: 10, md: 16 },
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <SportsBasketballIcon sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    fontSize: 300,
                    color: alpha('#fff', 0.03),
                    transform: 'rotate(-15deg)'
                }} />
                <SportsBasketballIcon sx={{
                    position: 'absolute',
                    bottom: -60,
                    left: -60,
                    fontSize: 250,
                    color: alpha('#fff', 0.02),
                    transform: 'rotate(20deg)'
                }} />

                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h2" component="h1" sx={{
                        fontWeight: 900,
                        mb: 2,
                        fontSize: { xs: '2.5rem', md: '4rem' },
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1
                    }}>
                        Gde se igra najbolji <span style={{ color: theme.palette.primary.light }}>basket?</span>
                    </Typography>
                    <Typography variant="h6" sx={{
                        mb: 6,
                        color: alpha('#fff', 0.7),
                        fontWeight: '400',
                        maxWidth: '650px',
                        mx: 'auto',
                        lineHeight: 1.6
                    }}>
                        Profesionalno upravljanje ligama, turnirima i ekipama.
                        Prati rezultate uživo, vodi statistiku i podigni nivo svoje igre.
                    </Typography>

                    <Stack sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', mb: 8 }}>
                        <Button
                            component={RouterLink}
                            to="/leagues"
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{
                                fontWeight: 800,
                                px: 5,
                                py: 1.8,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                                '&:hover': {
                                    boxShadow: `0 12px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                                }
                            }}
                        >
                            Istraži lige
                        </Button>
                        {!isAuthenticated && (
                            <Button
                                component={RouterLink}
                                to="/register"
                                variant="outlined"
                                color="inherit"
                                size="large"
                                sx={{
                                    fontWeight: 700,
                                    px: 5,
                                    py: 1.8,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    borderColor: alpha('#fff', 0.3),
                                    bgcolor: alpha('#fff', 0.05),
                                    '&:hover': {
                                        borderColor: '#fff',
                                        bgcolor: alpha('#fff', 0.1),
                                    }
                                }}
                            >
                                Postani član
                            </Button>
                        )}
                    </Stack>

                    <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative' }}>
                        <Box sx={{
                            bgcolor: alpha('#fff', 0.08),
                            backdropFilter: 'blur(12px)',
                            borderRadius: 4,
                            p: 1,
                            border: `1px solid ${alpha('#fff', 0.15)}`,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                        }}>
                            <TextField
                                fullWidth
                                variant="standard"
                                placeholder="Pretraži igrače i profile..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        color: 'white',
                                        px: 2,
                                        py: 1.5,
                                        fontSize: '1.1rem'
                                    },
                                    '& .MuiInput-underline:before, & .MuiInput-underline:after': { border: 'none !important' }
                                }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ ml: 1, color: alpha('#fff', 0.5) }} />
                                            </InputAdornment>
                                        ),
                                    }
                                }}
                            />
                        </Box>

                        {searchResults.length > 0 && (
                            <Paper sx={{
                                position: 'absolute',
                                top: '110%',
                                left: 0,
                                right: 0,
                                zIndex: 10,
                                borderRadius: 3,
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                            }}>
                                <List sx={{ p: 0 }}>
                                    {searchResults.map((player) => (
                                        <ListItem
                                            key={player.id}
                                            disablePadding
                                            sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
                                        >
                                            <ListItemButton
                                                onClick={() => navigate(`/profile/${player.id}`)}
                                                sx={{ py: 2 }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: theme.palette.primary.main }} src={player.profilePictureUrl}>
                                                        <PersonIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={`${player.firstName || ''} ${player.lastName || ''} (@${player.username})`}
                                                    secondary={player.email}
                                                    slotProps={{
                                                        primary: { sx: { fontWeight: 700, color: theme.palette.text.primary } }
                                                    }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        )}
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: -6, position: 'relative', zIndex: 2 }}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Card sx={{
                            borderRadius: 5,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.03)',
                            height: '100%'
                        }}>
                            <CardContent sx={{ p: 4 }}>
                                <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Stack sx={{ direction: "row", spacing: 1.5, alignItems: "center" }}>
                                        <Box sx={{ bgcolor: alpha('#ef4444', 0.1), p: 1, borderRadius: 2 }}>
                                            <LiveTvIcon sx={{ color: '#ef4444', display: 'block' }} />
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>Uživo mečevi</Typography>
                                    </Stack>
                                    <Chip sx={{ label: "LIVE", size: "small", color: "error", fontWeight: 900, px: 1, animate: "pulse" }} />
                                </Stack>

                                <Divider sx={{ mb: 4, opacity: 0.6 }} />

                                <Stack spacing={3} sx={{ py: 2, textAlign: 'center', alignItems: 'center' }}>
                                    <Box sx={{ p: 4, bgcolor: '#f8fafc', borderRadius: 4, width: '100%' }}>
                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                            Trenutno nema utakmica u toku. Prati rezultate sledećih zakazanih mečeva na stranici liga.
                                        </Typography>
                                        <Button
                                            component={RouterLink}
                                            to="/leagues"
                                            variant="outlined"
                                            sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}
                                        >
                                            Svi mečevi
                                        </Button>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card sx={{
                            borderRadius: 5,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.03)',
                            height: '100%'
                        }}>
                            <CardContent sx={{ p: 4 }}>
                                <Stack sx={{ direction: "row", spacing: 1.5, alignItems: "center", mb: 3 }}>
                                    <Box sx={{ bgcolor: alpha('#f59e0b', 0.1), p: 1, borderRadius: 2 }}>
                                        <EmojiEventsIcon sx={{ color: '#f59e0b', display: 'block' }} />
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Popularne Lige</Typography>
                                </Stack>

                                <Divider sx={{ mb: 3, opacity: 0.6 }} />

                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                                ) : (
                                    <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                        {activeLeagues.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                                Trenutno nema aktivnih liga.
                                            </Typography>
                                        ) : (
                                            activeLeagues.map((league) => (
                                                <Box
                                                    key={league.id}
                                                    sx={{
                                                        p: 2.5,
                                                        bgcolor: '#f8fafc',
                                                        borderRadius: 4,
                                                        border: '1px solid #eef2f6',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: '#fff',
                                                            boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                                                            transform: 'translateY(-2px)'
                                                        }
                                                    }}
                                                >
                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>{league.name}</Typography>
                                                            <Stack sx={{ direction: "row", spacing: 1, alignItems: "center" }}>
                                                                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                                    {league.currentTeamsCount || 0} timova prijavljeno
                                                                </Typography>
                                                            </Stack>
                                                        </Box>
                                                        <Chip
                                                            label={league.matchType === 2 ? '3x3' : '5x5'}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 800,
                                                                bgcolor: league.matchType === 2 ? '#fff' : alpha(theme.palette.primary.main, 0.1),
                                                                color: theme.palette.primary.main,
                                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                                            }}
                                                        />
                                                    </Stack>
                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                                                        <Typography variant="caption" sx={{
                                                            color: league.phase === 'Registration Open' ? 'success.main' : 'warning.main',
                                                            fontWeight: 800,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.5
                                                        }}>
                                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
                                                            {league.phase === 'Registration Open' ? 'PRIJAVE' : 'U TOKU'}
                                                        </Typography>
                                                        <Button
                                                            component={RouterLink}
                                                            to={`/leagues/${league.id}`}
                                                            size="small"
                                                            variant="text"
                                                            sx={{ fontWeight: 800, textTransform: 'none' }}
                                                        >
                                                            Detalji
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            ))
                                        )}
                                        <Button
                                            component={RouterLink}
                                            to="/leagues"
                                            fullWidth
                                            sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'none', mt: 1 }}
                                        >
                                            Pogledaj sve lige
                                        </Button>
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
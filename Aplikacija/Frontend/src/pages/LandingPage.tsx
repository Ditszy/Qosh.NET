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
    Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [activeLeagues, setActiveLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const leaguesRes = await axios.get(`${import.meta.env.VITE_API_URL}/Leagues/Get-Active-Leagues`);
                setActiveLeagues(leaguesRes.data.slice(0, 4));
                setLoading(false);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/User/Search?q=${searchQuery}`);
                    setSearchResults(res.data);
                } catch (err) { console.error(err); }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Box sx={{ bgcolor: '#111827', color: 'white', py: { xs: 6, md: 10 }, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <Container maxWidth="md">
                    <Typography variant="h3" component="h1" sx={{ fontWeight: '800', mb: 2, fontSize: { xs: '2.3rem', md: '3.5rem' } }}>
                        Qosh — portal za upravljanje ligama i turnirima
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 4, color: '#9ca3af', fontWeight: '400', maxWidth: '600px', mx: 'auto' }}>
                        Prati rezultate, tabele i statistiku igrača u realnom vremenu, uz pregled liga, turnira i bracket-a na jednom mestu.
                    </Typography>

                    <Stack sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', mb: 4 }}>
                        <Button
                            component={RouterLink}
                            to="/leagues"
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{ fontWeight: 'bold', px: 4, borderRadius: 2 }}
                        >
                            Pregledaj lige
                        </Button>
                        {!isAuthenticated && (
                            <Button
                                component={RouterLink}
                                to="/login"
                                variant="outlined"
                                color="inherit"
                                size="large"
                                sx={{ fontWeight: 'bold', px: 4, borderRadius: 2, borderColor: '#e5e7eb', color: '#e5e7eb' }}
                            >
                                Prijava
                            </Button>
                        )}
                    </Stack>

                    <Box sx={{ maxWidth: 500, mx: 'auto', position: 'relative' }}>
                        <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 0.5, boxShadow: 3 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Pretraži igrače (npr. 'marko')..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" sx={{ ml: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }
                                }}
                            />
                        </Box>

                        {searchResults.length > 0 && (
                            <Paper sx={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10, borderRadius: 2, overflow: 'hidden' }}>
                                <List sx={{ p: 0 }}>
                                    {searchResults.map((player) => (
                                        <ListItem
                                            key={player.id}
                                            disablePadding
                                            sx={{ borderBottom: '1px solid #eee' }}
                                        >
                                            <ListItemButton
                                                onClick={() => navigate(`/profile/${player.id}`)}
                                                sx={{ py: 1.5 }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: 'primary.main' }} src={player.profilePictureUrl}>
                                                        <PersonIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={`${player.firstName || ''} ${player.lastName || ''} (@${player.username})`}
                                                    secondary={player.email}
                                                    slotProps={{
                                                        primary: {
                                                            sx: { fontWeight: 600, color: 'black' }
                                                        }
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

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                ) : (
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mb: 2 }}>
                                        <LiveTvIcon sx={{ color: '#ef4444' }} />
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Istaknute utakmice</Typography>
                                    </Stack>
                                    <Divider sx={{ mb: 2 }} />

                                    <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                            Pregledaj rezultate u realnom vremenu na stranici mečeva.
                                        </Typography>
                                        <Button component={RouterLink} to="/leagues" variant="text" fullWidth sx={{ fontWeight: 700 }}>Svi mečevi</Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mb: 2 }}>
                                        <EmojiEventsIcon sx={{ color: '#f59e0b' }} />
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Aktivna Takmičenja</Typography>
                                    </Stack>
                                    <Divider sx={{ mb: 2 }} />

                                    <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {activeLeagues.map((league) => (
                                            <Box key={league.id} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{league.name}</Typography>
                                                    <Chip label={league.matchType === 2 ? '3x3' : '5x5'} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                                                </Stack>
                                                <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                                                        ● {league.phase === 'Registration Open' ? 'Prijave otvorene' : 'U toku'}
                                                    </Typography>
                                                    <Button component={RouterLink} to={`/leagues/${league.id}`} size="small" variant="text" sx={{ fontWeight: 'bold' }}>Pregledaj</Button>
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </Container>
        </Box>
    );
}
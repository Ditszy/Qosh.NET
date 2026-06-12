import { useMemo, useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Stack,
    Chip,
    Button,
    Divider,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import Navbar from '../components/Navbar';
import { MatchType } from '../types';
import { competitionSystemLabel, matchTypeLabel } from '../utils/leagueFormat';
import axios from 'axios';

export default function LeaguesPage() {
    const [query, setQuery] = useState('');
    const [formatFilter, setFormatFilter] = useState<'all' | MatchType>('all');
    const [leagues, setLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/Leagues/Get-Active-Leagues`);
                setLeagues(response.data);
            } catch (err) {
                console.error("Error fetching leagues", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeagues();
    }, []);

    const filteredLeagues = useMemo(() => {
        return leagues.filter((league) => {
            const matchesQuery = league.name.toLowerCase().includes(query.toLowerCase()) ||
                (league.location || '').toLowerCase().includes(query.toLowerCase());
            const matchesFormat = formatFilter === 'all' || league.matchType === formatFilter;
            return matchesQuery && matchesFormat;
        });
    }, [query, formatFilter, leagues]);

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Lige i turniri
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Pregledaj aktivna takmičenja, filtriraj po formatu i prati rezultate.
                    </Typography>
                </Stack>

                <Card sx={{ borderRadius: 3, mb: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 7 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Pretraži lige, gradove ili sezone..."
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon color="action" />
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="format-filter-label">Format</InputLabel>
                                    <Select
                                        labelId="format-filter-label"
                                        value={formatFilter}
                                        label="Format"
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setFormatFilter(value === 'all' ? 'all' : (Number(value) as MatchType));
                                        }}
                                    >
                                        <MenuItem value="all">Svi formati</MenuItem>
                                        <MenuItem value={MatchType.Classic_5x5}>5x5</MenuItem>
                                        <MenuItem value={MatchType.Basket_3X3}>3x3</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}><CircularProgress /></Box>
                ) : (
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <EmojiEventsIcon sx={{ color: '#f59e0b' }} />
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Aktivna takmičenja
                                        </Typography>
                                    </Stack>
                                    <Divider sx={{ mb: 3 }} />

                                    <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {filteredLeagues.length === 0 && (
                                            <Typography variant="body2" color="text.secondary">
                                                Trenutno nema takmičenja za izabrani format.
                                            </Typography>
                                        )}
                                        {filteredLeagues.map((league) => (
                                            <Card key={league.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                                <CardContent>
                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
                                                        <Box>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                                {league.name}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Sezona {league.season || '2026'} • {league.location || 'Srbija'}
                                                            </Typography>
                                                        </Box>
                                                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                                            <Chip label={matchTypeLabel(league.matchType)} size="small" color="primary" sx={{ fontWeight: 700 }} />
                                                            <Chip label={competitionSystemLabel(league.matchType)} size="small" variant="outlined" />
                                                            <Chip
                                                                label={league.phase === 'Registration Open' ? 'Prijave otvorene' : 'U toku'}
                                                                size="small"
                                                                color={league.phase === 'Registration Open' ? 'success' : 'warning'}
                                                                variant="outlined"
                                                            />
                                                        </Stack>
                                                    </Stack>

                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                                                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                                            <GroupsIcon fontSize="small" />
                                                            <Typography variant="body2">
                                                                Timovi: {league.currentTeamsCount}/{league.maxTeams}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Rok prijave: {new Date(league.registrationDeadline).toLocaleDateString()}
                                                        </Typography>
                                                    </Stack>

                                                    <Box sx={{ mt: 2 }}>
                                                        <Button
                                                            component={RouterLink}
                                                            to={`/leagues/${league.id}`}
                                                            size="small"
                                                            variant="text"
                                                            sx={{ fontWeight: 700 }}
                                                        >
                                                            Pregledaj ligu
                                                        </Button>
                                                    </Box>
                                                </CardContent>
                                            </Card>
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

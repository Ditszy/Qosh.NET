import { useState, useEffect, useCallback } from 'react';
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
    CircularProgress,
    Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import Navbar from '../components/Navbar';
import { MatchType } from '../types';
import { competitionSystemLabel, matchTypeLabel, formatDate, formatDateTime } from '../utils/leagueFormat';
import api from '../services/api';

export default function LeaguesPage() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [formatFilter, setFormatFilter] = useState<'all' | MatchType>('all');
    const [statusFilter, setStatusFilter] = useState('All');
    const [leagues, setLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [query]);

    const fetchLeagues = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                SearchTerm: debouncedQuery,
                MatchType: formatFilter === 'all' ? null : formatFilter,
                StatusFilter: statusFilter === 'All' ? null : statusFilter,
                Page: page,
                PageSize: pageSize
            };
            const response = await api.get('/Leagues/Get-Active-Leagues', { params });
            setLeagues(response.data.items || []);
            setTotalCount(response.data.totalCount || 0);
        } catch (err) {
            console.error("Error fetching leagues", err);
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, formatFilter, statusFilter, page, pageSize]);

    useEffect(() => {
        fetchLeagues();
    }, [fetchLeagues]);

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Lige i turniri
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        Pregledaj aktivna takmičenja, filtriraj po formatu i prati rezultate.
                    </Typography>
                </Stack>

                <Card sx={{ borderRadius: 3, mb: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Pretraži lige, gradove ili sezone..."
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon sx={{ color: 'action.active' }} />
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="format-filter-label">Format</InputLabel>
                                    <Select
                                        labelId="format-filter-label"
                                        value={formatFilter}
                                        label="Format"
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setFormatFilter(value === 'all' ? 'all' : (Number(value) as MatchType));
                                            setPage(1);
                                        }}
                                    >
                                        <MenuItem value="all">Svi formati</MenuItem>
                                        <MenuItem value={MatchType.Classic_5x5}>5x5</MenuItem>
                                        <MenuItem value={MatchType.Basket_3X3}>3x3</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="status-filter-label">Status</InputLabel>
                                    <Select
                                        labelId="status-filter-label"
                                        value={statusFilter}
                                        label="Status"
                                        onChange={(event) => {
                                            setStatusFilter(event.target.value);
                                            setPage(1);
                                        }}
                                    >
                                        <MenuItem value="All">Sve</MenuItem>
                                        <MenuItem value="Registration">Prijave otvorene</MenuItem>
                                        <MenuItem value="Live">U toku</MenuItem>
                                        <MenuItem value="Finished">Završeno</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
                        <CircularProgress />
                    </Box>
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
                                        {leagues.length === 0 && (
                                            <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
                                                Trenutno nema takmičenja za izabrane kriterijume.
                                            </Typography>
                                        )}
                                        {leagues.map((league) => (
                                            <Card key={league.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                                <CardContent>
                                                    <Stack sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
                                                        <Box>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                                {league.name}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                Sezona {league.season || '2026'} • {league.location || 'Srbija'}
                                                            </Typography>
                                                        </Box>
                                                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                            <Chip label={matchTypeLabel(league.matchType)} size="small" color="primary" sx={{ fontWeight: 700 }} />
                                                            <Chip label={competitionSystemLabel(league.matchType)} size="small" variant="outlined" />
                                                        </Stack>
                                                    </Stack>

                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                                                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                                            <GroupsIcon fontSize="small" sx={{ color: 'action.active' }} />
                                                            <Typography variant="body2">
                                                                Timovi: {league.currentTeamsCount}/{league.maxTeams}
                                                            </Typography>
                                                        </Stack>
                                                        {league.startDate && (
                                                            <Chip
                                                                label={`Početak: ${formatDateTime(league.startDate)}`}
                                                                size="small"
                                                                variant="outlined"
                                                                color="primary"
                                                                sx={{ fontWeight: 600 }}
                                                            />
                                                        )}
                                                        {league.leagueStatus === 3 ? (
                                                            <Chip
                                                                label="ZAVRŠENO"
                                                                color="default"
                                                                size="small"
                                                                variant="filled"
                                                                sx={{ fontWeight: 700, bgcolor: 'text.secondary', color: 'background.paper' }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label={(league.leagueStatus === 1 || league.leagueStatus == null) && new Date(league.registrationDeadline) > new Date() ? 'PRIJAVE OTVORENE' : 'PRIJAVE ZATVORENE'}
                                                                color={(league.leagueStatus === 1 || league.leagueStatus == null) && new Date(league.registrationDeadline) > new Date() ? 'success' : 'error'}
                                                                size="small"
                                                                sx={{ fontWeight: 700 }}
                                                            />
                                                        )}
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

                                    {totalCount > pageSize && (
                                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                            <Pagination
                                                count={Math.ceil(totalCount / pageSize)}
                                                page={page}
                                                onChange={(_, value) => setPage(value)}
                                                color="primary"
                                            />
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </Container>
        </Box>
    );
}


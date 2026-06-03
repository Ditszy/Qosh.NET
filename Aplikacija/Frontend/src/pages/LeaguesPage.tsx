import { useMemo, useState } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import Navbar from '../components/Navbar';
import { leagues, bracketByLeagueId } from '../data/leagueData';
import { MatchStatus, MatchType } from '../types';
import { competitionSystemLabel, matchStatusColor, matchStatusLabel, matchTypeLabel } from '../utils/leagueFormat';

export default function LeaguesPage() {
    const [query, setQuery] = useState('');
    const [formatFilter, setFormatFilter] = useState<'all' | MatchType>('all');
    const [statsFormat, setStatsFormat] = useState<MatchType>(MatchType.Basket_3X3);
    const [statsMetric, setStatsMetric] = useState<'points' | 'rebounds' | 'assists'>('points');

    const filteredLeagues = useMemo(() => {
        return leagues.filter((league) => {
            const matchesQuery = league.name.toLowerCase().includes(query.toLowerCase()) ||
                league.location.toLowerCase().includes(query.toLowerCase());
            const matchesFormat = formatFilter === 'all' || league.matchType === formatFilter;
            return matchesQuery && matchesFormat;
        });
    }, [query, formatFilter]);


    const bracketPreview = useMemo(() => {
        const firstKnockout = leagues.find((league) => league.matchType === MatchType.Basket_3X3);
        if (!firstKnockout) {
            return { league: null, matches: [] as { roundTitle: string; id: number; homeTeam: string; awayTeam: string; startTime: string; status: MatchStatus }[] };
        }

        const rounds = bracketByLeagueId[firstKnockout.id] ?? [];
        const matches = rounds.flatMap((round) =>
            round.matches.map((match) => ({
                roundTitle: round.title,
                id: match.id,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                startTime: match.startTime,
                status: match.status,
            }))
        );

        return { league: firstKnockout, matches };
    }, []);

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Lige i turniri
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Pregledaj aktivna takmičenja, filtriraj po formatu i prati bracket ili round robin fazu.
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
                                        <MenuItem value={MatchType.Basket_3X3}>3x3</MenuItem>
                                        <MenuItem value={MatchType.Classic_5x5}>5x5</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 8 }}>
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
                                                            Sezona {league.season} • {league.location}
                                                        </Typography>
                                                    </Box>
                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                                        <Chip label={matchTypeLabel(league.matchType)} size="small" color="primary" sx={{ fontWeight: 700 }} />
                                                        <Chip label={competitionSystemLabel(league.matchType)} size="small" variant="outlined" />
                                                        <Chip label={league.phaseLabel} size="small" color="success" variant="outlined" />
                                                    </Stack>
                                                </Stack>

                                                <Stack sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                                        <GroupsIcon fontSize="small" />
                                                        <Typography variant="body2">
                                                            Timovi: {league.teams}/{league.maxTeams}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Rok prijave: {league.registrationDeadline}
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

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                    Bracket faza (3x3)
                                </Typography>
                                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {!bracketPreview.league && (
                                        <Typography variant="body2" color="text.secondary">
                                            Nema dostupnih 3x3 turnira.
                                        </Typography>
                                    )}
                                    {bracketPreview.league && (
                                        <>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {bracketPreview.league.name}
                                            </Typography>
                                            <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {bracketPreview.matches.slice(0, 4).map((match) => (
                                                    <Box key={match.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {match.homeTeam} vs {match.awayTeam}
                                                        </Typography>
                                                        <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', mt: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {match.roundTitle} • {match.startTime}
                                                            </Typography>
                                                            <Chip
                                                                label={matchStatusLabel(match.status)}
                                                                color={matchStatusColor(match.status)}
                                                                size="small"
                                                            />
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </Stack>
                                            <Button
                                                component={RouterLink}
                                                to={`/leagues/${bracketPreview.league.id}`}
                                                size="small"
                                                variant="text"
                                                sx={{ fontWeight: 700, mt: 1 }}
                                            >
                                                Otvori bracket
                                            </Button>
                                        </>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
